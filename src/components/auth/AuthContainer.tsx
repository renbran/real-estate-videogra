import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { SimplifiedSignup } from './SimplifiedSignup'
import { EmailVerification } from './EmailVerification'
import { User } from '@/lib/types'
import { useAuth } from '@/hooks/useClientAPI'
import { useEmailVerification } from '@/lib/email-verification'

interface AuthContainerProps {
  onAuth: (user: User) => void
}

export function AuthContainer({ onAuth }: AuthContainerProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'simplified-signup' | 'email-verification'>('login')
  const [pendingUserData, setPendingUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const emailVerification = useEmailVerification()

  const handleShowRegister = () => {
    setMode('register')
  }

  const handleShowSimplifiedSignup = () => {
    setMode('simplified-signup')
  }

  const handleShowLogin = () => {
    setMode('login')
  }

  const handleSimplifiedSignup = async (userData: {
    name: string
    email: string
    password: string
    tier: string
    company: string
  }) => {
    setIsLoading(true)
    setError('')
    
    try {
      // Send verification code
      const result = await emailVerification.sendVerificationCode(userData.email)
      
      if (result.success) {
        setPendingUserData(userData)
        setMode('email-verification')
      } else {
        setError(result.error || 'Failed to send verification code')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailVerification = async (verificationCode: string) => {
    if (!pendingUserData) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // Verify the code
      const verifyResult = await emailVerification.verifyCode(pendingUserData.email, verificationCode)
      
      if (verifyResult.success) {
        // Register the user
        const registerResult = await register({
          name: pendingUserData.name,
          email: pendingUserData.email,
          password: pendingUserData.password,
          tier: pendingUserData.tier,
          company: pendingUserData.company || 'OSUS Real Estate Brokerage'
        })
        
        if (registerResult && registerResult.user) {
          onAuth(registerResult.user)
        } else {
          throw new Error('Registration failed')
        }
      } else {
        throw new Error(verifyResult.error || 'Verification failed')
      }
    } catch (err: any) {
      throw new Error(err.message || 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!pendingUserData) return
    
    try {
      await emailVerification.resendCode(pendingUserData.email)
    } catch (err: any) {
      setError(err.message || 'Failed to resend code')
    }
  }

  const handleGmailSignup = async (userData: {
    name: string
    email: string
    company: string
    tier: string
  }) => {
    setIsLoading(true)
    setError('')
    
    try {
      // For Gmail signup, we skip email verification since Google has already verified the email
      const registerResult = await register({
        name: userData.name,
        email: userData.email,
        password: Math.random().toString(36), // Generate random password for OAuth users
        tier: userData.tier,
        company: userData.company
      })
      
      if (registerResult && registerResult.user) {
        onAuth(registerResult.user)
      } else {
        throw new Error('Gmail signup failed')
      }
    } catch (err: any) {
      setError(err.message || 'Gmail signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (mode === 'register') {
    return (
      <RegisterForm 
        onRegister={onAuth}
        onBackToLogin={handleShowLogin}
      />
    )
  }

  if (mode === 'simplified-signup') {
    return (
      <SimplifiedSignup
        onSignup={handleSimplifiedSignup}
        onGmailSignup={handleGmailSignup}
        onBackToLogin={handleShowLogin}
        isLoading={isLoading}
        error={error}
      />
    )
  }

  if (mode === 'email-verification' && pendingUserData) {
    return (
      <EmailVerification
        email={pendingUserData.email}
        onVerified={handleEmailVerification}
        onBackToSignup={() => setMode('simplified-signup')}
        onResendCode={handleResendCode}
        isLoading={isLoading}
      />
    )
  }

  return (
    <LoginForm 
      onLogin={onAuth}
      onShowRegister={handleShowRegister}
      onShowSimplifiedSignup={handleShowSimplifiedSignup}
      onGmailSignup={handleGmailSignup}
    />
  )
}