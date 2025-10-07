// VideoPro Service Worker for Push Notifications
const CACHE_NAME = 'videopro-v1'
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Install service worker and cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
  )
})

// Serve cached content when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      }
    )
  )
})

// Handle push notifications
self.addEventListener('push', event => {
  console.log('Push notification received:', event)
  
  const options = {
    body: 'You have a new VideoPro update!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      options.title = payload.title || 'VideoPro Update'
      options.body = payload.body || 'You have a new update!'
      options.icon = payload.icon || '/icons/icon-192x192.png'
      options.data = payload.data || options.data
      options.tag = payload.tag || 'videopro-notification'
      options.requireInteraction = payload.requireInteraction || false
      
      if (payload.actions) {
        options.actions = payload.actions
      }
    } catch (error) {
      console.error('Error parsing push notification payload:', error)
    }
  }

  event.waitUntil(
    self.registration.showNotification('VideoPro', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Notification click received:', event)

  event.notification.close()

  const action = event.action
  const data = event.notification.data || {}

  let url = '/'

  // Handle different notification actions
  switch (action) {
    case 'explore':
    case 'view':
      url = data.bookingId ? `/#/booking/${data.bookingId}` : '/#/dashboard'
      break
    case 'approve':
      url = data.bookingId ? `/#/manager/approve/${data.bookingId}` : '/#/manager'
      break
    case 'calendar':
      // Open calendar application or booking details
      url = data.bookingId ? `/#/booking/${data.bookingId}/calendar` : '/#/calendar'
      break
    case 'directions':
      // Open directions in maps
      if (data.coordinates) {
        url = `https://www.google.com/maps/dir/?api=1&destination=${data.coordinates.lat},${data.coordinates.lng}`
      } else {
        url = '/#/dashboard'
      }
      break
    case 'contact':
      url = data.videographerId ? `/#/contact/${data.videographerId}` : '/#/contact'
      break
    case 'checklist':
      url = data.bookingId ? `/#/booking/${data.bookingId}/checklist` : '/#/checklist'
      break
    case 'accept':
      // Handle acceptance of optimization or schedule changes
      url = data.bookingId ? `/#/booking/${data.bookingId}/accept` : '/#/dashboard'
      break
    case 'decline':
      url = data.bookingId ? `/#/booking/${data.bookingId}/decline` : '/#/dashboard'
      break
    case 'rebook':
      url = '/#/booking/new'
      break
    case 'join':
      // Join batch booking
      url = data.batchId ? `/#/batch/${data.batchId}/join` : '/#/dashboard'
      break
    case 'close':
    case 'dismiss':
      // Just close the notification, don't open anything
      return
    default:
      // Default action - open dashboard or specific booking
      url = data.bookingId ? `/#/booking/${data.bookingId}` : '/#/dashboard'
  }

  // Open the URL
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Check if there's already a window/tab open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Handle notification close events
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event)
  
  // Track notification dismissal for analytics
  const data = event.notification.data || {}
  if (data.bookingId) {
    // Could send analytics data to server
    console.log('Notification dismissed for booking:', data.bookingId)
  }
})

// Handle background sync for offline notifications
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync-notifications') {
    event.waitUntil(
      // Sync pending notifications when connection is restored
      syncPendingNotifications()
    )
  }
})

// Function to sync pending notifications
async function syncPendingNotifications() {
  try {
    // Get pending notifications from storage
    const cache = await caches.open(CACHE_NAME)
    const pendingNotifications = await getStoredNotifications()
    
    for (const notification of pendingNotifications) {
      await self.registration.showNotification(
        notification.title,
        notification.options
      )
    }
    
    // Clear pending notifications after successful sync
    await clearStoredNotifications()
    
  } catch (error) {
    console.error('Error syncing pending notifications:', error)
  }
}

// Helper functions for notification storage
async function getStoredNotifications() {
  try {
    const response = await caches.match('/api/pending-notifications')
    if (response) {
      return await response.json()
    }
  } catch (error) {
    console.error('Error getting stored notifications:', error)
  }
  return []
}

async function clearStoredNotifications() {
  try {
    const cache = await caches.open(CACHE_NAME)
    await cache.delete('/api/pending-notifications')
  } catch (error) {
    console.error('Error clearing stored notifications:', error)
  }
}

// Handle message events from the main thread
self.addEventListener('message', event => {
  console.log('Service worker received message:', event.data)
  
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    case 'SCHEDULE_NOTIFICATION':
      scheduleDelayedNotification(data)
      break
    case 'CANCEL_NOTIFICATION':
      cancelScheduledNotification(data.notificationId)
      break
    default:
      console.log('Unknown message type:', type)
  }
})

// Schedule delayed notifications
function scheduleDelayedNotification(notificationData) {
  const { title, options, delay } = notificationData
  
  setTimeout(() => {
    self.registration.showNotification(title, options)
  }, delay)
}

// Cancel scheduled notifications
function cancelScheduledNotification(notificationId) {
  // In a real implementation, you would track scheduled notifications
  // and be able to cancel them by ID
  console.log('Cancelling notification:', notificationId)
}

// Activate service worker and claim clients
self.addEventListener('activate', event => {
  console.log('Service worker activated')
  
  event.waitUntil(
    // Clean up old caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
          return null
        }).filter(Boolean)
      )
    }).then(() => {
      // Take control of all clients
      return self.clients.claim()
    })
  )
})