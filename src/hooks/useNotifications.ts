import { useCallback } from 'react'
import { useKV } from './useKV'
import { toast } from 'sonner'
import { 
  sendBookingNotification, 
  scheduleReminderNotifications,
  NotificationPayload 
} from '@/lib/notification-service'
import { BookingRequest } from '@/lib/types'

export interface NotificationLog {
  id: string
  bookingId: string
  type: string
  recipient: string
  sent: boolean
  sentAt?: string
  error?: string
}

export function useNotifications() {
  const [notificationLogs, setNotificationLogs] = useKV<NotificationLog[]>('notification-logs', [])

  const logNotification = useCallback((log: Omit<NotificationLog, 'id'>) => {
    const newLog: NotificationLog = {
      ...log,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    }
    
    setNotificationLogs(current => [...(current || []), newLog])
    return newLog
  }, [setNotificationLogs])

  const sendApprovalNotification = useCallback(async (booking: BookingRequest): Promise<boolean> => {
    const agent = { name: 'Agent', email: 'agent@osus.com' } // Will be provided by calling component
    if (!agent) {
      toast.error('Cannot send notification - agent not found')
      return false
    }

    const payload: NotificationPayload = {
      type: 'booking_approved',
      booking,
      recipient: { ...agent, role: 'agent' as const }
    }

    try {
      const success = await sendBookingNotification(payload)
      
      logNotification({
        bookingId: booking.id,
        type: 'booking_approved',
        recipient: agent.email,
        sent: success,
        sentAt: success ? new Date().toISOString() : undefined,
        error: success ? undefined : 'Failed to send email'
      })

      if (success) {
        // Schedule reminder notifications
        scheduleReminderNotifications(booking)
        toast.success(`📧 Approval notification sent to ${agent.name}`)
      } else {
        toast.error('Failed to send approval notification')
      }

      return success
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      logNotification({
        bookingId: booking.id,
        type: 'booking_approved',
        recipient: agent.email,
        sent: false,
        error: errorMsg
      })
      
      toast.error(`Failed to send notification: ${errorMsg}`)
      return false
    }
  }, [logNotification])

  const sendDeclineNotification = useCallback(async (booking: BookingRequest, managerNotes?: string): Promise<boolean> => {
    const agent = { name: 'Agent', email: 'agent@osus.com' } // Will be provided by calling component
    if (!agent) {
      toast.error('Cannot send notification - agent not found')
      return false
    }

    const bookingWithNotes = managerNotes ? { ...booking, manager_notes: managerNotes } : booking

    const payload: NotificationPayload = {
      type: 'booking_declined',
      booking: bookingWithNotes,
      recipient: { ...agent, role: 'agent' as const }
    }

    try {
      const success = await sendBookingNotification(payload)
      
      logNotification({
        bookingId: booking.id,
        type: 'booking_declined',
        recipient: agent.email,
        sent: success,
        sentAt: success ? new Date().toISOString() : undefined,
        error: success ? undefined : 'Failed to send email'
      })

      if (success) {
        toast.success(`📧 Decline notification sent to ${agent.name}`)
      } else {
        toast.error('Failed to send decline notification')
      }

      return success
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      logNotification({
        bookingId: booking.id,
        type: 'booking_declined',
        recipient: agent.email,
        sent: false,
        error: errorMsg
      })
      
      toast.error(`Failed to send notification: ${errorMsg}`)
      return false
    }
  }, [logNotification])

  const sendBatchOpportunityNotification = useCallback(async (
    booking: BookingRequest, 
    nearbyBookings: BookingRequest[]
  ): Promise<boolean> => {
    const agent = { name: 'Agent', email: 'agent@osus.com' } // Will be provided by calling component
    if (!agent) return false

    const payload: NotificationPayload = {
      type: 'batch_opportunity',
      booking,
      recipient: { ...agent, role: 'agent' as const },
      additionalData: { nearbyBookings }
    }

    try {
      const success = await sendBookingNotification(payload)
      
      logNotification({
        bookingId: booking.id,
        type: 'batch_opportunity',
        recipient: agent.email,
        sent: success,
        sentAt: success ? new Date().toISOString() : undefined,
        error: success ? undefined : 'Failed to send email'
      })

      if (success) {
        toast.success(`📧 Batch opportunity notification sent to ${agent.name}`)
      }

      return success
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      logNotification({
        bookingId: booking.id,
        type: 'batch_opportunity',
        recipient: agent.email,
        sent: false,
        error: errorMsg
      })
      
      return false
    }
  }, [logNotification])

  const sendReminderNotification = useCallback(async (
    booking: BookingRequest, 
    daysUntil: number
  ): Promise<boolean> => {
    const agent = { name: 'Agent', email: 'agent@osus.com' } // Will be provided by calling component
    if (!agent) return false

    const payload: NotificationPayload = {
      type: 'booking_reminder',
      booking,
      recipient: { ...agent, role: 'agent' as const },
      additionalData: { daysUntil }
    }

    try {
      const success = await sendBookingNotification(payload)
      
      logNotification({
        bookingId: booking.id,
        type: 'booking_reminder',
        recipient: agent.email,
        sent: success,
        sentAt: success ? new Date().toISOString() : undefined,
        error: success ? undefined : 'Failed to send email'
      })

      if (success) {
        toast.success(`📧 Reminder notification sent to ${agent.name}`)
      }

      return success
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      logNotification({
        bookingId: booking.id,
        type: 'booking_reminder',
        recipient: agent.email,
        sent: false,
        error: errorMsg
      })
      
      return false
    }
  }, [logNotification])

  const getNotificationHistory = useCallback((bookingId?: string) => {
    if (!bookingId) return notificationLogs || []
    return (notificationLogs || []).filter(log => log.bookingId === bookingId)
  }, [notificationLogs])

  const getNotificationStats = useCallback(() => {
    const logs = notificationLogs || []
    return {
      total: logs.length,
      sent: logs.filter(log => log.sent).length,
      failed: logs.filter(log => !log.sent).length,
      byType: logs.reduce((acc, log) => {
        acc[log.type] = (acc[log.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }, [notificationLogs])

  return {
    sendApprovalNotification,
    sendDeclineNotification,
    sendBatchOpportunityNotification,
    sendReminderNotification,
    getNotificationHistory,
    getNotificationStats,
    notificationLogs: notificationLogs || []
  }
}