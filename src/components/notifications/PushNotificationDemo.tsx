import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, CheckCircle, XCircle, Play, Rocket } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface NotificationStatus {
  isSupported: boolean
  isPermissionGranted: boolean
  permission: NotificationPermission
}

interface TestNotification {
  id: string
  title: string
  body: string
  icon?: string
  urgent: boolean
}

export function PushNotificationDemo() {
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>({
    isSupported: false,
    isPermissionGranted: false,
    permission: 'default'
  })

  useEffect(() => {
    checkNotificationSupport()
  }, [])

  const checkNotificationSupport = () => {
    const isSupported = 'Notification' in window
    const isPermissionGranted = Notification.permission === 'granted'
    
    setNotificationStatus({
      isSupported,
      isPermissionGranted,
      permission: Notification.permission
    })
  }

  const sampleNotifications: TestNotification[] = [
    {
      id: '1',
      title: 'Booking Confirmed',
      body: 'Your videography session for 123 Oak Street has been confirmed for tomorrow at 2:00 PM',
      urgent: false
    },
    {
      id: '2',
      title: 'New Opportunity',
      body: 'Batch 3 nearby properties for better rates',
      urgent: false
    },
    {
      id: '3',
      title: 'Urgent Request',
      body: 'Last-minute booking available - Premium rate applies',
      urgent: true
    }
  ]

  const sendTestNotification = (notification: TestNotification) => {
    if (!notificationStatus.isPermissionGranted) {
      toast.error('Notification permission not granted')
      return
    }

    try {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/favicon.ico',
        tag: notification.id
      })
      
      toast.success(`Sent: ${notification.title}`)
    } catch (error) {
      toast.error('Failed to send notification')
    }
  }

  const requestNotificationPermission = async () => {
    if (!notificationStatus.isSupported) {
      toast.error('Notifications not supported in this browser')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationStatus(prev => ({
        ...prev,
        permission,
        isPermissionGranted: permission === 'granted'
      }))
      
      if (permission === 'granted') {
        toast.success('Notification permission granted!')
      } else {
        toast.error('Notification permission denied')
      }
    } catch (error) {
      toast.error('Failed to request notification permission')
    }
  }

  const sendAllNotifications = () => {
    sampleNotifications.forEach((notification, index) => {
      setTimeout(() => {
        sendTestNotification(notification)
      }, index * 1000)
    })
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
            Test push notification functionality for real-time updates
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!notificationStatus.isSupported && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm">
                Your browser doesn't support push notifications
              </span>
            </div>
          )}

          {notificationStatus.isSupported && !notificationStatus.isPermissionGranted && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Bell className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">
                  Enable notifications to receive real-time updates
                </span>
              </div>
              <Button onClick={requestNotificationPermission} className="w-full">
                Enable Notifications
              </Button>
            </div>
          )}

          {notificationStatus.isPermissionGranted && (
            <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                Notifications are enabled and ready
              </span>
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {sampleNotifications.map((notification) => (
                <div key={notification.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{notification.title}</span>
                      {notification.urgent && (
                        <Rocket className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.body}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendTestNotification(notification)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button onClick={sendAllNotifications} className="w-full">
              Send All Test Notifications
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <p className="text-sm text-muted-foreground">
            Different types of notifications you'll receive in the VideoPro platform
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Booking Updates</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• ✅ Approval confirmations</li>
              <li>• ⏰ Schedule changes</li>
              <li>• 📍 Location updates</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Opportunities</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• 🚀 Batching opportunities</li>
              <li>• 💰 Premium rate notifications</li>
              <li>• 📈 High-demand areas</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm">System Updates</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• 🛠️ Platform maintenance notices</li>
              <li>• 📱 App updates available</li>
              <li>• 🔧 Feature announcements</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}