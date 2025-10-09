import { useState, useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingScreen } from '@/components/Loading'
import { LoginForm } from '@/components/auth/LoginForm'
import { Header } from '@/components/navigation/Header'
import { AgentDashboard } from '@/components/dashboard/AgentDashboard'
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard'
import { VideographerDashboard } from '@/components/dashboard/VideographerDashboard'
import { User } from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)
    setIsLoading(false)
  }, [])

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
    return <LoadingScreen />
  }

  if (!currentUser) {
    return (
      <ErrorBoundary>
        <LoginForm onLogin={handleLogin} />
        <Toaster />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <Header user={currentUser} onLogout={handleLogout} />
        <main>
          {renderDashboard()}
        </main>
        <Toaster />
      </div>
    </ErrorBoundary>
  )
}

export default App