import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Play, CheckCircle, ArrowRight, Users, TrendUp, Clock, Star } from '@phosphor-icons/react'
import { DEMO_SCENARIOS, DEMO_ANALYTICS } from '@/lib/demo-data'

interface DemoModeProps {
  isOpen: boolean
  onClose: () => void
}

export function DemoMode({ isOpen, onClose }: DemoModeProps) {
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const handleScenarioStart = (scenarioId: string) => {
    setActiveScenario(scenarioId)
    setCurrentStep(0)
  }

  const nextStep = () => {
    const scenario = DEMO_SCENARIOS.find(s => s.id === activeScenario)
    if (scenario && currentStep < scenario.steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const resetDemo = () => {
    setActiveScenario(null)
    setCurrentStep(0)
  }

  if (activeScenario) {
    const scenario = DEMO_SCENARIOS.find(s => s.id === activeScenario)
    if (!scenario) return null

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              {scenario.title} - Demo Walkthrough
            </DialogTitle>
            <DialogDescription>
              {scenario.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                Step {currentStep + 1} of {scenario.steps.length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={resetDemo}>
                Reset Demo
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    {currentStep + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">{scenario.steps[currentStep]}</h4>
                    <p className="text-sm text-muted-foreground">
                      {getStepDescription(scenario.id, currentStep)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h4 className="font-medium">Progress:</h4>
              <div className="space-y-1">
                {scenario.steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {index < currentStep ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : index === currentStep ? (
                      <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted" />
                    )}
                    <span className={index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={resetDemo}>
                Start Over
              </Button>
              {currentStep < scenario.steps.length - 1 ? (
                <Button onClick={nextStep}>
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                  Demo Complete!
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-6 w-6 text-primary" />
            VideoPro System Demo - Production Ready
          </DialogTitle>
          <DialogDescription>
            Explore the complete videography booking and optimization system designed for real estate professionals.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* System Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendUp className="h-5 w-5" />
                System Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{DEMO_ANALYTICS.monthly_stats.total_bookings}</div>
                  <div className="text-sm text-muted-foreground">Total Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">${DEMO_ANALYTICS.monthly_stats.revenue_generated.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Revenue Generated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{DEMO_ANALYTICS.monthly_stats.client_satisfaction}</div>
                  <div className="text-sm text-muted-foreground">Client Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{DEMO_ANALYTICS.monthly_stats.average_turnaround}</div>
                  <div className="text-sm text-muted-foreground">Avg. Turnaround</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Scenarios */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Play className="h-5 w-5" />
              Interactive Demo Scenarios
            </h3>
            <div className="grid gap-4">
              {DEMO_SCENARIOS.map((scenario) => (
                <Card key={scenario.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{scenario.title}</CardTitle>
                      <Button size="sm" onClick={() => handleScenarioStart(scenario.id)}>
                        Start Demo
                        <Play className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>{scenario.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {scenario.steps.length} steps • Interactive walkthrough
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* User Roles Overview */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Roles & Capabilities
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Real Estate Agents</CardTitle>
                  <Badge variant="secondary">10 Demo Users</Badge>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div>• Submit booking requests</div>
                  <div>• Track request status</div>
                  <div>• View personal analytics</div>
                  <div>• Export calendar events</div>
                  <div>• Tier-based priority system</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Booking Managers</CardTitle>
                  <Badge variant="secondary">2 Demo Users</Badge>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div>• Approve/decline requests</div>
                  <div>• Route optimization</div>
                  <div>• System analytics</div>
                  <div>• Resource allocation</div>
                  <div>• Performance monitoring</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Videographers</CardTitle>
                  <Badge variant="secondary">2 Demo Users</Badge>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div>• View shoot schedule</div>
                  <div>• Update job status</div>
                  <div>• Access location details</div>
                  <div>• Report completion</div>
                  <div>• Track performance metrics</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Demo Login Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Demo Login Credentials</CardTitle>
              <CardDescription>Use these accounts to explore different user perspectives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Agents (Different Tiers):</h4>
                  <div className="space-y-1 text-muted-foreground">
                    <div>sarah@premiumrealty.com (Elite Tier)</div>
                    <div>michael@premiumrealty.com (Premium Tier)</div>
                    <div>jessica@premiumrealty.com (Standard Tier)</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Management & Video Team:</h4>
                  <div className="space-y-1 text-muted-foreground">
                    <div>alex@premiumrealty.com (Manager)</div>
                    <div>chris@videopro.com (Videographer)</div>
                    <div>admin@premiumrealty.com (Admin)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Close Demo Guide
            </Button>
            <Button onClick={() => handleScenarioStart('complete-workflow')}>
              Start Full Walkthrough
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getStepDescription(scenarioId: string, step: number): string {
  const descriptions: Record<string, string[]> = {
    'urgent-booking': [
      'Agent Sarah identifies time-sensitive listing opportunity and submits priority booking request with complete property details.',
      'System automatically calculates priority score based on property value, agent tier, timeline urgency, and business rules.',
      'Manager Alex receives instant push notification and email alert about high-priority request requiring immediate attention.',
      'Manager reviews all details and approves request within SLA timeframe, triggering automatic workflow progression.',
      'System identifies best-matched videographer based on availability, location, and expertise for luxury properties.',
      'All parties receive confirmation with detailed scheduling information, special requirements, and contact details.'
    ],
    'route-optimization': [
      'System identifies multiple approved bookings scheduled for the same geographic area and time period.',
      'AI engine analyzes traffic patterns, travel distances, shoot durations, and optimal timing for each location.',
      'Algorithm calculates most efficient route considering factors like lighting conditions, travel time, and setup requirements.',
      'System presents optimized schedule suggestion showing time savings and recommending combined shoot approach.',
      'Automatic rescheduling reduces total travel time from 3.5 hours to 2.1 hours, saving fuel costs and increasing efficiency.',
      'Videographer can now handle additional bookings in the freed time slot, increasing daily revenue potential by 40%.'
    ],
    'complete-workflow': [
      'Agent Jessica creates comprehensive booking with property details, client requirements, timeline, and special instructions.',
      'System validates all required fields, checks for conflicts, calculates priority score, and ensures completeness before submission.',
      'Manager Lisa receives notification, reviews booking against capacity and resources, then approves with scheduling preferences.',
      'Videographer Jordan gets assignment notification with complete job details, location access info, and client contact information.',
      'On-site execution includes checklist completion, photo/video capture, and real-time status updates visible to all stakeholders.',
      'Upon completion, system triggers automated delivery workflow, client notification, and invoice generation for seamless closure.'
    ]
  }

  return descriptions[scenarioId]?.[step] || 'Detailed step information not available.'
}