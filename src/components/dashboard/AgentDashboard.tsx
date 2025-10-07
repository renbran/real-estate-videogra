import { useState } from 'react'
import { useBookingAPI } from '@/hooks/useClientAPI'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { CalendarBlank, MapPin, Clock, TrendUp, Plus, Bell, Envelope } from '@phosphor-icons/react'
import { BookingRequest, SAMPLE_AGENTS, SHOOT_COMPLEXITIES } from '@/lib/types'
import { formatDate, formatDateTime } from '@/lib/date-utils'
import { BookingForm } from '@/components/booking/BookingForm'
import { CalendarExportButton } from '@/components/calendar/CalendarExportButton'
import { CalendarNotificationCenter } from '@/components/calendar/CalendarNotificationCenter'
import { PushNotificationSettings } from '@/components/notifications/PushNotificationSettings'
import { PushNotificationDemo } from '@/components/notifications/PushNotificationDemo'
import { useNotifications } from '@/hooks/useNotifications'

interface AgentDashboardProps {
  currentUserId: string
}

export function AgentDashboard({ currentUserId }: AgentDashboardProps) {
  const { getBookings, getBookingsByAgent } = useBookingAPI()
  const [activeTab, setActiveTab] = useState('overview')
  const { getNotificationHistory } = useNotifications()
  
  const currentAgent = SAMPLE_AGENTS.find(a => a.id === currentUserId) || SAMPLE_AGENTS[0]
  const myBookings = getBookingsByAgent(currentUserId)
  const pendingBookings = myBookings.filter(b => b.status === 'pending')
  const approvedBookings = myBookings.filter(b => b.status === 'approved')
  const completedBookings = myBookings.filter(b => b.status === 'completed')

  const getNotificationStatusBadge = (bookingId: string, status: string) => {
    const history = getNotificationHistory(bookingId)
    if (status === 'approved') {
      const approvalNotification = history.find(h => h.type === 'booking_approved')
      if (approvalNotification) {
        return approvalNotification.sent ? (
          <Badge variant="outline" className="text-xs border-green-300 text-green-700">
            <Envelope className="w-3 h-3 mr-1" />
            Notified
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs border-red-300 text-red-700">
            <Bell className="w-3 h-3 mr-1" />
            Notification Failed
          </Badge>
        )
      }
    }
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-800">Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getComplexityBadge = (complexity?: string) => {
    if (!complexity) return null
    switch (complexity) {
      case 'quick':
        return <Badge className="bg-green-100 text-green-800">Quick</Badge>
      case 'standard':
        return <Badge className="bg-yellow-100 text-yellow-800">Standard</Badge>
      case 'complex':
        return <Badge className="bg-red-100 text-red-800">Complex</Badge>
      default:
        return <Badge variant="outline">{complexity}</Badge>
    }
  }

  if (activeTab === 'new-booking') {
    return (
      <div>
        <div className="mb-6">
          <Button 
            onClick={() => setActiveTab('overview')} 
            variant="ghost" 
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <BookingForm 
          currentUserId={currentUserId} 
          onSubmit={() => setActiveTab('overview')}
        />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {currentAgent.name}</h1>
            <p className="text-muted-foreground mt-1">
              {currentAgent.tier.charAt(0).toUpperCase() + currentAgent.tier.slice(1)} Agent • Performance Score: {currentAgent.performance_score}/100
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CalendarExportButton bookings={approvedBookings} />
            <Button onClick={() => setActiveTab('new-booking')} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Booking
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Quota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentAgent.monthly_used}/{currentAgent.monthly_quota}</div>
            <Progress 
              value={(currentAgent.monthly_used / currentAgent.monthly_quota) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {currentAgent.monthly_quota - currentAgent.monthly_used} slots remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Shoots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Confirmed bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Performance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {currentAgent.performance_score}
              <TrendUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">+5 this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingBookings.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedBookings.length})</TabsTrigger>
          <TabsTrigger value="calendar">Calendar & Notifications</TabsTrigger>
          <TabsTrigger value="notifications">Push Notifications</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-start justify-between p-3 border rounded-md">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{booking.location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarBlank className="w-3 h-3" />
                            {formatDate(booking.preferred_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {booking.shoot_complexity && SHOOT_COMPLEXITIES[booking.shoot_complexity] ? 
                              SHOOT_COMPLEXITIES[booking.shoot_complexity].duration + 'min' : 
                              booking.estimated_duration ? booking.estimated_duration + 'min' : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(booking.status)}
                        {getComplexityBadge(booking.shoot_complexity)}
                      </div>
                    </div>
                  ))}
                  {myBookings.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarBlank className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No bookings yet</p>
                      <Button 
                        onClick={() => setActiveTab('new-booking')} 
                        variant="outline" 
                        className="mt-3"
                      >
                        Create your first booking
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Estimate Accuracy</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>On-Time Property Access</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Flexibility Score</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  
                  <div className="mt-4 p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium mb-1">Tips for Higher Priority</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Enable flexible scheduling for +5 points</li>
                      <li>• Book 7+ days in advance for +10 points</li>
                      <li>• Accurate estimates improve your score</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="space-y-4">
            {pendingBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{booking.location}</span>
                        {booking.shoot_complexity && getComplexityBadge(booking.shoot_complexity)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Preferred Date:</span> {formatDate(booking.preferred_date)}
                        </div>
                        <div>
                          <span className="font-medium">Priority Score:</span> {booking.priority_score}/100
                        </div>
                      </div>
                      {booking.backup_dates.length > 0 && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Backup Dates:</span> {booking.backup_dates.map(formatDate).join(', ')}
                        </div>
                      )}
                      {booking.special_requirements && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Special Requirements:</span> {booking.special_requirements}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(booking.status)}
                      <div className="text-xs text-muted-foreground">
                        Submitted {formatDateTime(booking.created_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingBookings.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CalendarBlank className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No pending requests</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved">
          <div className="space-y-4">
            {approvedBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{booking.property_address}</span>
                        {getComplexityBadge(booking.shoot_complexity)}
                        {getNotificationStatusBadge(booking.id, booking.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Scheduled:</span> {formatDate(booking.scheduled_date || booking.preferred_date)}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {SHOOT_COMPLEXITIES[booking.shoot_complexity].duration} minutes
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(booking.status)}
                      <CalendarExportButton booking={booking} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {approvedBookings.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CalendarBlank className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No approved bookings</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarNotificationCenter
            currentUser={currentAgent}
            userBookings={myBookings}
            upcomingBookings={approvedBookings.filter(b => 
              b.scheduled_date && new Date(b.scheduled_date) >= new Date()
            )}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <div className="space-y-6">
            <PushNotificationSettings />
            <PushNotificationDemo />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            {completedBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{booking.property_address}</span>
                        {getComplexityBadge(booking.shoot_complexity)}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Completed:</span> {formatDate(booking.updated_at)}
                        </div>
                        <div>
                          <span className="font-medium">Estimated:</span> {booking.estimated_duration}min
                        </div>
                        <div>
                          <span className="font-medium">Actual:</span> {booking.actual_duration || 'N/A'}min
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {completedBookings.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CalendarBlank className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No completed bookings</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}