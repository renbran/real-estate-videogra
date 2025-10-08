import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from '@/components/ui/sonner'
import { AuthContainer } from '@/components/auth/AuthContainer'
import { Header } from '@/components/navigation/Header'
import { AgentDashboard } from '@/components/dashboard/AgentDashboard'
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard'
import { VideographerDashboard } from '@/components/dashboard/VideographerDashboard'
import { LoadingScreen } from '@/components/ui/loading/LoadingScreen'
import { PageTransition } from '@/components/ui/animations/PageTransition'
import { User } from '@/lib/types'
import { useAuth } from '@/hooks/useClientAPI'

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)
  const { getCurrentUser, isLoading: authLoading } = useAuth()

  useEffect(() => {
    // Simulate initial app loading with minimum splash screen time
    const initApp = async () => {
      const minLoadTime = new Promise(resolve => setTimeout(resolve, 2500))
      const user = getCurrentUser()
      
      await minLoadTime // Ensure splash screen shows for at least 2.5 seconds
      
      setCurrentUser(user || null)
      setShowSplash(false)
      setIsLoading(false)
    }
    
    initApp()
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

  // Show loading screen during initial app load
  if (showSplash || isLoading || authLoading) {
    return (
      <LoadingScreen 
        type="full"
        message="Initializing your videography booking system"
        showProgress={true}
        duration={2000}
      />
    )
  }

  if (!currentUser) {
    return (
      <AnimatePresence>
        <PageTransition type="fade">
          <div className="min-h-screen bg-white">
            <AuthContainer onAuth={handleLogin} />
            <Toaster />
          </div>
        </PageTransition>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      <PageTransition type="slide">
        <div className="min-h-screen bg-white">
          <Header user={currentUser} onLogout={handleLogout} />
          <main>
            <PageTransition type="fade">
              {renderDashboard()}
            </PageTransition>
          </main>
          <Toaster />
        </div>
      </PageTransition>
    </AnimatePresence>
  )
}

export default App