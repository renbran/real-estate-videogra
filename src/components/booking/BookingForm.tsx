import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AddressInput } from '@/components/ui/address-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { CalendarBlank, MapPin, Clock, TrendUp, Camera, Users, Confetti, Video, Star } from '@phosphor-icons/react'
import { 
  BookingRequest, 
  ShootCategory,
  PropertyValue,
  PropertyType, 
  ShootComplexity, 
  PropertyAccess,
  PersonalShootType,
  PersonalShootSize,
  PersonalShootLocation,
  PersonalShootDuration,
  CompanyEventType,
  CompanyEventDuration,
  CompanyEventCoverage,
  MarketingContentType,
  MarketingScriptStatus,
  MarketingLocation,
  SpecialProjectComplexity,
  SpecialProjectDeadline,
  SHOOT_CATEGORIES,
  SHOOT_COMPLEXITIES,
  PROPERTY_VALUES,
  PROPERTY_TYPES,
  PERSONAL_SHOOT_TYPES,
  PERSONAL_SHOOT_SIZES,
  PERSONAL_SHOOT_LOCATIONS,
  PERSONAL_SHOOT_DURATIONS,
  COMPANY_EVENT_TYPES,
  COMPANY_EVENT_DURATIONS,
  COMPANY_EVENT_COVERAGE,
  MARKETING_CONTENT_TYPES,
  MARKETING_SCRIPT_STATUS,
  MARKETING_LOCATIONS,
  SPECIAL_PROJECT_COMPLEXITY,
  SPECIAL_PROJECT_DEADLINES,
  SAMPLE_AGENTS,
  Agent 
} from '@/lib/types'
import { calculatePriorityScore, getApprovalStatus, getScoreBreakdown } from '@/lib/priority-scoring'
import { googleMapsService } from '@/lib/google-maps'

interface BookingFormProps {
  currentUserId: string
  onSubmit?: () => void
}

const getCategoryIcon = (category: ShootCategory) => {
  switch (category) {
    case 'property': return <Camera className="w-5 h-5" />
    case 'personal': return <Users className="w-5 h-5" />
    case 'company_event': return <Confetti className="w-5 h-5" />
    case 'marketing_content': return <Video className="w-5 h-5" />
    case 'special_project': return <Star className="w-5 h-5" />
  }
}

export function BookingForm({ currentUserId, onSubmit }: BookingFormProps) {
  const [bookings, setBookings] = useKV<BookingRequest[]>('bookings', [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    agent_id: currentUserId,
    shoot_category: '' as ShootCategory,
    location_address: '',
    preferred_date: '',
    backup_dates: ['', '', ''],
    is_flexible: false,
    special_requirements: '',
    
    // Property shoot fields
    property_value: '' as PropertyValue,
    property_type: '' as PropertyType,
    bedrooms: '',
    shoot_complexity: '' as ShootComplexity,
    property_access: '' as PropertyAccess,
    property_status: '' as 'vacant' | 'occupied',
    
    // Personal shoot fields
    personal_shoot_type: '' as PersonalShootType,
    personal_shoot_size: '' as PersonalShootSize,
    personal_shoot_location: '' as PersonalShootLocation,
    personal_shoot_duration: '' as PersonalShootDuration,
    outfit_changes_needed: false,
    
    // Company event fields
    company_event_type: '' as CompanyEventType,
    company_event_duration: '' as CompanyEventDuration,
    company_event_coverage: '' as CompanyEventCoverage,
    expected_attendees: '',
    event_organizer: '',
    video_deliverable_needs: '',
    
    // Marketing content fields
    marketing_content_type: '' as MarketingContentType,
    marketing_duration: '',
    talent_participants: '',
    script_status: '' as MarketingScriptStatus,
    marketing_location: '' as MarketingLocation,
    
    // Special project fields
    project_description: '',
    project_complexity: '' as SpecialProjectComplexity,
    custom_requirements: '',
    deadline_criticality: '' as SpecialProjectDeadline,
    
    // Address validation fields
    formatted_address: '',
    place_id: '',
    coordinates: undefined as { lat: number; lng: number } | undefined,
    geographic_zone: 'central' as any
  })

  const currentAgent = SAMPLE_AGENTS.find(a => a.id === currentUserId) || SAMPLE_AGENTS[0]
  
  // Calculate priority score based on category and required fields
  const calculateCurrentPriorityScore = () => {
    if (!formData.shoot_category || !formData.preferred_date) return 0
    
    // Create a minimal booking object for priority calculation
    const mockBooking = {
      shoot_category: formData.shoot_category,
      property_value: formData.property_value,
      shoot_complexity: formData.shoot_complexity,
      is_flexible: formData.is_flexible,
      personal_shoot_type: formData.personal_shoot_type,
      company_event_type: formData.company_event_type,
      marketing_content_type: formData.marketing_content_type,
      project_complexity: formData.project_complexity,
      preferred_date: formData.preferred_date
    }
    
    return calculatePriorityScore(mockBooking as any, currentAgent)
  }
  
  const priorityScore = calculateCurrentPriorityScore()
  const approvalStatus = getApprovalStatus(priorityScore)

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddressChange = (address: string, placeDetails?: {
    coordinates: { lat: number; lng: number }
    formatted_address: string
    place_id: string
  }) => {
    const updates: Partial<typeof formData> = {
      location_address: address
    }

    if (placeDetails) {
      updates.formatted_address = placeDetails.formatted_address
      updates.place_id = placeDetails.place_id
      updates.coordinates = placeDetails.coordinates
      updates.geographic_zone = googleMapsService.determineGeographicZone(placeDetails.coordinates) as any
    }

    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleBackupDateChange = (index: number, value: string) => {
    const newBackupDates = [...formData.backup_dates]
    newBackupDates[index] = value
    setFormData(prev => ({ ...prev, backup_dates: newBackupDates }))
  }

  const getEstimatedDuration = (): number => {
    switch (formData.shoot_category) {
      case 'property':
        return formData.shoot_complexity ? SHOOT_COMPLEXITIES[formData.shoot_complexity].duration : 90
      case 'personal':
        return formData.personal_shoot_duration ? PERSONAL_SHOOT_DURATIONS[formData.personal_shoot_duration].minutes : 60
      case 'company_event':
        return formData.company_event_duration ? COMPANY_EVENT_DURATIONS[formData.company_event_duration].hours * 60 : 240
      case 'marketing_content':
        return parseInt(formData.marketing_duration) || 120
      case 'special_project':
        return formData.project_complexity === 'high' ? 240 : formData.project_complexity === 'medium' ? 120 : 60
      default:
        return 90
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const newBooking: BookingRequest = {
        id: Date.now().toString(),
        agent_id: formData.agent_id,
        agent_name: currentAgent.name,
        shoot_category: formData.shoot_category,
        location_address: formData.location_address,
        preferred_date: formData.preferred_date,
        backup_dates: formData.backup_dates?.filter(Boolean) || [],
        is_flexible: formData.is_flexible,
        special_requirements: formData.special_requirements,
        
        // Property fields (if applicable)
        ...(formData.shoot_category === 'property' && {
          property_value: formData.property_value,
          property_type: formData.property_type,
          bedrooms: parseInt(formData.bedrooms) || undefined,
          shoot_complexity: formData.shoot_complexity,
          property_access: formData.property_access,
          property_status: formData.property_status,
          geographic_zone: formData.geographic_zone
        }),
        
        // Personal shoot fields (if applicable)
        ...(formData.shoot_category === 'personal' && {
          personal_shoot_type: formData.personal_shoot_type,
          personal_shoot_size: formData.personal_shoot_size,
          personal_shoot_location: formData.personal_shoot_location,
          personal_shoot_duration: formData.personal_shoot_duration,
          outfit_changes_needed: formData.outfit_changes_needed
        }),
        
        // Company event fields (if applicable)
        ...(formData.shoot_category === 'company_event' && {
          company_event_type: formData.company_event_type,
          company_event_duration: formData.company_event_duration,
          company_event_coverage: formData.company_event_coverage,
          expected_attendees: parseInt(formData.expected_attendees) || undefined,
          event_organizer: formData.event_organizer,
          video_deliverable_needs: formData.video_deliverable_needs
        }),
        
        // Marketing content fields (if applicable)
        ...(formData.shoot_category === 'marketing_content' && {
          marketing_content_type: formData.marketing_content_type,
          marketing_duration: formData.marketing_duration,
          talent_participants: formData.talent_participants,
          script_status: formData.script_status,
          marketing_location: formData.marketing_location
        }),
        
        // Special project fields (if applicable)
        ...(formData.shoot_category === 'special_project' && {
          project_description: formData.project_description,
          project_complexity: formData.project_complexity,
          custom_requirements: formData.custom_requirements,
          deadline_criticality: formData.deadline_criticality
        }),
        
        priority_score: priorityScore,
        status: approvalStatus === 'auto_approve' ? 'approved' : 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        estimated_duration: getEstimatedDuration(),
        formatted_address: formData.formatted_address,
        place_id: formData.place_id,
        coordinates: formData.coordinates
      }

      setBookings(current => [...(current || []), newBooking])
      
      const categoryLabel = SHOOT_CATEGORIES[formData.shoot_category].label
      
      if (approvalStatus === 'auto_approve') {
        toast.success('Booking automatically approved!', {
          description: `Your ${categoryLabel.toLowerCase()} request has been confirmed for ${formData.preferred_date}`
        })
      } else if (approvalStatus === 'manager_review') {
        toast.success('Booking submitted for review', {
          description: `Your ${categoryLabel.toLowerCase()} request will be reviewed within 24 hours`
        })
      } else {
        toast.error('Booking could not be approved', {
          description: 'Please try alternative dates or contact your manager'
        })
      }

      // Reset form
      setFormData({
        agent_id: currentUserId,
        shoot_category: '' as ShootCategory,
        location_address: '',
        preferred_date: '',
        backup_dates: ['', '', ''],
        is_flexible: false,
        special_requirements: '',
        property_value: '' as PropertyValue,
        property_type: '' as PropertyType,
        bedrooms: '',
        shoot_complexity: '' as ShootComplexity,
        property_access: '' as PropertyAccess,
        property_status: '' as 'vacant' | 'occupied',
        personal_shoot_type: '' as PersonalShootType,
        personal_shoot_size: '' as PersonalShootSize,
        personal_shoot_location: '' as PersonalShootLocation,
        personal_shoot_duration: '' as PersonalShootDuration,
        outfit_changes_needed: false,
        company_event_type: '' as CompanyEventType,
        company_event_duration: '' as CompanyEventDuration,
        company_event_coverage: '' as CompanyEventCoverage,
        expected_attendees: '',
        event_organizer: '',
        video_deliverable_needs: '',
        marketing_content_type: '' as MarketingContentType,
        marketing_duration: '',
        talent_participants: '',
        script_status: '' as MarketingScriptStatus,
        marketing_location: '' as MarketingLocation,
        project_description: '',
        project_complexity: '' as SpecialProjectComplexity,
        custom_requirements: '',
        deadline_criticality: '' as SpecialProjectDeadline,
        formatted_address: '',
        place_id: '',
        coordinates: undefined,
        geographic_zone: 'central' as any
      })

      onSubmit?.()
    } catch (error) {
      toast.error('Failed to submit booking', {
        description: 'Please try again or contact support'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getApprovalStatusBadge = () => {
    switch (approvalStatus) {
      case 'auto_approve':
        return <Badge className="bg-green-100 text-green-800">Auto-Approve</Badge>
      case 'manager_review':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-800">Manager Review</Badge>
      case 'auto_decline':
        return <Badge variant="destructive">Needs Alternative</Badge>
    }
  }

  const renderCategorySpecificFields = () => {
    switch (formData.shoot_category) {
      case 'property':
        return (
          <div className="space-y-6">
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Property Shoot Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select value={formData.property_type} onValueChange={(value) => handleInputChange('property_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROPERTY_TYPES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Property Value Range</Label>
                  <Select value={formData.property_value} onValueChange={(value) => handleInputChange('property_value', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select value range" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROPERTY_VALUES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Number of Bedrooms</Label>
                  <Select value={formData.bedrooms} onValueChange={(value) => handleInputChange('bedrooms', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Bedrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Studio</SelectItem>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                      <SelectItem value="4">4 Bedrooms</SelectItem>
                      <SelectItem value="5">5 Bedrooms</SelectItem>
                      <SelectItem value="6">6+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
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

                <div className="space-y-2">
                  <Label>Property Status</Label>
                  <Select value={formData.property_status} onValueChange={(value) => handleInputChange('property_status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Is property vacant or occupied?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacant">Vacant</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Property Access</Label>
                <Select value={formData.property_access} onValueChange={(value) => handleInputChange('property_access', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="How will videographer access?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant_lockbox">Vacant - Lockbox Available</SelectItem>
                    <SelectItem value="vacant_key">Vacant - Key Pickup Required</SelectItem>
                    <SelectItem value="occupied_agent">Occupied - Agent Must Be Present</SelectItem>
                    <SelectItem value="occupied_key">Occupied - Tenant Has Key</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-1">First Come, First Serve</div>
                <div className="text-xs text-blue-700">
                  Property shoots are scheduled on a first-come, first-serve basis. Submit your request early to secure your preferred time slot.
                </div>
              </div>
            </div>
          </div>
        )

      case 'personal':
        return (
          <div className="space-y-6">
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Personal Shoot Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shoot Type</Label>
                  <Select value={formData.personal_shoot_type} onValueChange={(value) => handleInputChange('personal_shoot_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shoot type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PERSONAL_SHOOT_TYPES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Number of People</Label>
                  <Select value={formData.personal_shoot_size} onValueChange={(value) => handleInputChange('personal_shoot_size', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="How many people?" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PERSONAL_SHOOT_SIZES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location Preference</Label>
                  <Select value={formData.personal_shoot_location} onValueChange={(value) => handleInputChange('personal_shoot_location', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Where should we shoot?" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PERSONAL_SHOOT_LOCATIONS).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estimated Duration</Label>
                  <Select value={formData.personal_shoot_duration} onValueChange={(value) => handleInputChange('personal_shoot_duration', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="How long will this take?" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PERSONAL_SHOOT_DURATIONS).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="outfit-changes"
                  checked={formData.outfit_changes_needed}
                  onCheckedChange={(checked) => handleInputChange('outfit_changes_needed', checked)}
                />
                <Label htmlFor="outfit-changes" className="cursor-pointer">
                  Outfit changes needed (adds 15-30 minutes)
                </Label>
              </div>
            </div>
          </div>
        )

      case 'company_event':
        return (
          <div className="space-y-6">
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Company Event Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select value={formData.company_event_type} onValueChange={(value) => handleInputChange('company_event_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="What type of event?" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COMPANY_EVENT_TYPES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Event Duration</Label>
                  <Select value={formData.company_event_duration} onValueChange={(value) => handleInputChange('company_event_duration', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="How long is the event?" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COMPANY_EVENT_DURATIONS).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Coverage Type</Label>
                  <Select value={formData.company_event_coverage} onValueChange={(value) => handleInputChange('company_event_coverage', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="What coverage do you need?" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COMPANY_EVENT_COVERAGE).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendees">Expected Attendees</Label>
                  <Input
                    id="attendees"
                    type="number"
                    value={formData.expected_attendees}
                    onChange={(e) => handleInputChange('expected_attendees', e.target.value)}
                    placeholder="Number of people expected"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-organizer">Event Organizer/Contact</Label>
                <Input
                  id="event-organizer"
                  value={formData.event_organizer}
                  onChange={(e) => handleInputChange('event_organizer', e.target.value)}
                  placeholder="Who is organizing this event?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliverables">Video Deliverable needs</Label>
                <Textarea
                  id="deliverables"
                  value={formData.video_deliverable_needs}
                  onChange={(e) => handleInputChange('video_deliverable_needs', e.target.value)}
                  placeholder="What video outputs do you need? (highlights, full video, social clips, etc.)"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      case 'marketing_content':
        return (
          <div className="space-y-6">
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Marketing Content Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select value={formData.marketing_content_type} onValueChange={(value) => handleInputChange('marketing_content_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="What type of content?" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MARKETING_CONTENT_TYPES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marketing-duration">Estimated Duration (minutes)</Label>
                  <Input
                    id="marketing-duration"
                    type="number"
                    value={formData.marketing_duration}
                    onChange={(e) => handleInputChange('marketing_duration', e.target.value)}
                    placeholder="How long will this take to shoot?"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Script Status</Label>
                  <Select value={formData.script_status} onValueChange={(value) => handleInputChange('script_status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Is the script ready?" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MARKETING_SCRIPT_STATUS).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={formData.marketing_location} onValueChange={(value) => handleInputChange('marketing_location', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Where will we shoot?" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MARKETING_LOCATIONS).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="talent">Talent/Participants Involved</Label>
                <Textarea
                  id="talent"
                  value={formData.talent_participants}
                  onChange={(e) => handleInputChange('talent_participants', e.target.value)}
                  placeholder="Who will be in the video? Any special considerations?"
                  rows={2}
                />
              </div>
            </div>
          </div>
        )

      case 'special_project':
        return (
          <div className="space-y-6">
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Special Project Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="project-description">Project Description</Label>
                <Textarea
                  id="project-description"
                  value={formData.project_description}
                  onChange={(e) => handleInputChange('project_description', e.target.value)}
                  placeholder="Describe your special project in detail..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estimated Complexity</Label>
                  <Select value={formData.project_complexity} onValueChange={(value) => handleInputChange('project_complexity', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="How complex is this project?" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SPECIAL_PROJECT_COMPLEXITY).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Deadline Criticality</Label>
                  <Select value={formData.deadline_criticality} onValueChange={(value) => handleInputChange('deadline_criticality', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="How critical is the timeline?" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SPECIAL_PROJECT_DEADLINES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-requirements">Custom Requirements</Label>
                <Textarea
                  id="custom-requirements"
                  value={formData.custom_requirements}
                  onChange={(e) => handleInputChange('custom_requirements', e.target.value)}
                  placeholder="Any special equipment, skills, or arrangements needed?"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const isFormValid = () => {
    if (!formData.shoot_category || !formData.location_address || !formData.preferred_date) {
      return false
    }

    switch (formData.shoot_category) {
      case 'property':
        return !!(formData.property_type && formData.property_value && formData.bedrooms && formData.shoot_complexity && formData.property_access)
      case 'personal':
        return !!(formData.personal_shoot_type && formData.personal_shoot_size && formData.personal_shoot_duration)
      case 'company_event':
        return !!(formData.company_event_type && formData.company_event_duration && formData.company_event_coverage)
      case 'marketing_content':
        return !!(formData.marketing_content_type && formData.script_status)
      case 'special_project':
        return !!formData.project_description
      default:
        return false
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarBlank className="w-5 h-5" />
                New Videography Booking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Shoot Category Selection */}
                <div className="space-y-2">
                  <Label>Shoot Category</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(SHOOT_CATEGORIES).map(([key, { label, description }]) => (
                      <div
                        key={key}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${
                          formData.shoot_category === key ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                        onClick={() => handleInputChange('shoot_category', key)}
                      >
                        <div className="flex items-start gap-3">
                          {getCategoryIcon(key as ShootCategory)}
                          <div className="flex-1">
                            <div className="font-medium">{label}</div>
                            <div className="text-xs text-muted-foreground mt-1">{description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {formData.shoot_category && (
                  <>
                    {/* Location Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location Address
                      </Label>
                      <AddressInput
                        value={formData.location_address}
                        onChange={handleAddressChange}
                        placeholder="Enter full address or location"
                        required
                      />
                      {formData.formatted_address && formData.formatted_address !== formData.location_address && (
                        <div className="text-xs text-muted-foreground">
                          Validated: {formData.formatted_address}
                        </div>
                      )}
                    </div>

                    {/* Category-specific fields */}
                    {renderCategorySpecificFields()}

                    {/* Preferred Date */}
                    <div className="space-y-2">
                      <Label htmlFor="preferred-date">Preferred Date</Label>
                      <Input
                        id="preferred-date"
                        type="date"
                        value={formData.preferred_date}
                        onChange={(e) => handleInputChange('preferred_date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    {/* Backup Dates */}
                    <div className="space-y-2">
                      <Label>Backup Dates (Optional)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {formData.backup_dates.map((date, index) => (
                          <Input
                            key={index}
                            type="date"
                            value={date}
                            onChange={(e) => handleBackupDateChange(index, e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            placeholder={`Backup ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Flexibility Toggle */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="flexibility"
                        checked={formData.is_flexible}
                        onCheckedChange={(checked) => handleInputChange('is_flexible', checked)}
                      />
                      <Label htmlFor="flexibility" className="cursor-pointer">
                        Can be rescheduled for optimization (+5 priority points)
                      </Label>
                    </div>

                    {/* Special Requirements */}
                    <div className="space-y-2">
                      <Label htmlFor="requirements">Special Requirements</Label>
                      <Textarea
                        id="requirements"
                        value={formData.special_requirements}
                        onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                        placeholder="Any special requirements or notes..."
                        rows={3}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting || !isFormValid()}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                    </Button>
                  </>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Priority Score Card */}
        {formData.shoot_category && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendUp className="w-5 h-5" />
                  Priority Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-primary">{priorityScore}</div>
                  <div className="text-sm text-muted-foreground">out of 100</div>
                  <div className="mt-2">{getApprovalStatusBadge()}</div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium">Category: {SHOOT_CATEGORIES[formData.shoot_category]?.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {SHOOT_CATEGORIES[formData.shoot_category]?.description}
                  </div>
                  
                  {formData.shoot_category === 'company_event' && (
                    <div className="p-2 bg-blue-50 rounded text-xs text-blue-700">
                      Company events receive high priority (90+ points)
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <div className="text-sm font-medium mb-1">Monthly Usage</div>
                  <div className="text-xs text-muted-foreground">
                    {currentAgent.monthly_used} of {currentAgent.monthly_quota} slots used
                  </div>
                  <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${(currentAgent.monthly_used / currentAgent.monthly_quota) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}