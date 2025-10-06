import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { googleMapsService } from '@/lib/google-maps'
import { MapPin, CheckCircle, XCircle } from '@phosphor-icons/react'
import { Loader2 } from 'lucide-react'
import { GooglePlacePrediction } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AddressInputProps {
  value: string
  onChange: (value: string) => void
  onAddressValidated?: (data: {
    formatted_address: string
    place_id: string
    coordinates: { lat: number; lng: number }
    geographic_zone: string
  }) => void
  placeholder?: string
  required?: boolean
  className?: string
  label?: string
  showValidationStatus?: boolean
}

export function AddressInput({
  value,
  onChange,
  onAddressValidated,
  placeholder = "Start typing an address...",
  required = false,
  className,
  label = "Address",
  showValidationStatus = true
}: AddressInputProps) {
  const [predictions, setPredictions] = useState<GooglePlacePrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isValidated, setIsValidated] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!value.trim()) {
      setPredictions([])
      setShowDropdown(false)
      setIsValidated(false)
      setValidationError(null)
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        setIsLoading(true)
        const results = await googleMapsService.getAddressPredictions(value)
        setPredictions(results)
        setShowDropdown(results.length > 0)
        setValidationError(null)
      } catch (error) {
        console.error('Address prediction error:', error)
        setPredictions([])
        setShowDropdown(false)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsValidated(false)
    setValidationError(null)
    
    if (predictions.length > 0) {
      setShowDropdown(true)
    }
  }

  const handlePredictionSelect = async (prediction: GooglePlacePrediction) => {
    setIsValidating(true)
    setShowDropdown(false)
    
    try {
      const details = await googleMapsService.getPlaceDetails(prediction.place_id)
      
      if (details) {
        const zone = googleMapsService.determineGeographicZone(details.coordinates)
        
        onChange(details.formatted_address)
        setIsValidated(true)
        setValidationError(null)
        
        onAddressValidated?.({
          formatted_address: details.formatted_address,
          place_id: prediction.place_id,
          coordinates: details.coordinates,
          geographic_zone: zone
        })
      } else {
        setValidationError('Could not validate selected address')
      }
    } catch (error) {
      console.error('Address validation error:', error)
      setValidationError('Failed to validate address')
    } finally {
      setIsValidating(false)
    }
  }

  const handleManualValidation = async () => {
    setIsValidating(true)
    
    try {
      const result = await googleMapsService.geocodeAddress(value)
      
      if (result) {
        const zone = googleMapsService.determineGeographicZone(result.coordinates)
        
        onChange(result.formatted_address)
        setIsValidated(true)
        setValidationError(null)
        
        onAddressValidated?.({
          formatted_address: result.formatted_address,
          place_id: '',
          coordinates: result.coordinates,
          geographic_zone: zone
        })
      } else {
        setValidationError('Could not validate this address')
        setIsValidated(false)
      }
    } catch (error) {
      console.error('Manual validation error:', error)
      setValidationError('Address validation failed')
      setIsValidated(false)
    } finally {
      setIsValidating(false)
    }
  }

  const getValidationIcon = () => {
    if (isValidating) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
    }
    if (isValidated) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    if (validationError) {
      return <XCircle className="w-4 h-4 text-red-500" />
    }
    return <MapPin className="w-4 h-4 text-muted-foreground" />
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="flex items-center gap-2">
        <MapPin size={16} />
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          required={required}
          className={cn(
            "pr-20",
            isValidated && "border-green-500",
            validationError && "border-red-500"
          )}
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {showValidationStatus && getValidationIcon()}
          
          {value && !isValidated && !isValidating && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleManualValidation}
              className="h-6 px-2 text-xs"
            >
              Validate
            </Button>
          )}
        </div>

        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {isLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                Searching addresses...
              </div>
            )}
            
            {!isLoading && predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
                onClick={() => handlePredictionSelect(prediction)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {prediction.structured_formatting.main_text}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showValidationStatus && (
        <div className="flex items-center gap-2 min-h-[20px]">
          {isValidated && (
            <div className="flex items-center gap-1">
              <Badge variant="default" className="bg-green-500 text-white">
                ✓ Validated
              </Badge>
              <span className="text-xs text-muted-foreground">
                Address confirmed and geocoded
              </span>
            </div>
          )}
          
          {validationError && (
            <div className="flex items-center gap-1">
              <Badge variant="destructive">
                ✗ Invalid
              </Badge>
              <span className="text-xs text-red-600">{validationError}</span>
            </div>
          )}
          
          {!isValidated && !validationError && value && !isValidating && (
            <span className="text-xs text-yellow-600">
              ⚠ Address not validated - click Validate or select from dropdown
            </span>
          )}
        </div>
      )}
    </div>
  )
}