import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MapPin, 
  NavigationArrow, 
  Clock, 
  TrendUp,
  Users,
  Path
} from '@phosphor-icons/react'
import { BookingRequest, RouteOptimizationResult } from '@/lib/types'
import { googleMapsService } from '@/lib/google-maps'
import { MapVisualization } from '@/components/maps/MapVisualization'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface RouteOptimizerProps {
  selectedDate: string
  onOptimizationComplete?: (result: RouteOptimizationResult) => void
}

export function RouteOptimizer({ selectedDate, onOptimizationComplete }: RouteOptimizerProps) {
  const [bookings] = useKV<BookingRequest[]>('bookings', [])
  const [optimizations] = useKV<RouteOptimizationResult[]>('route_optimizations', [])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [currentOptimization, setCurrentOptimization] = useState<RouteOptimizationResult | null>(null)

  const dayBookings = bookings?.filter(booking => 
    (booking.scheduled_date === selectedDate || booking.preferred_date === selectedDate) && 
    booking.status === 'approved' &&
    booking.coordinates
  ) || []

  useEffect(() => {
    // Find existing optimization for this date
    const existingOptimization = optimizations?.find(opt => 
      opt.waypoints.some(wp => 
        dayBookings.some(booking => booking.id === wp.booking_id)
      )
    )
    setCurrentOptimization(existingOptimization || null)
  }, [optimizations, dayBookings])

  const handleOptimizeRoute = async () => {
    if (dayBookings.length < 2) {
      toast.error('Need at least 2 bookings to optimize route')
      return
    }

    setIsOptimizing(true)

    try {
      const waypoints = dayBookings.map(booking => ({
        booking_id: booking.id,
        coordinates: booking.coordinates!,
        address: booking.formatted_address || booking.property_address,
        duration_minutes: booking.estimated_duration
      }))

      const optimizationResult = await googleMapsService.optimizeRoute(waypoints)

      if (optimizationResult) {
        // Calculate time savings
        const originalDistance = calculateOriginalDistance(waypoints)
        const timeSavings = Math.round((originalDistance - optimizationResult.total_duration) / 60 * 100) / 100

        const enhancedResult = {
          ...optimizationResult,
          date: selectedDate,
          created_at: new Date().toISOString(),
          time_savings_hours: timeSavings
        }

        // Save optimization
        const updatedOptimizations = [...(optimizations || []), enhancedResult]
        
        setCurrentOptimization(enhancedResult)
        onOptimizationComplete?.(enhancedResult)

        toast.success('Route optimized successfully!', {
          description: `Estimated ${timeSavings.toFixed(1)} hours saved in travel time`
        })
      } else {
        toast.error('Failed to optimize route', {
          description: 'Please try again or contact support'
        })
      }
    } catch (error) {
      console.error('Route optimization error:', error)
      toast.error('Optimization failed', {
        description: 'Unable to calculate optimal route'
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  const calculateOriginalDistance = (waypoints: any[]): number => {
    let totalTime = 0
    for (let i = 0; i < waypoints.length - 1; i++) {
      const distance = googleMapsService.calculateDistance(
        waypoints[i].coordinates,
        waypoints[i + 1].coordinates
      )
      totalTime += (distance * 2.5) // Rough estimate: 2.5 minutes per mile in city
    }
    return totalTime
  }

  const getOptimizedBookingOrder = () => {
    if (!currentOptimization) return dayBookings

    return currentOptimization.optimized_order
      .map(bookingId => dayBookings.find(b => b.id === bookingId))
      .filter(Boolean) as BookingRequest[]
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (dayBookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Bookings to Optimize</h3>
          <p className="text-muted-foreground">
            Select a date with approved bookings to optimize travel routes.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Map Visualization */}
      <MapVisualization 
        bookings={dayBookings} 
        routeOptimization={currentOptimization || undefined}
        showRoute={!!currentOptimization}
      />
      
      {/* Optimization Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Path className="w-5 h-5" />
            Route Optimization - {format(new Date(selectedDate), 'MMM dd, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{dayBookings.length}</div>
              <div className="text-sm text-muted-foreground">Properties</div>
            </div>
            
            {currentOptimization && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">
                    {formatDuration(currentOptimization.total_duration)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Travel Time</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    -{(currentOptimization as any).time_savings_hours?.toFixed(1) || '0'}h
                  </div>
                  <div className="text-sm text-muted-foreground">Time Saved</div>
                </div>
              </>
            )}
          </div>

          <Button 
            onClick={handleOptimizeRoute}
            disabled={isOptimizing || dayBookings.length < 2}
            className="w-full"
          >
            <TrendUp className="w-4 h-4 mr-2" />
            {isOptimizing ? 'Optimizing Route...' : 'Optimize Route'}
          </Button>
        </CardContent>
      </Card>

      {/* Optimized Route Display */}
      {currentOptimization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NavigationArrow className="w-5 h-5" />
              Optimized Route Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getOptimizedBookingOrder().map((booking, index) => (
                <div key={booking.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {booking.formatted_address || booking.property_address}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {booking.agent_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(booking.estimated_duration)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge 
                      variant={booking.shoot_complexity === 'quick' ? 'default' : 
                               booking.shoot_complexity === 'standard' ? 'secondary' : 'destructive'}
                    >
                      {booking.shoot_complexity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            {currentOptimization && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Total Distance:</span>
                  <span>{(currentOptimization.total_distance / 1609.34).toFixed(1)} miles</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Estimated Travel Time:</span>
                  <span>{formatDuration(currentOptimization.total_duration)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-green-600">
                  <span>Time Savings:</span>
                  <span>{(currentOptimization as any).time_savings_hours?.toFixed(1) || '0'} hours</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Properties for {format(new Date(selectedDate), 'MMM dd, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dayBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">
                    {booking.formatted_address || booking.property_address}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {booking.agent_name} • {formatDuration(booking.estimated_duration)}
                  </div>
                </div>
                <Badge 
                  variant={booking.coordinates ? 'default' : 'destructive'}
                >
                  {booking.coordinates ? 'Geocoded' : 'Missing Location'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}