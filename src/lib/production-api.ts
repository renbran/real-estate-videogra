import { BookingRequest, User } from './types'

const env = import.meta.env as Record<string, string | undefined>

// Production API configuration
const API_BASE_URL = env.VITE_API_URL ?? env.REACT_APP_API_URL ?? '/api'
const API_KEY = env.VITE_API_KEY ?? env.REACT_APP_API_KEY

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ProductionAPI {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`
    }
    
    return headers
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      })

      const data = await response.json()
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`
        }
      }

      return {
        success: true,
        data: data.data || data
      }
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token?: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request('/auth/logout', {
      method: 'POST'
    })
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/auth/me')
  }

  async register(userData: {
    name: string
    email: string
    password: string
    phone?: string
    company?: string
    tier?: string
  }): Promise<ApiResponse<{ user: User; token?: string }>> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  }

  // Bookings
  async getBookings(filters?: {
    agent_id?: string
    status?: string
    date_from?: string
    date_to?: string
  }): Promise<ApiResponse<BookingRequest[]>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
    }
    
    const queryString = params.toString()
    return this.request(`/bookings${queryString ? `?${queryString}` : ''}`)
  }

  async getBooking(id: string): Promise<ApiResponse<BookingRequest>> {
    return this.request(`/bookings/${id}`)
  }

  async createBooking(booking: Omit<BookingRequest, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<BookingRequest>> {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking)
    })
  }

  async updateBooking(id: string, updates: Partial<BookingRequest>): Promise<ApiResponse<BookingRequest>> {
    return this.request(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async approveBooking(id: string, scheduledDate?: string, scheduledTime?: string, videographerId?: string): Promise<ApiResponse<BookingRequest>> {
    return this.request(`/bookings/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        videographer_id: videographerId
      })
    })
  }

  async declineBooking(id: string, reason?: string): Promise<ApiResponse<BookingRequest>> {
    return this.request(`/bookings/${id}/decline`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
  }

  async deleteBooking(id: string): Promise<ApiResponse<void>> {
    return this.request(`/bookings/${id}`, {
      method: 'DELETE'
    })
  }

  // Users
  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.request('/users')
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.request(`/users/${id}`)
  }

  async getAgents(): Promise<ApiResponse<User[]>> {
    return this.request('/users?role=agent')
  }

  async getVideographers(): Promise<ApiResponse<User[]>> {
    return this.request('/users?role=videographer')
  }

  // Analytics (for managers)
  async getAnalytics(dateFrom?: string, dateTo?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (dateFrom) params.append('date_from', dateFrom)
    if (dateTo) params.append('date_to', dateTo)
    
    const queryString = params.toString()
    return this.request(`/analytics${queryString ? `?${queryString}` : ''}`)
  }

  // Notifications
  async sendNotification(bookingId: string, type: string): Promise<ApiResponse<void>> {
    return this.request('/notifications/send', {
      method: 'POST',
      body: JSON.stringify({ booking_id: bookingId, type })
    })
  }
}

export const productionAPI = new ProductionAPI()

// Environment check - returns true if we should use production API
export function useProductionAPI(): boolean {
  const mode = env.MODE ?? env.VITE_NODE_ENV ?? 'development'
  if (mode === 'production') {
    return true
  }

  const rawFlag = env.VITE_USE_PRODUCTION_API ?? env.REACT_APP_USE_PRODUCTION_API
  if (!rawFlag) {
    return false
  }

  const normalized = rawFlag.toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on'
}