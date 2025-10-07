import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DeviceMobile, Bell, BellSlash, Gear, Warning } from '@phosphor-icons/react'
import { pushNotificationService } from '@/lib/push-notification-service'
import { toast } from 'sonner'

interface PushNotificationSettingsProps {
  onSettingsChange?: (enabled: boolean) => void
}

export function PushNotificationSettings({ onSettingsChange }: PushNotificationSettingsProps) {
  const [notificationSettings, setNotificationSettings] = useState({
    isSupported: false,
    isPermissionGranted: false,
    isSubscribed: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [preferences, setPreferences] = useState({
    bookingUpdates: true,
    reminders: true,
    optimizations: true,
    urgentOnly: false
  })

  useEffect(() => {
    // Get initial notification settings
    const settings = pushNotificationService.getNotificationSettings()
    setNotificationSettings(settings)

    // Load user preferences from storage
    const savedPreferences = localStorage.getItem('push-notification-preferences')
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences))
    }
  }, [])

  const handleEnableNotifications = async () => {
    setIsLoading(true)
    try {
      const success = await pushNotificationService.initialize()
      if (success) {
        const settings = pushNotificationService.getNotificationSettings()
        setNotificationSettings(settings)
        toast.success('Push notifications enabled successfully!')
        onSettingsChange?.(true)
      } else {
        toast.error('Failed to enable push notifications. Please check your browser settings.')
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error)
      toast.error('Failed to enable push notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableNotifications = async () => {
    setIsLoading(true)
    try {
      await pushNotificationService.unsubscribe()
      setNotificationSettings(prev => ({ ...prev, isSubscribed: false, isPermissionGranted: false }))
      toast.success('Push notifications disabled')
      onSettingsChange?.(false)
    } catch (error) {
      console.error('Failed to disable notifications:', error)
      toast.error('Failed to disable push notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    localStorage.setItem('push-notification-preferences', JSON.stringify(newPreferences))
    toast.success('Notification preferences updated')
  }

  const testNotification = () => {
    if (!notificationSettings.isPermissionGranted) {
      toast.error('Please enable notifications first')
      return
    }

    // Show test notification using basic Notification API
    if (Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from VideoPro',
        icon: '/icons/icon-192x192.png',
        tag: 'test-notification'
      })
      toast.success('Test notification sent!')
    }
  }

  const getNotificationStatus = () => {
    if (!notificationSettings.isSupported) {
      return { status: 'unsupported', color: 'destructive', text: 'Not Supported' }
    }
    if (!notificationSettings.isPermissionGranted) {
      return { status: 'disabled', color: 'secondary', text: 'Disabled' }
    }
    return { status: 'enabled', color: 'default', text: 'Enabled' }
  }

  const statusInfo = getNotificationStatus()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DeviceMobile className="h-5 w-5" />
          Push Notifications
          <Badge variant={statusInfo.color as any}>{statusInfo.text}</Badge>
        </CardTitle>
        <CardDescription>
          Get real-time updates about your bookings, schedule changes, and optimization opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!notificationSettings.isSupported && (
          <Alert>
            <Warning className="h-4 w-4" />
            <AlertDescription>
              Push notifications are not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
            </AlertDescription>
          </Alert>
        )}

        {notificationSettings.isSupported && (
          <div className="space-y-4">
            {/* Enable/Disable Notifications */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {notificationSettings.isPermissionGranted ? (
                    <Bell className="h-4 w-4 text-green-500" />
                  ) : (
                    <BellSlash className="h-4 w-4 text-gray-400" />
                  )}
                  <Label className="text-sm font-medium">
                    Enable Push Notifications
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Receive notifications even when the app is closed
                </p>
              </div>
              <div className="flex gap-2">
                {notificationSettings.isPermissionGranted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testNotification}
                  >
                    Test
                  </Button>
                )}
                <Button
                  onClick={notificationSettings.isPermissionGranted ? handleDisableNotifications : handleEnableNotifications}
                  disabled={isLoading}
                  variant={notificationSettings.isPermissionGranted ? "outline" : "default"}
                  size="sm"
                >
                  {isLoading ? 'Loading...' : notificationSettings.isPermissionGranted ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>

            {/* Notification Preferences */}
            {notificationSettings.isPermissionGranted && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Gear className="h-4 w-4" />
                  <Label className="text-sm font-medium">Notification Preferences</Label>
                </div>

                <div className="space-y-3 pl-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="booking-updates" className="text-sm">
                        Booking Updates
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Approval confirmations, schedule changes, cancellations
                      </p>
                    </div>
                    <Switch
                      id="booking-updates"
                      checked={preferences.bookingUpdates}
                      onCheckedChange={(checked) => handlePreferenceChange('bookingUpdates', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="reminders" className="text-sm">
                        Shoot Reminders
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        24-hour, 2-hour, and 30-minute reminders
                      </p>
                    </div>
                    <Switch
                      id="reminders"
                      checked={preferences.reminders}
                      onCheckedChange={(checked) => handlePreferenceChange('reminders', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="optimizations" className="text-sm">
                        Optimization Opportunities
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Batching suggestions, route optimizations
                      </p>
                    </div>
                    <Switch
                      id="optimizations"
                      checked={preferences.optimizations}
                      onCheckedChange={(checked) => handlePreferenceChange('optimizations', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="urgent-only" className="text-sm">
                        Urgent Only Mode
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Only receive high-priority notifications
                      </p>
                    </div>
                    <Switch
                      id="urgent-only"
                      checked={preferences.urgentOnly}
                      onCheckedChange={(checked) => handlePreferenceChange('urgentOnly', checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notification Types Info */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-3">You'll receive notifications for:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• ✅ Booking approved/declined</li>
                <li>• 📅 Shoot reminders (24h, 2h, 30min before)</li>
                <li>• 📝 Schedule changes and cancellations</li>
                <li>• 🚀 Optimization opportunities</li>
                <li>• 📍 Batching suggestions in your area</li>
                <li>• 🚨 Urgent approvals and emergency bookings</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}