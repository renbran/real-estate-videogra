export type UserRole = 'agent' | 'manager' | 'videographer' | 'admin'

export type PropertyValue = 'under_500k' | '500k_1m' | '1m_2m' | 'over_2m'

export type ShootComplexity = 'quick' | 'standard' | 'complex'

export type GeographicZone = 'north' | 'south' | 'east' | 'west' | 'central'

export type PropertyAccess = 'vacant_lockbox' | 'vacant_key' | 'occupied_agent' | 'occupied_key'

export type BookingStatus = 'pending' | 'approved' | 'declined' | 'completed' | 'cancelled'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  tier?: 'standard' | 'premium' | 'elite'
  performance_score?: number
  monthly_quota?: number
  monthly_used?: number
}

export interface Agent {
  id: string
  name: string
  email: string
  tier: 'standard' | 'premium' | 'elite'
  performance_score: number
  monthly_quota: number
  monthly_used: number
  total_bookings: number
}

export interface BookingRequest {
  id: string
  agent_id: string
  agent_name: string
  property_address: string
  property_value: PropertyValue
  shoot_complexity: ShootComplexity
  geographic_zone: GeographicZone
  property_access: PropertyAccess
  preferred_date: string
  backup_dates: string[]
  is_flexible: boolean
  special_requirements?: string
  priority_score: number
  status: BookingStatus
  created_at: string
  updated_at: string
  estimated_duration: number
  actual_duration?: number
  videographer_id?: string
  scheduled_date?: string
  scheduled_time?: string
  manager_notes?: string
  coordinates?: { lat: number; lng: number }
}

export interface ScheduleSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  booking_id: string
  videographer_id: string
  travel_time_before: number
  travel_time_after: number
}

export interface PerformanceMetrics {
  agent_id: string
  accurate_estimates: number
  property_ready_on_time: number
  flexible_for_optimization: number
  inaccurate_estimates: number
  access_issues: number
  last_minute_cancellations: number
  total_score: number
}

export interface OptimizationSuggestion {
  id: string
  type: 'batching' | 'route_optimization' | 'date_change'
  title: string
  description: string
  potential_savings: string
  affected_bookings: string[]
  status: 'pending' | 'accepted' | 'declined'
}

export const SHOOT_COMPLEXITIES: Record<ShootComplexity, { 
  label: string
  duration: number
  description: string 
}> = {
  quick: {
    label: 'Quick (30-45 min)',
    duration: 45,
    description: 'Exterior only, vacant, easy access'
  },
  standard: {
    label: 'Standard (90 min)',
    duration: 90,
    description: 'Interior/exterior, vacant'
  },
  complex: {
    label: 'Complex (3+ hrs)',
    duration: 180,
    description: 'Occupied, staging, drone, twilight'
  }
}

export const PROPERTY_VALUES: Record<PropertyValue, { 
  label: string
  priority_points: number 
}> = {
  under_500k: { label: 'Under $500K', priority_points: 5 },
  '500k_1m': { label: '$500K - $1M', priority_points: 10 },
  '1m_2m': { label: '$1M - $2M', priority_points: 20 },
  over_2m: { label: '$2M+', priority_points: 25 }
}

export const AGENT_TIERS: Record<string, { 
  label: string
  priority_points: number
  monthly_quota: number
}> = {
  standard: { label: 'Standard', priority_points: 5, monthly_quota: 2 },
  premium: { label: 'Premium', priority_points: 10, monthly_quota: 4 },
  elite: { label: 'Elite', priority_points: 15, monthly_quota: 8 }
}

export const SAMPLE_AGENTS: Agent[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.j@realty.com', tier: 'elite', performance_score: 85, monthly_quota: 8, monthly_used: 2, total_bookings: 45 },
  { id: '2', name: 'Mike Chen', email: 'mike.c@realty.com', tier: 'premium', performance_score: 78, monthly_quota: 4, monthly_used: 1, total_bookings: 32 },
  { id: '3', name: 'Emily Rodriguez', email: 'emily.r@realty.com', tier: 'standard', performance_score: 72, monthly_quota: 2, monthly_used: 0, total_bookings: 18 },
  { id: '4', name: 'David Thompson', email: 'david.t@realty.com', tier: 'premium', performance_score: 80, monthly_quota: 4, monthly_used: 3, total_bookings: 38 },
  { id: '5', name: 'Jessica Liu', email: 'jessica.l@realty.com', tier: 'elite', performance_score: 92, monthly_quota: 8, monthly_used: 1, total_bookings: 67 }
]