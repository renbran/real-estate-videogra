import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useClientAPI'
import { User } from '@/lib/types'

interface LoginFormProps {
  onLogin: (user: User) => void
  onShowRegister: () => void
  onShowSimplifiedSignup?: () => void
}

export function LoginForm({ onLogin, onShowRegister, onShowSimplifiedSignup }: LoginFormProps) {
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