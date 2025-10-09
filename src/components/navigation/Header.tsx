import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SignOut, User } from '@phosphor-icons/react'
import { User as UserType } from '@/lib/types'
import { logout } from '@/lib/auth'

interface HeaderProps {
  user: UserType
  onLogout: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  const handleLogout = () => {
    logout()
    onLogout()
  }

  const getRoleBadge = () => {
    switch (user.role) {
      case 'agent':
        return <Badge variant="secondary">{user.tier ? user.tier.toUpperCase() : 'AGENT'}</Badge>
      case 'manager':
        return <Badge className="bg-blue-100 text-blue-800">MANAGER</Badge>
      case 'videographer':
        return <Badge className="bg-purple-100 text-purple-800">VIDEOGRAPHER</Badge>
      case 'admin':
        return <Badge className="bg-red-100 text-red-800">ADMIN</Badge>
      default:
        return <Badge variant="outline">USER</Badge>
    }
  }

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <img 
            src="https://osusproperties.com/wp-content/uploads/2025/02/Logo-Icon.svg" 
            alt="OSUS Properties"
            className="h-10 w-auto"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
          <h1 className="hidden text-xl font-bold bg-gradient-to-r from-burgundy-600 to-burgundy-800 bg-clip-text text-transparent">
            OSUS Booking
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
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
  )
}