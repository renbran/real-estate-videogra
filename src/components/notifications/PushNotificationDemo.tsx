import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Bell, XCircle, CheckCircle, Play, Rocket } from '@phosphor-icons/react'
import { toast } from 'sonner'

type PushNotificationType = 'booking_approved' | 'booking_reminder_2h' | 'optimization_alert' | 'emergency_booking'

interface NotificationStatus {
  isSupported: boolean
  isPermissionGranted: boolean
  isSubscribed: boolean
}

export function PushNotificationDemo() {
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>({
    isSupported: false,
    isPermissionGranted: false,
    isSubscribed: false
  })

  useEffect(() => {
    const checkNotificationSupport = () => {
      const isSupported = 'Notification' in window && 'serviceWorker' in navigator
      const isPermissionGranted = Notification.permission === 'granted'
      
      setNotificationStatus({
        isSupported,
        isPermissionGranted,
        isSubscribed: isSupported && isPermissionGranted
      })
    }

    checkNotificationSupport()
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
      type: 'optimization_alert',
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
      const notification = testNotifications.find(n => n.type === type)
      if (notification) {
        new Notification(notification.title, {
          body: notification.description,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: type,
          requireInteraction: urgent
        })
        toast.success(`${notification.title} notification sent!`)
      }
    } catch (error) {
      console.error('Failed to send notification:', error)
      toast.error('Failed to send notification')
    }
  }

  const handleInitializeNotifications = async () => {
    if (!notificationStatus.isSupported) {
      toast.error('Push notifications are not supported in this browser')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setNotificationStatus(prev => ({
          ...prev,
          isPermissionGranted: true,
          isSubscribed: true
        }))
        toast.success('Push notifications enabled!')
      } else {
        toast.error('Push notification permission denied')
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      toast.error('Failed to enable notifications')
    }
  }

  const getStatusBadge = () => {
    if (!notificationStatus.isSupported) {
      return <Badge variant="destructive">Not Supported</Badge>
    }
    if (!notificationStatus.isPermissionGranted) {
      return <Badge variant="secondary">Disabled</Badge>
    }
    return <Badge variant="default" className="bg-green-500">Enabled</Badge>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notification Settings
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            Configure and test push notifications for real-time booking updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!notificationStatus.isSupported && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">Not Supported</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Push notifications are not supported in this browser
              </p>
            </div>
          )}

          {notificationStatus.isSupported && !notificationStatus.isPermissionGranted && (
            <div className="space-y-3">
              <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700">
                  <Bell className="h-4 w-4" />
                  <span className="font-medium">Enable Notifications</span>
                </div>
                <Button onClick={handleInitializeNotifications} className="mt-2">
                  Grant Permission
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Click above to enable real-time notifications for booking updates
              </p>
            </div>
          )}

          {notificationStatus.isPermissionGranted && (
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Notifications Enabled</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                You'll receive real-time updates for bookings and schedule changes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Notifications Card */}
      {notificationStatus.isPermissionGranted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Notifications
            </CardTitle>
            <CardDescription>
              Send test notifications to see how they appear
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {testNotifications.map((notification) => (
                <div key={notification.type} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{notification.title}</span>
                      {notification.urgent && (
                        <Badge variant="destructive" className="text-xs">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.description}</p>
                  </div>
                  <Button
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

            <div className="space-y-3">
              <Button
                onClick={() => handleTestNotification('booking_approved', false)}
                className="flex items-center gap-2 w-full"
              >
                <Rocket className="h-4 w-4" />
                Send Realistic Booking Update
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                This will trigger a realistic booking notification with your current data
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Types Info */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Different types of notifications you'll receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Booking Updates</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• ✅ Approval confirmations</li>
                <li>• ❌ Rejection notifications</li>
                <li>• 📝 Schedule changes</li>
                <li>• 💰 Payment updates</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Smart Reminders</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 📅 24-hour advance notice</li>
                <li>• ⏰ 2-hour preparation alert</li>
                <li>• 🚨 30-minute final reminder</li>
                <li>• 📍 Location and directions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Optimization Alerts</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 🚀 Batching opportunities</li>
                <li>• 🗺️ Route optimizations</li>
                <li>• 📊 Capacity suggestions</li>
                <li>• ⚡ Same-day availability</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Emergency Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
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