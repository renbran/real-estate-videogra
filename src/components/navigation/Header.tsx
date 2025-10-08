import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SignOut, User, Play, Bell } from '@phosphor-icons/react'
import { User as UserType } from '@/lib/types'
import { useAuth } from '@/hooks/useClientAPI'
import { DemoMode } from '@/components/demo/DemoMode'
import { DEMO_NOTIFICATIONS } from '@/lib/demo-data'

interface HeaderProps {
  user: UserType
  onLogout: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  const [showDemo, setShowDemo] = useState(false)
  const { logout } = useAuth()
  
  // Get user notifications count
  const userNotifications = DEMO_NOTIFICATIONS.filter(n => n.user_id === user.id && !n.read)

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const getRoleBadge = () => {
    switch (user.role) {
      case 'agent':
        return <Badge className="bg-gold-100 text-gold-700 border-gold-200">{user.agent_tier ? user.agent_tier.toUpperCase() : 'AGENT'}</Badge>
      case 'manager':
        return <Badge className="bg-burgundy-100 text-burgundy-800 border-burgundy-200">MANAGER</Badge>
      case 'videographer':
        return <Badge className="bg-blush-200 text-burgundy-700 border-blush-300">VIDEOGRAPHER</Badge>
      case 'admin':
        return <Badge className="bg-burgundy-500 text-white border-burgundy-600">ADMIN</Badge>
      default:
        return <Badge variant="outline" className="border-blush-300 text-burgundy-600">USER</Badge>
    }
  }

  return (
    <>
      <header className="border-b border-blush-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-burgundy-500 to-burgundy-700 bg-clip-text text-transparent">
              VideoPro
            </h1>
            <Badge variant="outline" className="text-xs border-gold-300 text-gold-600 bg-gold-50">
              Professional System
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Demo Mode Button */}
            <Button
              onClick={() => setShowDemo(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Demo Guide
            </Button>

            {/* Notifications */}
            {userNotifications.length > 0 && (
              <Button variant="outline" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                {userNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {userNotifications.length}
                  </span>
                )}
              </Button>
            )}
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{user.name}</span>
                  {getRoleBadge()}
                </div>
                {user.performance_score && (
                  <div className="text-xs text-muted-foreground">
                    Score: {user.performance_score}/100
                  </div>
                )}
              </div>
            </div>
            
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <SignOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <DemoMode isOpen={showDemo} onClose={() => setShowDemo(false)} />
    </>
  )
}