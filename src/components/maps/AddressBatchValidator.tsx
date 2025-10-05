import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, MapPin, Upload } from '@phosphor-icons/react'
import { BookingRequest } from '@/lib/types'
import { googleMapsService } from '@/lib/google-maps'
import { toast } from 'sonner'

interface AddressBatchValidatorProps {
  onValidationComplete?: (updatedBookings: BookingRequest[]) => void
}

export function AddressBatchValidator({ onValidationComplete }: AddressBatchValidatorProps) {
  const [bookings, setBookings] = useKV<BookingRequest[]>('bookings', [])
  const [validationResults, setValidationResults] = useState<Array<{
    booking_id: string
    address: string
    validated: boolean
    formatted_address?: string
    coordinates?: { lat: number; lng: number }
    error?: string
  }>>([])
  const [isValidating, setIsValidating] = useState(false)
  const [validationProgress, setValidationProgress] = useState(0)

  // Get bookings that need address validation
  const invalidBookings = (bookings || []).filter(booking => 
    !booking.coordinates || !booking.formatted_address
  )

  const handleBatchValidation = async () => {
    if (invalidBookings.length === 0) {
      toast.info('All addresses are already validated')
      return
    }

    setIsValidating(true)
    setValidationProgress(0)
    setValidationResults([])

    try {
      const addresses = invalidBookings.map(b => b.property_address)
      const results = await googleMapsService.batchValidateAddresses(addresses)
      
      const validationResults = invalidBookings.map((booking, index) => {
        const result = results[index]
        return {
          booking_id: booking.id,
          address: booking.property_address,
          validated: result.validated,
          formatted_address: result.result?.formatted_address,
          coordinates: result.result?.coordinates,
          error: result.validated ? undefined : 'Could not validate address'
        }
      })

      setValidationResults(validationResults)

      // Update bookings with validated addresses
      const updatedBookings = bookings?.map(booking => {
        const validation = validationResults.find(v => v.booking_id === booking.id)
        if (validation && validation.validated) {
          const geographic_zone = validation.coordinates ? 
            googleMapsService.determineGeographicZone(validation.coordinates) as any : 
            booking.geographic_zone

          return {
            ...booking,
            formatted_address: validation.formatted_address,
            coordinates: validation.coordinates,
            geographic_zone,
            updated_at: new Date().toISOString()
          }
        }
        return booking
      }) || []

      setBookings(updatedBookings as BookingRequest[])
      onValidationComplete?.(updatedBookings as BookingRequest[])

      const successCount = validationResults.filter(r => r.validated).length
      const failureCount = validationResults.length - successCount

      if (successCount > 0) {
        toast.success(`Successfully validated ${successCount} address${successCount > 1 ? 'es' : ''}`)
      }
      if (failureCount > 0) {
        toast.warning(`Failed to validate ${failureCount} address${failureCount > 1 ? 'es' : ''}`)
      }

    } catch (error) {
      console.error('Batch validation error:', error)
      toast.error('Batch validation failed', {
        description: 'Please try again or validate addresses individually'
      })
    } finally {
      setIsValidating(false)
      setValidationProgress(0)
    }
  }

  if (invalidBookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Addresses Validated</h3>
          <p className="text-muted-foreground">
            All booking addresses have been validated and geocoded successfully.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Address Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Upload className="w-4 h-4" />
              <AlertDescription>
                {invalidBookings.length} booking{invalidBookings.length > 1 ? 's' : ''} need{invalidBookings.length === 1 ? 's' : ''} address validation for route optimization.
              </AlertDescription>
            </Alert>

            {isValidating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Validating addresses...</span>
                  <span>{Math.round(validationProgress)}%</span>
                </div>
                <Progress value={validationProgress} className="w-full" />
              </div>
            )}

            <Button 
              onClick={handleBatchValidation}
              disabled={isValidating}
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {isValidating ? 'Validating Addresses...' : 'Validate All Addresses'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Validation List */}
      <Card>
        <CardHeader>
          <CardTitle>Addresses Needing Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invalidBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{booking.property_address}</div>
                  <div className="text-sm text-muted-foreground">
                    {booking.agent_name} • {booking.preferred_date}
                  </div>
                </div>
                <Badge variant="secondary">
                  Needs Validation
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {validationResults.map((result) => (
                <div key={result.booking_id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {result.validated ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {result.formatted_address || result.address}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {result.validated 
                        ? `✓ Geocoded successfully` 
                        : `✗ ${result.error || 'Validation failed'}`
                      }
                    </div>
                    {result.coordinates && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {result.coordinates.lat.toFixed(6)}, {result.coordinates.lng.toFixed(6)}
                      </div>
                    )}
                  </div>
                  
                  <Badge variant={result.validated ? 'default' : 'destructive'}>
                    {result.validated ? 'Valid' : 'Invalid'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}