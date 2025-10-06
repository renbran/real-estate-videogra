import { useState, useEffect } from 'react'
import { BookingRequest, User } from '@/lib/types'

// Demo data for GitHub Pages deployment - Production-ready scenarios
const DEMO_USERS: User[] = [
  // Agents - Different tiers showing hierarchy
  { id: '1', email: 'sarah@premiumrealty.com', name: 'Sarah Johnson', role: 'agent', agent_tier: 'elite', created_at: '2025-01-15T09:00:00Z', monthly_quota: 20, monthly_used: 12, performance_score: 98 },
  { id: '2', email: 'michael@premiumrealty.com', name: 'Michael Chen', role: 'agent', agent_tier: 'premium', created_at: '2025-02-01T10:30:00Z', monthly_quota: 15, monthly_used: 9, performance_score: 89 },
  { id: '3', email: 'jessica@premiumrealty.com', name: 'Jessica Williams', role: 'agent', agent_tier: 'standard', created_at: '2025-03-10T14:15:00Z', monthly_quota: 10, monthly_used: 6, performance_score: 85 },
  { id: '4', email: 'david@premiumrealty.com', name: 'David Rodriguez', role: 'agent', agent_tier: 'premium', created_at: '2025-01-20T11:45:00Z', monthly_quota: 15, monthly_used: 8, performance_score: 92 },
  { id: '5', email: 'emily@premiumrealty.com', name: 'Emily Davis', role: 'agent', agent_tier: 'standard', created_at: '2025-04-05T16:20:00Z', monthly_quota: 10, monthly_used: 5, performance_score: 78 },
  
  // Management team
  { id: '6', email: 'alex@premiumrealty.com', name: 'Alex Thompson', role: 'manager', created_at: '2024-06-01T08:00:00Z', performance_score: 95 },
  { id: '7', email: 'lisa@premiumrealty.com', name: 'Lisa Anderson', role: 'manager', created_at: '2024-08-15T09:30:00Z', performance_score: 93 },
  
  // Videography team
  { id: '8', email: 'chris@videopro.com', name: 'Chris Martinez', role: 'videographer', created_at: '2024-05-10T10:00:00Z', performance_score: 96 },
  { id: '9', email: 'jordan@videopro.com', name: 'Jordan Taylor', role: 'videographer', created_at: '2024-07-20T11:30:00Z', performance_score: 91 },
  
  // Admin
  { id: '10', email: 'admin@premiumrealty.com', name: 'System Administrator', role: 'admin', created_at: '2024-01-01T00:00:00Z', performance_score: 100 }
]

const DEMO_BOOKINGS: BookingRequest[] = [
  // COMPLETED BOOKINGS - Show successful workflows
  {
    id: 'VB-001',
    booking_number: 'VB-20251001-LUX001',
    agent_id: '1',
    shoot_category: 'property',
    location: '1847 Sunset Boulevard, Beverly Hills, CA 90210',
    preferred_date: '2025-10-01',
    backup_dates: [],
    status: 'completed',
    priority_score: 98,
    property_value: 'over_2m',
    property_type: 'luxury',
    bedrooms: 6,
    shoot_complexity: 'complex',
    property_status: 'staged',
    special_requirements: 'Drone footage, twilight shots, luxury staging highlight video',
    is_flexible: false,
    created_at: '2025-09-28T10:00:00Z',
    updated_at: '2025-10-01T18:30:00Z',
    scheduled_date: '2025-10-01',
    scheduled_time: '14:00',
    videographer_id: '8',
    completion_notes: 'Exceptional results - 4K footage delivered, client extremely satisfied'
  },
  {
    id: 'VB-002',
    booking_number: 'VB-20251002-CORP050',
    agent_id: '2',
    shoot_category: 'event',
    location: 'Silicon Valley Conference Center, Palo Alto, CA',
    preferred_date: '2025-10-02',
    backup_dates: [],
    status: 'completed',
    priority_score: 89,
    event_type: 'corporate',
    event_duration: '6',
    attendee_count: '250',
    special_requirements: 'Multi-camera setup, live streaming, executive interviews',
    is_flexible: false,
    created_at: '2025-09-25T09:00:00Z',
    updated_at: '2025-10-02T20:00:00Z',
    scheduled_date: '2025-10-02',
    scheduled_time: '09:00',
    videographer_id: '9',
    completion_notes: 'Live stream successful, 3-angle coverage delivered same day'
  },

  // SCHEDULED/IN-PROGRESS BOOKINGS
  {
    id: 'VB-003',
    booking_number: 'VB-20251007-PREM200',
    agent_id: '1',
    shoot_category: 'property',
    location: '2156 Pacific Coast Highway, Malibu, CA 90265',
    preferred_date: '2025-10-08',
    backup_dates: ['2025-10-09'],
    status: 'scheduled',
    priority_score: 94,
    property_value: 'over_2m',
    property_type: 'luxury',
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
    booking_number: 'VB-20251008-HEAD100',
    agent_id: '3',
    shoot_category: 'headshot',
    location: 'Downtown Professional Studios, Los Angeles, CA',
    preferred_date: '2025-10-08',
    backup_dates: ['2025-10-09', '2025-10-10'],
    status: 'scheduled',
    priority_score: 76,
    session_type: 'professional',
    participant_count: '5',
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
    booking_number: 'VB-20251009-MKT300',
    agent_id: '4',
    shoot_category: 'marketing',
    location: 'Various Premium Properties, West Hollywood, CA',
    preferred_date: '2025-10-10',
    backup_dates: ['2025-10-11', '2025-10-12'],
    status: 'approved',
    priority_score: 87,
    content_type: 'social_media',
    deliverable_format: 'video',
    special_requirements: 'Instagram Reels format, trending audio, lifestyle focus',
    is_flexible: true,
    created_at: '2025-10-06T13:00:00Z',
    updated_at: '2025-10-06T16:30:00Z'
  },
  {
    id: 'VB-006',
    booking_number: 'VB-20251010-PROJ400',
    agent_id: '2',
    shoot_category: 'special_project',
    location: 'Historic Downtown Renovation Project, LA',
    preferred_date: '2025-10-12',
    backup_dates: ['2025-10-13'],
    status: 'approved',
    priority_score: 82,
    project_type: 'documentary',
    project_scope: 'time_lapse',
    special_requirements: 'Monthly progress documentation, construction site safety protocols',
    is_flexible: false,
    created_at: '2025-10-05T16:20:00Z',
    updated_at: '2025-10-06T12:15:00Z'
  },

  // PENDING BOOKINGS - Awaiting approval
  {
    id: 'VB-007',
    booking_number: 'VB-20251006-PROP500',
    agent_id: '5',
    shoot_category: 'property',
    location: '3421 Vine Street, Hollywood, CA 90028',
    preferred_date: '2025-10-14',
    backup_dates: ['2025-10-15', '2025-10-16'],
    status: 'pending',
    priority_score: 73,
    property_value: '500k_1m',
    property_type: 'condo',
    bedrooms: 2,
    shoot_complexity: 'standard',
    property_status: 'occupied',
    special_requirements: 'Tenant coordination required, evening shoot preferred',
    is_flexible: true,
    created_at: '2025-10-06T14:30:00Z',
    updated_at: '2025-10-06T14:30:00Z'
  },
  {
    id: 'VB-008',
    booking_number: 'VB-20251006-EVT600',
    agent_id: '3',
    shoot_category: 'event',
    location: 'Rooftop Venue, Santa Monica, CA',
    preferred_date: '2025-10-18',
    backup_dates: ['2025-10-19'],
    status: 'pending',
    priority_score: 85,
    event_type: 'networking',
    event_duration: '4',
    attendee_count: '75',
    special_requirements: 'Golden hour timing, networking footage, testimonial interviews',
    is_flexible: true,
    created_at: '2025-10-06T15:45:00Z',
    updated_at: '2025-10-06T15:45:00Z'
  },
  {
    id: 'VB-009',
    booking_number: 'VB-20251006-RUSH700',
    agent_id: '1',
    shoot_category: 'property',
    location: '5678 Rodeo Drive, Beverly Hills, CA 90210',
    preferred_date: '2025-10-07',
    backup_dates: [],
    status: 'pending',
    priority_score: 96,
    property_value: 'over_2m',
    property_type: 'luxury',
    bedrooms: 7,
    shoot_complexity: 'complex',
    property_status: 'staged',
    special_requirements: 'URGENT: Listing goes live tomorrow, premium staging, architectural focus',
    is_flexible: false,
    created_at: '2025-10-06T16:15:00Z',
    updated_at: '2025-10-06T16:15:00Z'
  },

  // DECLINED BOOKINGS - Show rejection workflow
  {
    id: 'VB-010',
    booking_number: 'VB-20251005-DEC800',
    agent_id: '5',
    shoot_category: 'property',
    location: 'Remote Mountain Property, Big Sur, CA',
    preferred_date: '2025-10-06',
    backup_dates: [],
    status: 'declined',
    priority_score: 45,
    property_value: 'under_500k',
    property_type: 'cabin',
    bedrooms: 1,
    shoot_complexity: 'standard',
    property_status: 'vacant',
    special_requirements: 'Remote location, 3-hour drive each way',
    is_flexible: false,
    created_at: '2025-10-05T10:00:00Z',
    updated_at: '2025-10-05T17:30:00Z',
    decline_reason: 'Location too remote for same-day turnaround, insufficient notice period'
  }
]

// Initialize localStorage with demo data if not exists
const initializeStorage = () => {
  if (!localStorage.getItem('videography_bookings')) {
    localStorage.setItem('videography_bookings', JSON.stringify(DEMO_BOOKINGS))
  }
  if (!localStorage.getItem('videography_users')) {
    localStorage.setItem('videography_users', JSON.stringify(DEMO_USERS))
  }
}

// Utility functions for localStorage operations
const getStoredBookings = (): BookingRequest[] => {
  try {
    const stored = localStorage.getItem('videography_bookings')
    return stored ? JSON.parse(stored) : DEMO_BOOKINGS
  } catch {
    return DEMO_BOOKINGS
  }
}

const setStoredBookings = (bookings: BookingRequest[]) => {
  localStorage.setItem('videography_bookings', JSON.stringify(bookings))
}

const getStoredUsers = (): User[] => {
  try {
    const stored = localStorage.getItem('videography_users')
    return stored ? JSON.parse(stored) : DEMO_USERS
  } catch {
    return DEMO_USERS
  }
}

// Custom hook for bookings (client-side version)
export function useBookings(filters?: { status?: string; agent_id?: string }) {
  const [bookings, setBookings] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = () => {
    initializeStorage()
    let allBookings = getStoredBookings()
    
    // Apply filters
    if (filters?.status) {
      allBookings = allBookings.filter(b => b.status === filters.status)
    }
    if (filters?.agent_id) {
      allBookings = allBookings.filter(b => b.agent_id === filters.agent_id)
    }
    
    setBookings(allBookings)
    setLoading(false)
    setError(null)
  }

  useEffect(() => {
    fetchBookings()
  }, [filters?.status, filters?.agent_id])

  const addBooking = (newBooking: Omit<BookingRequest, 'id' | 'booking_number' | 'created_at' | 'updated_at' | 'priority_score'>) => {
    const booking: BookingRequest = {
      ...newBooking,
      id: `demo-${Date.now()}`,
      booking_number: `VB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      priority_score: Math.floor(Math.random() * 100),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const allBookings = getStoredBookings()
    const updatedBookings = [...allBookings, booking]
    setStoredBookings(updatedBookings)
    fetchBookings() // Refresh the display
    
    return Promise.resolve({ booking })
  }

  const updateBooking = (id: string, updates: Partial<BookingRequest>) => {
    const allBookings = getStoredBookings()
    const updatedBookings = allBookings.map(booking => 
      booking.id === id 
        ? { ...booking, ...updates, updated_at: new Date().toISOString() }
        : booking
    )
    setStoredBookings(updatedBookings)
    fetchBookings() // Refresh the display
    
    const updatedBooking = updatedBookings.find(b => b.id === id)
    return Promise.resolve({ booking: updatedBooking })
  }

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    addBooking,
    updateBooking
  }
}

// Custom hook for users (client-side version)
export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeStorage()
    setUsers(getStoredUsers())
    setLoading(false)
  }, [])

  return { users, loading }
}

// Custom hook for individual user
export function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeStorage()
    const users = getStoredUsers()
    const foundUser = users.find(u => u.id === id)
    setUser(foundUser || null)
    setLoading(false)
  }, [id])

  return { user, loading }
}

// Authentication hook (client-side version)
export function useAuth() {
  const login = async (email: string) => {
    initializeStorage()
    const users = getStoredUsers()
    const user = users.find(u => u.email === email)
    
    if (user) {
      localStorage.setItem('current_user', JSON.stringify(user))
      return { user, token: `demo-token-${user.id}` }
    } else {
      throw new Error('Invalid credentials')
    }
  }

  const logout = () => {
    localStorage.removeItem('current_user')
  }

  const getCurrentUser = (): User | null => {
    try {
      const stored = localStorage.getItem('current_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  return { login, logout, getCurrentUser }
}