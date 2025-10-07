import { BookingRequest, User, SAMPLE_AGENTS, SHOOT_COMPLEXITIES, PROPERTY_VALUES } from './types'
import { formatDate, formatTime } from './date-utils'
import { generateICalEvent, createCalendarEventFromBooking, sendBookingNotification } from './notification-service'
import { generateCalendarLinks } from './calendar-utils'

/**
 * Enhanced notification system with calendar integration and automated scheduling
 */

export interface NotificationSchedule {
  id: string
  bookingId: string
  type: 'reminder' | 'follow_up' | 'optimization_suggestion'
  scheduledDate: Date
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  retryCount: number
  metadata?: any
}

export interface CalendarIntegration {
  platform: 'google' | 'outlook' | 'apple' | 'ical'
  enabled: boolean
  autoSync: boolean
  reminderSettings: {
    sevenDays: boolean
    twoDays: boolean
    oneDay: boolean
    twoHours: boolean
  }
}

export interface AutomatedNotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  calendarIntegration: CalendarIntegration
  batchingAlerts: boolean
  optimizationSuggestions: boolean
}

class IntegratedNotificationSystem {
  private static instance: IntegratedNotificationSystem
  private schedules: Map<string, NotificationSchedule[]> = new Map()
  private userSettings: Map<string, AutomatedNotificationSettings> = new Map()

  static getInstance(): IntegratedNotificationSystem {
    if (!IntegratedNotificationSystem.instance) {
      IntegratedNotificationSystem.instance = new IntegratedNotificationSystem()
    }
    return IntegratedNotificationSystem.instance
  }

  /**
   * Initialize notification system with user settings
   */
  initializeUserSettings(userId: string, settings: AutomatedNotificationSettings) {
    this.userSettings.set(userId, settings)
  }

  /**
   * Get user notification settings with defaults
   */
  getUserSettings(userId: string): AutomatedNotificationSettings {
    return this.userSettings.get(userId) || {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      calendarIntegration: {
        platform: 'google',
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
    }
  }

  /**
   * Process booking approval with full notification suite
   */
  async processBookingApproval(booking: BookingRequest): Promise<boolean> {
    try {
      const agent = { name: 'Agent', email: 'agent@osus.com' } // Will be provided by calling component
      if (!agent) return false

      const userSettings = this.getUserSettings(agent.id)

      // 1. Send immediate approval notification
      if (userSettings.emailNotifications) {
        await sendBookingNotification({
          type: 'booking_approved',
          booking,
          recipient: agent as User
        })
      }

      // 2. Create calendar integration
      if (userSettings.calendarIntegration.enabled) {
        await this.createCalendarIntegration(booking, userSettings.calendarIntegration)
      }

      // 3. Schedule automated reminders
      await this.scheduleAutomatedReminders(booking, userSettings)

      // 4. Check for optimization opportunities
      if (userSettings.optimizationSuggestions) {
        await this.checkOptimizationOpportunities(booking)
      }

      // 5. Setup follow-up notifications
      await this.setupFollowUpNotifications(booking)

      return true
    } catch (error) {
      console.error('Failed to process booking approval notifications:', error)
      return false
    }
  }

  /**
   * Create calendar integration for approved booking
   */
  private async createCalendarIntegration(booking: BookingRequest, settings: CalendarIntegration): Promise<void> {
    const calendarEvent = createCalendarEventFromBooking(booking)
    const icalContent = generateICalEvent(calendarEvent)

    // Generate platform-specific calendar links
    const calendarLinks = generateCalendarLinks(booking)

    // Create calendar reminder notifications
    const reminderNotifications = []

    if (settings.reminderSettings.sevenDays) {
      reminderNotifications.push(this.createReminderSchedule(booking, 7, 'days'))
    }
    if (settings.reminderSettings.twoDays) {
      reminderNotifications.push(this.createReminderSchedule(booking, 2, 'days'))
    }
    if (settings.reminderSettings.oneDay) {
      reminderNotifications.push(this.createReminderSchedule(booking, 1, 'days'))
    }
    if (settings.reminderSettings.twoHours) {
      reminderNotifications.push(this.createReminderSchedule(booking, 2, 'hours'))
    }

    // Store reminder schedules
    this.schedules.set(booking.id, reminderNotifications)

    console.log(`📅 Calendar integration created for booking ${booking.id}`)
    console.log(`🔗 Calendar Links:`, calendarLinks)
  }

  /**
   * Create reminder schedule
   */
  private createReminderSchedule(booking: BookingRequest, amount: number, unit: 'days' | 'hours'): NotificationSchedule {
    const shootDate = new Date(booking.scheduled_date || booking.preferred_date)
    const reminderDate = new Date(shootDate)

    if (unit === 'days') {
      reminderDate.setDate(reminderDate.getDate() - amount)
    } else {
      reminderDate.setHours(reminderDate.getHours() - amount)
    }

    return {
      id: `${booking.id}-reminder-${amount}${unit}`,
      bookingId: booking.id,
      type: 'reminder',
      scheduledDate: reminderDate,
      status: 'pending',
      retryCount: 0,
      metadata: { amount, unit }
    }
  }

  /**
   * Schedule automated reminders
   */
  private async scheduleAutomatedReminders(booking: BookingRequest, settings: AutomatedNotificationSettings): Promise<void> {
    const schedules = this.schedules.get(booking.id) || []
    
    for (const schedule of schedules) {
      if (schedule.type === 'reminder' && schedule.scheduledDate > new Date()) {
        // In production, use a proper job scheduler
        this.simulateScheduledReminder(schedule, booking)
      }
    }
  }

  /**
   * Simulate scheduled reminder (replace with actual scheduler in production)
   */
  private simulateScheduledReminder(schedule: NotificationSchedule, booking: BookingRequest): void {
    const delay = schedule.scheduledDate.getTime() - Date.now()
    
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) { // Only schedule if within 24 hours
      setTimeout(async () => {
        try {
          const agent = { name: 'Agent', email: 'agent@osus.com' } // Will be provided by calling component
          if (agent) {
            await sendBookingNotification({
              type: 'booking_reminder',
              booking,
              recipient: agent as User,
              additionalData: { 
                daysUntil: schedule.metadata?.unit === 'days' ? schedule.metadata.amount : 0 
              }
            })
            
            schedule.status = 'sent'
            console.log(`📧 Reminder sent for booking ${booking.id}`)
          }
        } catch (error) {
          schedule.status = 'failed'
          schedule.retryCount++
          console.error(`Failed to send reminder for booking ${booking.id}:`, error)
        }
      }, delay)
    }
  }

  /**
   * Check for optimization opportunities
   */
  private async checkOptimizationOpportunities(booking: BookingRequest): Promise<void> {
    // This would integrate with the existing optimization logic
    // For now, simulate checking for nearby bookings
    console.log(`🔍 Checking optimization opportunities for booking ${booking.id}`)
    
    // Simulate finding nearby bookings (in production, query actual data)
    setTimeout(() => {
      const hasNearbyBookings = Math.random() > 0.7 // 30% chance of nearby bookings
      
      if (hasNearbyBookings) {
        this.sendBatchingOpportunityNotification(booking)
      }
    }, 2000)
  }

  /**
   * Send batching opportunity notification
   */
  private async sendBatchingOpportunityNotification(booking: BookingRequest): Promise<void> {
    const agent = { name: 'Agent', email: 'agent@osus.com' } // Will be provided by calling component
    if (!agent) return

    // Mock nearby bookings
    const nearbyBookings = [
      { ...booking, id: 'nearby-1', property_address: '456 Oak Street, Same City, ST 12345' },
      { ...booking, id: 'nearby-2', property_address: '789 Pine Avenue, Same City, ST 12345' }
    ]

    await sendBookingNotification({
      type: 'batch_opportunity',
      booking,
      recipient: agent as User,
      additionalData: { nearbyBookings }
    })

    console.log(`🚀 Batching opportunity notification sent for booking ${booking.id}`)
  }

  /**
   * Setup follow-up notifications
   */
  private async setupFollowUpNotifications(booking: BookingRequest): Promise<void> {
    const shootDate = new Date(booking.scheduled_date || booking.preferred_date)
    
    // Schedule post-shoot follow-up (1 day after)
    const followUpDate = new Date(shootDate)
    followUpDate.setDate(followUpDate.getDate() + 1)

    const followUpSchedule: NotificationSchedule = {
      id: `${booking.id}-followup`,
      bookingId: booking.id,
      type: 'follow_up',
      scheduledDate: followUpDate,
      status: 'pending',
      retryCount: 0,
      metadata: { type: 'post_shoot_feedback' }
    }

    const existingSchedules = this.schedules.get(booking.id) || []
    existingSchedules.push(followUpSchedule)
    this.schedules.set(booking.id, existingSchedules)

    console.log(`📝 Follow-up notification scheduled for ${followUpDate.toISOString()}`)
  }

  /**
   * Process booking cancellation
   */
  async processBookingCancellation(booking: BookingRequest, reason?: string): Promise<boolean> {
    try {
      // Cancel all scheduled notifications
      const schedules = this.schedules.get(booking.id) || []
      schedules.forEach(schedule => {
        schedule.status = 'cancelled'
      })

      // Send cancellation notification
      const agent = { name: 'Agent', email: 'agent@osus.com' } // Will be provided by calling component
      if (agent) {
        // Create cancellation email template
        await this.sendCancellationNotification(booking, agent as User, reason)
      }

      console.log(`❌ Booking ${booking.id} cancelled - all notifications stopped`)
      return true
    } catch (error) {
      console.error('Failed to process booking cancellation:', error)
      return false
    }
  }

  /**
   * Send cancellation notification
   */
  private async sendCancellationNotification(booking: BookingRequest, recipient: User, reason?: string): Promise<void> {
    // This would use a cancellation email template
    console.log(`📧 Cancellation notification sent to ${recipient.name} for booking ${booking.id}`)
    if (reason) {
      console.log(`Reason: ${reason}`)
    }
  }

  /**
   * Get notification status for a booking
   */
  getNotificationStatus(bookingId: string): NotificationSchedule[] {
    return this.schedules.get(bookingId) || []
  }

  /**
   * Update user notification settings
   */
  updateUserSettings(userId: string, settings: Partial<AutomatedNotificationSettings>): void {
    const currentSettings = this.getUserSettings(userId)
    const updatedSettings = { ...currentSettings, ...settings }
    this.userSettings.set(userId, updatedSettings)
  }

  /**
   * Generate comprehensive notification summary
   */
  generateNotificationSummary(bookingId: string): string {
    const schedules = this.schedules.get(bookingId) || []
    
    if (schedules.length === 0) {
      return 'No notifications scheduled for this booking.'
    }

    const summary = [
      'NOTIFICATION SCHEDULE',
      '='.repeat(25),
      '',
      ...schedules.map(schedule => {
        const status = schedule.status === 'sent' ? '✅' : 
                     schedule.status === 'failed' ? '❌' : 
                     schedule.status === 'cancelled' ? '🚫' : '⏳'
        
        return `${status} ${schedule.type.toUpperCase()} - ${schedule.scheduledDate.toLocaleString()}`
      }),
      '',
      `Total scheduled: ${schedules.length}`,
      `Sent: ${schedules.filter(s => s.status === 'sent').length}`,
      `Pending: ${schedules.filter(s => s.status === 'pending').length}`,
      `Failed: ${schedules.filter(s => s.status === 'failed').length}`
    ].join('\n')

    return summary
  }
}

// Export singleton instance
export const notificationSystem = IntegratedNotificationSystem.getInstance()

/**
 * Convenience functions for common operations
 */

export async function setupBookingNotifications(booking: BookingRequest): Promise<boolean> {
  return await notificationSystem.processBookingApproval(booking)
}

export async function cancelBookingNotifications(booking: BookingRequest, reason?: string): Promise<boolean> {
  return await notificationSystem.processBookingCancellation(booking, reason)
}

export function configureUserNotifications(userId: string, settings: Partial<AutomatedNotificationSettings>): void {
  notificationSystem.updateUserSettings(userId, settings)
}

export function getBookingNotificationStatus(bookingId: string): NotificationSchedule[] {
  return notificationSystem.getNotificationStatus(bookingId)
}

/**
 * Calendar export utilities
 */
export function exportBookingToCalendar(booking: BookingRequest, format: 'ical' | 'google' | 'outlook' = 'ical'): string | void {
  const calendarLinks = generateCalendarLinks(booking)
  
  switch (format) {
    case 'google':
      window.open(calendarLinks.google, '_blank')
      break
    case 'outlook':
      window.open(calendarLinks.outlook, '_blank')
      break
    case 'ical':
    default:
      calendarLinks.download()
      break
  }
}

/**
 * Bulk calendar export
 */
export function exportMultipleBookingsToCalendar(bookings: BookingRequest[], filename?: string): void {
  const approvedBookings = bookings.filter(b => b.status === 'approved' && b.scheduled_date)
  
  if (approvedBookings.length === 0) {
    console.warn('No approved bookings to export')
    return
  }

  // Generate combined iCal content
  const icalEvents = approvedBookings.map(booking => {
    const calendarEvent = createCalendarEventFromBooking(booking)
    return generateICalEvent(calendarEvent)
      .split('\n')
      .filter(line => 
        !line.startsWith('BEGIN:VCALENDAR') && 
        !line.startsWith('END:VCALENDAR') && 
        !line.startsWith('VERSION:') && 
        !line.startsWith('PRODID:') && 
        !line.startsWith('CALSCALE:') && 
        !line.startsWith('METHOD:')
      )
      .join('\n')
  })

  const fullCalendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VideoPro//Real Estate Videography Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...icalEvents,
    'END:VCALENDAR'
  ].join('\r\n')

  // Download file
  const blob = new Blob([fullCalendar], { type: 'text/calendar;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename || `videography-schedule-${new Date().toISOString().split('T')[0]}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  window.URL.revokeObjectURL(url)
  
  console.log(`📅 Exported ${approvedBookings.length} bookings to calendar file`)
}