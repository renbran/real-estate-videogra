import { useState, useEffect } from 'react'
import { useKV } from './useKV'
import { BookingRequest, User, AgentTier } from '@/lib/types'
import { productionAPI, useProductionAPI } from '@/lib/production-api'

// Fallback booking data for development/testing
const FALLBACK_BOOKINGS: BookingRequest[] = [
  // COMPLETED BOOKINGS
  {
    id: 'VB-001',
    agent_id: '1',
    shoot_category: 'property',
    location: '1847 Sunset Boulevard, Beverly Hills, CA 90210',
    preferred_date: '2025-10-01',
    backup_dates: [],
    status: 'completed',
    priority_score: 98,
    property_value: 'over_2m',
    property_type: 'single_family',
    bedrooms: 6,
    shoot_complexity: 'complex',
    property_status: 'vacant',
    special_requirements: 'Drone footage, twilight shots, luxury staging highlight video',
    is_flexible: false,
    created_at: '2025-09-28T10:00:00Z',
    updated_at: '2025-10-01T18:30:00Z',
    scheduled_date: '2025-10-01',
    scheduled_time: '14:00',
    videographer_id: '8'
  },
  {
    id: 'VB-002',
    agent_id: '2',
    shoot_category: 'company_event',
    location: 'Silicon Valley Conference Center, Palo Alto, CA',
    preferred_date: '2025-10-02',
    backup_dates: [],
    status: 'completed',
    priority_score: 89,
    company_event_type: 'conference',
    company_event_duration: 'full_day',
    coverage_type: 'full_coverage',
    expected_attendees: 250,
    special_requirements: 'Multi-camera setup, live streaming, executive interviews',
    is_flexible: false,
    created_at: '2025-09-25T09:00:00Z',
    updated_at: '2025-10-02T20:00:00Z',
    scheduled_date: '2025-10-02',
    scheduled_time: '09:00',
    videographer_id: '9'
  },

  // SCHEDULED/IN-PROGRESS BOOKINGS
  {
    id: 'VB-003',
    agent_id: '1',
    shoot_category: 'property',
    location: '2156 Pacific Coast Highway, Malibu, CA 90265',
    preferred_date: '2025-10-08',
    backup_dates: ['2025-10-09'],
    status: 'approved',
    priority_score: 94,
    property_value: 'over_2m',
    property_type: 'single_family',
    bedrooms: 5,
    shoot_complexity: 'complex',
    property_status: 'vacant',
    special_requirements: 'Ocean view emphasis, sunset timing critical, drone permitted',
    is_flexible: true,
    created_at: '2025-10-05T11:30:00Z',
    updated_at: '2025-10-06T15:20:00Z',
    scheduled_date: '2025-10-08',
    scheduled_time: '16:00',
    videographer_id: '8'
  },
  {
    id: 'VB-004',
    agent_id: '3',
    shoot_category: 'personal',
    location: 'Downtown Professional Studios, Los Angeles, CA',
    preferred_date: '2025-10-08',
    backup_dates: ['2025-10-09', '2025-10-10'],
    status: 'approved',
    priority_score: 76,
    personal_shoot_type: 'headshot',
    personal_shoot_size: 'small_group',
    personal_shoot_location: 'office_studio',
    personal_shoot_duration: 'one_hour',
    special_requirements: 'Corporate headshots for new agent team, consistent lighting',
    is_flexible: true,
    created_at: '2025-10-06T08:15:00Z',
    updated_at: '2025-10-06T14:45:00Z',
    scheduled_date: '2025-10-08',
    scheduled_time: '10:00',
    videographer_id: '9'
  },

  // APPROVED BOOKINGS - Ready for scheduling
  {
    id: 'VB-005',
    agent_id: '2',
    shoot_category: 'marketing_content',
    location: 'Westwood Office Complex, Los Angeles, CA',
    preferred_date: '2025-10-12',
    backup_dates: ['2025-10-13', '2025-10-14'],
    status: 'approved',
    priority_score: 82,
    marketing_content_type: 'promotional',
    talent_participants: 'Agent testimonial',
    script_status: 'ready',
    marketing_location: 'office',
    special_requirements: 'Professional lighting, branded backdrop',
    is_flexible: true,
    created_at: '2025-10-07T13:20:00Z',
    updated_at: '2025-10-07T16:35:00Z'
  },

  // PENDING BOOKINGS - Awaiting approval
  {
    id: 'VB-006',
    agent_id: '4',
    shoot_category: 'property',
    location: '9874 Rodeo Drive, Beverly Hills, CA 90210',
    preferred_date: '2025-10-15',
    backup_dates: ['2025-10-16'],
    status: 'pending',
    priority_score: 87,
    property_value: '1m_2m',
    property_type: 'condo',
    bedrooms: 3,
    shoot_complexity: 'standard',
    property_status: 'vacant',
    special_requirements: 'High-end finishes, city view shots',
    is_flexible: false,
    created_at: '2025-10-09T09:45:00Z',
    updated_at: '2025-10-09T09:45:00Z'
  },
  {
    id: 'VB-007',
    agent_id: '5',
    shoot_category: 'property',
    location: '15632 Ventura Boulevard, Sherman Oaks, CA 91403',
    preferred_date: '2025-10-18',
    backup_dates: ['2025-10-19', '2025-10-20'],
    status: 'pending',
    priority_score: 71,
    property_value: '500k_1m',
    property_type: 'townhouse',
    bedrooms: 4,
    shoot_complexity: 'standard',
    property_status: 'occupied',
    special_requirements: 'Family-friendly property, afternoon lighting preferred',
    is_flexible: true,
    created_at: '2025-10-09T14:00:00Z',
    updated_at: '2025-10-09T14:00:00Z'
  }
]

// Fallback users data for development/testing
const FALLBACK_USERS: User[] = [
  // ADMIN USER FOR TESTING
  { id: 'admin-1', name: 'OSUS Admin', email: 'admin@osusproperties.com', role: 'admin', created_at: '2024-01-01' },
  // AGENT USERS
  { id: '1', name: 'Sarah Johnson', email: 'sarah@osusproperties.com', role: 'agent', agent_tier: 'elite' as AgentTier, monthly_quota: 8, monthly_used: 3, performance_score: 95, created_at: '2024-01-01' },
  { id: '2', name: 'Mike Chen', email: 'mike@osusproperties.com', role: 'agent', agent_tier: 'premium' as AgentTier, monthly_quota: 4, monthly_used: 2, performance_score: 88, created_at: '2024-01-01' },
  { id: '3', name: 'Lisa Rodriguez', email: 'lisa@osusproperties.com', role: 'agent', agent_tier: 'standard' as AgentTier, monthly_quota: 2, monthly_used: 1, performance_score: 82, created_at: '2024-01-01' },
  { id: '4', name: 'David Thompson', email: 'david@osusproperties.com', role: 'agent', agent_tier: 'premium' as AgentTier, monthly_quota: 4, monthly_used: 3, performance_score: 91, created_at: '2024-01-01' },
  { id: '5', name: 'Emily Wilson', email: 'emily@osusproperties.com', role: 'agent', agent_tier: 'standard' as AgentTier, monthly_quota: 2, monthly_used: 0, performance_score: 79, created_at: '2024-01-01' },
  // MANAGER USERS
  { id: '6', name: 'Robert Martinez', email: 'robert@osusproperties.com', role: 'manager', created_at: '2024-01-01' },
  { id: '7', name: 'Jennifer Lee', email: 'jennifer@osusproperties.com', role: 'manager', created_at: '2024-01-01' },
  // VIDEOGRAPHER USERS
  { id: '8', name: 'Alex Kim', email: 'alex@osusvideopro.com', role: 'videographer', created_at: '2024-01-01' },
  { id: '9', name: 'Maria Gonzalez', email: 'maria@osusvideopro.com', role: 'videographer', created_at: '2024-01-01' }
]

// Production-ready authentication hook
export function useAuth() {
  const [currentUser, setCurrentUser] = useKV<User | null>('current-user', null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isProduction = useProductionAPI()

  useEffect(() => {
    if (isProduction && !currentUser) {
      // In production, try to get current user from token
      getCurrentUserFromAPI()
    } else if (!isProduction && !currentUser) {
      // In development, auto-login as first fallback user
      setCurrentUser(FALLBACK_USERS[0])
    }
  }, [currentUser, isProduction, setCurrentUser])

  const getCurrentUserFromAPI = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await productionAPI.getCurrentUser()
      if (response.success && response.data) {
        setCurrentUser(response.data)
      }
    } catch (err) {
      console.warn('Failed to get current user from API')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<User | null> => {
    setIsLoading(true)
    setError(null)
    
    try {
      if (isProduction) {
        const response = await productionAPI.login(email, password)
        if (response.success && response.data) {
          const { user, token } = response.data
          if (token) {
            localStorage.setItem('auth_token', token)
          }
          setCurrentUser(user)
          return user
        } else {
          setError(response.error || 'Login failed')
          return null
        }
      } else {
        // Fallback for development
        const user = FALLBACK_USERS.find(u => u.email === email)
        if (user) {
          setCurrentUser(user)
          return user
        } else {
          setError('Invalid credentials')
          return null
        }
      }
    } catch (err) {
      setError('Login failed - network error')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: {
    name: string
    email: string
    password: string
    phone?: string
    company?: string
    tier?: string
  }): Promise<{ user: User } | null> => {
    setIsLoading(true)
    setError(null)
    
    try {
      if (isProduction) {
        const response = await productionAPI.register(userData)
        if (response.success && response.data) {
          const { user, token } = response.data
          if (token) {
            localStorage.setItem('auth_token', token)
          }
          setCurrentUser(user)
          return { user }
        } else {
          setError(response.error || 'Registration failed')
          return null
        }
      } else {
        // For development, create a mock user
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          email: userData.email,
          name: userData.name,
          role: 'agent',
          tier: userData.tier as AgentTier || 'standard',
          phone: userData.phone || '',
          company: userData.company || '',
          monthly_quota: userData.tier === 'elite' ? 8 : userData.tier === 'premium' ? 4 : 2,
          current_month_bookings: 0,
          is_active: true,
          created_at: new Date().toISOString()
        }
        setCurrentUser(newUser)
        return { user: newUser }
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed - network error')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    
    try {
      if (isProduction) {
        await productionAPI.logout()
        localStorage.removeItem('auth_token')
      }
      setCurrentUser(null)
    } catch (err) {
      console.warn('Logout API call failed, but user logged out locally')
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentUser = () => currentUser

  return {
    currentUser,
    login,
    register,
    logout,
    getCurrentUser,
    isLoading,
    error,
    isProduction
  }
}

// Production-ready booking API
export function useBookingAPI() {
  const [bookings, setBookings] = useKV<BookingRequest[]>('bookings', FALLBACK_BOOKINGS)
  const [users, setUsers] = useState<User[]>(FALLBACK_USERS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isProduction = useProductionAPI()

  // Load data from API in production
  useEffect(() => {
    if (isProduction) {
      loadBookingsFromAPI()
      loadUsersFromAPI()
    }
  }, [isProduction])

  const loadBookingsFromAPI = async () => {
    setIsLoading(true)
    try {
      const response = await productionAPI.getBookings()
      if (response.success && response.data) {
        setBookings(response.data)
      }
    } catch (err) {
      console.warn('Failed to load bookings from API, using fallback data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUsersFromAPI = async () => {
    try {
      const response = await productionAPI.getUsers()
      if (response.success && response.data) {
        setUsers(response.data)
      }
    } catch (err) {
      console.warn('Failed to load users from API, using fallback data')
    }
  }

  const getBookings = () => bookings || []

  const getBookingById = (id: string) => {
    const allBookings = bookings || []
    return allBookings.find(b => b.id === id) || null
  }

  const getBookingsByAgent = (agentId: string) => {
    const allBookings = bookings || []
    return allBookings.filter(b => b.agent_id === agentId)
  }

  const getBookingsByStatus = (status: string) => {
    const allBookings = bookings || []
    return allBookings.filter(b => b.status === status)
  }

  const createBooking = async (booking: Omit<BookingRequest, 'id' | 'created_at' | 'updated_at'>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      if (isProduction) {
        const response = await productionAPI.createBooking(booking)
        if (response.success && response.data) {
          setBookings(prev => [...(prev || []), response.data!])
          return response.data
        } else {
          setError(response.error || 'Failed to create booking')
          return null
        }
      } else {
        // Fallback for development
        const newBooking: BookingRequest = {
          ...booking,
          id: `VB-${String(Date.now()).slice(-6)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        setBookings(prev => [...(prev || []), newBooking])
        return newBooking
      }
    } catch (err) {
      setError('Network error creating booking')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const updateBooking = async (id: string, updates: Partial<BookingRequest>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      if (isProduction) {
        const response = await productionAPI.updateBooking(id, updates)
        if (response.success && response.data) {
          setBookings(prev => (prev || []).map(booking =>
            booking.id === id ? response.data! : booking
          ))
          return response.data
        } else {
          setError(response.error || 'Failed to update booking')
          return null
        }
      } else {
        // Fallback for development
        setBookings(prev => (prev || []).map(booking =>
          booking.id === id
            ? { ...booking, ...updates, updated_at: new Date().toISOString() }
            : booking
        ))
        return (bookings || []).find(b => b.id === id) || null
      }
    } catch (err) {
      setError('Network error updating booking')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const deleteBooking = (id: string) => {
    setBookings(prev => (prev || []).filter(booking => booking.id !== id))
  }

  const getUsers = () => users

  const getUserById = (id: string) => {
    return users.find(u => u.id === id) || null
  }

  const getAgents = () => {
    return users.filter(u => u.role === 'agent')
  }

  const getVideographers = () => {
    return users.filter(u => u.role === 'videographer')
  }

  // Convenience methods for backward compatibility
  const addBooking = createBooking
  const approveBooking = async (id: string, scheduledDate?: string, scheduledTime?: string, videographerId?: string) => {
    if (isProduction) {
      const response = await productionAPI.approveBooking(id, scheduledDate, scheduledTime, videographerId)
      if (response.success && response.data) {
        setBookings(prev => (prev || []).map(booking =>
          booking.id === id ? response.data! : booking
        ))
        return response.data
      }
      return null
    } else {
      return updateBooking(id, { 
        status: 'approved', 
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        videographer_id: videographerId
      })
    }
  }

  const declineBooking = async (id: string, reason?: string) => {
    if (isProduction) {
      const response = await productionAPI.declineBooking(id, reason)
      if (response.success && response.data) {
        setBookings(prev => (prev || []).map(booking =>
          booking.id === id ? response.data! : booking
        ))
        return response.data
      }
      return null
    } else {
      return updateBooking(id, { 
        status: 'declined',
        manager_notes: reason
      })
    }
  }

  return {
    bookings,
    getBookings,
    getBookingById,
    getBookingsByAgent,
    getBookingsByStatus,
    createBooking,
    addBooking, // Alias for compatibility
    updateBooking,
    approveBooking,
    declineBooking,
    deleteBooking,
    users,
    getUsers,
    getUserById,
    getAgents,
    getVideographers,
    isLoading,
    error,
    isProduction,
    refreshData: () => {
      if (isProduction) {
        loadBookingsFromAPI()
        loadUsersFromAPI()
      }
    }
  }
}