import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from '@phosphor-icons/react'

interface ShootLocationMapProps {
  latitude: number
  longitude: number
  address: string
  title?: string
  height?: string
  className?: string
}

declare global {
  interface Window {
    google: any
  }
}

export function ShootLocationMap({ 
  latitude, 
  longitude, 
  address, 
  title = "Shoot Location",
  height = "400px",
  className = "" 
}: ShootLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerInstance = useRef<any>(null)

  useEffect(() => {
    loadGoogleMapsScript()
  }, [])

  useEffect(() => {
    if (window.google && mapRef.current) {
      initializeMap()
    }
  }, [latitude, longitude, address])

  const loadGoogleMapsScript = () => {
    if (window.google) {
      initializeMap()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDNJ-Jl4d4KFTxTJP_g5WW3_K9pL9tOq0g&libraries=places`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      initializeMap()
    }
    
    document.head.appendChild(script)
  }

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    const center = { lat: latitude, lng: longitude }
    
    // Initialize map
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 16,
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi.business',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          elementType: 'labels.icon',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })

    // Remove existing marker if any
    if (markerInstance.current) {
      markerInstance.current.setMap(null)
    }

    // Create custom marker icon
    const markerIcon = {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
          <path d="M16 0C7.2 0 0 7.2 0 16c0 16 16 24 16 24s16-8 16-24c0-8.8-7.2-16-16-16z" fill="#7d1538"/>
          <circle cx="16" cy="16" r="8" fill="white"/>
          <circle cx="16" cy="16" r="4" fill="#7d1538"/>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(32, 40),
      anchor: new window.google.maps.Point(16, 40)
    }

    // Add marker
    markerInstance.current = new window.google.maps.Marker({
      position: center,
      map: mapInstance.current,
      icon: markerIcon,
      title: address,
      animation: window.google.maps.Animation.DROP
    })

    // Add info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 8px; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0; color: #7d1538; font-size: 14px; font-weight: 600;">
            ${title}
          </h3>
          <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.4;">
            ${address}
          </p>
          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">
            Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}
          </p>
        </div>
      `
    })

    markerInstance.current.addListener('click', () => {
      infoWindow.open(mapInstance.current, markerInstance.current)
    })

    // Open info window by default
    setTimeout(() => {
      infoWindow.open(mapInstance.current, markerInstance.current)
    }, 500)
  }

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}&zoom=16`
    window.open(url, '_blank')
  }

  return (
    <Card className={`border-osus-primary-200 shadow-lg ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-osus-primary-800 flex items-center gap-2 text-base">
          <MapPin className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={mapRef} 
          style={{ height, width: '100%' }}
          className="rounded-b-lg overflow-hidden"
        />
        <div className="p-4 bg-osus-primary-50 border-t border-osus-primary-200">
          <p className="text-sm text-osus-primary-800 mb-2 font-medium">
            {address}
          </p>
          <button
            onClick={openInGoogleMaps}
            className="text-xs text-osus-primary-600 hover:text-osus-primary-800 underline transition-colors"
          >
            Open in Google Maps
          </button>
        </div>
      </CardContent>
    </Card>
  )
}