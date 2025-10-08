import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sparkle, User, Envelope, Shield, ArrowLeft } from '@phosphor-icons/react'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { FadeInUp, StaggerChildren, StaggerChild, ScaleIn } from '@/components/ui/animations/PageTransition'

interface SimplifiedSignupProps {
  onSignup: (userData: {
    name: string
    email: string
    password: string
    tier: string
  }) => void
  onBackToLogin: () => void
  isLoading?: boolean
  error?: string
}

export function SimplifiedSignup({ 
  onSignup, 
  onBackToLogin, 
  isLoading = false, 
  error 
}: SimplifiedSignupProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tier: 'standard'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSignup(formData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const tierOptions = [
    {
      value: 'standard',
      label: 'Standard',
      subtitle: '2 bookings/month',
      popular: false
    },
    {
      value: 'premium',
      label: 'Premium',
      subtitle: '4 bookings/month',
      popular: true
    },
    {
      value: 'elite',
      label: 'Elite',
      subtitle: '8 bookings/month',
      popular: false
    }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-osus-primary-50 via-white to-osus-secondary-50">
      <FadeInUp>
        <Card className="w-full max-w-md border-osus-primary-200/50 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <ScaleIn delay={0.2}>
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-osus-primary-500 to-osus-secondary-500 rounded-full flex items-center justify-center relative">
                <User className="w-8 h-8 text-white" />
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkle className="w-5 h-5 text-osus-secondary-400" />
                </motion.div>
              </div>
            </ScaleIn>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-osus-burgundy to-osus-primary-700 bg-clip-text text-transparent mb-2">
                Join OSUS VideoPro
              </CardTitle>
              <CardDescription className="text-osus-primary-600 text-base">
                Get started with professional videography booking in under 2 minutes
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit}>
              <StaggerChildren className="space-y-4">
                <StaggerChild>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-osus-primary-700 font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      className="border-osus-primary-300 focus:border-osus-primary-500"
                      required
                    />
                  </div>
                </StaggerChild>

                <StaggerChild>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-osus-primary-700 font-medium flex items-center gap-2">
                      <Envelope className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email address"
                      className="border-osus-primary-300 focus:border-osus-primary-500"
                      required
                    />
                    <p className="text-xs text-osus-primary-600">
                      We'll send you a verification code to confirm your email
                    </p>
                  </div>
                </StaggerChild>

                <StaggerChild>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-osus-primary-700 font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Create a secure password (min 8 characters)"
                      className="border-osus-primary-300 focus:border-osus-primary-500"
                      minLength={8}
                      required
                    />
                  </div>
                </StaggerChild>

                <StaggerChild>
                  <div className="space-y-3">
                    <Label className="text-osus-primary-700 font-medium">Choose Your Plan</Label>
                    <div className="grid gap-2">
                      {tierOptions.map((tier) => (
                        <motion.label
                          key={tier.value}
                          className={`relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.tier === tier.value
                              ? 'border-osus-primary-500 bg-osus-primary-50'
                              : 'border-osus-primary-200 hover:border-osus-primary-300 bg-white'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <input
                            type="radio"
                            name="tier"
                            value={tier.value}
                            checked={formData.tier === tier.value}
                            onChange={(e) => handleInputChange('tier', e.target.value)}
                            className="sr-only"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-osus-primary-800">
                                {tier.label}
                              </span>
                              {tier.popular && (
                                <Badge className="bg-osus-secondary-100 text-osus-secondary-800 text-xs px-2 py-0.5">
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-osus-primary-600">{tier.subtitle}</p>
                          </div>
                          
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            formData.tier === tier.value
                              ? 'border-osus-primary-500 bg-osus-primary-500'
                              : 'border-osus-primary-300'
                          }`}>
                            {formData.tier === tier.value && (
                              <motion.div
                                className="w-2 h-2 bg-white rounded-full"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500 }}
                              />
                            )}
                          </div>
                        </motion.label>
                      ))}
                    </div>
                  </div>
                </StaggerChild>

                {error && (
                  <StaggerChild>
                    <motion.div
                      className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {error}
                    </motion.div>
                  </StaggerChild>
                )}

                <StaggerChild>
                  <Button 
                    type="submit" 
                    className="w-full bg-osus-burgundy hover:bg-osus-primary-700 text-white font-semibold py-3 text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        Creating Account...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Envelope className="w-4 h-4" />
                        Continue with Email Verification
                      </div>
                    )}
                  </Button>
                </StaggerChild>
              </StaggerChildren>
            </form>

            <motion.div 
              className="mt-6 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={onBackToLogin}
                  className="text-sm text-osus-primary-600 hover:text-osus-primary-700 font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Already have an account? Sign in
                </Button>
              </div>

              <div className="p-3 bg-gradient-to-r from-osus-primary-50 to-osus-secondary-50 rounded-lg border border-osus-primary-200/50">
                <p className="text-xs text-osus-primary-700 text-center font-medium">
                  <Shield className="w-3 h-3 inline mr-1" />
                  Your data is protected with enterprise-grade security
                </p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </FadeInUp>
    </div>
  )
}