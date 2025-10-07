import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Navigation } from '@phosphor-icons/react'

interface PlaceResult {
  formatted_address: string
  place_id: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  name?: string
}

interface GooglePlacePickerProps {
  label?: string
  placeholder?: string
  value?: string
  onChange: (place: PlaceResult | null) => void
  onAddressChange?: (address: string) => void
  className?: string
}

declare global {
  interface Window {
    google: any
    initGoogleMaps: () => void
  }
}

export function GooglePlacePicker({ 
  label = "Location", 
  placeholder = "Enter location or address", 
  value = "",
  onChange, 
  onAddressChange,
  className = "" 
}: GooglePlacePickerProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isLoaded, setIsLoaded] = useState(false)
  const [autocomplete, setAutocomplete] = useState<any>(null)
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)

  useEffect(() => {
    loadGoogleMapsScript()
  }, [])

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const loadGoogleMapsScript = () => {
    if (window.google) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDNJ-Jl4d4KFTxTJP_g5WW3_K9pL9tOq0g&libraries=places`
    script.async = true
    script.defer = true
    
    window.initGoogleMaps = () => {
      setIsLoaded(true)
    }
    
    script.onload = () => {
      setIsLoaded(true)
    }
    
    document.head.appendChild(script)
  }

  useEffect(() => {
    if (isLoaded && window.google) {
      initializeAutocomplete()
    }
  }, [isLoaded])

  const initializeAutocomplete = () => {
    const input = document.getElementById('google-places-input') as HTMLInputElement
    if (!input || !window.google) return

    const autocompleteInstance = new window.google.maps.places.Autocomplete(input, {
      fields: ['formatted_address', 'place_id', 'geometry', 'name'],
      types: ['address']
    })

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace()
      
      if (!place.geometry) {
        console.log("No details available for input: '" + place.name + "'")
        return
      }

      const placeResult: PlaceResult = {
        formatted_address: place.formatted_address || '',
        place_id: place.place_id || '',
        geometry: {
          location: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          }
        },
        name: place.name || ''
      }

      setSelectedPlace(placeResult)
      setInputValue(place.formatted_address || '')
      onChange(placeResult)
      onAddressChange?.(place.formatted_address || '')
    })

    setAutocomplete(autocompleteInstance)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onAddressChange?.(newValue)
    
    // If user is typing manually, clear selected place
    if (!autocomplete) {
      setSelectedPlace(null)
      onChange(null)
    }
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        
        if (window.google) {
          const geocoder = new window.google.maps.Geocoder()
          const latlng = { lat: latitude, lng: longitude }
          
          geocoder.geocode({ location: latlng }, (results: any[], status: string) => {
            if (status === 'OK' && results[0]) {
              const place = results[0]
              const placeResult: PlaceResult = {
                formatted_address: place.formatted_address,
                place_id: place.place_id,
                geometry: {
                  location: {
                    lat: latitude,
                    lng: longitude
                  }
                }
              }
              
              setSelectedPlace(placeResult)
              setInputValue(place.formatted_address)
              onChange(placeResult)
              onAddressChange?.(place.formatted_address)
            }
          })
        }
      },
      (error) => {
        console.error('Error getting location:', error)
        alert('Unable to get your location. Please enter address manually.')
      }
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="flex items-center gap-2 text-osus-primary-800 font-medium">
        <MapPin size={16} />
        {label}
      </Label>
      
      <div className="relative">
        <Input
          id="google-places-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pr-10 border-osus-primary-200 focus:border-osus-primary-500"
          required
        />
        
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-osus-primary-600 hover:text-osus-primary-800 transition-colors"
          title="Use current location"
        >
          <Navigation size={18} />
        </button>
      </div>

      {selectedPlace && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-emerald-800 break-words">
                  {selectedPlace.name && (
                    <span className="block">{selectedPlace.name}</span>
                  )}
                  <span className="text-emerald-700">{selectedPlace.formatted_address}</span>
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  Coordinates: {selectedPlace.geometry.location.lat.toFixed(6)}, {selectedPlace.geometry.location.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoaded && (
        <div className="text-sm text-muted-foreground">
          Loading Google Maps...
        </div>
      )}
    </div>
  )
}