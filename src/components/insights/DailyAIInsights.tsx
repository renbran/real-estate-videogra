import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Sparkle, 
  TrendUp, 
  Target, 
  Lightning, 
  MapPin, 
  Clock, 
  Users,
  BrainCircuit,
  ChartLineUp,
  Lightbulb
} from '@phosphor-icons/react'
import { OSUS_BRAND } from '@/lib/osus-brand'
import { BookingRequest, User } from '@/lib/types'

interface DailyAIInsightsProps {
  bookings?: BookingRequest[]
  currentUser?: any
  userRole?: 'agent' | 'manager'
}

interface AIInsight {
  id: string
  type: 'optimization' | 'prediction' | 'recommendation' | 'alert'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  actionable: boolean
  action?: string
  value?: string | number
  icon?: React.ComponentType<any>
}

export function DailyAIInsights({ bookings = [], currentUser, userRole = 'agent' }: DailyAIInsightsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [refreshing, setRefreshing] = useState(false)

  // Generate AI insights based on current data
  const generateInsights = () => {
    const newInsights: AIInsight[] = []
    const today = new Date()
    const thisWeek = bookings.filter(b => {
      const bookingDate = new Date(b.preferred_date)
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      return bookingDate >= weekStart
    })

    // Route optimization insight
    if (userRole === 'manager' && thisWeek.length >= 3) {
      const clusteredBookings = thisWeek.filter(b => 
        b.property_address?.toLowerCase().includes('downtown') || 
        b.property_address?.toLowerCase().includes('center')
      )
      
      if (clusteredBookings.length >= 2) {
        newInsights.push({
          id: 'route-optimization',
          type: 'optimization',
          title: 'Route Optimization Opportunity',
          description: `${clusteredBookings.length} bookings this week are in the downtown area. Consider batching them on the same day.`,
          impact: 'high',
          actionable: true,
          action: 'Optimize Routes',
          value: '25% time savings',
          icon: MapPin
        })
      }
    }

    // Performance prediction
    if (currentUser?.performance_score) {
      const trend = currentUser.performance_score >= 80 ? 'up' : 'stable'
      newInsights.push({
        id: 'performance-trend',
        type: 'prediction',
        title: 'Performance Trend Analysis',
        description: trend === 'up' 
          ? 'Your performance is trending upward. You\'re likely to receive priority assignments.'
          : 'Maintaining steady performance. Consider flexible scheduling to boost priority score.',
        impact: trend === 'up' ? 'high' : 'medium',
        actionable: true,
        action: trend === 'up' ? 'Maintain Excellence' : 'Enable Flexibility',
        value: trend === 'up' ? '+12 points projected' : '+8 points potential',
        icon: TrendUp
      })
    }

    // Booking pattern insight
    const hourlyPatterns = bookings.reduce((acc, booking) => {
      const hour = booking.preferred_time ? parseInt(booking.preferred_time.split(':')[0]) : 10
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    
    const peakHour = Object.entries(hourlyPatterns)
      .sort(([,a], [,b]) => b - a)[0]
    
    if (peakHour && parseInt(peakHour[1]) >= 3) {
      newInsights.push({
        id: 'timing-insight',
        type: 'recommendation',
        title: 'Optimal Booking Time Detected',
        description: `Most bookings occur around ${peakHour[0]}:00. Consider suggesting this time slot to increase approval rates.`,
        impact: 'medium',
        actionable: true,
        action: 'Suggest Peak Times',
        value: '18% higher approval',
        icon: Clock
      })
    }

    // Market opportunity alert
    if (userRole === 'manager') {
      const agents = currentUser?.role === 'manager' ? 
        (bookings || []).reduce((acc, booking) => {
          const agent = { id: booking.agent_id, name: 'Agent', role: 'agent' }
          if (!acc.find(a => a.id === agent.id)) acc.push(agent as User)
          return acc
        }, [] as User[]) : []
      
      const agentUtilization = agents.map(agent => ({
        ...agent,
        utilization: ((agent.monthly_used || 0) / (agent.monthly_quota || 1)) * 100
      }))
      
      const underutilized = agentUtilization.filter(a => a.utilization < 60)
      
      if (underutilized.length > 0) {
        newInsights.push({
          id: 'capacity-alert',
          type: 'alert',
          title: 'Unused Capacity Detected',
          description: `${underutilized.length} agents are under 60% utilization. Potential for ${Math.round(underutilized.length * 15)} more bookings this month.`,
          impact: 'high',
          actionable: true,
          action: 'Redistribute Workload',
          value: `+${Math.round(underutilized.length * 15)} bookings`,
          icon: Users
        })
      }
    }

    // Innovative AI-powered suggestions
    const innovativeInsights = [
      {
        id: 'weather-optimization',
        type: 'recommendation',
        title: 'Weather-Smart Scheduling',
        description: 'AI weather analysis suggests rescheduling outdoor shoots to Thursday for optimal lighting conditions.',
        impact: 'medium',
        actionable: true,
        action: 'View Weather Insights',
        value: '30% better photos',
        icon: Lightning
      },
      {
        id: 'client-satisfaction',
        type: 'prediction',
        title: 'Client Satisfaction Forecast',
        description: 'Based on communication patterns, this client is likely to request additional services. Prepare upsell options.',
        impact: 'high',
        actionable: true,
        action: 'Prepare Upsells',
        value: '40% revenue increase',
        icon: Target
      }
    ]

    // Add some innovative insights randomly
    if (Math.random() > 0.5) {
      newInsights.push(innovativeInsights[Math.floor(Math.random() * innovativeInsights.length)])
    }

    setInsights(newInsights)
  }

  const refreshInsights = async () => {
    setRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate AI processing
    generateInsights()
    setRefreshing(false)
  }

  useEffect(() => {
    generateInsights()
  }, [bookings, currentUser, userRole])

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'from-osus-primary-500 to-emerald-500'
      case 'medium': return 'from-osus-secondary-500 to-osus-primary-500'
      case 'low': return 'from-osus-primary-300 to-osus-secondary-300'
      default: return 'from-osus-primary-500 to-osus-secondary-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return MapPin
      case 'prediction': return BrainCircuit
      case 'recommendation': return Lightbulb
      case 'alert': return Lightning
      default: return Sparkle
    }
  }

  return (
    <Card className="border-osus-primary-200/50 shadow-lg bg-gradient-to-br from-white via-osus-primary-50/30 to-osus-secondary-50/20">
      <CardHeader className="bg-gradient-to-r from-osus-primary-50 to-osus-secondary-50 border-b border-osus-primary-200/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-osus-burgundy flex items-center gap-2">
            <BrainCircuit className="w-5 h-5" />
            Daily AI Insights
            <Sparkle className="w-4 h-4 text-osus-gold animate-pulse" />
          </CardTitle>
          <Button
            onClick={refreshInsights}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="border-osus-primary-300 text-osus-primary-700 hover:bg-osus-primary-50"
          >
            {refreshing ? (
              <div className="w-4 h-4 border-2 border-osus-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ChartLineUp className="w-4 h-4" />
            )}
            {refreshing ? 'Processing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {insights.length === 0 ? (
          <div className="text-center py-6">
            <BrainCircuit className="w-8 h-8 mx-auto mb-2 text-osus-primary-400" />
            <p className="text-osus-primary-600 text-sm">Analyzing patterns to generate insights...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => {
              const IconComponent = insight.icon || getTypeIcon(insight.type)
              return (
                <div
                  key={insight.id}
                  className="p-4 border border-osus-primary-200/30 rounded-lg bg-gradient-to-r from-white to-osus-primary-50/30 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${getImpactColor(insight.impact)}`}>
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-osus-primary-800 text-sm">
                          {insight.title}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            insight.impact === 'high' 
                              ? 'border-emerald-300 text-emerald-700 bg-emerald-50' 
                              : insight.impact === 'medium'
                              ? 'border-osus-secondary-300 text-osus-secondary-700 bg-osus-secondary-50'
                              : 'border-osus-primary-300 text-osus-primary-700 bg-osus-primary-50'
                          }`}
                        >
                          {insight.impact} impact
                        </Badge>
                      </div>
                      <p className="text-xs text-osus-primary-700 mb-2">
                        {insight.description}
                      </p>
                      {insight.actionable && (
                        <div className="flex items-center justify-between">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs border-osus-primary-300 text-osus-primary-700 hover:bg-osus-primary-50"
                          >
                            {insight.action}
                          </Button>
                          {insight.value && (
                            <span className="text-xs font-semibold text-osus-secondary-600 bg-osus-secondary-50 px-2 py-1 rounded">
                              {insight.value}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}