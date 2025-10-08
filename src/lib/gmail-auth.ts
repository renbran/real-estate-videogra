// Gmail OAuth Authentication Service
// This handles Google OAuth integration for easy Gmail signup

export interface GoogleUser {
  id: string
  email: string
  name: string
  given_name: string
  family_name: string
  picture: string
  verified_email: boolean
}

export interface GoogleAuthService {
  initializeGoogleAuth: () => Promise<void>
  signInWithGoogle: () => Promise<GoogleUser | null>
  isGoogleAuthReady: () => boolean
}

// Mock Google Auth Service for development
class MockGoogleAuthService implements GoogleAuthService {
  private isReady = false

  async initializeGoogleAuth(): Promise<void> {
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    this.isReady = true
    console.log('🔧 Mock Google Auth initialized for development')
  }

  isGoogleAuthReady(): boolean {
    return this.isReady
  }

  async signInWithGoogle(): Promise<GoogleUser | null> {
    // Simulate OAuth flow delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock successful Google authentication
    const mockUser: GoogleUser = {
      id: `google_${Math.random().toString(36).substr(2, 9)}`,
      email: `gmail.user.${Math.floor(Math.random() * 1000)}@gmail.com`,
      name: 'Gmail Test User',
      given_name: 'Gmail',
      family_name: 'User',
      picture: 'https://ui-avatars.com/api/?name=Gmail+Test+User&background=4285f4&color=fff',
      verified_email: true
    }

    console.log('🔧 Mock Google signup successful:', mockUser)
    return mockUser
  }
}

// Production Google Auth Service
class ProductionGoogleAuthService implements GoogleAuthService {
  private googleAuth: any = null
  private isReady = false

  async initializeGoogleAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load Google Identity Services
      if (typeof window === 'undefined') {
        reject(new Error('Google Auth only available in browser'))
        return
      }

      // Check if script already loaded
      if (window.google && window.google.accounts) {
        this.initializeClient()
        resolve()
        return
      }

      // Load Google Identity Services script
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      
      script.onload = () => {
        this.initializeClient()
        resolve()
      }
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'))
      }
      
      document.head.appendChild(script)
    })
  }

  private initializeClient(): void {
    try {
      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id',
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true
      })
      
      this.isReady = true
      console.log('✅ Google Auth initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Google Auth:', error)
    }
  }

  private handleCredentialResponse(response: any): void {
    // This is handled by the prompt method
    console.log('Google credential response:', response)
  }

  isGoogleAuthReady(): boolean {
    return this.isReady && typeof window !== 'undefined' && window.google?.accounts?.id
  }

  async signInWithGoogle(): Promise<GoogleUser | null> {
    if (!this.isGoogleAuthReady()) {
      throw new Error('Google Auth not ready. Call initializeGoogleAuth() first.')
    }

    return new Promise((resolve, reject) => {
      try {
        // Use Google One Tap or popup
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fall back to popup
            this.showGooglePopup().then(resolve).catch(reject)
          }
        })
        
        // Set up credential callback for One Tap
        const originalCallback = window.google.accounts.id.initialize
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id',
          callback: async (response: any) => {
            try {
              const userData = await this.parseJWT(response.credential)
              resolve(userData)
            } catch (error) {
              reject(error)
            }
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  private async showGooglePopup(): Promise<GoogleUser | null> {
    return new Promise((resolve, reject) => {
      // Alternative popup method if available
      if (window.google?.accounts?.oauth2) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id',
          scope: 'email profile',
          callback: async (response: any) => {
            try {
              // Fetch user info with token
              const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`)
              const userData = await userResponse.json()
              resolve(userData)
            } catch (error) {
              reject(error)
            }
          }
        })
        client.requestAccessToken()
      } else {
        reject(new Error('Google OAuth popup not available'))
      }
    })
  }

  private async parseJWT(token: string): Promise<GoogleUser> {
    // Decode JWT token to get user info
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''))
    
    return JSON.parse(jsonPayload)
  }
}

// Export the appropriate service based on environment
export const googleAuthService: GoogleAuthService = 
  process.env.NODE_ENV === 'production' 
    ? new ProductionGoogleAuthService()
    : new MockGoogleAuthService()

// React hook for using Google Auth
export function useGoogleAuth() {
  return googleAuthService
}

// Utility function to extract user data for registration
export function extractUserDataFromGoogle(googleUser: GoogleUser): {
  name: string
  email: string
  company: string
  tier: string
} {
  return {
    name: googleUser.name || `${googleUser.given_name || ''} ${googleUser.family_name || ''}`.trim(),
    email: googleUser.email,
    company: 'OSUS Real Estate Brokerage', // Default company
    tier: 'standard' // Default tier
  }
}