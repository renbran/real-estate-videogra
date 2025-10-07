import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Bell, Play, CheckCircle, XCircle, Clock, Rocket } from '@phosphor-icons/react'
import { pushNotificationService, PushNotificationType } from '@/lib/push-notification-service'
import { SAMPLE_AGENTS } from '@/lib/types'
import { useBookings } from '@/hooks/useClientAPI'
import { toast } from 'sonner'

export function PushNotificationDemo() {
  const [notificationStatus, setNotificationStatus] = useState({
    isSupported: false,
    isPermissionGranted: false,
    isSubscribed: false
  })
  
  const { bookings } = useBookings()

  useEffect(() => {
    const settings = pushNotificationService.getNotificationSettings()
    setNotificationStatus(settings)
  }, [])

  const testNotifications: Array<{
    type: PushNotificationType
    title: string
    description: string
    urgent: boolean
  }> = [
    {
      type: 'booking_approved',
      title: 'Booking Approved',
      description: 'Test a booking approval notification',
      urgent: false
    },
    {
      type: 'booking_reminder_2h',
      title: '2-Hour Reminder',
      description: 'Test urgent shoot reminder',
      urgent: true
    },
    {
      type: 'batch_optimization',
      title: 'Optimization Available',
      description: 'Test batching opportunity alert',
      urgent: false
    },
    {
      type: 'emergency_booking',
      title: 'Emergency Booking',
      description: 'Test urgent same-day booking',
      urgent: true
    }
  ]

  const handleTestNotification = async (type: PushNotificationType, urgent: boolean) => {
    if (!notificationStatus.isPermissionGranted) {
      toast.error('Please enable push notifications first')
      return
    }

    try {
      // Use sample data for demo or first booking if available
      const sampleBooking = bookings?.[0] || {
        id: 'demo-booking-1',
        agent_id: 'agent-1',
        shoot_category: 'property' as const,
        location: '123 Demo Street, San Francisco, CA',
        property_address: '123 Demo Street, San Francisco, CA',
        property_value: '1m_2m' as const,
        shoot_complexity: 'standard' as const,
        preferred_date: new Date().toISOString().split('T')[0],
        backup_dates: [],
        is_flexible: true,
        status: 'approved' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      const sampleUser = SAMPLE_AGENTS[0]

      await pushNotificationService.showNotification(
        type,
        sampleBooking,
        sampleUser,
        {}
      )

      toast.success('Test notification sent!')
    } catch (error) {
      console.error('Failed to send test notification:', error)
      toast.error('Failed to send test notification')
    }
  }

  const handleInitialize = async () => {
    try {
      const success = await pushNotificationService.initialize()
      if (success) {
        const settings = pushNotificationService.getNotificationSettings()
        setNotificationStatus(settings)
        toast.success('Push notifications enabled!')
      } else {
        toast.error('Failed to enable push notifications')
      }
    } catch (error) {
      console.error('Failed to initialize:', error)
      toast.error('Failed to initialize push notifications')
    }
  }

  const getStatusBadge = () => {
    if (!notificationStatus.isSupported) {
      return <Badge variant="destructive">Not Supported</Badge>
    }
    if (!notificationStatus.isPermissionGranted) {
      return <Badge variant="secondary">Disabled</Badge>
    }
    return <Badge variant="default">Enabled</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notification Demo
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            Test mobile push notifications for time-sensitive booking updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!notificationStatus.isSupported && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">Browser Not Supported</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Push notifications are not supported in this browser. Try Chrome, Firefox, or Safari.
              </p>
            </div>
          )}

          {notificationStatus.isSupported && !notificationStatus.isPermissionGranted && (
            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-yellow-700">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Permission Required</span>
                </div>
                <Button onClick={handleInitialize} size="sm">
                  Enable Notifications
                </Button>
              </div>
              <p className="text-sm text-yellow-600 mt-1">
                Click "Enable Notifications" to allow push notifications from VideoPro.
              </p>
            </div>
          )}

          {notificationStatus.isPermissionGranted && (
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Push Notifications Enabled</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                You'll receive notifications for booking updates, reminders, and optimization opportunities.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Notifications */}
      {notificationStatus.isPermissionGranted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Notifications
            </CardTitle>
            <CardDescription>
              Try different types of push notifications to see how they work
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testNotifications.map((notification, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{notification.title}</span>
                      {notification.urgent && (
                        <Badge variant="destructive" className="text-xs">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.description}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestNotification(notification.type, notification.urgent)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="text-center">
              <Button
                onClick={() => handleTestNotification('booking_approved', false)}
                className="flex items-center gap-2"
              >
                <Rocket className="h-4 w-4" />
                Send Sample Booking Approval
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will trigger a realistic booking approval notification
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Push Notification Features</CardTitle>
          <CardDescription>
            Real-time updates delivered directly to your device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Booking Updates</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• ✅ Approval confirmations</li>
                <li>• ❌ Decline notifications</li>
                <li>• 📝 Schedule changes</li>
                <li>• 🚫 Cancellation alerts</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Smart Reminders</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 📅 24-hour advance notice</li>
                <li>• ⏰ 2-hour preparation alert</li>
                <li>• 🚨 30-minute final reminder</li>
                <li>• 📍 Location and directions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Optimization Alerts</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 🚀 Batching opportunities</li>
                <li>• 🗺️ Route optimizations</li>
                <li>• 📊 Capacity suggestions</li>
                <li>• ⚡ Same-day availability</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Emergency Features</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 🚨 Urgent approval requests</li>
                <li>• 🔥 Emergency bookings</li>
                <li>• 📱 Instant manager alerts</li>
                <li>• 🔄 Real-time status updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}