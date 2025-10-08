// Email verification service
// This handles sending verification codes and validating them

export interface EmailVerificationService {
  sendVerificationCode: (email: string) => Promise<{ success: boolean; error?: string }>
  verifyCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>
  resendCode: (email: string) => Promise<{ success: boolean; error?: string }>
}

class MockEmailVerificationService implements EmailVerificationService {
  private verificationCodes = new Map<string, { code: string; expires: number; attempts: number }>()
  
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }
  
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  async sendVerificationCode(email: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isValidEmail(email)) {
      return { success: false, error: 'Invalid email address' }
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800))

    const code = this.generateCode()
    const expires = Date.now() + 5 * 60 * 1000 // 5 minutes
    
    this.verificationCodes.set(email, { code, expires, attempts: 0 })
    
    // In a real application, you would send the email here
    // For demo purposes, we'll log it to console
    console.log(`📧 Verification code for ${email}: ${code}`)
    
    return { success: true }
  }

  async verifyCode(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const stored = this.verificationCodes.get(email)
    
    if (!stored) {
      return { success: false, error: 'No verification code found. Please request a new code.' }
    }
    
    if (Date.now() > stored.expires) {
      this.verificationCodes.delete(email)
      return { success: false, error: 'Verification code has expired. Please request a new code.' }
    }
    
    if (stored.attempts >= 3) {
      this.verificationCodes.delete(email)
      return { success: false, error: 'Too many failed attempts. Please request a new code.' }
    }
    
    if (stored.code !== code) {
      stored.attempts++
      return { 
        success: false, 
        error: `Invalid code. ${3 - stored.attempts} attempts remaining.`
      }
    }
    
    // Success! Remove the code
    this.verificationCodes.delete(email)
    return { success: true }
  }

  async resendCode(email: string): Promise<{ success: boolean; error?: string }> {
    return this.sendVerificationCode(email)
  }
}

// Production email verification service (would integrate with actual email service)
class ProductionEmailVerificationService implements EmailVerificationService {
  private apiUrl = process.env.REACT_APP_API_URL || '/api'
  
  async sendVerificationCode(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, error: data.message || 'Failed to send verification code' }
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  async verifyCode(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, error: data.message || 'Invalid verification code' }
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  async resendCode(email: string): Promise<{ success: boolean; error?: string }> {
    return this.sendVerificationCode(email)
  }
}

// Export the appropriate service based on environment
export const emailVerificationService: EmailVerificationService = 
  process.env.NODE_ENV === 'production' 
    ? new ProductionEmailVerificationService()
    : new MockEmailVerificationService()

// Hook for using email verification in React components
export function useEmailVerification() {
  return emailVerificationService
}