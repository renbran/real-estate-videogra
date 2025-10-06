// API configuration and authentication service  
const API_BASE_URL = import.meta.env.MODE === 'production'
  ? 'https://your-backend-domain.com/api'  // You'll update this with your actual domain
  : 'http://localhost:3001/api'

// API request helper with error handling
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Add auth token if available
  const token = getAuthToken()
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    }
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }))
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API Request failed:', error)
    throw error
  }
}

// Token management
function getAuthToken(): string | null {
  return localStorage.getItem('videoPro_authToken')
}

function setAuthToken(token: string): void {
  localStorage.setItem('videoPro_authToken', token)
}

function removeAuthToken(): void {
  localStorage.removeItem('videoPro_authToken')
}

// Authentication API calls
export const authAPI = {
  async login(email: string, password: string = 'demo123') {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    if (response.token) {
      setAuthToken(response.token)
    }
    
    return response
  },

  async register(userData: {
    email: string
    password: string
    name: string
    role: string
    tier?: string
  }) {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  async getCurrentUser() {
    return await apiRequest('/auth/me')
  },

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch (error) {
      // Continue with local logout even if API call fails
      console.warn('Logout API call failed:', error)
    } finally {
      removeAuthToken()
      localStorage.removeItem('videoPro_currentUser')
    }
  },

  async refreshToken() {
    const response = await apiRequest('/auth/refresh', { method: 'POST' })
    if (response.token) {
      setAuthToken(response.token)
    }
    return response
  }
}

// Booking API calls
export const bookingAPI = {
  async getBookings(filters?: { status?: string; agent_id?: string }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.agent_id) params.append('agent_id', filters.agent_id)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return await apiRequest(`/bookings${query}`)
  },

  async createBooking(bookingData: any) {
    return await apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    })
  },

  async updateBooking(bookingId: string, updates: any) {
    return await apiRequest(`/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  async deleteBooking(bookingId: string) {
    return await apiRequest(`/bookings/${bookingId}`, {
      method: 'DELETE',
    })
  },

  async approveBooking(bookingId: string, notes?: string) {
    return await apiRequest(`/bookings/${bookingId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ manager_notes: notes }),
    })
  },

  async declineBooking(bookingId: string, notes?: string) {
    return await apiRequest(`/bookings/${bookingId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ manager_notes: notes }),
    })
  }
}

// User API calls  
export const userAPI = {
  async getUsers() {
    return await apiRequest('/users')
  },

  async getUserById(userId: string) {
    return await apiRequest(`/users/${userId}`)
  },

  async updateUser(userId: string, userData: any) {
    return await apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }
}

export { apiRequest, getAuthToken }