// Production configuration for OSUS Videography Booking System

const env = import.meta.env as Record<string, string | undefined>

const MODE = env.MODE ?? env.VITE_NODE_ENV ?? 'development'
const bool = (value: string | undefined, fallback = false) => {
  if (!value) return fallback
  switch (value.toLowerCase()) {
    case 'true':
    case '1':
    case 'yes':
    case 'on':
      return true
    case 'false':
    case '0':
    case 'no':
    case 'off':
      return false
    default:
      return fallback
  }
}

const apiBaseUrl = env.VITE_API_URL ?? env.REACT_APP_API_URL ?? '/api'
const apiKey = env.VITE_API_KEY ?? env.REACT_APP_API_KEY
const useProductionAPIFlag = bool(env.VITE_USE_PRODUCTION_API ?? env.REACT_APP_USE_PRODUCTION_API, MODE === 'production')
const mapsApiKey = env.VITE_GOOGLE_MAPS_API_KEY ?? env.REACT_APP_GOOGLE_MAPS_API_KEY ?? 'AIzaSyDNJ-Jl4d4KFTxTJP_g5WW3_K9pL9tOq0g'
const emailServiceUrl = env.VITE_EMAIL_SERVICE_URL ?? env.REACT_APP_EMAIL_SERVICE_URL
const emailApiKey = env.VITE_EMAIL_API_KEY ?? env.REACT_APP_EMAIL_API_KEY
const vapidPublicKey = env.VITE_VAPID_PUBLIC_KEY ?? env.REACT_APP_VAPID_PUBLIC_KEY

export const config = {
  // Environment
  isDevelopment: MODE === 'development',
  isProduction: MODE === 'production',
  
  // API Configuration
  api: {
    baseUrl: apiBaseUrl,
    key: apiKey,
    timeout: 30000, // 30 seconds
    useProductionAPI: useProductionAPIFlag
  },
  
  // Google Maps Configuration
  maps: {
    apiKey: mapsApiKey,
    defaultLocation: {
      lat: 34.0522, // Los Angeles, CA
      lng: -118.2437
    },
    defaultZoom: 10
  },
  
  // Application Settings
  app: {
    name: 'OSUS Videography Booking System',
    version: '2.0.0',
    description: 'Professional videography booking and management system for real estate professionals',
    companyName: 'OSUS',
    supportEmail: 'support@osus.com',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime']
  },
  
  // Business Rules
  booking: {
    maxAdvanceDays: 90, // Maximum days in advance to book
    minAdvanceHours: 24, // Minimum hours in advance to book
    maxBackupDates: 3,
    autoApprovalThreshold: 80, // Priority score for auto-approval
    managerReviewThreshold: 60, // Priority score for manager review
    defaultDuration: {
      quick: 60,    // minutes
      standard: 90,
      complex: 120
    }
  },
  
  // Notification Settings
  notifications: {
    email: {
      enabled: true,
      serviceUrl: emailServiceUrl,
      apiKey: emailApiKey,
      fromAddress: 'noreply@osus.com',
      fromName: 'OSUS Videography'
    },
    push: {
      enabled: true,
      vapidPublicKey: vapidPublicKey,
      showBrowserPrompt: true
    }
  },
  
  // Security Settings
  security: {
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
    passwordMinLength: 8,
    requireStrongPassword: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutes
  },
  
  // Feature Flags
  features: {
    enableAIInsights: true,
    enableSmartSuggestions: true,
    enableCalendarSync: true,
    enablePushNotifications: true,
    enableAdvancedAnalytics: true,
    enableGoogleMapsIntegration: true,
    enableAutomaticScheduling: true
  },
  
  // Performance Settings
  performance: {
    debounceDelay: 300, // milliseconds
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    maxConcurrentRequests: 10,
    enableOfflineMode: false // Future feature
  }
}

// Validation function for production readiness
export function validateProductionConfig(): { isReady: boolean; issues: string[] } {
  const issues: string[] = []
  
  if (config.isProduction) {
    if (!config.api.key && config.api.useProductionAPI) {
      issues.push('API key is required for production')
    }
    
    if (!config.maps.apiKey || config.maps.apiKey === 'AIzaSyDNJ-Jl4d4KFTxTJP_g5WW3_K9pL9tOq0g') {
      issues.push('Production Google Maps API key is required')
    }
    
    if (!config.notifications.email.serviceUrl && config.notifications.email.enabled) {
      issues.push('Email service configuration is required')
    }
    
    if (!config.app.supportEmail.includes('@')) {
      issues.push('Valid support email is required')
    }
  }
  
  return {
    isReady: issues.length === 0,
    issues
  }
}

export default config