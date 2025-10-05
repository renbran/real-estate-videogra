import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CalendarBlank, MapPin, Clock, TrendUp } from '@phosphor-icons/react'
import { 
  BookingRequest, 
  PropertyValue, 
  ShootComplexity, 
  PropertyAccess, 
  SHOOT_COMPLEXITIES,
  PROPERTY_VALUES,
  SAMPLE_AGENTS,
  Agent 
} from '@/lib/types'
import { calculatePriorityScore, getApprovalStatus, getScoreBreakdown } from '@/lib/priority-scoring'

interface BookingFormProps {
  currentUserId: string
  onSubmit?: () => void
}

export function BookingForm({ currentUserId, onSubmit }: BookingFormProps) {
  const [bookings, setBookings] = useKV<BookingRequest[]>('bookings', [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    agent_id: currentUserId,
    property_address: '',
    property_value: '' as PropertyValue,
    shoot_complexity: '' as ShootComplexity,
    property_access: '' as PropertyAccess,
    preferred_date: '',
    backup_dates: ['', '', ''],
    is_flexible: false,
    special_requirements: ''
  })

  const currentAgent = SAMPLE_AGENTS.find(a => a.id === currentUserId) || SAMPLE_AGENTS[0]
  const priorityScore = formData.property_value && formData.shoot_complexity && formData.preferred_date ? 
    calculatePriorityScore(formData, currentAgent) : 0
  const approvalStatus = getApprovalStatus(priorityScore)
  const scoreBreakdown = formData.property_value && formData.shoot_complexity && formData.preferred_date ?
    getScoreBreakdown(formData, currentAgent) : []

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleBackupDateChange = (index: number, value: string) => {
    const newBackupDates = [...formData.backup_dates]
    newBackupDates[index] = value
    setFormData(prev => ({ ...prev, backup_dates: newBackupDates }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const newBooking: BookingRequest = {
        id: Date.now().toString(),
        agent_id: formData.agent_id,
        agent_name: currentAgent.name,
        property_address: formData.property_address,
        property_value: formData.property_value,
        shoot_complexity: formData.shoot_complexity,
        geographic_zone: 'central', // Would be auto-detected from address
        property_access: formData.property_access,
        preferred_date: formData.preferred_date,
        backup_dates: formData.backup_dates?.filter(Boolean) || [],
        is_flexible: formData.is_flexible,
        special_requirements: formData.special_requirements,
        priority_score: priorityScore,
        status: approvalStatus === 'auto_approve' ? 'approved' : 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        estimated_duration: SHOOT_COMPLEXITIES[formData.shoot_complexity].duration
      }

      setBookings(current => [...(current || []), newBooking])
      
      if (approvalStatus === 'auto_approve') {
        toast.success('Booking automatically approved!', {
          description: `Your videography request has been confirmed for ${formData.preferred_date}`
        })
      } else if (approvalStatus === 'manager_review') {
        toast.success('Booking submitted for review', {
          description: 'A manager will review your request within 24 hours'
        })
      } else {
        toast.error('Booking could not be approved', {
          description: 'Please try alternative dates or contact your manager'
        })
      }

      // Reset form
      setFormData({
        agent_id: currentUserId,
        property_address: '',
        property_value: '' as PropertyValue,
        shoot_complexity: '' as ShootComplexity,
        property_access: '' as PropertyAccess,
        preferred_date: '',
        backup_dates: ['', '', ''],
        is_flexible: false,
        special_requirements: ''
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
                {/* Property Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Property Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.property_address}
                    onChange={(e) => handleInputChange('property_address', e.target.value)}
                    placeholder="Enter full property address"
                    required
                  />
                </div>

                {/* Property Value & Shoot Complexity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                {/* Property Access */}
                <div className="space-y-2">
                  <Label>Property Access</Label>
                  <Select value={formData.property_access} onValueChange={(value) => handleInputChange('property_access', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="How will videographer access the property?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacant_lockbox">Vacant - Lockbox Available</SelectItem>
                      <SelectItem value="vacant_key">Vacant - Key Pickup Required</SelectItem>
                      <SelectItem value="occupied_agent">Occupied - Agent Must Be Present</SelectItem>
                      <SelectItem value="occupied_key">Occupied - Tenant Has Key</SelectItem>
                    </SelectContent>
                  </Select>
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
                  disabled={isSubmitting || !formData.property_address || !formData.property_value || !formData.shoot_complexity || !formData.preferred_date}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Priority Score Card */}
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
                {scoreBreakdown.map(({ category, points, max, description }) => (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{category}</span>
                      <span>{points}/{max}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${(points / max) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">{description}</div>
                  </div>
                ))}
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
      </div>
    </div>
  )
}