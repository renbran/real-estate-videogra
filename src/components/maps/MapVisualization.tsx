/// <reference path="../../types/google-maps.d.ts" />
import { useEffect, useRef } from 'react'
import { BookingRequest, RouteOptimizationResult } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Path } from '@phosphor-icons/react'

interface MapVisualizationProps {
  bookings: BookingRequest[]
  routeOptimization?: RouteOptimizationResult
  showRoute?: boolean
  className?: string
  height?: string
}

export function MapVisualization({ 
  bookings, 
  routeOptimization, 
  showRoute = false, 
  className,
  height = 'h-96'
}: MapVisualizationProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)

  useEffect(() => {
    if (typeof google === 'undefined' || !google.maps || !mapRef.current) {
      return
    }

    const validBookings = bookings.filter(b => b.coordinates)
    
    if (validBookings.length === 0) {
      return
    }

    // Create map centered on first booking
    const center = validBookings[0].coordinates!
    const map = new google.maps.Map(mapRef.current, {
      zoom: 13,
      center: new google.maps.LatLng(center.lat, center.lng),
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    })

    mapInstanceRef.current = map

    // Add markers for each booking
    const markers: google.maps.Marker[] = []
    const infoWindows: google.maps.InfoWindow[] = []

    // Determine marker order based on route optimization
    const orderedBookings = routeOptimization && showRoute ? 
      getBookingsInOptimizedOrder(validBookings, routeOptimization) : 
      validBookings

    orderedBookings.forEach((booking, index) => {
      if (!booking.coordinates) return

      const isOptimized = routeOptimization && showRoute
      const markerNumber = isOptimized ? 
        routeOptimization.optimized_order.indexOf(booking.id) + 1 : 
        index + 1

      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(booking.coordinates.lat, booking.coordinates.lng),
        map: map,
        title: booking.formatted_address || booking.property_address,
        label: {
          text: markerNumber.toString(),
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 22,
          fillColor: getComplexityColor(booking.shoot_complexity),
          fillOpacity: 1,
          strokeColor: isOptimized ? '#0066cc' : '#ffffff',
          strokeWeight: isOptimized ? 3 : 2
        }
      })

      markers.push(marker)

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 250px;">
            <h4 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">
              ${isOptimized ? `Stop ${markerNumber}: ` : ''}${booking.formatted_address || booking.property_address}
            </h4>
            <div style="font-size: 13px; line-height: 1.4;">
              <p style="margin: 4px 0;"><strong>Agent:</strong> ${booking.agent_name}</p>
              <p style="margin: 4px 0;"><strong>Complexity:</strong> ${booking.shoot_complexity}</p>
              <p style="margin: 4px 0;"><strong>Duration:</strong> ${booking.estimated_duration}min</p>
              <p style="margin: 4px 0;"><strong>Date:</strong> ${booking.scheduled_date || booking.preferred_date}</p>
              ${booking.special_requirements ? 
                `<p style="margin: 8px 0 4px 0; font-size: 12px; color: #6b7280; font-style: italic;">${booking.special_requirements}</p>` : 
                ''}
            </div>
            ${isOptimized ? 
              `<div style="margin-top: 8px; padding: 4px 8px; background: #e0f2fe; border-radius: 4px; font-size: 12px; color: #0066cc;">
                🗺️ Optimized route position
              </div>` : 
              ''}
          </div>
        `
      })

      infoWindows.push(infoWindow)

      marker.addListener('click', () => {
        // Close other info windows
        infoWindows.forEach(iw => iw.close())
        infoWindow.open(map, marker)
      })
    })

    // Fit map to show all markers
    if (validBookings.length > 1) {
      const bounds = new google.maps.LatLngBounds()
      validBookings.forEach(booking => {
        if (booking.coordinates) {
          bounds.extend(new google.maps.LatLng(booking.coordinates.lat, booking.coordinates.lng))
        }
      })
      map.fitBounds(bounds)
    }

    // Cleanup
    return () => {
      markers.forEach(marker => marker.setMap(null))
      infoWindows.forEach(infoWindow => infoWindow.close())
    }
  }, [bookings, routeOptimization, showRoute])

  const getBookingsInOptimizedOrder = (
    bookings: BookingRequest[], 
    optimization: RouteOptimizationResult
  ): BookingRequest[] => {
    return optimization.optimized_order
      .map(bookingId => bookings.find(b => b.id === bookingId))
      .filter(Boolean) as BookingRequest[]
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'quick': return '#10b981' // green
      case 'standard': return '#f59e0b' // yellow
      case 'complex': return '#ef4444' // red
      default: return '#6b7280' // gray
    }
  }

  if (bookings.filter(b => b.coordinates).length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Geocoded Properties</h3>
          <p className="text-muted-foreground">
            Properties need valid addresses with coordinates to display on the map.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {showRoute && routeOptimization ? (
            <>
              <Path className="w-5 h-5" />
              Optimized Route Map
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5" />
              Property Locations
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef} 
          className={`w-full ${height} rounded-lg border`}
          style={{ minHeight: '400px' }}
        />
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>Quick (30-45min)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span>Standard (90min)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span>Complex (3+ hrs)</span>
            </div>
          </div>
          
          {showRoute && routeOptimization && (
            <div className="flex items-center gap-2 text-blue-600">
              <Path className="w-4 h-4" />
              <span>Optimized route shown</span>
            </div>
          )}
        </div>
        
        {routeOptimization && showRoute && (
          <div className="mt-4 pt-4 border-t bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Path className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Route Optimization Summary</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-blue-600 font-medium">
                  {(routeOptimization.total_distance / 1609.34).toFixed(1)} mi
                </div>
                <div className="text-gray-600">Total Distance</div>
              </div>
              <div>
                <div className="text-blue-600 font-medium">
                  {Math.round(routeOptimization.total_duration)} min
                </div>
                <div className="text-gray-600">Travel Time</div>
              </div>
              <div>
                <div className="text-green-600 font-medium">
                  {routeOptimization.optimized_order.length} stops
                </div>
                <div className="text-gray-600">Properties</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}