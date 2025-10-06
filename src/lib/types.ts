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

export type MarketingLocation = 'office' | 'on_location' | 'multiple_locations'

export type ScriptStatus = 'ready' | 'in_progress' | 'need_help'

export type SpecialProjectComplexity = 'low' | 'medium' | 'high'

export type SpecialProjectDeadline = 'flexible' | 'firm' | 'urgent'

export type PropertyAccess = 'vacant_lockbox' | 'vacant_key' | 'occupied_agent_required'

export type PropertyType = 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'commercial' | 'land'

export type BookingStatus = 'pending' | 'approved' | 'declined' | 'completed' | 'cancelled'

export type GeographicZone = 'north' | 'south' | 'east' | 'west' | 'central'

export type AgentTier = 'standard' | 'premium' | 'elite'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  tier?: AgentTier // For agents
  agent_tier?: AgentTier // For backward compatibility
  monthly_quota?: number
  monthly_used?: number
  performance_score?: number
  created_at: string
}

export interface BookingRequest {
  id: string
  agent_id: string
  shoot_category: ShootCategory
  preferred_date: string
  backup_dates: string[]
  is_flexible: boolean
  location: string // Generic location for all categories
  property_address?: string // For backward compatibility and property shoots
  special_requirements?: string
  
  // Property shoot specific fields
  property_value?: PropertyValue
  property_type?: PropertyType
  bedrooms?: number
  shoot_complexity?: ShootComplexity
  geographic_zone?: GeographicZone
  property_status?: 'vacant' | 'occupied'
  access_method?: PropertyAccess
  
  // Personal shoot specific fields
  personal_shoot_type?: PersonalShootType
  personal_shoot_size?: PersonalShootSize
  personal_shoot_location?: PersonalShootLocation
  personal_shoot_duration?: PersonalShootDuration
  outfit_changes?: boolean
  
  // Company event specific fields
  company_event_type?: CompanyEventType
  company_event_duration?: CompanyEventDuration
  coverage_type?: CompanyEventCoverage
  expected_attendees?: number
  event_organizer?: string
  
  // Marketing content specific fields
  marketing_content_type?: MarketingContentType
  talent_participants?: string
  script_status?: ScriptStatus
  marketing_location?: MarketingLocation
  
  // Special project specific fields
  project_description?: string
  project_complexity?: SpecialProjectComplexity
  deadline_criticality?: SpecialProjectDeadline
  
  // System fields
  status: BookingStatus
  priority_score?: number
  created_at: string
  updated_at: string
  scheduled_date?: string
  scheduled_time?: string // Additional time field for scheduling
  manager_notes?: string
  
  // Google Maps integration fields
  formatted_address?: string
  address_components?: GoogleAddressComponent[]
  place_id?: string
  latitude?: number
  longitude?: number
  coordinates?: { lat: number; lng: number } // For easier access
  
  // Additional fields that are referenced in components
  agent_name?: string // Computed/joined field
  estimated_duration?: number // Duration in minutes
  actual_duration?: number // Actual time taken
  videographer_id?: string // Assigned videographer
  property_access?: PropertyAccess // Access method for property
}

export interface GoogleAddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

export interface GooglePlacePrediction {
  description: string
  matched_substrings: Array<{
    length: number
    offset: number
  }>
  place_id: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  types: string[]
}

export interface RouteOptimization {
  optimized_order: string[]
  total_duration: number
  total_distance: number
  waypoints: Array<{
    booking_id: string
    name: string
    address: string
    latitude: number
    longitude: number
  }>
}

// Alias for backward compatibility
export type RouteOptimizationResult = RouteOptimization

export interface ScheduleBlock {
  id: string
  date: string
  start_time: string
  end_time: string
  booking_ids: string[]
  videographer_id: string
  total_shoot_time: number
  travel_time_after: number
}

export interface AgentPerformance {
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
  type: 'batching' | 'route_optimization' | 'schedule_shift'
  title: string
  description: string
  potential_savings: string
  affected_bookings: string[]
  priority: 'low' | 'medium' | 'high'
}

// Constants and lookup objects
export const SHOOT_CATEGORIES: Record<ShootCategory, {
  label: string
  icon: string
  description: string
}> = {
  property: {
    label: 'Property Shoot',
    icon: '🏠',
    description: 'Real estate listings photography and video'
  },
  personal: {
    label: 'Personal Shoot',
    icon: '👤',
    description: 'Agent headshots, team photos, personal branding'
  },
  company_event: {
    label: 'Company Event',
    icon: '🎉',
    description: 'Office events, awards, conferences, milestones'
  },
  marketing_content: {
    label: 'Marketing Content',
    icon: '📹',
    description: 'Promotional videos, testimonials, brand content'
  },
  special_project: {
    label: 'Special Project',
    icon: '⭐',
    description: 'Custom requests and one-off productions'
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
  large_group: { label: 'Large Group (10+)', max_people: 50 }
}

export const PERSONAL_SHOOT_LOCATIONS: Record<PersonalShootLocation, { label: string }> = {
  office_studio: { label: 'Office Studio' },
  on_location: { label: 'On Location' },
  outdoor: { label: 'Outdoor Setting' }
}

export const PERSONAL_SHOOT_DURATIONS: Record<PersonalShootDuration, { label: string; minutes: number }> = {
  thirty_min: { label: '30 minutes', minutes: 30 },
  one_hour: { label: '1 hour', minutes: 60 },
  two_hours: { label: '2 hours', minutes: 120 }
}

export const COMPANY_EVENT_TYPES: Record<CompanyEventType, { label: string }> = {
  conference: { label: 'Conference' },
  award_ceremony: { label: 'Award Ceremony' },
  office_party: { label: 'Office Party' },
  team_building: { label: 'Team Building' },
  open_house: { label: 'Open House' },
  launch_event: { label: 'Launch Event' }
}

export const COMPANY_EVENT_DURATIONS: Record<CompanyEventDuration, { label: string; hours: number }> = {
  short: { label: '1-2 hours', hours: 2 },
  half_day: { label: 'Half day (4 hours)', hours: 4 },
  full_day: { label: 'Full day (8 hours)', hours: 8 },
  multi_day: { label: 'Multi-day event', hours: 16 }
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

export const SCRIPT_STATUSES: Record<ScriptStatus, { label: string }> = {
  ready: { label: 'Script Ready' },
  in_progress: { label: 'Script In Progress' },
  need_help: { label: 'Need Help with Script' }
}

export const MARKETING_LOCATIONS: Record<MarketingLocation, { label: string }> = {
  office: { label: 'Office Location' },
  on_location: { label: 'On Location' },
  multiple_locations: { label: 'Multiple Locations' }
}

export const SPECIAL_PROJECT_COMPLEXITIES: Record<SpecialProjectComplexity, { label: string }> = {
  low: { label: 'Low Complexity' },
  medium: { label: 'Medium Complexity' },
  high: { label: 'High Complexity' }
}

export const SPECIAL_PROJECT_DEADLINES: Record<SpecialProjectDeadline, { label: string }> = {
  flexible: { label: 'Flexible Timeline' },
  firm: { label: 'Firm Deadline' },
  urgent: { label: 'Urgent Request' }
}

export const SHOOT_COMPLEXITIES: Record<ShootComplexity, {
  label: string
  description: string
  duration: number
  priority_bonus: number
}> = {
  quick: {
    label: 'Quick Shoot',
    description: 'Exterior only, vacant property, easy access',
    duration: 45,
    priority_bonus: 0
  },
  standard: {
    label: 'Standard Shoot',
    description: 'Interior/exterior photography, vacant property',
    duration: 90,
    priority_bonus: 5
  },
  complex: {
    label: 'Complex Shoot',
    description: 'Occupied property, staging, drone, twilight shots',
    duration: 180,
    priority_bonus: 10
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

export const AGENT_TIERS: Record<AgentTier, {
  label: string
  priority_points: number
  monthly_quota: number
}> = {
  standard: { label: 'Standard Agent', priority_points: 5, monthly_quota: 2 },
  premium: { label: 'Premium Agent', priority_points: 10, monthly_quota: 4 },
  elite: { label: 'Elite Agent', priority_points: 15, monthly_quota: 6 }
}

export const PROPERTY_TYPES: Record<PropertyType, { label: string }> = {
  single_family: { label: 'Single Family Home' },
  condo: { label: 'Condominium' },
  townhouse: { label: 'Townhouse' },
  multi_family: { label: 'Multi-family' },
  commercial: { label: 'Commercial Property' },
  land: { label: 'Land/Lot' }
}

// Sample agents for the system
export const SAMPLE_AGENTS: User[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@realestate.com', role: 'agent', agent_tier: 'elite', monthly_quota: 6, monthly_used: 2, performance_score: 95, created_at: '2024-01-01' },
  { id: '2', name: 'Mike Chen', email: 'mike@realestate.com', role: 'agent', agent_tier: 'premium', monthly_quota: 4, monthly_used: 1, performance_score: 88, created_at: '2024-01-01' },
  { id: '3', name: 'Lisa Rodriguez', email: 'lisa@realestate.com', role: 'agent', agent_tier: 'standard', monthly_quota: 2, monthly_used: 0, performance_score: 82, created_at: '2024-01-01' },
  { id: '4', name: 'David Thompson', email: 'david@realestate.com', role: 'agent', agent_tier: 'premium', monthly_quota: 4, monthly_used: 3, performance_score: 91, created_at: '2024-01-01' },
  { id: '5', name: 'Emily Wilson', email: 'emily@realestate.com', role: 'agent', agent_tier: 'standard', monthly_quota: 2, monthly_used: 1, performance_score: 79, created_at: '2024-01-01' }
]