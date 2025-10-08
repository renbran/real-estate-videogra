import { useState } from 'react'
import { useBookingAPI } from '@/hooks/useClientAPI'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { CalendarBlank, MapPin, Clock, TrendUp, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { SmartBookingSuggestions } from './SmartBookingSuggestions'
import { GooglePlacePicker } from '@/components/maps/GooglePlacePicker'
import { ShootLocationMap } from '@/components/maps/ShootLocationMap'
import { OSUS_BRAND } from '@/lib/osus-brand'
import {
  BookingRequest,
  ShootCategory,
  PropertyValue,
  ShootComplexity,
  PropertyType,
  SHOOT_CATEGORIES,
  PROPERTY_VALUES,
  PROPERTY_TYPES,
  SHOOT_COMPLEXITIES,
  User
} from '@/lib/types'

interface BookingFormProps {
  currentUserId: string
  onSubmit?: () => void
}

export function BookingForm({ currentUserId, onSubmit }: BookingFormProps) {
  const { createBooking, getUsers } = useBookingAPI()
  const users = getUsers()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    // Common fields
    agent_id: currentUserId,
    shoot_category: 'property' as ShootCategory,
    location: '',
    preferred_date: '',
    backup_dates: ['', '', ''],
    is_flexible: false,
    special_requirements: '',
    
    // Property shoot fields (most important for real estate)
    property_type: '' as PropertyType,
    bedrooms: '',
    shoot_complexity: '' as ShootComplexity,
    property_status: 'vacant' as 'vacant' | 'occupied',
    
    // Conditional fields based on shoot category
    participants_count: '',
    event_type: '',
    content_style: '',
    creative_direction: '',
    space_layout: '',
    
    // Address validation fields
    formatted_address: '',
    place_id: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  })

  const currentAgent = users.find(a => a.id === currentUserId && a.role === 'agent')

  const calculatePriorityScore = (): number => {
    let score = 0
    
    // Base score for advance notice (10 points max)
    if (formData.preferred_date) {
      const daysInAdvance = Math.floor((new Date(formData.preferred_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      score += Math.min(daysInAdvance >= 7 ? 10 : daysInAdvance * 1.4, 10)
    }
    
    // Agent tier bonus
    if (currentAgent?.agent_tier === 'elite') score += 15
    else if (currentAgent?.agent_tier === 'premium') score += 10
    else score += 5
    
    // Shoot category bonus
    if (formData.shoot_category === 'property') score += 10
    else if (formData.shoot_category === 'event') score += 8
    else if (formData.shoot_category === 'group') score += 6
    else if (formData.shoot_category === 'content') score += 5
    else if (formData.shoot_category === 'personal') score += 3
    
    // Shoot complexity bonus
    if (formData.shoot_complexity) {
      score += SHOOT_COMPLEXITIES[formData.shoot_complexity]?.priority_bonus || 0
    }
    
    // Flexibility bonus
    if (formData.is_flexible) score += 5
    
    return Math.round(score)
  }

  const getApprovalStatus = () => {
    const score = calculatePriorityScore()
    if (score >= 80) return 'auto_approve'
    if (score >= 60) return 'manager_review'
    return 'auto_decline'
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleBackupDateChange = (index: number, value: string) => {
    const currentDates = formData.backup_dates || ['', '', '']
    const newBackupDates = [...currentDates]
    newBackupDates[index] = value
    setFormData(prev => ({ ...prev, backup_dates: newBackupDates }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return
    
    setIsSubmitting(true)
    
    try {
      const priorityScore = calculatePriorityScore()
      const approvalStatus = getApprovalStatus()
      
      const newBookingData = {
        agent_id: currentUserId,
        shoot_category: formData.shoot_category,
        preferred_date: formData.preferred_date,
        backup_dates: (formData.backup_dates || []).filter(date => date.length > 0),
        is_flexible: formData.is_flexible,
        location: formData.location,
        special_requirements: formData.special_requirements,
        
        // Property shoot fields (conditional)
        property_type: formData.shoot_category === 'property' ? formData.property_type : undefined,
        bedrooms: formData.shoot_category === 'property' ? parseInt(formData.bedrooms) || undefined : undefined,
        shoot_complexity: formData.shoot_complexity,
        property_status: formData.shoot_category === 'property' ? formData.property_status : undefined,
        
        // Conditional fields based on shoot category
        participants_count: formData.shoot_category === 'group' ? parseInt(formData.participants_count) || undefined : undefined,
        event_type: formData.shoot_category === 'event' ? formData.event_type : undefined,
        content_style: formData.shoot_category === 'content' ? formData.content_style : undefined,
        creative_direction: formData.shoot_category === 'content' ? formData.creative_direction : undefined,
        space_layout: formData.shoot_category === 'property' ? formData.space_layout : undefined,
        
        // System fields
        status: approvalStatus === 'auto_approve' ? 'approved' : 'pending',
        priority_score: priorityScore,
        formatted_address: formData.formatted_address,
        place_id: formData.place_id,
        latitude: formData.latitude,
        longitude: formData.longitude
      } as Omit<BookingRequest, 'id'>
      
      const result = await createBooking(newBookingData)
      
      if (!result) {
        throw new Error('Failed to create booking')
      }
      
      if (approvalStatus === 'auto_approve') {
        toast.success('Booking automatically approved!', {
          description: `Priority score: ${priorityScore}/100 - First come, first serve basis`
        })
      } else {
        toast.success('Booking submitted for review', {
          description: `Priority score: ${priorityScore}/100 - First come, first serve basis`
        })
      }
      
      // Reset form
      setFormData({
        agent_id: currentUserId,
        shoot_category: 'property' as ShootCategory,
        location: '',
        preferred_date: '',
        backup_dates: ['', '', ''],
        is_flexible: false,
        special_requirements: '',
        property_type: '' as PropertyType,
        bedrooms: '',
        shoot_complexity: '' as ShootComplexity,
        property_status: 'vacant' as 'vacant' | 'occupied',
        participants_count: '',
        event_type: '',
        content_style: '',
        creative_direction: '',
        space_layout: '',
        formatted_address: '',
        place_id: '',
        latitude: undefined,
        longitude: undefined
      })
      
      onSubmit?.()
      
    } catch (error) {
      toast.error('Failed to submit booking', {
        description: 'Please try again'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getApprovalStatusBadge = () => {
    const status = getApprovalStatus()
    switch (status) {
      case 'auto_approve':
        return <Badge variant="default" className="bg-green-500">Auto-Approved</Badge>
      case 'manager_review':
        return <Badge variant="secondary">Manager Review</Badge>
      case 'auto_decline':
        return <Badge variant="destructive">Needs Improvement</Badge>
    }
  }

  const isFormValid = () => {
    const baseFields = formData.shoot_category && formData.location && formData.preferred_date && formData.shoot_complexity
    
    if (!baseFields) return false
    
    // Category-specific validation
    switch (formData.shoot_category) {
      case 'property':
        return !!(formData.property_type && formData.bedrooms)
      case 'group':
        return !!(formData.participants_count)
      case 'event':
        return !!(formData.event_type)
      case 'content':
        return !!(formData.content_style)
      case 'personal':
        return true // Only base fields required
      default:
        return false
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="border-osus-primary-300 shadow-lg bg-white">
          <CardHeader className="bg-osus-primary-100 border-b-2 border-osus-primary-300">
            <CardTitle className="text-osus-primary-900 font-bold text-lg flex items-center gap-2">
              <CalendarBlank size={20} className="text-osus-gold" />
              New Videography Booking
              <Sparkle className="w-5 h-5 text-osus-gold animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Shoot Category */}
              <div className="space-y-2">
                <Label>Type of Shoot</Label>
                <Select value={formData.shoot_category} onValueChange={(value) => handleInputChange('shoot_category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shoot type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SHOOT_CATEGORIES).map(([key, { label, description }]) => (
                      <SelectItem key={key} value={key}>
                        <div>
                          <div>{label}</div>
                          <div className="text-xs text-muted-foreground">{description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Location with Google Places */}
              <GooglePlacePicker
                label={formData.shoot_category === 'property' ? 'Property Address' : 'Shoot Location'}
                placeholder={formData.shoot_category === 'property' ? 'Enter full property address' : 'Enter shoot location'}
                value={formData.location}
                onAddressChange={(address) => handleInputChange('location', address)}
                onChange={(place) => {
                  if (place) {
                    handleInputChange('formatted_address', place.formatted_address)
                    handleInputChange('place_id', place.place_id)
                    handleInputChange('latitude', place.geometry.location.lat)
                    handleInputChange('longitude', place.geometry.location.lng)
                  } else {
                    handleInputChange('formatted_address', '')
                    handleInputChange('place_id', '')
                    handleInputChange('latitude', undefined)
                    handleInputChange('longitude', undefined)
                  }
                }}
              />

              {/* Category-Specific Details */}
              <div className="space-y-6">
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">
                    {formData.shoot_category === 'property' && 'Property Details'}
                    {formData.shoot_category === 'personal' && 'Personal Shoot Preferences'}
                    {formData.shoot_category === 'group' && 'Group Shoot Details'}
                    {formData.shoot_category === 'content' && 'Content Creation Details'}
                    {formData.shoot_category === 'event' && 'Event Details'}
                  </h3>
                  
                  {/* Property Shoot Fields */}
                  {formData.shoot_category === 'property' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Property Type</Label>
                        <Select value={formData.property_type} onValueChange={(value) => handleInputChange('property_type', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PROPERTY_TYPES).map(([key, { label }]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Number of Bedrooms</Label>
                        <Select value={formData.bedrooms} onValueChange={(value) => handleInputChange('bedrooms', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Bedroom</SelectItem>
                            <SelectItem value="2">2 Bedrooms</SelectItem>
                            <SelectItem value="3">3 Bedrooms</SelectItem>
                            <SelectItem value="4">4 Bedrooms</SelectItem>
                            <SelectItem value="5">5 Bedrooms</SelectItem>
                            <SelectItem value="6">6+ Bedrooms</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Property Status</Label>
                        <Select value={formData.property_status} onValueChange={(value) => handleInputChange('property_status', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vacant">Vacant</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 md:col-span-3">
                        <Label>Space Layout Preferences</Label>
                        <Select value={formData.space_layout} onValueChange={(value) => handleInputChange('space_layout', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select layout focus" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open-concept">Open Concept Flow</SelectItem>
                            <SelectItem value="room-by-room">Room-by-Room Tour</SelectItem>
                            <SelectItem value="lifestyle-focus">Lifestyle Focused</SelectItem>
                            <SelectItem value="architectural">Architectural Features</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Personal Shoot Fields */}
                  {formData.shoot_category === 'personal' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-osus-primary-50/50 border border-osus-primary-200/30 rounded-lg">
                        <h4 className="font-medium text-osus-primary-800 mb-2">Personal Shoot Options</h4>
                        <ul className="text-sm text-osus-primary-700 space-y-1">
                          <li>• Professional headshots and portraits</li>
                          <li>• Personal branding content</li>
                          <li>• Individual lifestyle photography</li>
                          <li>• Creative personal expression sessions</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Group Shoot Fields */}
                  {formData.shoot_category === 'group' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Number of Participants</Label>
                        <Select value={formData.participants_count} onValueChange={(value) => handleInputChange('participants_count', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select participant count" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 People</SelectItem>
                            <SelectItem value="3">3 People</SelectItem>
                            <SelectItem value="4">4 People</SelectItem>
                            <SelectItem value="5">5 People</SelectItem>
                            <SelectItem value="6">6-10 People</SelectItem>
                            <SelectItem value="10">10+ People</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <h4 className="font-medium text-emerald-800 mb-2">Group Shoot Specialties</h4>
                        <ul className="text-sm text-emerald-700 space-y-1">
                          <li>• Family portraits and gatherings</li>
                          <li>• Team and corporate group shots</li>
                          <li>• Friend group lifestyle sessions</li>
                          <li>• Multi-person coordination and poses</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Content Shoot Fields */}
                  {formData.shoot_category === 'content' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Content Style</Label>
                        <Select value={formData.content_style} onValueChange={(value) => handleInputChange('content_style', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select content style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="social-media">Social Media Content</SelectItem>
                            <SelectItem value="commercial">Commercial/Advertising</SelectItem>
                            <SelectItem value="product">Product Showcase</SelectItem>
                            <SelectItem value="editorial">Editorial/Magazine Style</SelectItem>
                            <SelectItem value="documentary">Documentary Style</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Creative Direction</Label>
                        <Select value={formData.creative_direction} onValueChange={(value) => handleInputChange('creative_direction', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select creative approach" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minimalist">Minimalist & Clean</SelectItem>
                            <SelectItem value="dramatic">Dramatic & Cinematic</SelectItem>
                            <SelectItem value="natural">Natural & Candid</SelectItem>
                            <SelectItem value="artistic">Artistic & Creative</SelectItem>
                            <SelectItem value="brand-focused">Brand-Focused</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-medium text-purple-800 mb-2">Content Creation Focus</h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                          <li>• High-quality media for marketing campaigns</li>
                          <li>• Social media and digital content</li>
                          <li>• Creative storytelling through visuals</li>
                          <li>• Brand-aligned content development</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Event Shoot Fields */}
                  {formData.shoot_category === 'event' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Event Type</Label>
                        <Select value={formData.event_type} onValueChange={(value) => handleInputChange('event_type', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="corporate">Corporate Event</SelectItem>
                            <SelectItem value="wedding">Wedding</SelectItem>
                            <SelectItem value="party">Private Party</SelectItem>
                            <SelectItem value="conference">Conference/Meeting</SelectItem>
                            <SelectItem value="launch">Product Launch</SelectItem>
                            <SelectItem value="celebration">Celebration/Milestone</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 className="font-medium text-amber-800 mb-2">Event Coverage Includes</h4>
                        <ul className="text-sm text-amber-700 space-y-1">
                          <li>• Complete event documentation</li>
                          <li>• Key moments and milestone capture</li>
                          <li>• Logistics coordination and scheduling</li>
                          <li>• Multi-angle coverage planning</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {/* Shoot Complexity - Common to all */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock size={16} />
                      Shoot Complexity
                    </Label>
                    <Select value={formData.shoot_complexity} onValueChange={(value) => handleInputChange('shoot_complexity', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select complexity" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SHOOT_COMPLEXITIES).map(([key, { label, description }]) => (
                          <SelectItem key={key} value={key}>
                            <div>
                              <div>{label}</div>
                              <div className="text-xs text-muted-foreground">{description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formData.shoot_complexity && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">
                        Estimated Duration: {SHOOT_COMPLEXITIES[formData.shoot_complexity]?.duration} minutes
                      </div>
                      <div className="text-xs text-blue-700">
                        {SHOOT_COMPLEXITIES[formData.shoot_complexity]?.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preferred Date */}
              <div className="space-y-2">
                <Label htmlFor="preferred-date" className="flex items-center gap-2">
                  <CalendarBlank size={16} />
                  Preferred Date
                  <Sparkle className="w-4 h-4 text-osus-secondary-500" />
                </Label>
                <Input
                  id="preferred-date"
                  type="date"
                  value={formData.preferred_date}
                  onChange={(e) => handleInputChange('preferred_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {/* Smart Booking Suggestions */}
              {(formData.location || formData.preferred_date) && (
                <SmartBookingSuggestions
                  location={formData.location}
                  preferredDate={formData.preferred_date}
                  onSuggestionSelect={(suggestion) => {
                    handleInputChange('preferred_date', suggestion.suggestedDate)
                    toast.success('Applied AI suggestion!', {
                      description: `Updated to ${suggestion.title}`
                    })
                  }}
                />
              )}

              {/* Backup dates */}
              <div className="space-y-2">
                <Label>Backup Dates (Optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {(formData.backup_dates || []).map((date, index) => (
                    <Input
                      key={index}
                      type="date"
                      value={date}
                      onChange={(e) => handleBackupDateChange(index, e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  ))}
                </div>
              </div>

              {/* Flexibility toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="flexibility"
                  checked={formData.is_flexible}
                  onCheckedChange={(checked) => handleInputChange('is_flexible', checked)}
                />
                <Label htmlFor="flexibility">
                  Can be rescheduled for optimization (+5 priority points)
                </Label>
              </div>

              {/* Special Requirements */}
              <div className="space-y-2">
                <Label htmlFor="special-requirements">Special Requirements</Label>
                <Textarea
                  id="special-requirements"
                  value={formData.special_requirements}
                  onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                  placeholder="Any special requirements or notes"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isSubmitting || !isFormValid()}
                className="w-full"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Priority Assessment Sidebar */}
      {formData.preferred_date && (
        <div className="space-y-4">
          {/* Location Map */}
          {formData.latitude && formData.longitude && formData.formatted_address && (
            <ShootLocationMap
              latitude={formData.latitude}
              longitude={formData.longitude}
              address={formData.formatted_address}
              title="Shoot Location"
              height="250px"
            />
          )}
          
          <Card className="border-osus-primary-300 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-osus-primary-900 font-semibold">
                <TrendUp size={16} />
                Priority Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">{calculatePriorityScore()}</div>
                <div className="text-sm text-muted-foreground">Priority Score</div>
              </div>
              
              <div className="space-y-2">
                {getApprovalStatusBadge()}
                <div className="text-xs text-muted-foreground">
                  {getApprovalStatus() === 'auto_approve' && 'High priority - will be automatically approved'}
                  {getApprovalStatus() === 'manager_review' && 'Medium priority - requires manager review'}
                  {getApprovalStatus() === 'auto_decline' && 'Low priority - may be declined, consider adjusting details'}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Agent Tier ({currentAgent?.agent_tier})</span>
                  <span>+{currentAgent?.agent_tier === 'elite' ? 15 : currentAgent?.agent_tier === 'premium' ? 10 : 5}</span>
                </div>
                {formData.is_flexible && (
                  <div className="flex justify-between text-xs">
                    <span>Flexibility Bonus</span>
                    <span>+5</span>
                  </div>
                )}
                <div className="text-xs text-green-600 font-medium">
                  ⚡ First come, first serve basis - submit early for best availability!
                </div>
                {formData.shoot_complexity && (
                  <div className="text-xs text-muted-foreground">
                    Estimated Duration: {SHOOT_COMPLEXITIES[formData.shoot_complexity]?.duration} minutes
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}