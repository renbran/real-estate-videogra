import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authenticateUser, setCurrentUser } from '@/lib/auth'
import { User } from '@/lib/types'
import { OSUSLogo } from '@/components/branding/OSUSLogo'

interface LoginFormProps {
  onLogin: (user: User) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const user = authenticateUser(email)
      if (user) {
        setCurrentUser(user)
        onLogin(user)
      } else {
        setError('User not found. Try one of the demo accounts.')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const demoUsers = [
    { email: 'sarah.j@realty.com', role: 'Agent (Elite Tier)' },
    { email: 'manager@realty.com', role: 'Manager' },
    { email: 'video@realty.com', role: 'Videographer' }
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <OSUSLogo size="md" className="mb-2" />
          <CardDescription>
            OSUS Properties - Videography Booking System
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

            {error && (
              <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="text-sm font-medium text-muted-foreground mb-3">
              Demo Accounts:
            </div>
            <div className="space-y-2">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  onClick={() => setEmail(user.email)}
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