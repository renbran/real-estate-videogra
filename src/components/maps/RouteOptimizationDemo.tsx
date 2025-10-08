import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Path, MapPin, Clock, TrendUp, Sparkle } from '@phosphor-icons/react'
import { BookingRequest } from '@/lib/types'
import { googleMapsService } from '@/lib/google-maps'
import { MapVisualization } from './MapVisualization'
import { toast } from 'sonner'

interface RouteOptimizationDemoProps {
  selectedDate?: string
  onOptimizationComplete?: (result: any) => void
}

export function RouteOptimizationDemo({ selectedDate, onOptimizationComplete }: RouteOptimizationDemoProps) {
  const [bookings] = useKV<BookingRequest[]>('bookings', [])
  const [optimizationResult, setOptimizationResult] = useState<any>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [showOptimizedRoute, setShowOptimizedRoute] = useState(false)

  // Filter bookings with coordinates for route optimization
  const optimizableBookings = bookings?.filter(booking => 
    booking.coordinates && 
    booking.status === 'approved' &&
    (!selectedDate || booking.scheduled_date === selectedDate)
  ) || []

  const handleOptimizeRoute = async () => {
    if (optimizableBookings.length < 2) {
      toast.warning('Need at least 2 geocoded properties to optimize route')
      return
    }

    setIsOptimizing(true)
    try {
      // Prepare waypoints for optimization
      const waypoints = optimizableBookings.map(booking => ({
        coordinates: booking.coordinates!,
        booking_id: booking.id,
        address: booking.formatted_address || booking.property_address || booking.location,
        duration_minutes: booking.estimated_duration || getDefaultDuration(booking.shoot_complexity)
      }))

      const result = await googleMapsService.optimizeRoute(waypoints)
      
      if (result) {
        setOptimizationResult(result)
        setShowOptimizedRoute(true)
        onOptimizationComplete?.(result)
        
        const timeSaved = calculateTimeSavings(waypoints, result)
        toast.success(`Route optimized! Estimated ${timeSaved} minutes saved`, {
          description: `${result.optimized_order.length} stops, ${(result.total_distance / 1609.34).toFixed(1)} miles total`
        })
      } else {
        toast.error('Failed to optimize route', {
          description: 'Please try again or check your addresses'
        })
      }
    } catch (error) {
      console.error('Route optimization error:', error)
      toast.error('Route optimization failed', {
        description: 'Please ensure all addresses are validated'
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  const getDefaultDuration = (complexity?: string): number => {
    switch (complexity) {
      case 'quick': return 45
      case 'standard': return 90
      case 'complex': return 180
      default: return 90
    }
  }

  const calculateTimeSavings = (waypoints: any[], result: any): number => {
    // Simplified calculation - in reality you'd compare against non-optimized route
    const estimatedSavings = Math.max(0, waypoints.length * 15 - result.total_duration * 0.1)
    return Math.round(estimatedSavings)
  }

  const getSuggestedBatches = () => {
    const suggestions = []
    
    // Group by geographic zone
    const zoneGroups = optimizableBookings.reduce((acc, booking) => {
      const zone = booking.geographic_zone || 'unknown'
      if (!acc[zone]) acc[zone] = []
      acc[zone].push(booking)
      return acc
    }, {} as Record<string, BookingRequest[]>)

    Object.entries(zoneGroups).forEach(([zone, bookings]) => {
      if (bookings.length >= 2) {
        suggestions.push({
          type: 'geographic',
          zone,
          bookings,
          potential_savings: `${bookings.length * 20} min travel time`
        })
      }
    })

    return suggestions
  }

  if (optimizableBookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Properties Available for Route Optimization</h3>
          <p className="text-muted-foreground mb-4">
            Properties need validated addresses with coordinates to enable route optimization.
          </p>
          <Alert>
            <Sparkle className="w-4 h-4" />
            <AlertDescription>
              Tip: Use the address validation tool to geocode property addresses, then return here to optimize routes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Route Optimization Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Path className="w-5 h-5" />
            Route Optimization
            {selectedDate && (
              <Badge variant="secondary">{selectedDate}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {optimizableBookings.length} Properties Ready for Optimization
                </div>
                <div className="text-sm text-muted-foreground">
                  All addresses have been validated and geocoded
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleOptimizeRoute}
                  disabled={isOptimizing || optimizableBookings.length < 2}
                  className="flex items-center gap-2"
                >
                  <TrendUp className="w-4 h-4" />
                  {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
                </Button>
                
                {optimizationResult && (
                  <Button
                    variant="outline"
                    onClick={() => setShowOptimizedRoute(!showOptimizedRoute)}
                  >
                    {showOptimizedRoute ? 'Hide Route' : 'Show Route'}
                  </Button>
                )}
              </div>
            </div>

            {/* Optimization Results Summary */}
            {optimizationResult && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {optimizationResult.optimized_order.length}
                  </div>
                  <div className="text-sm text-blue-800">Stops</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(optimizationResult.total_distance / 1609.34).toFixed(1)}
                  </div>
                  <div className="text-sm text-blue-800">Miles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(optimizationResult.total_duration)}
                  </div>
                  <div className="text-sm text-blue-800">Min Travel</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {calculateTimeSavings(optimizableBookings, optimizationResult)}
                  </div>
                  <div className="text-sm text-green-800">Min Saved</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Batching Suggestions */}
      {getSuggestedBatches().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkle className="w-5 h-5" />
              Smart Batching Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getSuggestedBatches().map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {suggestion.bookings.length} properties in {suggestion.zone} zone
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Potential savings: {suggestion.potential_savings}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    Efficient
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Map */}
      <MapVisualization
        bookings={optimizableBookings}
        routeOptimization={optimizationResult}
        showRoute={showOptimizedRoute}
        height="h-[500px]"
      />

      {/* Properties List */}
      <Card>
        <CardHeader>
          <CardTitle>Properties for Route Optimization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {optimizableBookings.map((booking, index) => {
              const optimizedIndex = optimizationResult?.optimized_order.indexOf(booking.id)
              const isOptimized = optimizedIndex !== -1

              return (
                <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isOptimized 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isOptimized ? optimizedIndex + 1 : index + 1}
                    </div>
                    <div>
                      <div className="font-medium">
                        {booking.formatted_address || booking.property_address || booking.location}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.shoot_complexity} • {booking.estimated_duration || getDefaultDuration(booking.shoot_complexity)} min
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      booking.shoot_complexity === 'quick' ? 'default' :
                      booking.shoot_complexity === 'standard' ? 'secondary' : 'destructive'
                    }>
                      {booking.shoot_complexity}
                    </Badge>
                    {booking.coordinates && (
                      <Badge variant="outline" className="text-green-600">
                        <MapPin className="w-3 h-3 mr-1" />
                        Geocoded
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}