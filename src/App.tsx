import { useState, useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { AuthContainer } from '@/components/auth/AuthContainer'
import { Header } from '@/components/navigation/Header'
import { AgentDashboard } from '@/components/dashboard/AgentDashboard'
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard'
import { VideographerDashboard } from '@/components/dashboard/VideographerDashboard'
import { User } from '@/lib/types'
import { useAuth } from '@/hooks/useClientAPI'

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { getCurrentUser } = useAuth()

  useEffect(() => {
    const user = getCurrentUser()
    if (user !== undefined) {
      setCurrentUser(user)
    }
    setIsLoading(false)
  }, [getCurrentUser])

  const handleLogin = (user: User) => {
    setCurrentUser(user)
  }

  const handleLogout = () => {
    setCurrentUser(null)
  }

  const renderDashboard = () => {
    if (!currentUser) return null

    switch (currentUser.role) {
      case 'agent':
        return <AgentDashboard currentUserId={currentUser.id} />
      case 'manager':
        return <ManagerDashboard />
      case 'videographer':
        return <VideographerDashboard />
      case 'admin':
        return <ManagerDashboard /> // Admins see manager view for now
      default:
        return <div className="p-6 text-center">Role not supported</div>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-primary mb-2">VideoPro</div>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white">
        <AuthContainer onAuth={handleLogin} />
        <Toaster />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header user={currentUser} onLogout={handleLogout} />
      <main>
        {renderDashboard()}
      </main>
      <Toaster />
    </div>
  )
}

export default App