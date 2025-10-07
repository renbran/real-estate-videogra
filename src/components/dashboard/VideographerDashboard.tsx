import { useBookingAPI } from '@/hooks/useClientAPI'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarBlank, MapPin, Clock, CheckCircle } from '@phosphor-icons/react'
import { BookingRequest, SHOOT_COMPLEXITIES } from '@/lib/types'
import { formatDate, formatDateTime } from '@/lib/date-utils'

export function VideographerDashboard() {
  const { bookings, loading } = useBookings({ status: 'approved' })
  
  const approvedBookings = (bookings || []).filter(b => b.status === 'approved')
  const todayBookings = approvedBookings.filter(b => {
    const bookingDate = new Date(b.scheduled_date || b.preferred_date).toDateString()
    const today = new Date().toDateString()
    return bookingDate === today
  })
  const upcomingBookings = approvedBookings.filter(b => {
    const bookingDate = new Date(b.scheduled_date || b.preferred_date)
    const today = new Date()
    return bookingDate > today
  }).slice(0, 10)

  const getComplexityBadge = (complexity: string) => {
    switch (complexity) {
      case 'quick':
        return <Badge className="bg-green-100 text-green-800">Quick (30-45min)</Badge>
      case 'standard':
        return <Badge className="bg-yellow-100 text-yellow-800">Standard (90min)</Badge>
      case 'complex':
        return <Badge className="bg-red-100 text-red-800">Complex (3+ hrs)</Badge>
      default:
        return <Badge variant="outline">{complexity}</Badge>
    }
  }

  const getTotalDuration = (bookings: BookingRequest[]) => {
    return bookings.reduce((total, booking) => {
      return total + SHOOT_COMPLEXITIES[booking.shoot_complexity].duration
    }, 0)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Videographer Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Your scheduled shoots and upcoming assignments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Shoots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {getTotalDuration(todayBookings)} minutes total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled shoots</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65%</div>
            <p className="text-xs text-muted-foreground mt-1">Capacity utilized</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground mt-1">On-time rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarBlank className="w-5 h-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayBookings.map((booking) => (
                <div key={booking.id} className="flex items-start justify-between p-4 border rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{booking.property_address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Agent: {booking.agent_name}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {SHOOT_COMPLEXITIES[booking.shoot_complexity].duration}min
                      </span>
                    </div>
                    {booking.special_requirements && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">Notes:</span> {booking.special_requirements}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getComplexityBadge(booking.shoot_complexity)}
                    <div className="text-xs text-muted-foreground">
                      9:00 AM
                    </div>
                  </div>
                </div>
              ))}
              {todayBookings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No shoots scheduled for today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Shoots */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Shoots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-start justify-between p-4 border rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{booking.property_address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarBlank className="w-3 h-3" />
                        {formatDate(booking.scheduled_date || booking.preferred_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {SHOOT_COMPLEXITIES[booking.shoot_complexity].duration}min
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Agent: {booking.agent_name}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getComplexityBadge(booking.shoot_complexity)}
                  </div>
                </div>
              ))}
              {upcomingBookings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarBlank className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming shoots</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Optimization */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Route Optimization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Optimized route suggestions will appear here</p>
            <p className="text-sm mt-1">Based on geographic clustering and traffic patterns</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}