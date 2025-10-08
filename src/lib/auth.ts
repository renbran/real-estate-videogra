import { User } from './types'

const DEMO_USERS: Record<string, User> = {
  'sarah.j@realty.com': {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@realty.com',
    role: 'agent',
    tier: 'elite',
    performance_score: 85,
    monthly_quota: 8,
    monthly_used: 2
  },
  'manager@realty.com': {
    id: 'manager1',
    name: 'Alex Manager',
    email: 'manager@realty.com',
    role: 'manager'
  },
  'video@realty.com': {
    id: 'video1',
    name: 'Chris Videographer',
    email: 'video@realty.com',
    role: 'videographer'
  }
}

export function authenticateUser(email: string): User | null {
  return DEMO_USERS[email] || null
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  
  const userData = localStorage.getItem('videoPro_currentUser')
  return userData ? JSON.parse(userData) : null
}

export function setCurrentUser(user: User): void {
  localStorage.setItem('videoPro_currentUser', JSON.stringify(user))
}

export function logout(): void {
  localStorage.removeItem('videoPro_currentUser')
}