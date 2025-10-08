import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Envelope, CheckCircle, Clock, ArrowLeft } from '@phosphor-icons/react'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { FadeInUp, ScaleIn } from '@/components/ui/animations/PageTransition'

interface EmailVerificationProps {
  email: string
  onVerified: (verificationCode: string) => void
  onBackToSignup: () => void
  onResendCode: () => void
  isLoading?: boolean
}

export function EmailVerification({ 
  email, 
  onVerified, 
  onBackToSignup, 
  onResendCode,
  isLoading = false 
}: EmailVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('')
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [canResend, setCanResend] = useState(false)
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code')
      return
    }
    
    setIsVerifying(true)
    
    try {
      await onVerified(verificationCode)
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = () => {
    setTimeLeft(300) // Reset to 5 minutes
    setCanResend(false)
    setError('')
    onResendCode()
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-osus-primary-50 via-white to-osus-secondary-50">
      <FadeInUp>
        <Card className="w-full max-w-md border-osus-primary-200/50 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <ScaleIn delay={0.2}>
              <div className="mx-auto mb-4 w-20 h-20 bg-white rounded-full flex items-center justify-center relative shadow-lg border-2 border-osus-primary-200">
                <img 
                  src="https://osusproperties.com/wp-content/uploads/2025/02/Logo-Icon.svg" 
                  alt="OSUS Properties Logo"
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    // Fallback to Envelope icon if logo fails to load
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const fallback = target.nextElementSibling as HTMLElement
                    if (fallback) fallback.style.display = 'block'
                  }}
                />
                <div className="w-8 h-8 bg-gradient-to-r from-osus-primary-500 to-osus-secondary-500 rounded-full flex items-center justify-center" style={{ display: 'none' }}>
                  <Envelope className="w-4 h-4 text-white" />
                </div>
                <motion.div
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-osus-primary-500 to-osus-secondary-500 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Envelope className="w-3 h-3 text-white" />
                </motion.div>
              </div>
            </ScaleIn>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-osus-burgundy to-osus-primary-700 bg-clip-text text-transparent mb-2">
                Verify Your Email
              </CardTitle>
              <CardDescription className="text-osus-primary-600 text-sm">
                OSUS Real Estate Brokerage has sent a 6-digit verification code to
              </CardDescription>
              <Badge variant="outline" className="mt-2 border-osus-primary-300 text-osus-primary-700 bg-osus-primary-50">
                {email}
              </Badge>
            </motion.div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Label htmlFor="code" className="text-osus-primary-700 font-medium">
                  Verification Code
                </Label>
                <div className="relative">
                  <Input
                    id="code"
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '') // Only digits
                      setVerificationCode(value)
                      setError('')
                    }}
                    placeholder="000000"
                    className="text-center text-lg font-mono tracking-widest border-osus-primary-300 focus:border-osus-primary-500"
                    autoComplete="one-time-code"
                    required
                  />
                  {verificationCode.length === 6 && (
                    <motion.div
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {error && (
                <motion.div
                  className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Button 
                  type="submit" 
                  className="w-full bg-osus-burgundy hover:bg-osus-primary-700 text-white font-semibold py-3"
                  disabled={isVerifying || verificationCode.length !== 6}
                >
                  {isVerifying ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      Verifying...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Verify Email
                    </div>
                  )}
                </Button>
              </motion.div>
            </form>

            <motion.div 
              className="mt-6 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {!canResend ? (
                <div className="flex items-center justify-center gap-2 text-sm text-osus-primary-600">
                  <Clock className="w-4 h-4" />
                  <span>Resend code in {formatTime(timeLeft)}</span>
                </div>
              ) : (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-osus-primary-700 border-osus-primary-300 hover:bg-osus-primary-50"
                  >
                    Resend Verification Code
                  </Button>
                </div>
              )}

              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={onBackToSignup}
                  className="text-sm text-osus-primary-600 hover:text-osus-primary-700 font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Sign Up
                </Button>
              </div>
            </motion.div>

            <motion.div 
              className="mt-4 p-3 bg-osus-primary-50 rounded-lg border border-osus-primary-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <p className="text-xs text-osus-primary-600 text-center">
                <span className="font-semibold">Didn't receive the code?</span> Check your spam folder or try resending.
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </FadeInUp>
    </div>
  )
}