import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { TestTube, Envelope, Calendar, Users } from '@phosphor-icons/react'
import { BookingRequest, SAMPLE_AGENTS } from '@/lib/types'
import { useNotifications } from '@/hooks/useNotifications'
import { EmailPreview } from './EmailPreview'
import { CalendarExportButton } from '@/components/calendar/CalendarExportButton'

// Sample booking for testing
const SAMPLE_BOOKING: BookingRequest = {
  id: 'test-booking-001',
  agent_id: '1',
  agent_name: 'Sarah Johnson',
  property_address: '123 Test Drive, Beverly Hills, CA 90210',
  property_value: '1m_2m',
  shoot_complexity: 'standard',
  geographic_zone: 'west',
  property_access: 'vacant_lockbox',
  preferred_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
  backup_dates: [
    new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  ],
  is_flexible: true,
  special_requirements: 'Please coordinate with staging company arriving at 8 AM',
  priority_score: 75,
  status: 'approved',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  estimated_duration: 90,
  scheduled_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  scheduled_time: '10:00',
  manager_notes: 'High-value property - priority scheduling',
  coordinates: { lat: 34.0736, lng: -118.4004 }
}

export function NotificationTest() {
  const [selectedType, setSelectedType] = useState<'booking_approved' | 'booking_declined' | 'booking_reminder' | 'batch_opportunity'>('booking_approved')
  const [isSending, setIsSending] = useState(false)
  
  const {
    sendApprovalNotification,
    sendDeclineNotification,
    sendReminderNotification,
    sendBatchOpportunityNotification,
    getNotificationStats
  } = useNotifications()

  const stats = getNotificationStats()

  const handleSendTestNotification = async () => {
    setIsSending(true)
    try {
      let success = false
      
      switch (selectedType) {
        case 'booking_approved':
          success = await sendApprovalNotification(SAMPLE_BOOKING)
          break
        case 'booking_declined':
          success = await sendDeclineNotification({
            ...SAMPLE_BOOKING,
            status: 'declined',
            manager_notes: 'Unfortunately, we cannot accommodate this request due to capacity constraints. Please consider alternative dates or contact us for priority scheduling options.'
          })
          break
        case 'booking_reminder':
          success = await sendReminderNotification(SAMPLE_BOOKING, 2)
          break
        case 'batch_opportunity':
          success = await sendBatchOpportunityNotification(SAMPLE_BOOKING, [
            { ...SAMPLE_BOOKING, id: 'nearby-1', property_address: '456 Oak Street, Beverly Hills, CA 90210' },
            { ...SAMPLE_BOOKING, id: 'nearby-2', property_address: '789 Pine Avenue, Beverly Hills, CA 90210' }
          ])
          break
      }
      
      if (success) {
        toast.success(`Test ${selectedType.replace('_', ' ')} notification sent!`)
      } else {
        toast.error('Failed to send test notification')
      }
    } catch (error) {
      console.error('Test notification error:', error)
      toast.error('Error sending test notification')
    } finally {
      setIsSending(false)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'booking_approved':
        return 'Booking Approved'
      case 'booking_declined':
        return 'Booking Declined'
      case 'booking_reminder':
        return 'Booking Reminder'
      case 'batch_opportunity':
        return 'Batch Opportunity'
      default:
        return type
    }
  }

  return (
    <Card className="border-dashed border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TestTube className="w-5 h-5 text-primary" />
          <span>Notification System Test</span>
          <Badge variant="outline" className="text-xs">Development Only</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Stats Display */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            <div className="text-sm text-muted-foreground">Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Notification Type</label>
            <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="booking_approved">Booking Approved</SelectItem>
                <SelectItem value="booking_declined">Booking Declined</SelectItem>
                <SelectItem value="booking_reminder">Booking Reminder</SelectItem>
                <SelectItem value="batch_opportunity">Batch Opportunity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sample Data Preview */}
          <div className="bg-muted p-3 rounded text-sm">
            <div className="font-medium mb-2">Test Data:</div>
            <div className="space-y-1 text-muted-foreground">
              <div><strong>Agent:</strong> {SAMPLE_AGENTS[0].name} ({SAMPLE_AGENTS[0].email})</div>
              <div><strong>Property:</strong> {SAMPLE_BOOKING.property_address}</div>
              <div><strong>Date:</strong> {SAMPLE_BOOKING.scheduled_date} at {SAMPLE_BOOKING.scheduled_time}</div>
              <div><strong>Type:</strong> {getTypeLabel(selectedType)}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <EmailPreview 
              booking={selectedType === 'booking_declined' 
                ? { ...SAMPLE_BOOKING, status: 'declined', manager_notes: 'Test decline reason' }
                : SAMPLE_BOOKING
              }
              type={selectedType}
              additionalData={selectedType === 'booking_reminder' ? { daysUntil: 2 } : 
                             selectedType === 'batch_opportunity' ? { nearbyBookings: [] } : undefined}
            />
            
            <Button
              onClick={handleSendTestNotification}
              disabled={isSending}
              className="flex-1"
            >
              <Envelope className="w-4 h-4 mr-1" />
              {isSending ? 'Sending...' : `Send Test ${getTypeLabel(selectedType)}`}
            </Button>
            
            <CalendarExportButton 
              booking={SAMPLE_BOOKING}
              variant="outline"
            />
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="text-xs text-muted-foreground bg-background p-3 rounded border">
          <div className="font-medium mb-1">📧 Email Notifications:</div>
          <ul className="list-disc list-inside space-y-1 mb-2">
            <li>Automatically sent when bookings are approved/declined</li>
            <li>Include calendar invitations for approved bookings</li>
            <li>Support reminder notifications for upcoming shoots</li>
            <li>HTML and plain text versions generated</li>
          </ul>
          
          <div className="font-medium mb-1">📅 Calendar Integration:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Download .ics files for any calendar app</li>
            <li>Direct links to Google Calendar and Outlook</li>
            <li>Export multiple bookings as schedule</li>
            <li>Include all booking details and attendees</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}