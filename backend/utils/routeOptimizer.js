const { pool } = require('../config/database');
const { Client } = require('@googlemaps/google-maps-services-js');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/route-optimizer.log' })
  ]
});

const mapsClient = new Client({});

// Generate daily route optimizations for all videographers
async function generateDailyOptimizations() {
  try {
    logger.info('Starting daily route optimization generation');
    
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    // Get all videographers with bookings tomorrow
    const videographersResult = await pool.query(`
      SELECT DISTINCT r.user_id as videographer_id, u.name as videographer_name
      FROM bookings b
      JOIN resources r ON b.resource_id = r.id
      JOIN users u ON r.user_id = u.id
      WHERE b.scheduled_date = $1 
        AND b.status = 'approved'
        AND u.role = 'videographer'
        AND u.is_active = true
    `, [tomorrowDate]);
    
    if (videographersResult.rows.length === 0) {
      logger.info('No videographers with bookings tomorrow - no optimizations needed');
      return { success: true, optimizationsGenerated: 0 };
    }
    
    let optimizationsGenerated = 0;
    
    for (const videographer of videographersResult.rows) {
      try {
        const optimization = await generateVideographerOptimization(
          videographer.videographer_id,
          tomorrowDate
        );
        
        if (optimization.success && optimization.timeSaved > 15) {
          // Only save optimization if it saves more than 15 minutes
          await saveOptimizationSuggestion(optimization);
          optimizationsGenerated++;
          
          logger.info(`Generated optimization for ${videographer.videographer_name}`, {
            videographerId: videographer.videographer_id,
            timeSaved: optimization.timeSaved,
            distanceSaved: optimization.distanceSaved
          });
        }
      } catch (error) {
        logger.error(`Failed to generate optimization for videographer ${videographer.videographer_id}:`, error);
      }
    }
    
    logger.info(`Daily optimization generation completed - ${optimizationsGenerated} optimizations generated`);
    return { success: true, optimizationsGenerated };
    
  } catch (error) {
    logger.error('Failed to generate daily optimizations:', error);
    throw error;
  }
}

// Generate optimization for a specific videographer on a specific date
async function generateVideographerOptimization(videographerId, date) {
  try {
    // Get all bookings for the videographer on the specified date
    const bookingsResult = await pool.query(`
      SELECT b.id, b.location, b.latitude, b.longitude, b.scheduled_time, 
             b.estimated_duration, b.booking_number, b.shoot_category
      FROM bookings b
      JOIN resources r ON b.resource_id = r.id
      WHERE r.user_id = $1 
        AND b.scheduled_date = $2 
        AND b.status = 'approved'
        AND b.latitude IS NOT NULL 
        AND b.longitude IS NOT NULL
      ORDER BY b.scheduled_time
    `, [videographerId, date]);
    
    const bookings = bookingsResult.rows;
    
    if (bookings.length < 2) {
      return { 
        success: false, 
        message: 'Need at least 2 bookings with coordinates for optimization' 
      };
    }
    
    // Calculate original route metrics
    const originalMetrics = await calculateRouteMetrics(bookings);\n    \n    // Generate optimized route using Google Maps\n    const optimizedRoute = await optimizeRoute(bookings);\n    \n    // Calculate optimized route metrics\n    const optimizedMetrics = await calculateRouteMetrics(optimizedRoute.bookings);\n    \n    // Calculate savings\n    const timeSaved = Math.max(0, originalMetrics.totalDuration - optimizedMetrics.totalDuration);\n    const distanceSaved = Math.max(0, originalMetrics.totalDistance - optimizedMetrics.totalDistance);\n    \n    return {\n      success: true,\n      videographerId,\n      date,\n      originalRoute: {\n        bookings,\n        totalDistance: originalMetrics.totalDistance,\n        totalDuration: originalMetrics.totalDuration\n      },\n      optimizedRoute: {\n        bookings: optimizedRoute.bookings,\n        totalDistance: optimizedMetrics.totalDistance,\n        totalDuration: optimizedMetrics.totalDuration,\n        googleRoute: optimizedRoute.googleRoute\n      },\n      timeSaved: Math.round(timeSaved / 60), // Convert to minutes\n      distanceSaved: (distanceSaved * 0.000621371).toFixed(2), // Convert to miles\n      fuelSavings: calculateFuelSavings(distanceSaved),\n      carbonSavings: calculateCarbonSavings(distanceSaved),\n      clusters: generateGeographicClusters(bookings)\n    };\n    \n  } catch (error) {\n    logger.error('Failed to generate videographer optimization:', error);\n    throw error;\n  }\n}\n\n// Optimize route using Google Maps Directions API\nasync function optimizeRoute(bookings) {\n  try {\n    if (bookings.length < 2) {\n      return { bookings, googleRoute: null };\n    }\n    \n    // Prepare waypoints for Google Maps\n    const waypoints = bookings.slice(1, -1).map(booking => ({\n      location: `${booking.latitude},${booking.longitude}`,\n      stopover: true\n    }));\n    \n    const directionsParams = {\n      origin: `${bookings[0].latitude},${bookings[0].longitude}`,\n      destination: `${bookings[bookings.length - 1].latitude},${bookings[bookings.length - 1].longitude}`,\n      mode: 'driving',\n      optimize: true,\n      departure_time: 'now',\n      traffic_model: 'best_guess',\n      key: process.env.GOOGLE_MAPS_API_KEY\n    };\n    \n    if (waypoints.length > 0) {\n      directionsParams.waypoints = waypoints;\n    }\n    \n    const response = await mapsClient.directions({ params: directionsParams });\n    const route = response.data.routes[0];\n    \n    if (!route) {\n      return { bookings, googleRoute: null };\n    }\n    \n    // Reorder bookings based on Google's optimization\n    let optimizedBookings = [bookings[0]]; // First booking stays first\n    \n    if (route.waypoint_order && route.waypoint_order.length > 0) {\n      // Add waypoints in optimized order\n      route.waypoint_order.forEach(index => {\n        optimizedBookings.push(bookings[index + 1]);\n      });\n      \n      // Add last booking if it exists and wasn't included\n      if (bookings.length > waypoints.length + 1) {\n        optimizedBookings.push(bookings[bookings.length - 1]);\n      }\n    } else {\n      // No waypoints to optimize, keep original order\n      optimizedBookings = [...bookings];\n    }\n    \n    return {\n      bookings: optimizedBookings,\n      googleRoute: route\n    };\n    \n  } catch (error) {\n    logger.error('Route optimization API error:', error);\n    // Return original bookings if optimization fails\n    return { bookings, googleRoute: null };\n  }\n}\n\n// Calculate route metrics (distance and duration)\nasync function calculateRouteMetrics(bookings) {\n  let totalDistance = 0;\n  let totalDuration = 0;\n  \n  if (bookings.length < 2) {\n    return { totalDistance: 0, totalDuration: 0 };\n  }\n  \n  // Calculate distance and duration between consecutive bookings\n  for (let i = 0; i < bookings.length - 1; i++) {\n    const origin = bookings[i];\n    const destination = bookings[i + 1];\n    \n    try {\n      const response = await mapsClient.distancematrix({\n        params: {\n          origins: [`${origin.latitude},${origin.longitude}`],\n          destinations: [`${destination.latitude},${destination.longitude}`],\n          mode: 'driving',\n          units: 'metric',\n          departure_time: 'now',\n          traffic_model: 'best_guess',\n          key: process.env.GOOGLE_MAPS_API_KEY\n        }\n      });\n      \n      const element = response.data.rows[0].elements[0];\n      \n      if (element.status === 'OK') {\n        totalDistance += element.distance.value; // meters\n        totalDuration += (element.duration_in_traffic || element.duration).value; // seconds\n      } else {\n        // Fallback to Haversine distance if Google Maps fails\n        const distance = calculateHaversineDistance(\n          origin.latitude, origin.longitude,\n          destination.latitude, destination.longitude\n        );\n        totalDistance += distance * 1609.34; // Convert miles to meters\n        totalDuration += (distance / 35) * 3600; // Assume 35 mph average speed\n      }\n      \n      // Add small delay to respect API limits\n      await new Promise(resolve => setTimeout(resolve, 100));\n      \n    } catch (error) {\n      logger.error(`Error calculating distance between bookings ${origin.id} and ${destination.id}:`, error);\n      \n      // Fallback calculation\n      const distance = calculateHaversineDistance(\n        origin.latitude, origin.longitude,\n        destination.latitude, destination.longitude\n      );\n      totalDistance += distance * 1609.34;\n      totalDuration += (distance / 35) * 3600;\n    }\n  }\n  \n  return { totalDistance, totalDuration };\n}\n\n// Calculate Haversine distance between two points\nfunction calculateHaversineDistance(lat1, lon1, lat2, lon2) {\n  const R = 3959; // Earth's radius in miles\n  const dLat = (lat2 - lat1) * Math.PI / 180;\n  const dLon = (lon2 - lon1) * Math.PI / 180;\n  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +\n            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *\n            Math.sin(dLon / 2) * Math.sin(dLon / 2);\n  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));\n  return R * c;\n}\n\n// Calculate fuel savings\nfunction calculateFuelSavings(distanceSavedMeters) {\n  const distanceSavedMiles = distanceSavedMeters * 0.000621371;\n  const avgMPG = 25; // Average miles per gallon\n  const avgGasPrice = 3.50; // Average gas price per gallon\n  \n  const gallonsSaved = distanceSavedMiles / avgMPG;\n  const dollarsSaved = gallonsSaved * avgGasPrice;\n  \n  return {\n    gallons: gallonsSaved.toFixed(2),\n    dollars: dollarsSaved.toFixed(2)\n  };\n}\n\n// Calculate carbon emissions savings\nfunction calculateCarbonSavings(distanceSavedMeters) {\n  const distanceSavedMiles = distanceSavedMeters * 0.000621371;\n  const co2PoundsPerMile = 0.89; // Average CO2 emissions per mile\n  \n  const poundsCO2Saved = distanceSavedMiles * co2PoundsPerMile;\n  const kgCO2Saved = poundsCO2Saved * 0.453592;\n  \n  return {\n    pounds: poundsCO2Saved.toFixed(2),\n    kg: kgCO2Saved.toFixed(2)\n  };\n}\n\n// Generate geographic clusters from bookings\nfunction generateGeographicClusters(bookings) {\n  const clusters = [];\n  const processed = new Set();\n  const clusterThresholdMiles = 5; // Cluster bookings within 5 miles\n  \n  for (let i = 0; i < bookings.length; i++) {\n    if (processed.has(i)) continue;\n    \n    const cluster = {\n      id: clusters.length + 1,\n      bookings: [bookings[i]],\n      centerLat: bookings[i].latitude,\n      centerLng: bookings[i].longitude\n    };\n    \n    processed.add(i);\n    \n    // Find nearby bookings to add to this cluster\n    for (let j = i + 1; j < bookings.length; j++) {\n      if (processed.has(j)) continue;\n      \n      const distance = calculateHaversineDistance(\n        bookings[i].latitude, bookings[i].longitude,\n        bookings[j].latitude, bookings[j].longitude\n      );\n      \n      if (distance <= clusterThresholdMiles) {\n        cluster.bookings.push(bookings[j]);\n        processed.add(j);\n      }\n    }\n    \n    // Recalculate cluster center if multiple bookings\n    if (cluster.bookings.length > 1) {\n      cluster.centerLat = cluster.bookings.reduce((sum, b) => sum + b.latitude, 0) / cluster.bookings.length;\n      cluster.centerLng = cluster.bookings.reduce((sum, b) => sum + b.longitude, 0) / cluster.bookings.length;\n    }\n    \n    cluster.radius = calculateClusterRadius(cluster.bookings, cluster.centerLat, cluster.centerLng);\n    clusters.push(cluster);\n  }\n  \n  return clusters;\n}\n\n// Calculate cluster radius\nfunction calculateClusterRadius(bookings, centerLat, centerLng) {\n  if (bookings.length <= 1) return 0;\n  \n  let maxDistance = 0;\n  bookings.forEach(booking => {\n    const distance = calculateHaversineDistance(\n      centerLat, centerLng,\n      booking.latitude, booking.longitude\n    );\n    maxDistance = Math.max(maxDistance, distance);\n  });\n  \n  return maxDistance;\n}\n\n// Save optimization suggestion to database\nasync function saveOptimizationSuggestion(optimization) {\n  try {\n    const result = await pool.query(`\n      INSERT INTO route_optimizations \n      (videographer_id, optimization_date, booking_ids, original_route, \n       optimized_route, time_saved, distance_saved, status)\n      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')\n      RETURNING id\n    `, [\n      optimization.videographerId,\n      optimization.date,\n      optimization.originalRoute.bookings.map(b => b.id),\n      JSON.stringify(optimization.originalRoute),\n      JSON.stringify(optimization.optimizedRoute),\n      optimization.timeSaved,\n      parseFloat(optimization.distanceSaved)\n    ]);\n    \n    const optimizationId = result.rows[0].id;\n    \n    // Create notification for videographer\n    await pool.query(`\n      INSERT INTO notifications (user_id, type, title, message)\n      VALUES ($1, $2, $3, $4)\n    `, [\n      optimization.videographerId,\n      'route_optimization',\n      'New Route Optimization Available',\n      `A new route optimization is available for ${optimization.date} that could save you ${optimization.timeSaved} minutes and ${optimization.distanceSaved} miles. Review and accept the optimization in your dashboard.`\n    ]);\n    \n    logger.info(`Optimization suggestion saved with ID ${optimizationId}`);\n    return optimizationId;\n    \n  } catch (error) {\n    logger.error('Failed to save optimization suggestion:', error);\n    throw error;\n  }\n}\n\n// Get optimization suggestions for a videographer\nasync function getOptimizationSuggestions(videographerId, status = 'pending') {\n  try {\n    const result = await pool.query(`\n      SELECT ro.*, \n             COUNT(DISTINCT b.id) as booking_count\n      FROM route_optimizations ro\n      LEFT JOIN bookings b ON b.id = ANY(ro.booking_ids)\n      WHERE ro.videographer_id = $1 \n        AND ro.status = $2\n        AND ro.optimization_date >= CURRENT_DATE\n      GROUP BY ro.id\n      ORDER BY ro.optimization_date, ro.created_at DESC\n    `, [videographerId, status]);\n    \n    return result.rows.map(row => ({\n      ...row,\n      original_route: JSON.parse(row.original_route),\n      optimized_route: JSON.parse(row.optimized_route)\n    }));\n    \n  } catch (error) {\n    logger.error('Failed to get optimization suggestions:', error);\n    throw error;\n  }\n}\n\n// Accept optimization suggestion\nasync function acceptOptimization(optimizationId, videographerId) {\n  const client = await pool.connect();\n  \n  try {\n    await client.query('BEGIN');\n    \n    // Get optimization details\n    const optimizationResult = await client.query(`\n      SELECT * FROM route_optimizations \n      WHERE id = $1 AND videographer_id = $2 AND status = 'pending'\n    `, [optimizationId, videographerId]);\n    \n    if (optimizationResult.rows.length === 0) {\n      throw new Error('Optimization not found or already processed');\n    }\n    \n    const optimization = optimizationResult.rows[0];\n    const optimizedRoute = JSON.parse(optimization.optimized_route);\n    \n    // Update booking times based on optimized route\n    for (let i = 0; i < optimizedRoute.bookings.length; i++) {\n      const booking = optimizedRoute.bookings[i];\n      const newTime = calculateOptimalTime(optimization.optimization_date, i, optimizedRoute.bookings);\n      \n      await client.query(`\n        UPDATE bookings \n        SET scheduled_time = $1,\n            manager_notes = COALESCE(manager_notes, '') || '\\nRoute optimized - new time: ' || $1\n        WHERE id = $2\n      `, [newTime, booking.id]);\n    }\n    \n    // Mark optimization as accepted\n    await client.query(`\n      UPDATE route_optimizations \n      SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP\n      WHERE id = $1\n    `, [optimizationId]);\n    \n    // Create success notification\n    await client.query(`\n      INSERT INTO notifications (user_id, type, title, message)\n      VALUES ($1, $2, $3, $4)\n    `, [\n      videographerId,\n      'optimization_accepted',\n      'Route Optimization Applied',\n      `Route optimization for ${optimization.optimization_date} has been applied. Your bookings have been rescheduled for optimal efficiency.`\n    ]);\n    \n    await client.query('COMMIT');\n    \n    logger.info(`Optimization ${optimizationId} accepted by videographer ${videographerId}`);\n    \n    return {\n      success: true,\n      message: 'Route optimization applied successfully',\n      timeSaved: optimization.time_saved,\n      distanceSaved: optimization.distance_saved\n    };\n    \n  } catch (error) {\n    await client.query('ROLLBACK');\n    logger.error('Failed to accept optimization:', error);\n    throw error;\n  } finally {\n    client.release();\n  }\n}\n\n// Calculate optimal booking time based on route position\nfunction calculateOptimalTime(date, bookingIndex, optimizedBookings) {\n  const baseTime = new Date(`${date}T08:00:00`);\n  \n  // Calculate cumulative time for previous bookings\n  let cumulativeMinutes = 0;\n  \n  for (let i = 0; i < bookingIndex; i++) {\n    const booking = optimizedBookings[i];\n    const duration = booking.estimated_duration || 120; // Default 2 hours\n    const travelTime = 30; // Default 30 minutes travel time\n    \n    cumulativeMinutes += duration + travelTime;\n  }\n  \n  baseTime.setMinutes(baseTime.getMinutes() + cumulativeMinutes);\n  return baseTime.toTimeString().slice(0, 5); // Return HH:MM format\n}\n\nmodule.exports = {\n  generateDailyOptimizations,\n  generateVideographerOptimization,\n  getOptimizationSuggestions,\n  acceptOptimization,\n  calculateRouteMetrics,\n  optimizeRoute\n};"