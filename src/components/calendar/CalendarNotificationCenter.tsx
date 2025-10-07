import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  Calendar, 
  Bell, 
  Download, 
  Envelope, 
  Clock, 
  Gear,
  CheckCircle,
  XCircle,
  Warning
} from '@phosphor-icons/react'
import { BookingRequest, User } from '@/lib/types'
import { 
  notificationSystem, 
  configureUserNotifications,
  exportBookingToCalendar,
  exportMultipleBookingsToCalendar,
  getBookingNotificationStatus
} from '@/lib/integrated-notification-system'
import { generateCalendarLinks } from '@/lib/calendar-utils'
import { formatDate, formatTime } from '@/lib/date-utils'
import { toast } from 'sonner'

interface CalendarNotificationCenterProps {
  currentUser: User
  userBookings: BookingRequest[]
  upcomingBookings: BookingRequest[]
}

export function CalendarNotificationCenter({
  currentUser,
  userBookings,
  upcomingBookings
}: CalendarNotificationCenterProps) {
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    calendarIntegration: {
      platform: 'google' as 'google' | 'outlook' | 'apple' | 'ical',
      enabled: true,
      autoSync: true,
      reminderSettings: {
        sevenDays: true,
        twoDays: true,
        oneDay: true,
        twoHours: true
      }
    },
    batchingAlerts: true,
    optimizationSuggestions: true
  })

  const [notificationStatuses, setNotificationStatuses] = useState<Record<string, any[]>>({})

  useEffect(() => {
    // Load notification statuses for user's bookings
    const statuses: Record<string, any[]> = {}
    userBookings.forEach(booking => {
      statuses[booking.id] = getBookingNotificationStatus(booking.id)
    })
    setNotificationStatuses(statuses)
  }, [userBookings])

  const handleSettingsChange = (key: string, value: any) => {
    const newSettings = { ...notificationSettings, [key]: value }
    setNotificationSettings(newSettings)
    
    // Update user notification settings
    configureUserNotifications(currentUser.id, newSettings)
    
    toast.success('Notification settings updated')
  }

  const handleCalendarExport = (format: 'google' | 'outlook' | 'ical', booking?: BookingRequest) => {
    if (booking) {
      exportBookingToCalendar(booking, format)
      toast.success(`Calendar event exported to ${format ? (format.charAt(0).toUpperCase() + format.slice(1)) : 'Calendar'}`)
    } else {
      exportMultipleBookingsToCalendar(upcomingBookings)
      toast.success('All upcoming bookings exported to calendar')
    }
  }

  const getNotificationStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />
      default:
        return <Warning className="w-4 h-4 text-gray-400" />
    }
  }

  const upcomingNotifications = Object.entries(notificationStatuses)
    .flatMap(([bookingId, schedules]) => 
      schedules
        .filter(s => s.status === 'pending' && new Date(s.scheduledDate) > new Date())
        .map(s => ({ ...s, bookingId }))
    )
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Calendar & Notifications</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleCalendarExport('ical')}
            disabled={upcomingBookings.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="notifications">Notification Status</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Upcoming Events Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Videography Bookings
              </CardTitle>
              <CardDescription>
                Your confirmed shoots and calendar integration options
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming bookings scheduled</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => {
                    const calendarLinks = generateCalendarLinks(booking)
                    
                    return (
                      <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">
                              {booking.location || booking.property_address}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>📅 {formatDate(booking.scheduled_date || booking.preferred_date)}</span>
                              <span>⏰ {formatTime(booking.scheduled_time || '09:00')}</span>
                              <span>⏱️ {booking.estimated_duration || 90} min</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {booking.shoot_category?.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCalendarExport('google', booking)}
                            >
                              Google
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCalendarExport('outlook', booking)}
                            >
                              Outlook
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCalendarExport('ical', booking)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Notification Status for this booking */}
                        {notificationStatuses[booking.id]?.length > 0 && (
                          <div className="pt-2 border-t">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Bell className="w-4 h-4" />
                              <span>Notifications:</span>
                              {notificationStatuses[booking.id].map((notification, idx) => (
                                <span key={idx} className="flex items-center gap-1">
                                  {getNotificationStatusIcon(notification.status)}
                                  <span className="capitalize">{notification.type}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Status Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Schedule
              </CardTitle>
              <CardDescription>
                Track automated reminders and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming notifications scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingNotifications.map((notification) => {
                    const booking = userBookings.find(b => b.id === notification.bookingId)
                    
                    return (
                      <div key={notification.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          {getNotificationStatusIcon(notification.status)}
                          <div>
                            <p className="font-medium capitalize">
                              {notification.type.replace('_', ' ')} Reminder
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {booking?.location || booking?.property_address}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right text-sm">
                          <p className="font-medium">
                            {new Date(notification.scheduledDate).toLocaleDateString()}
                          </p>
                          <p className="text-muted-foreground">
                            {new Date(notification.scheduledDate).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gear className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive booking confirmations and reminders via email
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingsChange('emailNotifications', checked)}
                />
              </div>

              {/* Calendar Integration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Calendar Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync bookings with your calendar
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.calendarIntegration.enabled}
                    onCheckedChange={(checked) => 
                      handleSettingsChange('calendarIntegration', {
                        ...notificationSettings.calendarIntegration,
                        enabled: checked
                      })
                    }
                  />
                </div>

                {notificationSettings.calendarIntegration.enabled && (
                  <div className="ml-4 space-y-3">
                    <div>
                      <Label className="text-sm">Preferred Calendar Platform</Label>
                      <Select
                        value={notificationSettings.calendarIntegration.platform}
                        onValueChange={(value) =>
                          handleSettingsChange('calendarIntegration', {
                            ...notificationSettings.calendarIntegration,
                            platform: value
                          })
                        }
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="google">Google Calendar</SelectItem>
                          <SelectItem value="outlook">Outlook Calendar</SelectItem>
                          <SelectItem value="apple">Apple Calendar</SelectItem>
                          <SelectItem value="ical">iCal Download</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Reminder Settings */}
                    <div className="space-y-2">
                      <Label className="text-sm">Automatic Reminders</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(notificationSettings.calendarIntegration.reminderSettings).map(([key, enabled]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Switch
                              id={key}
                              checked={enabled}
                              onCheckedChange={(checked) =>
                                handleSettingsChange('calendarIntegration', {
                                  ...notificationSettings.calendarIntegration,
                                  reminderSettings: {
                                    ...notificationSettings.calendarIntegration.reminderSettings,
                                    [key]: checked
                                  }
                                })
                              }
                            />
                            <Label htmlFor={key} className="text-xs">
                              {key === 'sevenDays' && '7 days before'}
                              {key === 'twoDays' && '2 days before'}
                              {key === 'oneDay' && '1 day before'}
                              {key === 'twoHours' && '2 hours before'}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Optimization Alerts */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Batching Opportunities</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about nearby bookings for efficient scheduling
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.batchingAlerts}
                  onCheckedChange={(checked) => handleSettingsChange('batchingAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Optimization Suggestions</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive suggestions to optimize your booking schedule
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.optimizationSuggestions}
                  onCheckedChange={(checked) => handleSettingsChange('optimizationSuggestions', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common calendar and notification tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleCalendarExport('google')}
                  disabled={upcomingBookings.length === 0}
                  className="justify-start"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Export to Google Calendar
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleCalendarExport('outlook')}
                  disabled={upcomingBookings.length === 0}
                  className="justify-start"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Export to Outlook
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleCalendarExport('ical')}
                  disabled={upcomingBookings.length === 0}
                  className="justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download iCal File
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    // Test notification
                    toast.success('Test notification sent!')
                  }}
                  className="justify-start"
                >
                  <Envelope className="w-4 h-4 mr-2" />
                  Test Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}