import { User } from './types'
import { authAPI } from './api'

// Keep demo users as fallback for development/testing
const DEMO_USERS: Record<string, User> = {
  'sarah.j@realty.com': {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@realty.com',
    role: 'agent',
    agent_tier: 'elite',
    performance_score: 85,
    monthly_quota: 8,
    monthly_used: 2,
    created_at: '2024-01-01T00:00:00Z'
  },
  'manager@realty.com': {
    id: 'manager1',
    name: 'Alex Manager',
    email: 'manager@realty.com',
    role: 'manager',
    created_at: '2024-01-01T00:00:00Z'
  },
  'video@realty.com': {
    id: 'video1',
    name: 'Chris Videographer',
    email: 'video@realty.com',
    role: 'videographer',
    created_at: '2024-01-01T00:00:00Z'
  }
}

export async function authenticateUser(email: string, password: string = 'demo123'): Promise<User | null> {
  try {
    // Try API authentication first
    const response = await authAPI.login(email, password)
    if (response.user) {
      setCurrentUser(response.user)
      return response.user
    }
  } catch (error) {
    console.warn('API authentication failed, falling back to demo users:', error)
    // Fallback to demo users for development
    const demoUser = DEMO_USERS[email]
    if (demoUser) {
      setCurrentUser(demoUser)
      return demoUser
    }
  }
  return null
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  
  const userData = localStorage.getItem('videoPro_currentUser')
  return userData ? JSON.parse(userData) : null
}

export function setCurrentUser(user: User): void {
  localStorage.setItem('videoPro_currentUser', JSON.stringify(user))
}

export async function logout(): Promise<void> {
  try {
    await authAPI.logout()
  } catch (error) {
    console.warn('Logout API call failed, proceeding with local logout:', error)
    // Continue with local cleanup even if API fails
    localStorage.removeItem('videoPro_currentUser')
  }
}