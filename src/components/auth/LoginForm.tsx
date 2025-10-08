import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useClientAPI'
import { User } from '@/lib/types'
import { GmailSignupButton } from '@/components/auth/GmailSignupButton'

interface LoginFormProps {
  onLogin: (user: User) => void
  onShowRegister: () => void
  onShowSimplifiedSignup?: () => void
  onGmailSignup?: (userData: {
    name: string
    email: string
    company: string
    tier: string
  }) => void
}

export function LoginForm({ onLogin, onShowRegister, onShowSimplifiedSignup, onGmailSignup }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const user = await login(email, password)
      if (user) {
        onLogin(user)
      } else {
        setError('Invalid email or password')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-blush-200 shadow-xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-burgundy-500 to-burgundy-700 bg-clip-text text-transparent mb-2">
            VideoPro
          </CardTitle>
          <CardDescription className="text-burgundy-600 text-base">
            Professional Videography Booking System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Gmail Login Option */}
          {onGmailSignup && (
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-600">or</span>
                </div>
              </div>
              
              <div className="mt-4">
                <GmailSignupButton 
                  onGoogleSignup={onGmailSignup}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}

          {/* Admin Quick Access for Testing */}
          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-700 font-semibold mb-2 flex items-center gap-1">
              <span>🔧</span> Testing Credentials:
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-purple-600 font-medium">👑 Admin:</span>
                <code className="bg-white px-2 py-1 rounded text-purple-800 font-mono">admin@osusproperties.com</code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600 font-medium">👨‍💼 Manager:</span>
                <code className="bg-white px-2 py-1 rounded text-blue-800 font-mono">robert@osusproperties.com</code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-medium">🏠 Agent:</span>
                <code className="bg-white px-2 py-1 rounded text-green-800 font-mono">sarah@osusproperties.com</code>
              </div>
            </div>
            <p className="text-xs text-purple-600 mt-2 italic">Any password works in development mode</p>
          </div>

          <div className="mt-4 space-y-3 text-center">
            {onShowSimplifiedSignup && (
              <div>
                <Button
                  variant="outline"
                  onClick={onShowSimplifiedSignup}
                  className="w-full border-osus-primary-300 text-osus-primary-700 hover:bg-osus-primary-50 font-semibold"
                >
                  🏢 Join OSUS Real Estate - Quick Signup
                </Button>
              </div>
            )}
            <div>
              <button
                onClick={onShowRegister}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Don't have an account? Create one
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}