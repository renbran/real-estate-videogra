import { BookingRequest, User } from './types'
import { formatDate, formatTime } from './date-utils'

export interface NotificationPayload {
  title: string
  body: string
  badge?: string
  data?: any
  icon?: string
  image?: string
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
  tag?: string
  silent?: boolean
  badge?: string
}

export type PushNotificationType =
  | 'booking_approved'
  | 'booking_declined'
  | 'booking_pending'
  | 'booking_reminder_24h'
  | 'booking_reminder_2h'
  | 'schedule_change'
  | 'cancellation'
  | 'batch_optimization'
  | 'urgent_approval'
  | 'capacity_warning'
  | 'route_optimization'
  | 'emergency_booking'
  | 'general_update'

/**
 * Service for handling push notifications in the VideoPro app
 */
export class PushNotificationService {
  private static instance: PushNotificationService | null = null
  private subscription: PushSubscription | null = null
  private isPermissionGranted: boolean = false
  private registration: ServiceWorkerRegistration | null = null

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
  private checkSupport(): boolean {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported')
      return false
    }
    return true
  }

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<boolean> {
    if (!this.checkSupport()) {
      return false
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', this.registration)

      // Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.warn('Push notification permission denied')
        return false
      }

      this.isPermissionGranted = true
      await this.subscribeToNotifications()
      return true
    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
      return false
    }
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToNotifications(): Promise<void> {
    if (!this.registration) {
      throw new Error('Cannot subscribe without service worker registration')
    }

    try {
      const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY_HERE' // Replace with actual key
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      })

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription)
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
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
    // In production, you would send this to your backend server
    console.log('Subscription to send to server:', subscription)
    
    // Store locally for demo purposes
    localStorage.setItem('push-subscription', JSON.stringify(subscription))
  }

  /**
   * Show a notification
   */
  async showNotification(
    type: PushNotificationType,
    booking: BookingRequest,
    user: User,
    options: PushNotificationOptions = {}
  ): Promise<void> {
    if (!this.isPermissionGranted) {
      console.warn('Push notification permission not granted')
      return
    }

    const payload = this.createNotificationPayload(type, booking, user)

    if (this.registration) {
      // Show via service worker (persistent notification)
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        badge: payload.badge,
        icon: payload.icon,
        tag: payload.tag || options.tag,
        data: payload.data,
        requireInteraction: payload.requireInteraction,
        silent: payload.silent || options.silent
      })
    } else {
      // Fallback to basic notification
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon,
        tag: payload.tag || options.tag
      })
    }
  }

  /**
   * Create notification payload based on type
   */
  private createNotificationPayload(
    type: PushNotificationType,
    booking: BookingRequest,
    user: User
  ): NotificationPayload {
    const shootTime = `${formatDate(booking.preferred_date)} at ${booking.scheduled_time ? formatTime(booking.scheduled_time) : 'TBD'}`
    const baseActions: NotificationAction[] = [
      { action: 'view', title: 'View Details', icon: '/icons/view.png' }
    ]

    switch (type) {
      case 'booking_approved':
        return {
          title: '✅ Booking Confirmed',
          body: `Your ${booking.shoot_category} shoot is confirmed for ${shootTime}`,
          icon: '/icons/approved.png',
          tag: `booking_${booking.id}`,
          data: { bookingId: booking.id, type, userId: user.id },
          requireInteraction: true,
          actions: [
            ...baseActions,
            { action: 'directions', title: 'Get Directions', icon: '/icons/directions.png' }
          ]
        }

      case 'booking_declined':
        return {
          title: '❌ Booking Declined',
          body: `Your ${booking.shoot_category} shoot request was declined. Tap to rebook.`,
          icon: '/icons/declined.png',
          tag: `booking_${booking.id}`,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            ...baseActions,
            { action: 'rebook', title: 'Book Again', icon: '/icons/rebook.png' }
          ]
        }

      case 'booking_pending':
        return {
          title: '⏳ Booking Pending',
          body: `Your ${booking.shoot_category} shoot request is being reviewed`,
          icon: '/icons/pending.png',
          tag: `booking_${booking.id}`,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: baseActions
        }

      case 'booking_reminder_24h':
        return {
          title: '📅 Shoot Tomorrow',
          body: `Your ${booking.shoot_category} shoot is scheduled for tomorrow at ${booking.scheduled_time ? formatTime(booking.scheduled_time) : 'TBD'}`,
          icon: '/icons/reminder.png',
          tag: `reminder_${booking.id}`,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            ...baseActions,
            { action: 'directions', title: 'Get Directions', icon: '/icons/directions.png' }
          ]
        }

      case 'booking_reminder_2h':
        return {
          title: '🎬 Shoot Starting Soon',
          body: `Your ${booking.shoot_category} shoot starts in 2 hours`,
          icon: '/icons/reminder.png',
          tag: `reminder_${booking.id}`,
          requireInteraction: true,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            ...baseActions,
            { action: 'directions', title: 'Get Directions', icon: '/icons/directions.png' }
          ]
        }

      case 'schedule_change':
        return {
          title: '📝 Schedule Updated',
          body: `Your ${booking.shoot_category} shoot has been rescheduled to ${shootTime}`,
          icon: '/icons/schedule.png',
          tag: `schedule_${booking.id}`,
          requireInteraction: true,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            ...baseActions,
            { action: 'approve', title: 'Accept Changes', icon: '/icons/approve.png' },
            { action: 'decline', title: 'Request Different Time', icon: '/icons/decline.png' }
          ]
        }

      case 'cancellation':
        return {
          title: '🚫 Booking Cancelled',
          body: `Your ${booking.shoot_category} shoot has been cancelled`,
          icon: '/icons/cancelled.png',
          tag: `cancel_${booking.id}`,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            ...baseActions,
            { action: 'rebook', title: 'Book Again', icon: '/icons/rebook.png' }
          ]
        }

      case 'batch_optimization':
        return {
          title: '🎯 Batch Opportunity',
          body: `We can batch your shoot with others nearby for a discount`,
          icon: '/icons/batch.png',
          tag: `batch_${booking.id}`,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            ...baseActions,
            { action: 'accept', title: 'Accept Batch', icon: '/icons/accept.png' }
          ]
        }

      case 'urgent_approval':
        return {
          title: '🚨 Urgent Approval',
          body: `High-priority ${booking.shoot_category} shoot request needs approval`,
          icon: '/icons/urgent.png',
          tag: `urgent_${booking.id}`,
          requireInteraction: true,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            { action: 'approve', title: 'Approve', icon: '/icons/approve.png' },
            { action: 'decline', title: 'Decline', icon: '/icons/decline.png' }
          ]
        }

      case 'capacity_warning':
        return {
          title: '⚠️ Capacity Alert',
          body: `Multiple shoots scheduled in your area. Consider optimization.`,
          icon: '/icons/capacity-warning.png',
          tag: 'capacity_warning',
          data: { bookingId: booking.id, type, userId: user.id },
          actions: baseActions
        }

      case 'route_optimization':
        return {
          title: '🗺️ Route Optimized',
          body: `2 other shoots scheduled in your area on ${formatDate(booking.preferred_date)}`,
          icon: '/icons/route.png',
          tag: `route_${booking.id}`,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            ...baseActions,
            { action: 'join', title: 'Join Route', icon: '/icons/join.png' }
          ]
        }

      case 'emergency_booking':
        return {
          title: '🚨 Emergency Booking',
          body: `Emergency ${booking.shoot_category} shoot request - immediate response needed`,
          icon: '/icons/emergency.png',
          tag: `emergency_${booking.id}`,
          requireInteraction: true,
          data: { bookingId: booking.id, type, userId: user.id },
          actions: [
            { action: 'accept', title: 'Accept Emergency', icon: '/icons/accept.png' },
            { action: 'decline', title: 'Decline', icon: '/icons/decline.png' }
          ]
        }

      case 'general_update':
      default:
        return {
          title: '📢 VideoPro Update',
          body: `Update for your ${booking.shoot_category} shoot`,
          icon: '/icons/update.png',
          tag: 'general_update',
          data: { bookingId: booking.id, type, userId: user.id },
          actions: baseActions
        }
    }
  }

  /**
   * Schedule automated notifications for a booking
   */
  async scheduleAutomatedNotifications(booking: BookingRequest, user: User): Promise<void> {
    const shootDate = new Date(`${booking.preferred_date}T${booking.scheduled_time || '09:00'}`)
    const now = new Date()

    // 24-hour reminder
    const reminder24h = new Date(shootDate.getTime() - 24 * 60 * 60 * 1000)
    if (reminder24h > now) {
      this.scheduleDelayedNotification('booking_reminder_24h', booking, user, reminder24h)
    }

    // 2-hour reminder
    const reminder2h = new Date(shootDate.getTime() - 2 * 60 * 60 * 1000)
    if (reminder2h > now) {
      this.scheduleDelayedNotification('booking_reminder_2h', booking, user, reminder2h)
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
        this.showNotification(type, booking, user)
      }, delay)
    }
  }

  /**
   * Handle notification clicks
   */
  handleNotificationClick(action: string, bookingId: string): void {
    switch (action) {
      case 'view':
        this.openBookingDetails(bookingId)
        break
      case 'approve':
        this.quickApprove(bookingId)
        break
      case 'decline':
        this.quickDecline(bookingId)
        break
      case 'directions':
        this.openDirections(bookingId)
        break
      case 'rebook':
        this.openRebookFlow(bookingId)
        break
      case 'accept':
        this.acceptOffer(bookingId)
        break
      default:
        this.openBookingDetails(bookingId)
    }
  }

  private openBookingDetails(bookingId: string): void {
    window.open(`/booking/${bookingId}`, '_blank')
  }

  private quickApprove(bookingId: string): void {
    console.log('Quick approving:', bookingId)
    // Implementation would call approval API
  }

  private quickDecline(bookingId: string): void {
    console.log('Quick declining:', bookingId)
    // Implementation would call decline API
  }

  private openDirections(bookingId: string): void {
    console.log('Opening directions for:', bookingId)
    // Implementation would open maps with booking location
  }

  private openRebookFlow(bookingId: string): void {
    window.open(`/rebook/${bookingId}`, '_blank')
  }

  private acceptOffer(bookingId: string): void {
    console.log('Accepting offer:', bookingId)
    // Implementation would call accept API
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<void> {
    if (this.subscription) {
      await this.subscription.unsubscribe()
      this.subscription = null
      localStorage.removeItem('push-subscription')
    }
  }

  /**
   * Get notification status
   */
  getStatus() {
    const isSupported = this.checkSupport()
    const permission = 'Notification' in window ? Notification.permission : 'default'

    return {
      isSupported,
      isPermissionGranted: this.isPermissionGranted,
      permission,
      hasSubscription: !!this.subscription,
      isSubscribed: !!this.subscription // Alias for backward compatibility
    }
  }

  /**
   * Get notification settings (alias for getStatus for backward compatibility)
   */
  getNotificationSettings() {
    return {
      isSupported: this.checkSupport(),
      isPermissionGranted: this.isPermissionGranted,
      isSubscribed: !!this.subscription
    }
  }
}

/**
 * Utility functions for notification customization
 */
export class NotificationUtils {
  /**
   * Get vibration pattern based on notification type
   */
  static getVibrationPattern(type: PushNotificationType): number[] {
    switch (type) {
      case 'urgent_approval':
      case 'emergency_booking':
        return [200, 100, 200, 100, 200] // Urgent pattern
      
      case 'booking_reminder_2h':
        return [100, 50, 100] // Gentle reminder
      
      default:
        return [200] // Single vibration
    }
  }

  /**
   * Get notification priority
   */
  static getPriority(type: PushNotificationType): 'high' | 'normal' | 'low' {
    const highPriority: PushNotificationType[] = [
      'urgent_approval',
      'emergency_booking',
      'cancellation'
    ]
    
    const lowPriority: PushNotificationType[] = [
      'batch_optimization',
      'route_optimization',
      'general_update'
    ]

    if (highPriority.includes(type)) return 'high'
    if (lowPriority.includes(type)) return 'low'
    return 'normal'
  }

  /**
   * Check if notification should be persistent
   */
  static shouldRequireInteraction(type: PushNotificationType): boolean {
    const persistentTypes: PushNotificationType[] = [
      'booking_approved',
      'schedule_change',
      'urgent_approval',
      'emergency_booking',
      'booking_reminder_2h'
    ]
    return persistentTypes.includes(type)
  }
}

// Export singleton instance for easy access
export const pushNotificationService = PushNotificationService.getInstance()