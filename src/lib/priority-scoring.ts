import { BookingRequest, PROPERTY_VALUES, AGENT_TIERS, Agent } from './types'

export function calculatePriorityScore(
  booking: Partial<BookingRequest>,
  agent: Agent
): number {
  let score = 0

  // Property value points (25 points max)
  if (booking.property_value) {
    score += PROPERTY_VALUES[booking.property_value].priority_points
  }

  // Agent tier points (15 points max)
  score += AGENT_TIERS[agent.tier].priority_points

  // Historical usage points (15 points max)
  // Lower usage = higher priority
  const usageRatio = agent.monthly_used / agent.monthly_quota
  if (usageRatio === 0) {
    score += 15 // No bookings used
  } else if (usageRatio <= 0.25) {
    score += 12 // 25% or less used
  } else if (usageRatio <= 0.5) {
    score += 8 // 50% or less used
  } else if (usageRatio <= 0.75) {
    score += 4 // 75% or less used
  }
  // No points if over 75% used

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

  // Performance score adjustment (-10 to +10 points)
  const performanceAdjustment = Math.round((agent.performance_score - 75) / 5)
  score += Math.max(-10, Math.min(10, performanceAdjustment))

  return Math.max(0, score)
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

  // Property value
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

  // Agent tier
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

  // Advance notice
  let noticePoints = 0
  let noticeDesc = 'Not specified'
  
  if (booking.preferred_date) {
    const preferredDate = new Date(booking.preferred_date)
    const now = new Date()
    const daysInAdvance = Math.ceil((preferredDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysInAdvance >= 7) {
      noticePoints = 10
      noticeDesc = '7+ days advance notice'
    } else if (daysInAdvance >= 3) {
      noticePoints = 6
      noticeDesc = '3-6 days advance notice'
    } else if (daysInAdvance >= 1) {
      noticePoints = 3
      noticeDesc = '1-2 days advance notice'
    } else {
      noticePoints = 0
      noticeDesc = 'Less than 1 day notice'
    }
  }

  breakdown.push({
    category: 'Advance Notice',
    points: noticePoints,
    max: 10,
    description: noticeDesc
  })

  // Flexibility
  const flexibilityPoints = booking.is_flexible ? 5 : 0
  breakdown.push({
    category: 'Flexibility',
    points: flexibilityPoints,
    max: 5,
    description: booking.is_flexible ? 'Flexible for optimization' : 'Fixed date required'
  })

  // Performance
  const performanceAdjustment = Math.round((agent.performance_score - 75) / 5)
  const performancePoints = Math.max(-10, Math.min(10, performanceAdjustment))
  breakdown.push({
    category: 'Performance Score',
    points: performancePoints,
    max: 10,
    description: `Score: ${agent.performance_score}/100 (${performancePoints > 0 ? '+' : ''}${performancePoints})`
  })

  return breakdown
}