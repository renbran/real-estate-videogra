import { useState, useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { LoginForm } from '@/components/auth/LoginForm'
import { Header } from '@/components/navigation/Header'
import { AgentDashboard } from '@/components/dashboard/AgentDashboard'
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard'
import { VideographerDashboard } from '@/components/dashboard/VideographerDashboard'
import { LuxuryPropertyShowcase } from '@/components/property/LuxuryPropertyCard'
import { BrandingShowcase } from '@/components/branding/BusinessCard'
import { User } from '@/lib/types'
import { useAuth } from '@/hooks/useClientAPI'

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showMode, setShowMode] = useState<'app' | 'properties' | 'branding'>('app')
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

  // Special showcase mode for design samples
  if (showMode === 'properties') {
    return (
      <>
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button 
            onClick={() => setShowMode('app')} 
            className="px-4 py-2 bg-osus-burgundy text-white rounded-lg text-sm hover:bg-osus-primary-800 transition-colors"
          >
            Back to App
          </button>
          <button 
            onClick={() => setShowMode('branding')} 
            className="px-4 py-2 bg-osus-gold text-white rounded-lg text-sm hover:bg-osus-secondary-600 transition-colors"
          >
            View Branding
          </button>
        </div>
        <LuxuryPropertyShowcase />
        <Toaster />
      </>
    )
  }

  if (showMode === 'branding') {
    return (
      <>
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button 
            onClick={() => setShowMode('app')} 
            className="px-4 py-2 bg-osus-burgundy text-white rounded-lg text-sm hover:bg-osus-primary-800 transition-colors"
          >
            Back to App
          </button>
          <button 
            onClick={() => setShowMode('properties')} 
            className="px-4 py-2 bg-osus-gold text-white rounded-lg text-sm hover:bg-osus-secondary-600 transition-colors"
          >
            View Properties
          </button>
        </div>
        <BrandingShowcase />
        <Toaster />
      </>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-osus-primary-50/40 via-white to-osus-secondary-50/30">
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button 
            onClick={() => setShowMode('properties')} 
            className="px-4 py-2 bg-osus-burgundy text-white rounded-lg text-sm hover:bg-osus-primary-800 transition-colors"
          >
            View Properties
          </button>
          <button 
            onClick={() => setShowMode('branding')} 
            className="px-4 py-2 bg-osus-gold text-white rounded-lg text-sm hover:bg-osus-secondary-600 transition-colors"
          >
            View Branding
          </button>
        </div>
        <LoginForm onLogin={handleLogin} />
        <Toaster />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button 
          onClick={() => setShowMode('properties')} 
          className="px-3 py-1 bg-osus-burgundy text-white rounded text-xs hover:bg-osus-primary-800 transition-colors"
        >
          Properties
        </button>
        <button 
          onClick={() => setShowMode('branding')} 
          className="px-3 py-1 bg-osus-gold text-white rounded text-xs hover:bg-osus-secondary-600 transition-colors"
        >
          Branding
        </button>
      </div>
      <Header user={currentUser} onLogout={handleLogout} />
      <main>
        {renderDashboard()}
      </main>
      <Toaster />
    </div>
  )
}

export default App