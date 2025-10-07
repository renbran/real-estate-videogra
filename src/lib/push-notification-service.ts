import { BookingRequest, User } from './types'
import { formatDate, formatTime } from './date-utils'

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: any
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  timestamp?: number
  actions?: NotificationAction[]
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface PushNotificationOptions {
  urgent?: boolean
  silent?: boolean
  vibrate?: number[]
  sound?: string
  category?: string
  tag?: string
}

export type PushNotificationType = 
  | 'booking_approved'
  | 'booking_declined' 
  | 'booking_pending_approval'
  | 'booking_reminder_24h'
  | 'booking_reminder_2h'
  | 'booking_reminder_30min'
  | 'schedule_change'
  | 'cancellation'
  | 'optimization_opportunity'
  | 'urgent_approval_needed'
  | 'capacity_alert'
  | 'batch_opportunity'
  | 'route_optimization'
  | 'emergency_booking'

/**
 * Mobile Push Notification Service for VideoPro
 * Handles time-sensitive booking updates and system notifications
 */
export class PushNotificationService {
  private static instance: PushNotificationService
  private registration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null
  private isSupported: boolean = false
  private isPermissionGranted: boolean = false

  private constructor() {
    this.checkSupport()
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService()
    }
    return PushNotificationService.instance
  }

  /**
   * Check if push notifications are supported
   */
  private checkSupport(): void {
    this.isSupported = 'serviceWorker' in navigator && 
                     'PushManager' in window && 
                     'Notification' in window
  }

  /**
   * Initialize push notification service
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Push notifications not supported in this browser')
      return false
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', this.registration)

      // Request permission
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        console.warn('Push notification permission denied')
        return false
      }

      // Subscribe to push notifications
      await this.subscribe()
      return true
    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
      return false
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied'
    }

    const permission = await Notification.requestPermission()
    this.isPermissionGranted = permission === 'granted'
    return permission
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribe(): Promise<void> {
    if (!this.registration || !this.isPermissionGranted) {
      throw new Error('Cannot subscribe: service worker not registered or permission denied')
    }

    // For demo purposes, skip VAPID key subscription
    // In production, you would implement proper VAPID key handling
    console.log('Push notifications enabled (demo mode)')
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    // In a real implementation, send to your backend server
    console.log('Subscription to send to server:', JSON.stringify(subscription))
    
    // Store locally for demo purposes
    localStorage.setItem('push-subscription', JSON.stringify(subscription))
  }

  /**
   * Create and display a local notification
   */
  async showNotification(
    type: PushNotificationType,
    booking: BookingRequest,
    user: User,
    options: PushNotificationOptions = {}
  ): Promise<void> {
    if (!this.isPermissionGranted) {
      console.warn('Cannot show notification: permission not granted')
      return
    }

    const payload = this.generateNotificationPayload(type, booking, user, options)
    
    if (this.registration) {
      // Show via service worker (persistent)
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        data: payload.data,
        tag: payload.tag || `booking-${booking.id}`,
        requireInteraction: payload.requireInteraction || options.urgent,
        silent: payload.silent || options.silent
      })
    } else {
      // Fallback to basic notification
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        tag: payload.tag || `booking-${booking.id}`,
        requireInteraction: payload.requireInteraction || options.urgent,
        silent: payload.silent || options.silent,
        data: payload.data
      })

      // Auto-close non-urgent notifications after 5 seconds
      if (!options.urgent) {
        setTimeout(() => notification.close(), 5000)
      }
    }
  }

  /**
   * Generate notification payload based on type
   */
  private generateNotificationPayload(
    type: PushNotificationType,
    booking: BookingRequest,
    user: User,
    options: PushNotificationOptions
  ): PushNotificationPayload {
    const shootDate = formatDate(booking.scheduled_date || booking.preferred_date)
    const shootTime = booking.scheduled_time ? formatTime(booking.scheduled_time) : ''
    const location = booking.formatted_address || booking.location
    
    const baseActions: NotificationAction[] = [
      { action: 'view', title: 'View Details', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
    ]

    switch (type) {
      case 'booking_approved':
        return {
          title: '✅ Booking Approved!',
          body: `Your ${booking.shoot_category} shoot for ${shootDate} has been confirmed at ${location}`,
          icon: '/icons/approved.png',
          requireInteraction: true,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            { action: 'view', title: 'View Details', icon: '/icons/view.png' },
            { action: 'calendar', title: 'Add to Calendar', icon: '/icons/calendar.png' }
          ]
        }

      case 'booking_declined':
        return {
          title: '❌ Booking Declined',
          body: `Your ${booking.shoot_category} shoot request for ${shootDate} was declined. ${booking.manager_notes || 'Please try alternative dates.'}`,
          icon: '/icons/declined.png',
          requireInteraction: true,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            { action: 'view', title: 'View Details', icon: '/icons/view.png' },
            { action: 'rebook', title: 'Book Again', icon: '/icons/rebook.png' }
          ]
        }

      case 'booking_pending_approval':
        return {
          title: '⏳ Booking Pending Review',
          body: `Your ${booking.shoot_category} shoot request for ${shootDate} is awaiting manager approval`,
          icon: '/icons/pending.png',
          data: { bookingId: booking.id, type, userId: user.id },
          actions: baseActions
        }

      case 'booking_reminder_24h':
        return {
          title: '📅 Shoot Tomorrow',
          body: `Reminder: ${booking.shoot_category} shoot tomorrow at ${shootTime || 'TBD'} - ${location}`,
          icon: '/icons/reminder.png',
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            { action: 'view', title: 'View Details', icon: '/icons/view.png' },
            { action: 'directions', title: 'Get Directions', icon: '/icons/directions.png' }
          ]
        }

      case 'booking_reminder_2h':
        return {
          title: '🎬 Shoot in 2 Hours',
          body: `${booking.shoot_category} shoot at ${shootTime} - ${location}. Please arrive 10 minutes early.`,
          icon: '/icons/reminder-urgent.png',
          requireInteraction: true,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            { action: 'directions', title: 'Get Directions', icon: '/icons/directions.png' },
            { action: 'contact', title: 'Contact Videographer', icon: '/icons/contact.png' }
          ]
        }

      case 'booking_reminder_30min':
        return {
          title: '🚨 Shoot Starting Soon!',
          body: `Your ${booking.shoot_category} shoot starts in 30 minutes at ${location}`,
          icon: '/icons/urgent.png',
          requireInteraction: true,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            { action: 'directions', title: 'Get Directions', icon: '/icons/directions.png' },
            { action: 'checklist', title: 'Pre-Shoot Checklist', icon: '/icons/checklist.png' }
          ]
        }

      case 'schedule_change':
        return {
          title: '📝 Schedule Updated',
          body: `Your ${booking.shoot_category} shoot has been rescheduled to ${shootDate} at ${shootTime || 'TBD'}`,
          icon: '/icons/schedule-change.png',
          requireInteraction: true,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            { action: 'view', title: 'View Changes', icon: '/icons/view.png' },
            { action: 'accept', title: 'Accept', icon: '/icons/accept.png' },
            { action: 'decline', title: 'Request Different Time', icon: '/icons/decline.png' }
          ]
        }

      case 'cancellation':
        return {
          title: '🚫 Booking Cancelled',
          body: `Your ${booking.shoot_category} shoot for ${shootDate} has been cancelled. ${booking.manager_notes || ''}`,
          icon: '/icons/cancelled.png',
          requireInteraction: true,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            { action: 'view', title: 'View Details', icon: '/icons/view.png' },
            { action: 'rebook', title: 'Book Again', icon: '/icons/rebook.png' }
          ]
        }

      case 'optimization_opportunity':
        return {
          title: '🚀 Optimization Opportunity',
          body: `We can batch your ${booking.shoot_category} shoot with 2 others in the same area on ${shootDate}. Faster service!`,
          icon: '/icons/optimization.png',
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            { action: 'accept', title: 'Accept Optimization', icon: '/icons/accept.png' },
            { action: 'decline', title: 'Keep Original', icon: '/icons/decline.png' }
          ]
        }

      case 'urgent_approval_needed':
        return {
          title: '🚨 Urgent: Approval Needed',
          body: `High-priority ${booking.shoot_category} shoot request requires immediate manager review`,
          icon: '/icons/urgent-approval.png',
          requireInteraction: true,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            { action: 'approve', title: 'Quick Approve', icon: '/icons/approve.png' },
            { action: 'view', title: 'Review Details', icon: '/icons/view.png' }
          ]
        }

      case 'capacity_alert':
        return {
          title: '⚠️ Capacity Alert',
          body: `${shootDate} is at 90% capacity. Consider booking alternative dates for faster approval.`,
          icon: '/icons/capacity-warning.png',
          data: { bookingId: booking.id, type, userId: user.id },
          actions: baseActions
        }

      case 'batch_opportunity':
        return {
          title: '📍 Batching Opportunity',
          body: `2 other shoots scheduled in your area on ${shootDate}. Consider joining for optimized scheduling!`,
          icon: '/icons/batch.png',
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            { action: 'join', title: 'Join Batch', icon: '/icons/join.png' },
            { action: 'view', title: 'View Details', icon: '/icons/view.png' }
          ]
        }

      case 'route_optimization':
        return {
          title: '🗺️ Route Optimized',
          body: `Your shoot schedule has been optimized. Total travel time reduced by 45 minutes!`,
          icon: '/icons/route.png',
          data: { bookingId: booking.id, type, userId: user.id },
          actions: baseActions
        }

      case 'emergency_booking':
        return {
          title: '🚨 Emergency Booking',
          body: `Urgent ${booking.shoot_category} shoot request needs immediate attention - same day service required`,
          icon: '/icons/emergency.png',
          requireInteraction: true,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            { action: 'accept', title: 'Accept Emergency', icon: '/icons/accept.png' },
            { action: 'view', title: 'View Details', icon: '/icons/view.png' }
          ]
        }

      default:
        return {
          title: 'VideoPro Update',
          body: `Update for your ${booking.shoot_category} shoot`,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: baseActions
        }
    }
  }

  /**
   * Schedule automated notifications
   */
  async scheduleAutomatedNotifications(booking: BookingRequest, user: User): Promise<void> {
    if (!booking.scheduled_date) return

    const shootDate = new Date(booking.scheduled_date)
    const now = new Date()

    // Schedule 24-hour reminder
    const reminder24h = new Date(shootDate.getTime() - 24 * 60 * 60 * 1000)
    if (reminder24h > now) {
      this.scheduleDelayedNotification('booking_reminder_24h', booking, user, reminder24h)
    }

    // Schedule 2-hour reminder
    const reminder2h = new Date(shootDate.getTime() - 2 * 60 * 60 * 1000)
    if (reminder2h > now) {
      this.scheduleDelayedNotification('booking_reminder_2h', booking, user, reminder2h)
    }

    // Schedule 30-minute reminder
    const reminder30min = new Date(shootDate.getTime() - 30 * 60 * 1000)
    if (reminder30min > now) {
      this.scheduleDelayedNotification('booking_reminder_30min', booking, user, reminder30min)
    }
  }

  /**
   * Schedule a delayed notification
   */
  private scheduleDelayedNotification(
    type: PushNotificationType,
    booking: BookingRequest,
    user: User,
    scheduledTime: Date
  ): void {
    const delay = scheduledTime.getTime() - Date.now()
    
    if (delay > 0) {
      setTimeout(() => {
        this.showNotification(type, booking, user, { urgent: type.includes('30min') })
      }, delay)
    }
  }

  /**
   * Handle notification clicks
   */
  handleNotificationClick(data: any): void {
    const { bookingId, type, action } = data

    switch (action) {
      case 'view':
        window.open(`/#/booking/${bookingId}`, '_blank')
        break
      case 'calendar':
        this.addToCalendar(bookingId)
        break
      case 'directions':
        this.openDirections(bookingId)
        break
      case 'approve':
        this.quickApprove(bookingId)
        break
      case 'decline':
        this.quickDecline(bookingId)
        break
      case 'accept':
        this.acceptOptimization(bookingId)
        break
      case 'rebook':
        window.open('/#/booking/new', '_blank')
        break
      default:
        window.open('/#/dashboard', '_blank')
    }
  }

  /**
   * Helper methods for notification actions
   */
  private addToCalendar(bookingId: string): void {
    // Implementation would integrate with calendar system
    console.log('Adding to calendar:', bookingId)
  }

  private openDirections(bookingId: string): void {
    // Implementation would open Google Maps with directions
    console.log('Opening directions for:', bookingId)
  }

  private quickApprove(bookingId: string): void {
    // Implementation would call approval API
    console.log('Quick approving:', bookingId)
  }

  private quickDecline(bookingId: string): void {
    // Implementation would call decline API
    console.log('Quick declining:', bookingId)
  }

  private acceptOptimization(bookingId: string): void {
    // Implementation would accept optimization suggestion
    console.log('Accepting optimization for:', bookingId)
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<void> {
    if (this.subscription) {
      await this.subscription.unsubscribe()
      this.subscription = null
    }
  }

  /**
   * Get notification settings
   */
  getNotificationSettings(): {
    isSupported: boolean
    isPermissionGranted: boolean
    isSubscribed: boolean
  } {
    return {
      isSupported: this.isSupported,
      isPermissionGranted: this.isPermissionGranted,
      isSubscribed: !!this.subscription
    }
  }
}

/**
 * Utility functions for push notifications
 */
export const pushNotificationUtils = {
  /**
   * Create vibration patterns for different notification types
   */
  getVibrationPattern(type: PushNotificationType): number[] {
    switch (type) {
      case 'booking_reminder_30min':
      case 'urgent_approval_needed':
      case 'emergency_booking':
        return [200, 100, 200, 100, 200] // Urgent pattern
      case 'booking_approved':
      case 'booking_declined':
        return [300, 200, 300] // Important pattern
      case 'booking_reminder_24h':
      case 'booking_reminder_2h':
        return [200, 100, 200] // Standard reminder
      default:
        return [200] // Single vibration
    }
  },

  /**
   * Get notification priority level
   */
  getPriority(type: PushNotificationType): 'low' | 'normal' | 'high' {
    const highPriority: PushNotificationType[] = [
      'booking_reminder_30min',
      'urgent_approval_needed',
      'emergency_booking',
      'cancellation'
    ]
    
    const normalPriority: PushNotificationType[] = [
      'booking_approved',
      'booking_declined',
      'schedule_change',
      'booking_reminder_2h'
    ]

    if (highPriority.includes(type)) return 'high'
    if (normalPriority.includes(type)) return 'normal'
    return 'low'
  },

  /**
   * Check if notification should be persistent
   */
  shouldRequireInteraction(type: PushNotificationType): boolean {
    const persistentTypes: PushNotificationType[] = [
      'booking_approved',
      'booking_declined',
      'schedule_change',
      'cancellation',
      'urgent_approval_needed',
      'emergency_booking',
      'booking_reminder_2h',
      'booking_reminder_30min'
    ]
    
    return persistentTypes.includes(type)
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance()