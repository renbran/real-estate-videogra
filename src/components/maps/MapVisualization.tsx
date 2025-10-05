/// <reference path="../../types/google-maps.d.ts" />
import { useEffect, useRef } from 'react'
import { BookingRequest } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from '@phosphor-icons/react'

interface MapVisualizationProps {
  bookings: BookingRequest[]
  className?: string
}

export function MapVisualization({ bookings, className }: MapVisualizationProps) {
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
    validBookings.forEach((booking, index) => {
      if (!booking.coordinates) return

      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(booking.coordinates.lat, booking.coordinates.lng),
        map: map,
        title: booking.formatted_address || booking.property_address,
        label: {
          text: (index + 1).toString(),
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: getComplexityColor(booking.shoot_complexity),
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      })

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h4 style="margin: 0 0 8px 0; font-weight: 600;">${booking.formatted_address || booking.property_address}</h4>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Agent:</strong> ${booking.agent_name}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Complexity:</strong> ${booking.shoot_complexity}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Duration:</strong> ${booking.estimated_duration}min</p>
            ${booking.special_requirements ? `<p style="margin: 4px 0; font-size: 12px; color: #666;"><em>${booking.special_requirements}</em></p>` : ''}
          </div>
        `
      })

      marker.addListener('click', () => {
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
      if (mapInstanceRef.current) {
        // Clean up markers and info windows when component unmounts
      }
    }
  }, [bookings])

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
          <MapPin className="w-5 h-5" />
          Property Locations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef} 
          className="w-full h-96 rounded-lg border"
          style={{ minHeight: '400px' }}
        />
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
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
      </CardContent>
    </Card>
  )
}