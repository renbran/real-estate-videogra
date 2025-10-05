import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, MapPin, Clock, Users } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { BookingRequest, SAMPLE_AGENTS, SHOOT_COMPLEXITIES } from '@/lib/types'
import { formatDate, formatDateTime } from '@/lib/date-utils'

export function ManagerDashboard() {
  const [bookings, setBookings] = useKV<BookingRequest[]>('bookings', [])
  const [activeTab, setActiveTab] = useState('pending')
  
  const pendingBookings = (bookings || []).filter(b => b.status === 'pending')
  const approvedBookings = (bookings || []).filter(b => b.status === 'approved')
  const allBookings = bookings || []

  const handleApprove = (bookingId: string) => {
    setBookings(current => 
      (current || []).map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'approved', updated_at: new Date().toISOString() }
          : booking
      )
    )
    toast.success('Booking approved successfully')
  }

  const handleDecline = (bookingId: string) => {
    setBookings(current => 
      (current || []).map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'declined', updated_at: new Date().toISOString() }
          : booking
      )
    )
    toast.success('Booking declined')
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
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getComplexityBadge = (complexity: string) => {
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

  const getPriorityBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">High Priority</Badge>
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>
    return <Badge variant="outline">Low Priority</Badge>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage videography bookings and optimize schedules
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Require review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved shoots</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{SAMPLE_AGENTS.length}</div>
            <p className="text-xs text-muted-foreground mt-1">In system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Capacity Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65%</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">
            Pending Approvals ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedBookings.length})</TabsTrigger>
          <TabsTrigger value="all">All Bookings ({allBookings.length})</TabsTrigger>
          <TabsTrigger value="optimization">Route Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="space-y-4">
            {pendingBookings
              .sort((a, b) => b.priority_score - a.priority_score)
              .map((booking) => {
                const agent = SAMPLE_AGENTS.find(a => a.id === booking.agent_id)
                return (
                  <Card key={booking.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{booking.property_address}</span>
                            {getComplexityBadge(booking.shoot_complexity)}
                            {getPriorityBadge(booking.priority_score)}
                          </div>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                            <div>
                              <span className="font-medium">Agent:</span> {booking.agent_name}
                            </div>
                            <div>
                              <span className="font-medium">Preferred Date:</span> {formatDate(booking.preferred_date)}
                            </div>
                            <div>
                              <span className="font-medium">Priority Score:</span> {booking.priority_score}/100
                            </div>
                            <div>
                              <span className="font-medium">Duration:</span> {SHOOT_COMPLEXITIES[booking.shoot_complexity].duration}min
                            </div>
                          </div>

                          {booking.backup_dates.length > 0 && (
                            <div className="mb-3 text-sm">
                              <span className="font-medium">Backup Dates:</span> 
                              <span className="text-muted-foreground ml-1">
                                {booking.backup_dates.map(formatDate).join(', ')}
                              </span>
                            </div>
                          )}

                          {booking.special_requirements && (
                            <div className="mb-3 text-sm">
                              <span className="font-medium">Special Requirements:</span>
                              <p className="text-muted-foreground mt-1">{booking.special_requirements}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Submitted {formatDateTime(booking.created_at)}</span>
                            {booking.is_flexible && (
                              <Badge variant="outline" className="text-xs">Flexible</Badge>
                            )}
                            {agent && (
                              <Badge variant="secondary" className="text-xs">
                                {agent.tier} tier • {agent.performance_score}/100
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleApprove(booking.id)}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleDecline(booking.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            
            {pendingBookings.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No pending approvals</p>
                  <p className="text-sm text-muted-foreground mt-1">All caught up!</p>
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
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{booking.property_address}</span>
                        {getComplexityBadge(booking.shoot_complexity)}
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Agent:</span> {booking.agent_name}
                        </div>
                        <div>
                          <span className="font-medium">Scheduled:</span> {formatDate(booking.scheduled_date || booking.preferred_date)}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {SHOOT_COMPLEXITIES[booking.shoot_complexity].duration}min
                        </div>
                        <div>
                          <span className="font-medium">Approved:</span> {formatDateTime(booking.updated_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {approvedBookings.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No approved bookings</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="space-y-4">
            {allBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{booking.property_address}</span>
                        {getComplexityBadge(booking.shoot_complexity)}
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Agent:</span> {booking.agent_name}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(booking.scheduled_date || booking.preferred_date)}
                        </div>
                        <div>
                          <span className="font-medium">Priority:</span> {booking.priority_score}/100
                        </div>
                        <div>
                          <span className="font-medium">Updated:</span> {formatDateTime(booking.updated_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {allBookings.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No bookings in the system</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="optimization">
          <Card>
            <CardHeader>
              <CardTitle>Route Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Route optimization features coming soon</p>
                <p className="text-sm mt-1">This will include geographic clustering and travel time optimization</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}