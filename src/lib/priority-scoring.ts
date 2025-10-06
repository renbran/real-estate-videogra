import { BookingRequest, PROPERTY_VALUES, AGENT_TIERS, Agent, ShootCategory } from './types'

export function calculatePriorityScore(
  booking: Partial<BookingRequest>,
  agent: Agent
): number {
  if (!booking.shoot_category) return 0

  let score = 0

  // Category-specific scoring
  switch (booking.shoot_category) {
    case 'property':
      score += calculatePropertyScore(booking)
      break
    case 'personal':
      score += calculatePersonalScore(booking, agent)
      break
    case 'company_event':
      score += calculateCompanyEventScore(booking)
      break
    case 'marketing_content':
      score += calculateMarketingScore(booking)
      break
    case 'special_project':
      score += calculateSpecialProjectScore(booking)
      break
  }

  // Common scoring factors across all categories
  
  // Agent tier points (varies by category)
  const tierMultiplier = booking.shoot_category === 'company_event' ? 0.5 : 1 // Company events care less about agent tier
  score += AGENT_TIERS[agent.tier].priority_points * tierMultiplier

  // Historical usage points (15 points max)
  const usageRatio = agent.monthly_used / agent.monthly_quota
  if (usageRatio === 0) {
    score += 15
  } else if (usageRatio <= 0.25) {
    score += 12
  } else if (usageRatio <= 0.5) {
    score += 8
  } else if (usageRatio <= 0.75) {
    score += 4
  }

  // Advance notice points (10 points max)
  if (booking.preferred_date) {
    const preferredDate = new Date(booking.preferred_date)
    const now = new Date()
    const daysInAdvance = Math.ceil((preferredDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysInAdvance >= 7) {
      score += 10
    } else if (daysInAdvance >= 3) {
      score += 6
    } else if (daysInAdvance >= 1) {
      score += 3
    }
  }

  // Flexibility bonus (5 points)
  if (booking.is_flexible) {
    score += 5
  }

  // Performance score adjustment (-10 to +10 points) - less impact for company events
  const performanceMultiplier = booking.shoot_category === 'company_event' ? 0.3 : 1
  const performanceAdjustment = Math.round((agent.performance_score - 75) / 5) * performanceMultiplier
  score += Math.max(-10, Math.min(10, performanceAdjustment))

  return Math.max(0, Math.round(score))
}

function calculatePropertyScore(booking: Partial<BookingRequest>): number {
  let score = 0
  
  // Property value points (25 points max)
  if (booking.property_value) {
    score += PROPERTY_VALUES[booking.property_value].priority_points
  }
  
  // Urgency/complexity bonus
  if (booking.shoot_complexity === 'complex') {
    score += 10 // Complex shoots get priority
  }
  
  return score
}

function calculatePersonalScore(booking: Partial<BookingRequest>, agent: Agent): number {
  let score = 0
  
  // Business need assessment (20 points max)
  if (booking.personal_shoot_type === 'headshot') {
    score += 20 // Professional headshots have high business value
  } else if (booking.personal_shoot_type === 'team_photo') {
    score += 15
  } else if (booking.personal_shoot_type === 'personal_branding') {
    score += 12
  } else {
    score += 8
  }
  
  // Time since last personal shoot (15 points max)
  // This would need to be calculated from historical data
  // For now, give standard 10 points
  score += 10
  
  return score
}

function calculateCompanyEventScore(booking: Partial<BookingRequest>): number {
  // Company events get high base priority (90 points)
  let score = 90
  
  // Event importance bonus
  if (booking.company_event_type === 'conference' || booking.company_event_type === 'award_ceremony') {
    score += 10 // Major events get extra priority
  }
  
  return score
}

function calculateMarketingScore(booking: Partial<BookingRequest>): number {
  let score = 0
  
  // Strategic value (25 points max)
  if (booking.marketing_content_type === 'promotional') {
    score += 25 // High strategic value
  } else if (booking.marketing_content_type === 'testimonial') {
    score += 20
  } else if (booking.marketing_content_type === 'social_media') {
    score += 15
  } else {
    score += 12
  }
  
  // Script readiness bonus (10 points max)
  if (booking.script_status === 'ready') {
    score += 10
  } else if (booking.script_status === 'in_progress') {
    score += 5
  }
  
  return score
}

function calculateSpecialProjectScore(booking: Partial<BookingRequest>): number {
  let score = 0
  
  // Base score for special projects
  score += 40
  
  // Complexity adjustment
  if (booking.project_complexity === 'high') {
    score += 20
  } else if (booking.project_complexity === 'medium') {
    score += 10
  }
  
  // Deadline criticality
  if (booking.deadline_criticality === 'urgent') {
    score += 30
  } else if (booking.deadline_criticality === 'firm') {
    score += 15
  }
  
  return score
}

export function getApprovalStatus(score: number): 'auto_approve' | 'manager_review' | 'auto_decline' {
  if (score >= 80) return 'auto_approve'
  if (score >= 60) return 'manager_review'
  return 'auto_decline'
}

export function getScoreBreakdown(
  booking: Partial<BookingRequest>,
  agent: Agent
): Array<{ category: string; points: number; max: number; description: string }> {
  const breakdown: Array<{ category: string; points: number; max: number; description: string }> = []

  if (!booking.shoot_category) return breakdown

  // Category-specific breakdown
  switch (booking.shoot_category) {
    case 'property':
      const propertyPoints = booking.property_value 
        ? PROPERTY_VALUES[booking.property_value].priority_points 
        : 0
      breakdown.push({
        category: 'Property Value',
        points: propertyPoints,
        max: 25,
        description: booking.property_value 
          ? PROPERTY_VALUES[booking.property_value].label 
          : 'Not specified'
      })
      break

    case 'personal':
      let personalPoints = 0
      let personalDesc = 'Not specified'
      if (booking.personal_shoot_type === 'headshot') {
        personalPoints = 20
        personalDesc = 'Professional headshot - high business value'
      } else if (booking.personal_shoot_type === 'team_photo') {
        personalPoints = 15
        personalDesc = 'Team photo - medium business value'
      }
      breakdown.push({
        category: 'Business Need',
        points: personalPoints,
        max: 20,
        description: personalDesc
      })
      break

    case 'company_event':
      breakdown.push({
        category: 'Company Event Priority',
        points: 90,
        max: 90,
        description: 'Company events receive automatic high priority'
      })
      break

    case 'marketing_content':
      let marketingPoints = 0
      let marketingDesc = 'Not specified'
      if (booking.marketing_content_type === 'promotional') {
        marketingPoints = 25
        marketingDesc = 'Promotional content - high strategic value'
      } else if (booking.marketing_content_type === 'testimonial') {
        marketingPoints = 20
        marketingDesc = 'Client testimonial - good strategic value'
      }
      breakdown.push({
        category: 'Strategic Value',
        points: marketingPoints,
        max: 25,
        description: marketingDesc
      })
      break

    case 'special_project':
      let specialPoints = 40
      let specialDesc = 'Base special project priority'
      if (booking.deadline_criticality === 'urgent') {
        specialPoints += 30
        specialDesc += ' + urgent deadline'
      }
      breakdown.push({
        category: 'Special Project Priority',
        points: specialPoints,
        max: 90,
        description: specialDesc
      })
      break
  }

  // Common factors
  const tierPoints = AGENT_TIERS[agent.tier].priority_points
  breakdown.push({
    category: 'Agent Tier',
    points: tierPoints,
    max: 15,
    description: `${AGENT_TIERS[agent.tier].label} tier`
  })

  // Usage history
  const usageRatio = agent.monthly_used / agent.monthly_quota
  let usagePoints = 0
  let usageDesc = ''
  
  if (usageRatio === 0) {
    usagePoints = 15
    usageDesc = 'No bookings used this month'
  } else if (usageRatio <= 0.25) {
    usagePoints = 12
    usageDesc = '25% or less quota used'
  } else if (usageRatio <= 0.5) {
    usagePoints = 8
    usageDesc = '50% or less quota used'
  } else if (usageRatio <= 0.75) {
    usagePoints = 4
    usageDesc = '75% or less quota used'
  } else {
    usagePoints = 0
    usageDesc = 'Over 75% quota used'
  }

  breakdown.push({
    category: 'Monthly Usage',
    points: usagePoints,
    max: 15,
    description: `${agent.monthly_used}/${agent.monthly_quota} slots - ${usageDesc}`
  })

  return breakdown
}