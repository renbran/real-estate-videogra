import { BookingRequest, User } from '@/lib/types'

export interface Notification {
  id: string
  type: 'booking_submitted' | 'booking_approved' | 'booking_declined' | 'booking_scheduled' | 'booking_completed' | 'urgent_request' | 'system_update'
  title: string
  message: string
  booking_id?: string
  user_id: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  read: boolean
  created_at: string
  action_url?: string
}

// Demo notifications showing the complete workflow
export const DEMO_NOTIFICATIONS: Notification[] = [
  // Recent urgent notifications
  {
    id: 'notif-001',
    type: 'urgent_request',
    title: 'URGENT: Same-Day Booking Request',
    message: 'Sarah Johnson submitted a high-priority booking for Beverly Hills luxury property. Listing goes live tomorrow.',
    booking_id: 'VB-009',
    user_id: '6', // Manager
    priority: 'urgent',
    read: false,
    created_at: '2025-10-06T16:16:00Z',
    action_url: '/bookings/VB-009'
  },
  {
    id: 'notif-002',
    type: 'booking_submitted',
    title: 'New Event Booking Request',
    message: 'Jessica Williams submitted a networking event booking for Santa Monica rooftop venue.',
    booking_id: 'VB-008',
    user_id: '6', // Manager
    priority: 'medium',
    read: false,
    created_at: '2025-10-06T15:46:00Z',
    action_url: '/bookings/VB-008'
  },

  // Videographer notifications
  {
    id: 'notif-003',
    type: 'booking_scheduled',
    title: 'Malibu Shoot Confirmed for Tomorrow',
    message: 'Pacific Coast Highway luxury property shoot scheduled for 4:00 PM. Sunset timing critical.',
    booking_id: 'VB-003',
    user_id: '8', // Chris Martinez
    priority: 'high',
    read: false,
    created_at: '2025-10-06T15:21:00Z',
    action_url: '/schedule/VB-003'
  },
  {
    id: 'notif-004',
    type: 'booking_scheduled',
    title: 'Team Headshots Scheduled',
    message: 'Corporate headshot session for 5 new agents scheduled for 10:00 AM at downtown studio.',
    booking_id: 'VB-004',
    user_id: '9', // Jordan Taylor
    priority: 'medium',
    read: false,
    created_at: '2025-10-06T14:46:00Z',
    action_url: '/schedule/VB-004'
  },

  // Agent notifications
  {
    id: 'notif-005',
    type: 'booking_approved',
    title: 'Marketing Content Shoot Approved',
    message: 'Your Instagram Reels project has been approved. Scheduling coordinator will contact you shortly.',
    booking_id: 'VB-005',
    user_id: '4', // David Rodriguez
    priority: 'medium',
    read: true,
    created_at: '2025-10-06T16:31:00Z'
  },
  {
    id: 'notif-006',
    type: 'booking_completed',
    title: 'Beverly Hills Shoot Completed',
    message: 'Your luxury property shoot is complete! 4K footage and edited highlights will be delivered within 24 hours.',
    booking_id: 'VB-001',
    user_id: '1', // Sarah Johnson
    priority: 'low',
    read: true,
    created_at: '2025-10-01T18:31:00Z'
  },

  // System updates
  {
    id: 'notif-007',
    type: 'system_update',
    title: 'New Route Optimization Feature',
    message: 'AI-powered route optimization is now available! Save time and fuel costs on multi-location shoots.',
    user_id: '6', // Manager
    priority: 'low',
    read: true,
    created_at: '2025-10-05T09:00:00Z',
    action_url: '/features/route-optimization'
  },
  {
    id: 'notif-008',
    type: 'booking_declined',
    title: 'Remote Location Booking Declined',
    message: 'Your Big Sur cabin booking was declined due to distance and timing constraints. Please contact management for alternatives.',
    booking_id: 'VB-010',
    user_id: '5', // Emily Davis
    priority: 'medium',
    read: true,
    created_at: '2025-10-05T17:31:00Z'
  }
]

// Analytics data for comprehensive reporting
export const DEMO_ANALYTICS = {
  monthly_stats: {
    total_bookings: 47,
    completed_shoots: 42,
    revenue_generated: 89250,
    client_satisfaction: 4.8,
    average_turnaround: '18 hours'
  },
  booking_trends: {
    property_shoots: 32,
    event_coverage: 8,
    marketing_content: 4,
    headshot_sessions: 3
  },
  agent_performance: [
    { name: 'Sarah Johnson', bookings: 12, revenue: 28500, tier: 'elite' },
    { name: 'Michael Chen', bookings: 9, revenue: 19800, tier: 'premium' },
    { name: 'David Rodriguez', bookings: 8, revenue: 17250, tier: 'premium' },
    { name: 'Jessica Williams', bookings: 6, revenue: 12400, tier: 'standard' },
    { name: 'Emily Davis', bookings: 5, revenue: 9300, tier: 'standard' }
  ],
  revenue_by_category: [
    { category: 'Luxury Properties', revenue: 45200, percentage: 51 },
    { category: 'Corporate Events', revenue: 22100, percentage: 25 },
    { category: 'Marketing Content', revenue: 12800, percentage: 14 },
    { category: 'Standard Properties', revenue: 9150, percentage: 10 }
  ],
  time_efficiency: {
    average_shoot_duration: '3.2 hours',
    travel_time_saved: '24%',
    same_day_delivery: '89%',
    client_revision_rate: '12%'
  }
}

// Demo mode configuration
export const DEMO_MODE_CONFIG = {
  guided_tour: true,
  show_tooltips: true,
  highlight_features: true,
  auto_play_scenarios: false,
  demo_data_refresh: true
}

export const DEMO_SCENARIOS = [
  {
    id: 'urgent-booking',
    title: 'Urgent High-Value Property',
    description: 'Experience how the system handles rush bookings for premium properties',
    steps: [
      'Agent submits urgent booking request',
      'System calculates priority score (96/100)',
      'Manager receives immediate notification',
      'Fast-track approval process',
      'Automatic videographer assignment',
      'Client receives confirmation'
    ]
  },
  {
    id: 'route-optimization',
    title: 'Multi-Location Efficiency',
    description: 'See how AI optimizes travel routes for multiple shoots',
    steps: [
      'Multiple bookings in same area',
      'System identifies clustering opportunity',
      'AI calculates optimal route',
      'Suggests combined shooting schedule',
      'Reduces travel time by 40%',
      'Increases daily capacity'
    ]
  },
  {
    id: 'complete-workflow',
    title: 'End-to-End Process',
    description: 'Follow a booking from submission to delivery',
    steps: [
      'Agent creates detailed booking',
      'System validates requirements',
      'Manager reviews and approves',
      'Videographer receives assignment',
      'Shoot execution and completion',
      'Automated delivery to client'
    ]
  }
]