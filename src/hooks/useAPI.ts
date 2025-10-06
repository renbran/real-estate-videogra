import { useState, useEffect } from 'react'
import { bookingAPI } from '@/lib/api'
import { BookingRequest } from '@/lib/types'

// Custom hook to replace useKV for bookings
export function useBookings(filters?: { status?: string; agent_id?: string }) {
  const [bookings, setBookings] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await bookingAPI.getBookings(filters)
      setBookings(response.bookings || [])
    } catch (err) {
      console.warn('Failed to fetch bookings from API, using demo data:', err)
      setError(null) // Clear error since we have fallback
      
      // Fallback to demo data for testing
      const demoBookings = [
        {
          id: 'demo-1',
          agent_id: '1',
          shoot_category: 'property' as const,
          location: '123 Main Street, Downtown, CA 90210',
          preferred_date: '2025-10-08',
          backup_dates: ['2025-10-09', '2025-10-10'],
          status: 'pending' as const,
          priority_score: 85,
          property_value: '1m_2m' as const,
          property_type: 'single_family' as const,
          bedrooms: 3,
          shoot_complexity: 'standard' as const,
          property_status: 'vacant' as const,
          special_requirements: 'Drone shots required for large backyard',
          is_flexible: false,
          created_at: '2025-10-06T10:00:00Z',
          updated_at: '2025-10-06T10:00:00Z'
        },
        {
          id: 'demo-2',
          agent_id: '1',
          shoot_category: 'property' as const,
          location: '456 Oak Avenue, Westside, CA 90211',
          preferred_date: '2025-10-07',
          backup_dates: ['2025-10-08'],
          status: 'approved' as const,
          priority_score: 95,
          property_value: 'over_2m' as const,
          property_type: 'condo' as const,
          bedrooms: 4,
          shoot_complexity: 'complex' as const,
          property_status: 'occupied' as const,
          is_flexible: true,
          created_at: '2025-10-05T14:00:00Z',
          updated_at: '2025-10-06T09:00:00Z',
          scheduled_date: '2025-10-07',
          scheduled_time: '10:00'
        }
      ] as BookingRequest[]
      
      // Filter demo data based on provided filters
      let filteredBookings = demoBookings
      if (filters?.status) {
        filteredBookings = filteredBookings.filter(b => b.status === filters.status)
      }
      if (filters?.agent_id) {
        filteredBookings = filteredBookings.filter(b => b.agent_id === filters.agent_id)
      }
      
      setBookings(filteredBookings)
    } finally {
      setLoading(false)
    }
  }

  const addBooking = async (bookingData: Omit<BookingRequest, 'id'>) => {
    try {
      const response = await bookingAPI.createBooking(bookingData)
      const newBooking = response.booking
      setBookings(prev => [...prev, newBooking])
      return newBooking
    } catch (err) {
      console.warn('Failed to create booking via API, using demo fallback:', err)
      
      // Fallback: create booking locally for testing
      const newBooking: BookingRequest = {
        ...bookingData,
        id: `demo-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setBookings(prev => [...prev, newBooking])
      return newBooking
    }
  }

  const updateBooking = async (bookingId: string, updates: Partial<BookingRequest>) => {
    try {
      const response = await bookingAPI.updateBooking(bookingId, updates)
      const updatedBooking = response.booking
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId ? updatedBooking : booking
        )
      )
      return updatedBooking
    } catch (err) {
      console.error('Failed to update booking:', err)
      throw err
    }
  }

  const approveBooking = async (bookingId: string, notes?: string) => {
    try {
      const response = await bookingAPI.approveBooking(bookingId, notes)
      const updatedBooking = response.booking
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId ? updatedBooking : booking
        )
      )
      return updatedBooking
    } catch (err) {
      console.warn('Failed to approve booking via API, using demo fallback:', err)
      
      // Fallback: update booking locally
      const updatedBooking = bookings.find(b => b.id === bookingId)
      if (updatedBooking) {
        const approved = {
          ...updatedBooking,
          status: 'approved' as const,
          updated_at: new Date().toISOString(),
          manager_notes: notes,
          scheduled_date: updatedBooking.scheduled_date || updatedBooking.preferred_date
        }
        
        setBookings(prev => 
          prev.map(booking => 
            booking.id === bookingId ? approved : booking
          )
        )
        return approved
      }
      throw new Error('Booking not found')
    }
  }

  const declineBooking = async (bookingId: string, notes?: string) => {
    try {
      const response = await bookingAPI.declineBooking(bookingId, notes)
      const updatedBooking = response.booking
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId ? updatedBooking : booking
        )
      )
      return updatedBooking
    } catch (err) {
      console.warn('Failed to decline booking via API, using demo fallback:', err)
      
      // Fallback: update booking locally
      const updatedBooking = bookings.find(b => b.id === bookingId)
      if (updatedBooking) {
        const declined = {
          ...updatedBooking,
          status: 'declined' as const,
          updated_at: new Date().toISOString(),
          manager_notes: notes
        }
        
        setBookings(prev => 
          prev.map(booking => 
            booking.id === bookingId ? declined : booking
          )
        )
        return declined
      }
      throw new Error('Booking not found')
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [filters?.status, filters?.agent_id])

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    addBooking,
    updateBooking,
    approveBooking,
    declineBooking
  }
}

// Custom hook for users data (replaces useKV for users)
export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await bookingAPI.getBookings() // This will be updated when we have user endpoints
      setUsers([]) // Placeholder - will be implemented with proper user API
    } catch (err) {
      console.warn('Failed to fetch users from API:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    refetch: fetchUsers
  }
}