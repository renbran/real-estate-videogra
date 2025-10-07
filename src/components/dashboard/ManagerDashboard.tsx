import { useState } from 'react'
import { useBookingAPI } from '@/hooks/useClientAPI'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, MapPin, Clock, Users, Bell, TrendUp, CurrencyDollar, Star, Calendar, BarChart3, FileText, Settings, Route, Lightning, Sparkle, Target, Crown } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { BookingRequest, SAMPLE_AGENTS, SHOOT_COMPLEXITIES } from '@/lib/types'
import { formatDate, formatDateTime } from '@/lib/date-utils'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { CalendarExportButton } from '@/components/calendar/CalendarExportButton'
import { NotificationTest } from '@/components/notifications/NotificationTest'
import { RouteOptimizer } from './RouteOptimizer'
import { AddressBatchValidator } from '@/components/maps/AddressBatchValidator'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { FileManager } from '@/components/files/FileManager'
import { RouteOptimizer as RouteOptimizerNew } from '@/components/optimization/RouteOptimizer'
import { DEMO_ANALYTICS } from '@/lib/demo-data'
import { OSUS_BRAND } from '@/lib/osus-brand'
import { useBookingAPI } from '@/hooks/useClientAPI'
import { DailyAIInsights } from '@/components/insights/DailyAIInsights'

// Hook wrapper for compatibility
function useBookings() {
  const api = useBookingAPI()
  return {
    bookings: api.getBookings(),
    loading: false,
    updateBooking: api.updateBooking
  }
}

export function ManagerDashboard() {
  const { bookings, loading, updateBooking } = useBookings()
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedOptimizationDate, setSelectedOptimizationDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const approveBooking = async (id: string) => {
    await updateBooking(id, { status: 'approved' as const })
    toast.success('Booking approved successfully')
  }

  const declineBooking = async (id: string) => {
    await updateBooking(id, { status: 'declined' as const })
    toast.success('Booking declined')
  }
  
  const pendingBookings = (bookings || []).filter(b => b.status === 'pending')
  const approvedBookings = (bookings || []).filter(b => b.status === 'approved')
  const allBookings = bookings || []

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="text-lg">Loading bookings...</div>
        </div>
      </div>
    )
  }

  const handleApprove = async (bookingId: string, notes?: string) => {
    try {
      await approveBooking(bookingId, notes)
      toast.success('Booking approved successfully')
    } catch (error) {
      toast.error('Failed to approve booking')
      console.error('Approve booking error:', error)
    }
  }

  const handleDecline = async (bookingId: string, notes?: string) => {
    try {
      await declineBooking(bookingId, notes)
      toast.success('Booking declined')
    } catch (error) {
      toast.error('Failed to decline booking')
      console.error('Decline booking error:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-osus-secondary-300 text-osus-secondary-800 bg-osus-secondary-50">Pending</Badge>
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Approved</Badge>
      case 'completed':
        return <Badge className="bg-osus-primary-100 text-osus-primary-800 hover:bg-osus-primary-200">Completed</Badge>
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getComplexityBadge = (complexity: string) => {
    switch (complexity) {
      case 'quick':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Quick</Badge>
      case 'standard':
        return <Badge className="bg-osus-secondary-100 text-osus-secondary-800 hover:bg-osus-secondary-200">Standard</Badge>
      case 'complex':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Complex</Badge>
      default:
        return <Badge variant="outline">{complexity}</Badge>
    }
  }

  const getPriorityBadge = (score: number) => {
    if (score >= 80) return (
      <Badge className="bg-gradient-to-r from-osus-primary-100 to-emerald-100 text-osus-primary-800 hover:from-osus-primary-200 hover:to-emerald-200 flex items-center gap-1">
        <Crown className="w-3 h-3" />
        High Priority
      </Badge>
    )
    if (score >= 60) return (
      <Badge className="bg-osus-secondary-100 text-osus-secondary-800 hover:bg-osus-secondary-200 flex items-center gap-1">
        <Target className="w-3 h-3" />
        Medium Priority
      </Badge>
    )
    return <Badge variant="outline">Low Priority</Badge>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-osus-primary-50/30 via-white to-osus-secondary-50/20 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="relative">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-osus-primary-600 to-osus-primary-800 bg-clip-text text-transparent flex items-center gap-3">
                <Crown className="w-8 h-8 text-osus-secondary-500" />
                Manager Dashboard
                <Sparkle className="w-6 h-6 text-osus-secondary-500 animate-pulse" />
              </h1>
            </div>
            <p className="text-osus-primary-700/80 mt-2 font-medium">
              AI-Powered videography booking management and route optimization
            </p>
          </div>
          <CalendarExportButton bookings={approvedBookings} />
        </div>
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

      {/* Daily AI Insights */}
      <div className="mb-8">
        <DailyAIInsights 
          bookings={allBookings}
          userRole="manager"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">
            Pending Approvals ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedBookings.length})</TabsTrigger>
          <TabsTrigger value="all">All Bookings ({allBookings.length})</TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-1" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="optimization">
            <Route className="w-4 h-4 mr-1" />
            Route Optimization
          </TabsTrigger>
          <TabsTrigger value="files">
            <FileText className="w-4 h-4 mr-1" />
            File Manager
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-1" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="address-validation">Address Validation</TabsTrigger>
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

        <TabsContent value="notifications">
          <div className="space-y-6">
            <NotificationTest />
            <NotificationCenter 
              bookings={allBookings}
              onApproveBooking={handleApprove}
              onDeclineBooking={handleDecline}
            />
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="optimization">
          <RouteOptimizerNew />
        </TabsContent>

        <TabsContent value="files">
          <FileManager />
        </TabsContent>

        <TabsContent value="address-validation">
          <div className="space-y-6">
            <AddressBatchValidator 
              onValidationComplete={(updatedBookings) => {
                // The validator updates the bookings automatically via useKV
                toast.success('Address validation completed!', {
                  description: `Validated ${updatedBookings.filter(b => b.coordinates).length} addresses`
                })
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}