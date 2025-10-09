import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authenticateUser, setCurrentUser } from '@/lib/auth'
import { User } from '@/lib/types'

interface LoginFormProps {
  onLogin: (user: User) => void
  onSwitchToRegister?: () => void
}

export function LoginForm({ onLogin, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const user = await authenticateUser(email, password)
      setCurrentUser(user)
      onLogin(user)
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please check your credentials and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const demoUsers = [
    { email: 'sarah.j@realty.com', role: 'Agent (Elite Tier)', password: 'demo123' },
    { email: 'manager@realty.com', role: 'Manager', password: 'demo123' },
    { email: 'video@realty.com', role: 'Videographer', password: 'demo123' },
    { email: 'admin@osusproperties.com', role: 'Admin', password: 'demo123' }
  ]

  const handleDemoLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush-50 via-background to-blush-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-burgundy-100">
        <CardHeader className="text-center space-y-4 pt-8">
          {/* OSUS Properties Logo */}
          <div className="flex justify-center mb-2">
            <img 
              src="https://osusproperties.com/wp-content/uploads/2025/02/Logo-Icon.svg" 
              alt="OSUS Properties"
              className="h-20 w-auto"
              onError={(e) => {
                // Fallback if logo fails to load
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <div className="hidden text-4xl font-bold bg-gradient-to-r from-burgundy-600 to-burgundy-800 bg-clip-text text-transparent">
              OSUS
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-burgundy-900">
            Videography Booking System
          </CardTitle>
          <CardDescription className="text-burgundy-600">
            Professional Real Estate Media Services
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

          {onSwitchToRegister && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-burgundy-600 hover:text-burgundy-700 font-medium hover:underline"
                >
                  Sign Up
                </button>
              </p>
            </div>
          )}

          <div className="mt-6">
            <div className="text-sm font-medium text-muted-foreground mb-3">
              Demo Accounts (Password: demo123):
            </div>
            <div className="space-y-2">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  onClick={() => handleDemoLogin(user.email, user.password)}
                  className="w-full text-left p-2 text-sm bg-muted/50 hover:bg-muted rounded-md transition-colors"
                >
                  <div className="font-medium">{user.email}</div>
                  <div className="text-muted-foreground text-xs">{user.role}</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}