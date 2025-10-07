import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Bell, CheckCircle, XCircle, Play, Rocket } from '@phosphor-icons/react'
import { toast } from 'sonner'

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
    checkNotificationSupport()
  }, [])

  const checkNotificationSupport = () => {
    const isSupported = 'Notification' in window
    const isPermissionGranted = isSupported && Notification.permission === 'granted'
    
    setNotificationStatus({
      isSupported,
      isPermissionGranted,
      isSubscribed: isPermissionGranted
    })
  }

  const sampleNotifications = [
    {
      title: 'Booking Approved',
      body: 'Your videography request for 123 Main St has been approved',
      urgent: false
    },
    {
      title: '2-Hour Reminder',
      body: 'Upcoming shoot at 456 Oak Ave in 2 hours',
      urgent: false
    },
    {
      title: 'Optimization Available',
      body: 'Batch 3 nearby properties for better rates',
      urgent: false
    },
    {
      title: 'Urgent Request',
      body: 'Urgent same-day request - Premium rates available',
      urgent: true
    }
  ]

  const sendTestNotification = (notification: typeof sampleNotifications[0]) => {
    if (!notificationStatus.isPermissionGranted) {
      toast.error('Please enable push notifications first')
      return
    }
    
    try {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/favicon.ico'
      })
      toast.success(`${notification.title} notification sent!`)
    } catch (error) {
      toast.error('Failed to send notification')
    }
  }

  const enableNotifications = async () => {
    if (!notificationStatus.isSupported) {
      toast.error('Your browser does not support push notifications')
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
      toast.error('Failed to enable notifications')
    }
  }

  const disableNotifications = () => {
    if (!notificationStatus.isPermissionGranted) {
      return
    }
    
    setNotificationStatus(prev => ({
      ...prev,
      isSubscribed: false
    }))
    toast.info('Notifications disabled for this session')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure and test push notifications for real-time updates
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!notificationStatus.isSupported && (
            <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">Not Supported</span>
              </div>
              <p className="text-sm text-destructive/80 mt-1">
                Your browser doesn't support push notifications
              </p>
            </div>
          )}

          {notificationStatus.isSupported && !notificationStatus.isPermissionGranted && (
            <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700">
                <Bell className="h-4 w-4" />
                <span className="font-medium">Enable Notifications</span>
              </div>
              <p className="text-sm text-amber-600 mt-1 mb-3">
                Grant permission to receive real-time booking updates
              </p>
              <Button onClick={enableNotifications} size="sm">
                Enable Notifications
              </Button>
            </div>
          )}

          {notificationStatus.isPermissionGranted && (
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Notifications Enabled</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                You'll receive real-time updates for bookings and opportunities
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {notificationStatus.isPermissionGranted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {sampleNotifications.map((notification, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{notification.title}</span>
                      {notification.urgent && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                  </div>
                  <Button
                    onClick={() => sendTestNotification(notification)}
                    size="sm"
                    variant="outline"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Send
                  </Button>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="text-center">
              <Button onClick={() => sendTestNotification(sampleNotifications[0])} className="w-full">
                <Rocket className="h-4 w-4 mr-2" />
                Send Test Notification
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will trigger a realistic notification preview
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <p className="text-sm text-muted-foreground">
            Different types of notifications you'll receive
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Booking Updates</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• ✅ Approval confirmations</li>
                <li>• 📝 Requirement changes</li>
                <li>• ⏰ Schedule modifications</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Reminders</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• ⏰ 2-hour preparation alerts</li>
                <li>• 📍 Location and access details</li>
                <li>• 📋 Equipment checklists</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Opportunities</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 🚀 Batching opportunities</li>
                <li>• 📊 Capacity optimization alerts</li>
                <li>• 💰 Premium rate notifications</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">System Alerts</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 🔄 Real-time status updates</li>
                <li>• 🛠️ Platform maintenance notices</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}