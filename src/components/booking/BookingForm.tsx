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
import { CalendarBlank, MapPin, Clock, TrendUp } from '@phosphor-icons/react'
import { toast } from 'sonner'
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
  SAMPLE_AGENTS
} from '@/lib/types'

interface BookingFormProps {
  currentUserId: string
  onSubmit?: () => void
}

export function BookingForm({ currentUserId, onSubmit }: BookingFormProps) {
  const { addBooking } = useBookings()
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
    property_value: '' as PropertyValue,
    bedrooms: '',
    shoot_complexity: '' as ShootComplexity,
    property_status: 'vacant' as 'vacant' | 'occupied',
    
    // Address validation fields
    formatted_address: '',
    place_id: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  })

  const currentAgent = SAMPLE_AGENTS.find(a => a.id === currentUserId)

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
    
    // Property value bonus
    if (formData.property_value) {
      score += PROPERTY_VALUES[formData.property_value]?.priority_points || 0
    }
    
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
        
        // Property shoot fields
        property_type: formData.property_type,
        property_value: formData.property_value,
        bedrooms: parseInt(formData.bedrooms) || undefined,
        shoot_complexity: formData.shoot_complexity,
        property_status: formData.property_status,
        
        // System fields
        status: approvalStatus === 'auto_approve' ? 'approved' : 'pending',
        priority_score: priorityScore,
        formatted_address: formData.formatted_address,
        place_id: formData.place_id,
        latitude: formData.latitude,
        longitude: formData.longitude
      } as Omit<BookingRequest, 'id'>
      
      await addBooking(newBookingData)
      
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
        property_value: '' as PropertyValue,
        bedrooms: '',
        shoot_complexity: '' as ShootComplexity,
        property_status: 'vacant' as 'vacant' | 'occupied',
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
    return !!(
      formData.shoot_category && 
      formData.location && 
      formData.preferred_date &&
      formData.property_type && 
      formData.property_value && 
      formData.shoot_complexity &&
      formData.bedrooms
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarBlank size={20} />
              New Property Videography Booking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Property Address */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin size={16} />
                  Property Address
                </Label>
                <Input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter full property address"
                  required
                />
              </div>

              {/* Property Details */}
              <div className="space-y-6">
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">Property Details</h3>
                  
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
                      <Label>Property Value</Label>
                      <Select value={formData.property_value} onValueChange={(value) => handleInputChange('property_value', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PROPERTY_VALUES).map(([key, { label }]) => (
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
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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