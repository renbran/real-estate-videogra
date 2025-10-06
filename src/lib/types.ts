export type UserRole = 'agent' | 'manager' | 'videographer' | 'admin'

export type ShootCategory = 'property' | 'personal' | 'company_event' | 'marketing_content' | 'special_project'

export type PropertyValue = 'under_500k' | '500k_1m' | '1m_2m' | 'over_2m'

export type ShootComplexity = 'quick' | 'standard' | 'complex'

export type PersonalShootType = 'headshot' | 'team_photo' | 'personal_branding' | 'portfolio'

export type PersonalShootSize = 'single' | 'small_group' | 'medium_group' | 'large_group'

export type PersonalShootLocation = 'office_studio' | 'on_location' | 'outdoor'

export type PersonalShootDuration = 'thirty_min' | 'one_hour' | 'two_hours'

export type CompanyEventType = 'conference' | 'award_ceremony' | 'office_party' | 'team_building' | 'open_house' | 'launch_event'

export type CompanyEventDuration = 'short' | 'half_day' | 'full_day' | 'multi_day'

export type CompanyEventCoverage = 'highlights' | 'full_coverage' | 'live_streaming'

export type MarketingContentType = 'testimonial' | 'promotional' | 'social_media' | 'training'

export type MarketingScriptStatus = 'ready' | 'in_progress' | 'need_help'

export type MarketingLocation = 'office' | 'on_location' | 'multiple_locations'

export type SpecialProjectComplexity = 'low' | 'medium' | 'high'

export type SpecialProjectDeadline = 'flexible' | 'firm' | 'urgent'

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
  
  // Common fields across all categories
  shoot_category: ShootCategory
  location_address: string
  preferred_date: string
  backup_dates: string[]
  is_flexible: boolean
  special_requirements?: string
  
  // Property shoot specific fields
  property_value?: PropertyValue
  shoot_complexity?: ShootComplexity
  geographic_zone?: GeographicZone
  property_access?: PropertyAccess
  property_status?: 'vacant' | 'occupied'
  
  // Personal shoot specific fields
  personal_shoot_type?: PersonalShootType
  personal_shoot_size?: PersonalShootSize
  personal_shoot_location?: PersonalShootLocation
  personal_shoot_duration?: PersonalShootDuration
  outfit_changes_needed?: boolean
  
  // Company event specific fields
  company_event_type?: CompanyEventType
  company_event_duration?: CompanyEventDuration
  company_event_coverage?: CompanyEventCoverage
  expected_attendees?: number
  event_organizer?: string
  video_deliverable_needs?: string
  
  // Marketing content specific fields
  marketing_content_type?: MarketingContentType
  marketing_duration?: string
  talent_participants?: string
  script_status?: MarketingScriptStatus
  marketing_location?: MarketingLocation
  
  // Special project specific fields
  project_description?: string
  project_complexity?: SpecialProjectComplexity
  custom_requirements?: string
  deadline_criticality?: SpecialProjectDeadline
  
  // System fields
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
  formatted_address?: string
  place_id?: string
  address_components?: GoogleAddressComponent[]
}

export interface GoogleAddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

export interface GooglePlacePrediction {
  description: string
  place_id: string
  matched_substrings: Array<{
    length: number
    offset: number
  }>
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  types: string[]
}

export interface RouteOptimizationResult {
  optimized_order: string[]
  total_distance: number
  total_duration: number
  waypoints: Array<{
    booking_id: string
    coordinates: { lat: number; lng: number }
    address: string
    duration_minutes: number
  }>
  traffic_aware: boolean
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

export const SHOOT_CATEGORIES: Record<ShootCategory, { 
  label: string
  description: string
  icon: string
}> = {
  property: {
    label: 'Property Shoot',
    description: 'Real estate listings and property marketing',
    icon: '🏠'
  },
  personal: {
    label: 'Personal Shoot',
    description: 'Agent headshots, team photos, personal branding',
    icon: '👤'
  },
  company_event: {
    label: 'Company Event',
    description: 'Office events, conferences, award ceremonies',
    icon: '🎉'
  },
  marketing_content: {
    label: 'Marketing Content',
    description: 'Promotional videos, testimonials, brand content',
    icon: '📹'
  },
  special_project: {
    label: 'Special Project',
    description: 'Custom requests and one-off productions',
    icon: '⭐'
  }
}

export const PERSONAL_SHOOT_TYPES: Record<PersonalShootType, { label: string }> = {
  headshot: { label: 'Professional Headshot' },
  team_photo: { label: 'Team Photo' },
  personal_branding: { label: 'Personal Branding' },
  portfolio: { label: 'Portfolio Shoot' }
}

export const PERSONAL_SHOOT_SIZES: Record<PersonalShootSize, { label: string; max_people: number }> = {
  single: { label: '1 Person', max_people: 1 },
  small_group: { label: '2-5 People', max_people: 5 },
  medium_group: { label: '6-10 People', max_people: 10 },
  large_group: { label: 'Large Group (10+)', max_people: 999 }
}

export const PERSONAL_SHOOT_LOCATIONS: Record<PersonalShootLocation, { label: string }> = {
  office_studio: { label: 'Office Studio' },
  on_location: { label: 'On-Location' },
  outdoor: { label: 'Outdoor Location' }
}

export const PERSONAL_SHOOT_DURATIONS: Record<PersonalShootDuration, { label: string; minutes: number }> = {
  thirty_min: { label: '30 Minutes', minutes: 30 },
  one_hour: { label: '1 Hour', minutes: 60 },
  two_hours: { label: '2 Hours', minutes: 120 }
}

export const COMPANY_EVENT_TYPES: Record<CompanyEventType, { label: string }> = {
  conference: { label: 'Conference' },
  award_ceremony: { label: 'Award Ceremony' },
  office_party: { label: 'Office Party' },
  team_building: { label: 'Team Building Event' },
  open_house: { label: 'Open House' },
  launch_event: { label: 'Launch Event' }
}

export const COMPANY_EVENT_DURATIONS: Record<CompanyEventDuration, { label: string; hours: number }> = {
  short: { label: '1-2 Hours', hours: 2 },
  half_day: { label: 'Half Day (4 hours)', hours: 4 },
  full_day: { label: 'Full Day (8 hours)', hours: 8 },
  multi_day: { label: 'Multi-Day Event', hours: 16 }
}

export const COMPANY_EVENT_COVERAGE: Record<CompanyEventCoverage, { label: string }> = {
  highlights: { label: 'Highlights Only' },
  full_coverage: { label: 'Full Event Coverage' },
  live_streaming: { label: 'Live Streaming' }
}

export const MARKETING_CONTENT_TYPES: Record<MarketingContentType, { label: string }> = {
  testimonial: { label: 'Client Testimonial' },
  promotional: { label: 'Promotional Video' },
  social_media: { label: 'Social Media Content' },
  training: { label: 'Training Video' }
}

export const MARKETING_SCRIPT_STATUS: Record<MarketingScriptStatus, { label: string }> = {
  ready: { label: 'Script Ready' },
  in_progress: { label: 'Script In Progress' },
  need_help: { label: 'Need Script Help' }
}

export const MARKETING_LOCATIONS: Record<MarketingLocation, { label: string }> = {
  office: { label: 'Office Location' },
  on_location: { label: 'On-Location' },
  multiple_locations: { label: 'Multiple Locations' }
}

export const SPECIAL_PROJECT_COMPLEXITY: Record<SpecialProjectComplexity, { label: string }> = {
  low: { label: 'Low Complexity' },
  medium: { label: 'Medium Complexity' },
  high: { label: 'High Complexity' }
}

export const SPECIAL_PROJECT_DEADLINES: Record<SpecialProjectDeadline, { label: string }> = {
  flexible: { label: 'Flexible Timeline' },
  firm: { label: 'Firm Deadline' },
  urgent: { label: 'Urgent - ASAP' }
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