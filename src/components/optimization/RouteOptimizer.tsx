import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Clock, Route, Fuel, Leaf, CheckCircle, XCircle, Navigation } from 'lucide-react'
import { toast } from 'sonner'

interface Booking {
  id: string
  booking_number: string
  location: string
  latitude: number
  longitude: number
  scheduled_time: string
  estimated_duration: number
  shoot_category: string
}

interface RouteOptimization {
  optimizationId: string
  originalRoute: {
    bookings: Booking[]
    totalDistance: number
    totalDuration: number
    estimatedFuelCost: number
  }
  optimizedRoute: {
    bookings: Booking[]
    totalDistance: number
    totalDuration: number
    estimatedFuelCost: number
  }
  savings: {
    timeSaved: number
    timeSavedMinutes: number
    distanceSaved: number
    distanceSavedMiles: number
    fuelSavings: {
      gallons: string
      dollars: string
    }
    carbonSavings: {
      pounds: string
      kg: string
    }
  }
  clusters: Array<{
    id: number
    bookings: Booking[]
    centerLat: number
    centerLng: number
    radius: number
  }>
  recommendedStartTime: string
}

interface OptimizationSuggestion {
  id: string
  optimization_date: string
  time_saved: number
  distance_saved: number
  booking_count: number
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export function RouteOptimizer() {
  const [optimizations, setOptimizations] = useState<OptimizationSuggestion[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedBookings, setSelectedBookings] = useState<string[]>([])
  const [availableBookings, setAvailableBookings] = useState<Booking[]>([])
  const [optimizationResult, setOptimizationResult] = useState<RouteOptimization | null>(null)
  const [loading, setLoading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)

  useEffect(() => {
    fetchOptimizationSuggestions()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchBookingsForDate(selectedDate)
    }
  }, [selectedDate])

  const fetchOptimizationSuggestions = async () => {
    try {
      setLoading(true)
      // Mock data for development
      const mockSuggestions: OptimizationSuggestion[] = [
        {
          id: '1',
          optimization_date: '2024-01-15',
          time_saved: 45,
          distance_saved: 12.5,
          booking_count: 4,
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          optimization_date: '2024-01-16',
          time_saved: 30,
          distance_saved: 8.2,
          booking_count: 3,
          status: 'accepted',
          created_at: new Date().toISOString()
        }
      ]
      setOptimizations(mockSuggestions)
    } catch (error) {
      console.error('Failed to fetch optimization suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBookingsForDate = async (date: string) => {
    try {
      // Mock data for development
      const mockBookings: Booking[] = [
        {
          id: '1',
          booking_number: 'VID-001',
          location: '123 Main St, Downtown',
          latitude: 40.7128,
          longitude: -74.0060,
          scheduled_time: '09:00',
          estimated_duration: 90,
          shoot_category: 'property'
        },
        {
          id: '2',
          booking_number: 'VID-002',
          location: '456 Oak Ave, Midtown',
          latitude: 40.7580,
          longitude: -73.9855,
          scheduled_time: '11:00',
          estimated_duration: 60,
          shoot_category: 'personal'
        },
        {
          id: '3',
          booking_number: 'VID-003',
          location: '789 Pine St, Uptown',
          latitude: 40.7831,
          longitude: -73.9712,
          scheduled_time: '14:00',
          estimated_duration: 120,
          shoot_category: 'property'
        }
      ]
      setAvailableBookings(mockBookings)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    }
  }

  const optimizeRoute = async () => {
    if (selectedBookings.length < 2) {
      toast.error('Please select at least 2 bookings to optimize')
      return
    }

    try {
      setOptimizing(true)
      
      // Mock optimization result
      const mockResult: RouteOptimization = {
        optimizationId: 'opt_' + Date.now(),
        originalRoute: {
          bookings: [],
          totalDistance: 25000,
          totalDuration: 7200,
          estimatedFuelCost: 15.50
        },
        optimizedRoute: {
          bookings: [],
          totalDistance: 18000,
          totalDuration: 5400,
          estimatedFuelCost: 11.25
        },
        savings: {
          timeSaved: 1800,
          timeSavedMinutes: 30,
          distanceSaved: 7000,
          distanceSavedMiles: 4.3,
          fuelSavings: {
            gallons: '1.2',
            dollars: '4.25'
          },
          carbonSavings: {
            pounds: '12.5',
            kg: '5.7'
          }
        },
        clusters: [],
        recommendedStartTime: '08:30'
      }
      
      setOptimizationResult(mockResult)
      toast.success('Route optimization completed!')
    } catch (error) {
      console.error('Route optimization error:', error)
      toast.error('Route optimization failed')
    } finally {
      setOptimizing(false)
    }
  }

  const acceptOptimization = async (optimizationId: string) => {
    try {
      toast.success('Route optimization accepted and applied!')
      fetchOptimizationSuggestions()
      setOptimizationResult(null)
    } catch (error) {
      console.error('Accept optimization error:', error)
      toast.error('Failed to accept optimization')
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatDistance = (meters: number) => {
    const miles = meters * 0.000621371
    return `${miles.toFixed(1)} miles`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Route Optimizer</h1>
          <p className="text-muted-foreground">
            AI-powered route optimization for efficient scheduling
          </p>
        </div>
      </div>

      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suggestions">Optimization Suggestions</TabsTrigger>
          <TabsTrigger value="create">Create Optimization</TabsTrigger>
          <TabsTrigger value="analytics">Route Analytics</TabsTrigger>
        </TabsList>

        {/* Optimization Suggestions */}
        <TabsContent value="suggestions" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2">Loading suggestions...</span>
            </div>
          ) : optimizations.length === 0 ? (
            <Card>
              <CardContent className="text-center p-8">
                <Route className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No optimization suggestions available</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Create some bookings to see route optimization opportunities
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {optimizations.map((suggestion) => (
                <Card key={suggestion.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Route for {new Date(suggestion.optimization_date).toLocaleDateString()}
                        </CardTitle>
                        <CardDescription>
                          {suggestion.booking_count} bookings • Created {new Date(suggestion.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={suggestion.status === 'pending' ? 'default' : 
                               suggestion.status === 'accepted' ? 'secondary' : 'destructive'}
                      >
                        {suggestion.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{suggestion.time_saved} minutes saved</div>
                          <div className="text-sm text-muted-foreground">Time optimization</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{suggestion.distance_saved} miles saved</div>
                          <div className="text-sm text-muted-foreground">Distance reduction</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Fuel className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">~${(suggestion.distance_saved * 0.25).toFixed(2)} saved</div>
                          <div className="text-sm text-muted-foreground">Estimated fuel savings</div>
                        </div>
                      </div>
                    </div>
                    
                    {suggestion.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <Button 
                          onClick={() => acceptOptimization(suggestion.id)}
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept Optimization
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Create Optimization */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Route Optimization</CardTitle>
              <CardDescription>
                Select bookings for a specific date to generate an optimized route
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="date">Select Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {availableBookings.length > 0 && (
                <div>
                  <Label>Select Bookings to Optimize</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {availableBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedBookings.includes(booking.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => {
                          setSelectedBookings(prev => 
                            prev.includes(booking.id)
                              ? prev.filter(id => id !== booking.id)
                              : [...prev, booking.id]
                          )
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{booking.booking_number}</div>
                            <div className="text-sm text-muted-foreground">{booking.location}</div>
                            <div className="text-xs text-muted-foreground">
                              {booking.scheduled_time} • {booking.shoot_category}
                            </div>
                          </div>
                          {selectedBookings.includes(booking.id) && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {availableBookings.length === 0 && selectedDate && (
                <div className="text-center p-4 text-muted-foreground">
                  No approved bookings with coordinates found for this date
                </div>
              )}

              <Button 
                onClick={optimizeRoute} 
                disabled={selectedBookings.length < 2 || optimizing}
                className="w-full"
              >
                {optimizing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Optimizing Route...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    Optimize Route
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Optimization Results */}
          {optimizationResult && (
            <Card>
              <CardHeader>
                <CardTitle>Optimization Results</CardTitle>
                <CardDescription>
                  Route optimization completed with significant improvements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Original Route */}
                  <div>
                    <h4 className="font-medium mb-3">Original Route</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Distance:</span>
                        <span>{formatDistance(optimizationResult.originalRoute.totalDistance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Time:</span>
                        <span>{formatTime(Math.round(optimizationResult.originalRoute.totalDuration / 60))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fuel Cost:</span>
                        <span>${optimizationResult.originalRoute.estimatedFuelCost}</span>
                      </div>
                    </div>
                  </div>

                  {/* Optimized Route */}
                  <div>
                    <h4 className="font-medium mb-3">Optimized Route</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Distance:</span>
                        <span>{formatDistance(optimizationResult.optimizedRoute.totalDistance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Time:</span>
                        <span>{formatTime(Math.round(optimizationResult.optimizedRoute.totalDuration / 60))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fuel Cost:</span>
                        <span>${optimizationResult.optimizedRoute.estimatedFuelCost}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Savings */}
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium mb-3 text-green-800 dark:text-green-200">Savings Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-green-600">
                        {optimizationResult.savings.timeSavedMinutes} min
                      </div>
                      <div className="text-green-700 dark:text-green-300">Time Saved</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-600">
                        {optimizationResult.savings.distanceSavedMiles} mi
                      </div>
                      <div className="text-green-700 dark:text-green-300">Distance Saved</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-600">
                        ${optimizationResult.savings.fuelSavings.dollars}
                      </div>
                      <div className="text-green-700 dark:text-green-300">Fuel Savings</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-600">
                        {optimizationResult.savings.carbonSavings.pounds} lbs
                      </div>
                      <div className="text-green-700 dark:text-green-300">CO₂ Saved</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 mt-6">
                  <Button 
                    onClick={() => acceptOptimization(optimizationResult.optimizationId)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept & Apply
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setOptimizationResult(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Route Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Time Efficiency</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24%</div>
                <div className="text-sm text-muted-foreground">Average time savings</div>
                <div className="text-xs text-green-600 mt-1">+5% vs last month</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Fuel className="h-5 w-5" />
                  <span>Fuel Efficiency</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$127</div>
                <div className="text-sm text-muted-foreground">Monthly fuel savings</div>
                <div className="text-xs text-green-600 mt-1">18.3 gallons saved</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Leaf className="h-5 w-5" />
                  <span>Carbon Impact</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">163 lbs</div>
                <div className="text-sm text-muted-foreground">CO₂ emissions saved</div>
                <div className="text-xs text-green-600 mt-1">Monthly reduction</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}