const express = require('express');
const { Client } = require('@googlemaps/google-maps-services-js');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// Initialize Google Maps client
const mapsClient = new Client({});

// Validate and geocode address
router.post('/geocode', authenticateToken, async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ success: false, message: 'Address is required' });
    }
    
    const response = await mapsClient.geocode({
      params: {
        address: address,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    
    if (response.data.results.length === 0) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    const result = response.data.results[0];
    const location = result.geometry.location;
    
    res.json({
      success: true,
      data: {
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        latitude: location.lat,
        longitude: location.lng,
        addressComponents: result.address_components,
        types: result.types
      }
    });
    
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ success: false, message: 'Failed to geocode address' });
  }
});

// Get travel time matrix between multiple locations
router.post('/distance-matrix', authenticateToken, async (req, res) => {
  try {
    const { origins, destinations, mode = 'driving' } = req.body;
    
    if (!origins || !destinations || origins.length === 0 || destinations.length === 0) {
      return res.status(400).json({ success: false, message: 'Origins and destinations are required' });
    }
    
    const response = await mapsClient.distancematrix({
      params: {
        origins: origins,
        destinations: destinations,
        mode: mode,
        units: 'imperial',
        departure_time: 'now',
        traffic_model: 'best_guess',
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    
    const matrix = response.data.rows.map((row, originIndex) => ({
      origin: origins[originIndex],
      destinations: row.elements.map((element, destIndex) => ({
        destination: destinations[destIndex],
        distance: element.distance,
        duration: element.duration,
        durationInTraffic: element.duration_in_traffic,
        status: element.status
      }))
    }));
    
    res.json({
      success: true,
      data: {
        matrix: matrix,
        originAddresses: response.data.origin_addresses,
        destinationAddresses: response.data.destination_addresses
      }
    });
    
  } catch (error) {
    console.error('Distance matrix error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate distance matrix' });
  }
});

// Optimize route for multiple bookings
router.post('/optimize-route', authenticateToken, authorizeRoles('videographer', 'manager', 'admin'), async (req, res) => {
  try {
    const { bookingIds, startLocation, endLocation, optimizeFor = 'time' } = req.body;
    
    if (!bookingIds || bookingIds.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 bookings required for optimization' });
    }
    
    // Get booking locations
    const bookingsResult = await pool.query(`
      SELECT id, location, latitude, longitude, scheduled_time, estimated_duration, booking_number
      FROM bookings 
      WHERE id = ANY($1) AND status = 'approved'
      ORDER BY scheduled_time
    `, [bookingIds]);
    
    if (bookingsResult.rows.length !== bookingIds.length) {
      return res.status(400).json({ success: false, message: 'Some bookings not found or not approved' });
    }
    
    const bookings = bookingsResult.rows;
    
    // Prepare waypoints for Google Maps Directions API
    const waypoints = bookings.map(booking => ({
      location: booking.latitude && booking.longitude 
        ? `${booking.latitude},${booking.longitude}`
        : booking.location,
      stopover: true
    }));
    
    // Get optimized route using Google Directions API
    const directionsResponse = await mapsClient.directions({
      params: {
        origin: startLocation || waypoints[0].location,
        destination: endLocation || waypoints[waypoints.length - 1].location,
        waypoints: waypoints.slice(1, -1),
        optimize: true,
        mode: 'driving',
        departure_time: 'now',
        traffic_model: 'best_guess',
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    
    const route = directionsResponse.data.routes[0];
    const optimizedOrder = route.waypoint_order || [];
    
    // Calculate original route metrics
    const originalDistanceMatrix = await calculateRouteMetrics(bookings, 'original');
    
    // Reorder bookings based on optimization
    const optimizedBookings = [
      bookings[0], // First booking stays first
      ...optimizedOrder.map(index => bookings[index + 1]),
      // Note: Google's optimization doesn't include start/end points in waypoint_order
    ];
    
    // Calculate optimized route metrics
    const optimizedDistanceMatrix = await calculateRouteMetrics(optimizedBookings, 'optimized');
    
    // Calculate savings
    const timeSavings = originalDistanceMatrix.totalDuration - optimizedDistanceMatrix.totalDuration;
    const distanceSavings = originalDistanceMatrix.totalDistance - optimizedDistanceMatrix.totalDistance;
    const fuelSavings = calculateFuelSavings(distanceSavings);
    
    // Generate geographic clustering analysis
    const clusters = await generateGeographicClusters(bookings);
    
    const optimizationResult = {
      originalRoute: {
        bookings: bookings,
        totalDistance: originalDistanceMatrix.totalDistance,
        totalDuration: originalDistanceMatrix.totalDuration,
        estimatedFuelCost: calculateFuelCost(originalDistanceMatrix.totalDistance)
      },
      optimizedRoute: {
        bookings: optimizedBookings,
        totalDistance: optimizedDistanceMatrix.totalDistance,
        totalDuration: optimizedDistanceMatrix.totalDuration,
        estimatedFuelCost: calculateFuelCost(optimizedDistanceMatrix.totalDistance)
      },
      savings: {
        timeSaved: Math.max(0, timeSavings), // in seconds
        timeSavedMinutes: Math.max(0, Math.round(timeSavings / 60)),
        distanceSaved: Math.max(0, distanceSavings), // in meters
        distanceSavedMiles: Math.max(0, (distanceSavings * 0.000621371).toFixed(2)),
        fuelSavings: fuelSavings,
        carbonSavings: calculateCarbonSavings(distanceSavings)
      },
      clusters: clusters,
      googleMapsRoute: route,
      optimizationDate: new Date().toISOString(),
      recommendedStartTime: calculateOptimalStartTime(optimizedBookings)
    };
    
    // Save optimization suggestion to database
    const optimizationId = await saveRouteOptimization(
      req.user.id,
      bookingIds,
      optimizationResult
    );
    
    res.json({
      success: true,
      data: {
        optimizationId,
        ...optimizationResult
      }
    });
    
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ success: false, message: 'Failed to optimize route' });
  }
});

// Accept route optimization
router.post('/accept-optimization/:optimizationId', authenticateToken, async (req, res) => {
  try {
    const { optimizationId } = req.params;
    
    // Get optimization details
    const optimizationResult = await pool.query(`
      SELECT * FROM route_optimizations 
      WHERE id = $1 AND videographer_id = $2 AND status = 'pending'
    `, [optimizationId, req.user.id]);
    
    if (optimizationResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Optimization not found or already processed' });
    }
    
    const optimization = optimizationResult.rows[0];
    const optimizedRoute = optimization.optimized_route;
    
    // Update booking order/times based on optimization
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update each booking with new scheduled time based on optimized route
      for (let i = 0; i < optimizedRoute.bookings.length; i++) {
        const booking = optimizedRoute.bookings[i];
        const newTime = calculateNewScheduledTime(optimization.optimization_date, i, optimizedRoute.bookings);
        
        await client.query(`
          UPDATE bookings 
          SET scheduled_time = $1,
              manager_notes = COALESCE(manager_notes, '') || '\\nRoute optimized - new time: ' || $1
          WHERE id = $2
        `, [newTime, booking.id]);
      }
      
      // Mark optimization as accepted
      await client.query(`
        UPDATE route_optimizations 
        SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [optimizationId]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Route optimization accepted and bookings updated',
        data: {
          optimizationId,
          updatedBookings: optimizedRoute.bookings.length,
          timeSaved: optimization.time_saved,
          distanceSaved: optimization.distance_saved
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Accept optimization error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept route optimization' });
  }
});

// Get geographic zones and clustering data
router.get('/geographic-zones', authenticateToken, authorizeRoles('manager', 'admin'), async (req, res) => {
  try {
    const zonesResult = await pool.query(`
      SELECT z.*, u.name as default_videographer_name
      FROM geographic_zones z
      LEFT JOIN users u ON z.default_videographer_id = u.id
      WHERE z.is_active = true
      ORDER BY z.zone_name
    `);
    
    // Get booking distribution by zone
    const distributionResult = await pool.query(`
      SELECT 
        geographic_zone,
        COUNT(*) as booking_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        AVG(priority_score) as avg_priority
      FROM bookings 
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND geographic_zone IS NOT NULL
      GROUP BY geographic_zone
      ORDER BY booking_count DESC
    `);
    
    res.json({
      success: true,
      data: {
        zones: zonesResult.rows,
        distribution: distributionResult.rows
      }
    });
    
  } catch (error) {
    console.error('Geographic zones error:', error);
    res.status(500).json({ success: false, message: 'Failed to load geographic zones' });
  }
});

// Create or update geographic zone
router.post('/geographic-zones', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const {
      zoneName,
      zoneCode,
      boundaryCoordinates,
      defaultVideographerId
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO geographic_zones 
      (zone_name, zone_code, boundary_coordinates, default_videographer_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      zoneName,
      zoneCode,
      JSON.stringify(boundaryCoordinates),
      defaultVideographerId
    ]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Create geographic zone error:', error);
    res.status(500).json({ success: false, message: 'Failed to create geographic zone' });
  }
});

// Batch validate addresses
router.post('/batch-validate', authenticateToken, async (req, res) => {
  try {
    const { addresses } = req.body;
    
    if (!addresses || addresses.length === 0) {
      return res.status(400).json({ success: false, message: 'Addresses array is required' });
    }
    
    const validationResults = [];
    
    // Process addresses in batches to avoid API limits
    const batchSize = 10;
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (address, index) => {
        try {
          const response = await mapsClient.geocode({
            params: {
              address: address.address,
              key: process.env.GOOGLE_MAPS_API_KEY
            }
          });
          
          if (response.data.results.length > 0) {
            const result = response.data.results[0];
            const location = result.geometry.location;
            
            return {
              originalAddress: address.address,
              isValid: true,
              formattedAddress: result.formatted_address,
              placeId: result.place_id,
              latitude: location.lat,
              longitude: location.lng,
              confidence: result.geometry.location_type,
              types: result.types
            };
          } else {
            return {
              originalAddress: address.address,
              isValid: false,
              error: 'Address not found'
            };
          }
        } catch (error) {
          return {
            originalAddress: address.address,
            isValid: false,
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      validationResults.push(...batchResults);
      
      // Add delay between batches to respect API limits
      if (i + batchSize < addresses.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const summary = {
      total: validationResults.length,
      valid: validationResults.filter(r => r.isValid).length,
      invalid: validationResults.filter(r => !r.isValid).length,
      validationRate: (validationResults.filter(r => r.isValid).length / validationResults.length * 100).toFixed(2)
    };
    
    res.json({
      success: true,
      data: {
        results: validationResults,
        summary
      }
    });
    
  } catch (error) {
    console.error('Batch address validation error:', error);
    res.status(500).json({ success: false, message: 'Failed to validate addresses' });
  }
});

// Helper functions
async function calculateRouteMetrics(bookings, routeType) {
  let totalDistance = 0;
  let totalDuration = 0;
  
  for (let i = 0; i < bookings.length - 1; i++) {
    const origin = bookings[i];
    const destination = bookings[i + 1];
    
    try {
      const response = await mapsClient.distancematrix({
        params: {
          origins: [origin.latitude && origin.longitude 
            ? `${origin.latitude},${origin.longitude}`
            : origin.location
          ],
          destinations: [destination.latitude && destination.longitude 
            ? `${destination.latitude},${destination.longitude}`
            : destination.location
          ],
          mode: 'driving',
          units: 'imperial',
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });
      
      const element = response.data.rows[0].elements[0];
      if (element.status === 'OK') {
        totalDistance += element.distance.value; // meters
        totalDuration += element.duration.value; // seconds
      }
    } catch (error) {
      console.error(`Error calculating distance between ${origin.location} and ${destination.location}:`, error);
    }
  }
  
  return { totalDistance, totalDuration };
}

function calculateFuelSavings(distanceSavedMeters) {
  const distanceSavedMiles = distanceSavedMeters * 0.000621371;
  const avgMPG = 25; // Average miles per gallon
  const avgGasPrice = 3.50; // Average gas price per gallon
  
  return {
    gallonsSaved: (distanceSavedMiles / avgMPG).toFixed(2),
    dollarsaved: ((distanceSavedMiles / avgMPG) * avgGasPrice).toFixed(2)
  };
}

function calculateFuelCost(distanceMeters) {
  const distanceMiles = distanceMeters * 0.000621371;
  const avgMPG = 25;
  const avgGasPrice = 3.50;
  
  return ((distanceMiles / avgMPG) * avgGasPrice).toFixed(2);
}

function calculateCarbonSavings(distanceSavedMeters) {
  const distanceSavedMiles = distanceSavedMeters * 0.000621371;
  const co2PoundsPerMile = 0.89; // Average CO2 emissions per mile
  
  return {
    poundsCO2Saved: (distanceSavedMiles * co2PoundsPerMile).toFixed(2),
    kgCO2Saved: (distanceSavedMiles * co2PoundsPerMile * 0.453592).toFixed(2)
  };
}

async function generateGeographicClusters(bookings) {
  // Simple clustering algorithm based on proximity
  const clusters = [];
  const processed = new Set();
  
  for (let i = 0; i < bookings.length; i++) {
    if (processed.has(i)) continue;
    
    const cluster = [bookings[i]];
    processed.add(i);
    
    for (let j = i + 1; j < bookings.length; j++) {
      if (processed.has(j)) continue;
      
      const distance = calculateHaversineDistance(
        bookings[i].latitude, bookings[i].longitude,
        bookings[j].latitude, bookings[j].longitude
      );
      
      // If within 10 miles, add to cluster
      if (distance <= 10) {
        cluster.push(bookings[j]);
        processed.add(j);
      }
    }
    
    clusters.push({
      id: clusters.length + 1,
      bookings: cluster,
      centerLat: cluster.reduce((sum, b) => sum + (b.latitude || 0), 0) / cluster.length,
      centerLng: cluster.reduce((sum, b) => sum + (b.longitude || 0), 0) / cluster.length,
      radius: calculateClusterRadius(cluster)
    });
  }
  
  return clusters;
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateClusterRadius(cluster) {
  if (cluster.length <= 1) return 0;
  
  const centerLat = cluster.reduce((sum, b) => sum + (b.latitude || 0), 0) / cluster.length;
  const centerLng = cluster.reduce((sum, b) => sum + (b.longitude || 0), 0) / cluster.length;
  
  let maxDistance = 0;
  cluster.forEach(booking => {
    const distance = calculateHaversineDistance(
      centerLat, centerLng,
      booking.latitude || 0, booking.longitude || 0
    );
    maxDistance = Math.max(maxDistance, distance);
  });
  
  return maxDistance;
}

async function saveRouteOptimization(videographerId, bookingIds, optimizationResult) {
  const result = await pool.query(`
    INSERT INTO route_optimizations 
    (videographer_id, optimization_date, booking_ids, original_route, 
     optimized_route, time_saved, distance_saved)
    VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6)
    RETURNING id
  `, [
    videographerId,
    bookingIds,
    JSON.stringify(optimizationResult.originalRoute),
    JSON.stringify(optimizationResult.optimizedRoute),
    optimizationResult.savings.timeSavedMinutes,
    parseFloat(optimizationResult.savings.distanceSavedMiles)
  ]);
  
  return result.rows[0].id;
}

function calculateOptimalStartTime(optimizedBookings) {
  // Calculate optimal start time based on first booking and travel time
  if (optimizedBookings.length === 0) return '08:00';
  
  const firstBooking = optimizedBookings[0];
  const scheduledTime = firstBooking.scheduled_time || '09:00:00';
  
  // Recommend starting 30 minutes before first booking for setup
  const [hours, minutes] = scheduledTime.split(':');
  const startTime = new Date();
  startTime.setHours(parseInt(hours), parseInt(minutes) - 30, 0);
  
  return startTime.toTimeString().slice(0, 5);
}

function calculateNewScheduledTime(optimizationDate, bookingIndex, optimizedBookings) {
  // Calculate new scheduled time based on position in optimized route
  const baseTime = new Date(`${optimizationDate}T08:00:00`);
  
  // Add travel time and session duration for each previous booking
  let cumulativeMinutes = 0;
  for (let i = 0; i < bookingIndex; i++) {
    cumulativeMinutes += (optimizedBookings[i].estimated_duration || 120) + 30; // 30 min travel buffer
  }
  
  baseTime.setMinutes(baseTime.getMinutes() + cumulativeMinutes);
  return baseTime.toTimeString().slice(0, 5);
}

module.exports = router;