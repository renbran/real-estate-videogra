import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { User } from '@/lib/types'

interface AuthContainerProps {
  onAuth: (user: User) => void
}

export function AuthContainer({ onAuth }: AuthContainerProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const handleShowRegister = () => {
    setMode('register')
  }

  const handleShowLogin = () => {
    setMode('login')
  }

  if (mode === 'register') {
    return (
      <RegisterForm 
        onRegister={onAuth}
        onBackToLogin={handleShowLogin}
      />
    )
  }

  return (
    <LoginForm 
      onLogin={onAuth}
      onShowRegister={handleShowRegister}
    />
  )
}