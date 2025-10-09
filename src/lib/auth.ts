import { User } from './types'
import { api, TokenManager, type LoginCredentials, type RegisterData } from './api'

// Demo users for fallback (when API is unavailable)
const DEMO_USERS: Record<string, User> = {
  'sarah.j@realty.com': {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@realty.com',
    role: 'agent',
    tier: 'elite',
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
  },
  'admin@osusproperties.com': {
    id: 'admin1',
    name: 'Admin User',
    email: 'admin@osusproperties.com',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z'
  }
}

/**
 * Authenticate user with email and password
 * Uses real API backend with JWT tokens
 */
export async function authenticateUser(email: string, password: string): Promise<User> {
  try {
    const response = await api.login({ email, password })
    return response.user
  } catch (error: any) {
    console.error('Authentication error:', error)
    throw new Error(error.message || 'Authentication failed')
  }
}

/**
 * Register new user
 */
export async function registerUser(data: RegisterData): Promise<User> {
  try {
    const response = await api.register(data)
    return response.user
  } catch (error: any) {
    console.error('Registration error:', error)
    throw new Error(error.message || 'Registration failed')
  }
}

/**
 * Get current authenticated user
 * First checks localStorage, then validates with API
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  
  // Check if we have a valid token
  if (!TokenManager.hasValidToken()) {
    return null
  }
  
  // Return cached user data
  return TokenManager.getUser()
}

/**
 * Fetch fresh user data from API
 */
export async function refreshCurrentUser(): Promise<User> {
  try {
    const userData = await api.getCurrentUser()
    TokenManager.setUser(userData)
    return userData
  } catch (error: any) {
    console.error('Failed to refresh user:', error)
    throw error
  }
}

/**
 * Set current user (internal use)
 */
export function setCurrentUser(user: User): void {
  TokenManager.setUser(user)
}

/**
 * Logout user and clear all tokens
 */
export async function logout(): Promise<void> {
  try {
    await api.logout()
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    TokenManager.clearTokens()
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return TokenManager.hasValidToken() && getCurrentUser() !== null
}

/**
 * Get demo user (for testing/fallback)
 */
export function getDemoUser(email: string): User | null {
  return DEMO_USERS[email] || null
}