import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, Check } from '@phosphor-icons/react'
import { GooglePlacePrediction } from '@/lib/types'
import { googleMapsService } from '@/lib/google-maps'
import { cn } from '@/lib/utils'

interface AddressInputProps {
  value: string
  onChange: (address: string, placeDetails?: {
    coordinates: { lat: number; lng: number }
    formatted_address: string
    place_id: string
  }) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function AddressInput({
  value,
  onChange,
  placeholder = "Enter property address",
  required = false,
  disabled = false,
  className
}: AddressInputProps) {
  const [predictions, setPredictions] = useState<GooglePlacePrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isValidated, setIsValidated] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const initService = async () => {
      try {
        await googleMapsService.initializeServices()
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error)
      }
    }
    initService()
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (value.length > 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          setIsLoading(true)
          const results = await googleMapsService.getAddressPredictions(value)
          setPredictions(results)
          setIsOpen(results.length > 0)
        } catch (error) {
          console.error('Error fetching predictions:', error)
          setPredictions([])
        } finally {
          setIsLoading(false)
        }
      }, 300)
    } else {
      setPredictions([])
      setIsOpen(false)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsValidated(false)
    
    if (newValue.length <= 2) {
      setIsOpen(false)
      setPredictions([])
    }
  }

  const handlePredictionSelect = async (prediction: GooglePlacePrediction) => {
    try {
      setIsLoading(true)
      const placeDetails = await googleMapsService.getPlaceDetails(prediction.place_id)
      
      if (placeDetails) {
        onChange(prediction.description, {
          coordinates: placeDetails.coordinates,
          formatted_address: placeDetails.formatted_address,
          place_id: prediction.place_id
        })
        setIsValidated(true)
      } else {
        onChange(prediction.description)
      }
    } catch (error) {
      console.error('Error getting place details:', error)
      onChange(prediction.description)
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  const validateCurrentAddress = async () => {
    if (!value || isValidated) return

    try {
      setIsLoading(true)
      const geocodeResult = await googleMapsService.geocodeAddress(value)
      
      if (geocodeResult) {
        onChange(geocodeResult.formatted_address, {
          coordinates: geocodeResult.coordinates,
          formatted_address: geocodeResult.formatted_address,
          place_id: '' // Geocoding doesn't provide place_id
        })
        setIsValidated(true)
      }
    } catch (error) {
      console.error('Error validating address:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200)
          }}
          onFocus={() => {
            if (predictions.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled || isLoading}
          className={cn(
            "pl-10 pr-10",
            isValidated && "border-green-500 bg-green-50",
            className
          )}
        />
        
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        
        {isValidated && (
          <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600" />
        )}
        
        {!isValidated && value && !isLoading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={validateCurrentAddress}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-2 text-xs"
          >
            Validate
          </Button>
        )}
      </div>

      {isOpen && predictions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto border shadow-lg">
          <div className="p-1">
            {predictions.map((prediction, index) => (
              <button
                key={prediction.place_id || index}
                className="w-full text-left p-3 hover:bg-muted rounded-sm transition-colors flex items-start gap-3"
                onClick={() => handlePredictionSelect(prediction)}
                type="button"
              >
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}