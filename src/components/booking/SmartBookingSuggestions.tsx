import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Sparkle, 
  Calendar,
  MapPin, 
  Clock, 
  TrendUp,
  Lightning,
  Target,
  BrainCircuit,
  Sun,
  CloudRain,
  Users,
  Star
} from '@phosphor-icons/react'
import { OSUS_BRAND } from '@/lib/osus-brand'

interface SmartSuggestion {
  id: string
  type: 'time_optimization' | 'weather_based' | 'route_efficiency' | 'peak_performance'
  title: string
  description: string
  suggestedDate: string
  suggestedTime: string
  confidence: number
  benefits: string[]
  reasoning: string
  icon: React.ComponentType<any>
}

interface SmartBookingSuggestionsProps {
  location?: string
  preferredDate?: string
  onSuggestionSelect?: (suggestion: SmartSuggestion) => void
  className?: string
}

export function SmartBookingSuggestions({ 
  location, 
  preferredDate, 
  onSuggestionSelect,
  className = ""
}: SmartBookingSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  const generateSmartSuggestions = async () => {
    setLoading(true)
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const smartSuggestions: SmartSuggestion[] = [
      {
        id: 'optimal-lighting',
        type: 'weather_based',
        title: 'Golden Hour Optimization',
        description: 'Perfect lighting conditions predicted for exterior shots',
        suggestedDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        suggestedTime: '16:30',
        confidence: 92,
        benefits: [
          'Optimal natural lighting',
          '25% better photo quality',
          'No additional equipment needed'
        ],
        reasoning: 'AI weather analysis shows clear skies with perfect golden hour lighting. Historical data shows 40% higher client satisfaction during this time.',
        icon: Sun
      },
      {
        id: 'route-efficiency',
        type: 'route_efficiency',
        title: 'Route-Optimized Timing',
        description: 'Minimize travel time with clustered bookings',
        suggestedDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        suggestedTime: '14:00',
        confidence: 87,
        benefits: [
          '30% less travel time',
          'Lower fuel costs',
          'More bookings per day possible'
        ],
        reasoning: '3 other bookings scheduled in the same area. Batching reduces overall travel by 2.5 hours and increases daily capacity.',
        icon: MapPin
      },
      {
        id: 'peak-performance',
        type: 'peak_performance',
        title: 'Peak Performance Window',
        description: 'Your highest productivity time slot available',
        suggestedDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        suggestedTime: '10:00',
        confidence: 95,
        benefits: [
          'Your peak energy time',
          'Fastest completion rate',
          'Highest quality output'
        ],
        reasoning: 'Performance analytics show you complete shoots 23% faster and with 15% higher quality ratings during this time window.',
        icon: Lightning
      },
      {
        id: 'weather-avoidance',
        type: 'weather_based',
        title: 'Weather Risk Mitigation',
        description: 'Avoid predicted rain with strategic scheduling',
        suggestedDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        suggestedTime: '11:00',
        confidence: 89,
        benefits: [
          'Zero weather delays',
          'No rescheduling needed',
          'Consistent availability'
        ],
        reasoning: 'Weather forecasting AI predicts 70% chance of rain on your preferred date. This alternative has 95% clear weather probability.',
        icon: CloudRain
      }
    ]

    // Filter suggestions based on context
    let filteredSuggestions = smartSuggestions
    
    if (location?.toLowerCase().includes('outdoor') || location?.toLowerCase().includes('exterior')) {
      filteredSuggestions = smartSuggestions.filter(s => s.type === 'weather_based')
    }
    
    // Sort by confidence score
    filteredSuggestions.sort((a, b) => b.confidence - a.confidence)
    
    setSuggestions(filteredSuggestions.slice(0, 3))
    setLoading(false)
  }

  useEffect(() => {
    if (location || preferredDate) {
      generateSmartSuggestions()
    }
  }, [location, preferredDate])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'from-emerald-500 to-green-500'
    if (confidence >= 80) return 'from-osus-primary-500 to-osus-secondary-500'
    return 'from-osus-secondary-500 to-yellow-500'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (!location && !preferredDate) {
    return null
  }

  return (
    <Card className={`border-osus-primary-200/50 shadow-lg bg-gradient-to-br from-white via-osus-primary-50/20 to-osus-secondary-50/20 ${className}`}>
      <CardHeader className="bg-gradient-to-r from-osus-primary-50 to-osus-secondary-50 border-b border-osus-primary-200/30">
        <CardTitle className="text-osus-primary-800 flex items-center gap-2">
          <BrainCircuit className="w-5 h-5" />
          AI Smart Scheduling Suggestions
          <Sparkle className="w-4 h-4 text-osus-secondary-500 animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-3 border-osus-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-osus-primary-600 text-sm">Analyzing optimal scheduling options...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-6">
            <BrainCircuit className="w-8 h-8 mx-auto mb-2 text-osus-primary-400" />
            <p className="text-osus-primary-600 text-sm">Enter location details to receive AI-powered scheduling suggestions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-4 border border-osus-primary-200/30 rounded-lg bg-gradient-to-r from-white to-osus-primary-50/30 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${getConfidenceColor(suggestion.confidence)}`}>
                    <suggestion.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-osus-primary-800 text-sm">
                        {suggestion.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          className={`text-xs ${
                            suggestion.confidence >= 90
                              ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                              : 'border-osus-primary-300 text-osus-primary-700 bg-osus-primary-50'
                          }`}
                        >
                          <Star className="w-3 h-3 mr-1" />
                          {suggestion.confidence}% confident
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-xs text-osus-primary-700 mb-3">
                      {suggestion.description}
                    </p>

                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <div className="flex items-center gap-1 text-osus-primary-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(suggestion.suggestedDate)}
                      </div>
                      <div className="flex items-center gap-1 text-osus-primary-600">
                        <Clock className="w-4 h-4" />
                        {formatTime(suggestion.suggestedTime)}
                      </div>
                    </div>

                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-osus-primary-800 mb-1">Benefits:</h4>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.benefits.map((benefit, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs border-osus-secondary-300 text-osus-secondary-700 bg-osus-secondary-50"
                          >
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-osus-primary-600 bg-osus-primary-50 p-2 rounded italic">
                        <strong>AI Reasoning:</strong> {suggestion.reasoning}
                      </p>
                    </div>

                    <Button
                      onClick={() => onSuggestionSelect?.(suggestion)}
                      size="sm"
                      className="bg-gradient-to-r from-osus-primary-500 to-osus-secondary-500 hover:from-osus-primary-600 hover:to-osus-secondary-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Target className="w-3 h-3 mr-1" />
                      Apply This Suggestion
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}