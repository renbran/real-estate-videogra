import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Envelope, 
  Warning,
  CalendarCheck,
  Users,
  TrendUp
} from '@phosphor-icons/react'
import { useNotifications } from '@/hooks/useNotifications'
import { BookingRequest } from '@/lib/types'
import { formatDate, formatDateTime } from '@/lib/date-utils'
import { EmailPreview } from './EmailPreview'

interface NotificationCenterProps {
  bookings: BookingRequest[]
  onApproveBooking: (bookingId: string, notes?: string) => void
  onDeclineBooking: (bookingId: string, notes?: string) => void
}

export function NotificationCenter({ bookings, onApproveBooking, onDeclineBooking }: NotificationCenterProps) {
  const {
    sendApprovalNotification,
    sendDeclineNotification,
    sendBatchOpportunityNotification,
    sendReminderNotification,
    getNotificationHistory,
    getNotificationStats,
    notificationLogs
  } = useNotifications()

  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null)
  const [managerNotes, setManagerNotes] = useState('')
  const [activeTab, setActiveTab] = useState('pending')

  const stats = getNotificationStats()

  const handleApproveWithNotification = async (booking: BookingRequest) => {
    try {
      // First approve the booking
      onApproveBooking(booking.id, managerNotes)
      
      // Then send notification
      await sendApprovalNotification({
        ...booking,
        status: 'approved',
        manager_notes: managerNotes || undefined,
        scheduled_date: booking.scheduled_date || booking.preferred_date,
        scheduled_time: booking.scheduled_time || '09:00'
      })
      
      setSelectedBooking(null)
      setManagerNotes('')
    } catch (error) {
      console.error('Failed to approve with notification:', error)
    }
  }

  const handleDeclineWithNotification = async (booking: BookingRequest) => {
    try {
      // First decline the booking
      onDeclineBooking(booking.id, managerNotes)
      
      // Then send notification
      await sendDeclineNotification(booking, managerNotes)
      
      setSelectedBooking(null)
      setManagerNotes('')
    } catch (error) {
      console.error('Failed to decline with notification:', error)
    }
  }

  const handleSendReminder = async (booking: BookingRequest, daysUntil: number) => {
    await sendReminderNotification(booking, daysUntil)
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const approvedBookings = bookings.filter(b => b.status === 'approved')
  const upcomingBookings = approvedBookings.filter(b => {
    const bookingDate = new Date(b.scheduled_date || b.preferred_date)
    const today = new Date()
    const diffDays = Math.ceil((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Warning className="w-4 h-4 text-gray-600" />
    }
  }

  const getNotificationStatusBadge = (bookingId: string, type: string) => {
    const logs = getNotificationHistory(bookingId).filter(log => log.type === type)
    if (logs.length === 0) return null
    
    const latestLog = logs[logs.length - 1]
    return (
      <Badge variant={latestLog.sent ? "default" : "destructive"} className="text-xs">
        {latestLog.sent ? '📧 Sent' : '❌ Failed'}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Envelope className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Actions</p>
                <p className="text-2xl font-bold">{pendingBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarCheck className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendUp className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Management Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notification Center</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">
                Pending Actions ({pendingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming Shoots ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                Notification History ({notificationLogs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4 mt-4">
              {pendingBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending bookings requiring action</p>
                </div>
              ) : (
                pendingBookings.map((booking) => {
                  const agent = { name: 'Agent', email: 'agent@osus.com' } // Production will use real agent data
                  return (
                    <Card key={booking.id} className="border-l-4 border-l-yellow-400">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(booking.status)}
                              <h4 className="font-semibold">{booking.property_address}</h4>
                              <Badge variant="outline">Priority: {booking.priority_score}</Badge>
                            </div>
                            
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p><span className="font-medium">Agent:</span> {agent?.name || 'Unknown'}</p>
                              <p><span className="font-medium">Requested:</span> {formatDate(booking.preferred_date)}</p>
                              <p><span className="font-medium">Type:</span> {booking.shoot_complexity}</p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedBooking(booking)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Approve Booking</DialogTitle>
                                  <DialogDescription>
                                    Approve this booking and send notification to the agent
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="notes">Manager Notes (Optional)</Label>
                                    <Textarea
                                      id="notes"
                                      placeholder="Add any notes for the agent..."
                                      value={managerNotes}
                                      onChange={(e) => setManagerNotes(e.target.value)}
                                    />
                                  </div>
                                  
                                  <div className="flex justify-between items-center">
                                    <EmailPreview 
                                      booking={{
                                        ...selectedBooking,
                                        status: 'approved',
                                        manager_notes: managerNotes || undefined,
                                        scheduled_date: selectedBooking?.scheduled_date || selectedBooking?.preferred_date,
                                        scheduled_time: selectedBooking?.scheduled_time || '09:00'
                                      } as BookingRequest}
                                      type="booking_approved"
                                    />
                                    
                                    <div className="flex space-x-2">
                                      <Button
                                        onClick={() => selectedBooking && handleApproveWithNotification(selectedBooking)}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <Envelope className="w-4 h-4 mr-1" />
                                        Approve & Notify
                                      </Button>
                                      <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedBooking(booking)}
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Decline
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Decline Booking</DialogTitle>
                                  <DialogDescription>
                                    Decline this booking and notify the agent with alternatives
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="decline-notes">Reason for Decline</Label>
                                    <Textarea
                                      id="decline-notes"
                                      placeholder="Explain why this booking cannot be accommodated and suggest alternatives..."
                                      value={managerNotes}
                                      onChange={(e) => setManagerNotes(e.target.value)}
                                      required
                                    />
                                  </div>
                                  
                                  <div className="flex justify-between items-center">
                                    <EmailPreview 
                                      booking={{
                                        ...selectedBooking,
                                        manager_notes: managerNotes
                                      } as BookingRequest}
                                      type="booking_declined"
                                    />
                                    
                                    <div className="flex space-x-2">
                                      <Button
                                        onClick={() => selectedBooking && handleDeclineWithNotification(selectedBooking)}
                                        variant="destructive"
                                      >
                                        <Envelope className="w-4 h-4 mr-1" />
                                        Decline & Notify
                                      </Button>
                                      <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4 mt-4">
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming shoots in the next 7 days</p>
                </div>
              ) : (
                upcomingBookings.map((booking) => {
                  const agent = { name: 'Agent', email: 'agent@osus.com' } // Production will use real agent data
                  const bookingDate = new Date(booking.scheduled_date || booking.preferred_date)
                  const today = new Date()
                  const daysUntil = Math.ceil((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <Card key={booking.id} className="border-l-4 border-l-green-400">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <CalendarCheck className="w-4 h-4 text-green-600" />
                              <h4 className="font-semibold">{booking.property_address}</h4>
                              <Badge variant={daysUntil <= 1 ? "destructive" : daysUntil <= 3 ? "default" : "secondary"}>
                                {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                              </Badge>
                              {getNotificationStatusBadge(booking.id, 'booking_approved')}
                            </div>
                            
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p><span className="font-medium">Agent:</span> {agent?.name || 'Unknown'}</p>
                              <p><span className="font-medium">Scheduled:</span> {formatDateTime(booking.scheduled_date + 'T' + (booking.scheduled_time || '09:00'))}</p>
                              <p><span className="font-medium">Duration:</span> {booking.estimated_duration} minutes</p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendReminder(booking, daysUntil)}
                            >
                              <Bell className="w-4 h-4 mr-1" />
                              Send Reminder
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-4">
              {notificationLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Envelope className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No notification history available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notificationLogs
                    .sort((a, b) => new Date(b.sentAt || b.bookingId).getTime() - new Date(a.sentAt || a.bookingId).getTime())
                    .map((log) => {
                      const booking = bookings.find(b => b.id === log.bookingId)
                      const agent = booking ? { name: 'Agent', email: 'agent@osus.com' } : null // Production will use real agent data
                      
                      return (
                        <Card key={log.id} className="border-l-4 border-l-blue-400">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Envelope className={`w-4 h-4 ${log.sent ? 'text-green-600' : 'text-red-600'}`} />
                                <div>
                                  <p className="text-sm font-medium">
                                    {log.type.replace('_', ' ').toUpperCase()} - {agent?.name || 'Unknown Agent'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {booking?.property_address || `Booking ${log.bookingId}`}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Badge variant={log.sent ? "default" : "destructive"}>
                                  {log.sent ? 'Sent' : 'Failed'}
                                </Badge>
                                {log.sentAt && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDateTime(log.sentAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {log.error && (
                              <p className="text-xs text-red-600 mt-1">Error: {log.error}</p>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}