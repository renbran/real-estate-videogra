import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBookingAPI } from '@/hooks/useClientAPI'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { CalendarBlank, MapPin, Clock, TrendUp, Plus, Bell, Envelope, Lightning, Sparkle, Target } from '@phosphor-icons/react'
import { BookingRequest, SHOOT_COMPLEXITIES, User } from '@/lib/types'
import { formatDate, formatDateTime } from '@/lib/date-utils'
import { BookingForm } from '@/components/booking/BookingForm'
import { CalendarExportButton } from '@/components/calendar/CalendarExportButton'
import { CalendarNotificationCenter } from '@/components/calendar/CalendarNotificationCenter'
import { PushNotificationSettings } from '@/components/notifications/PushNotificationSettings'
import { PushNotificationDemo } from '@/components/notifications/PushNotificationDemo'
import { useNotifications } from '@/hooks/useNotifications'
import { OSUS_BRAND } from '@/lib/osus-brand'
import { DailyAIInsights } from '@/components/insights/DailyAIInsights'
import { 
  PageTransition, 
  FadeInUp, 
  StaggerChildren, 
  StaggerChild, 
  CardAnimation, 
  HoverScale, 
  FloatingAnimation,
  PulseAnimation 
} from '@/components/ui/animations/PageTransition'

interface AgentDashboardProps {
  currentUserId: string
}

export function AgentDashboard({ currentUserId }: AgentDashboardProps) {
  const { getBookings, getBookingsByAgent, getUsers } = useBookingAPI()
  const users = getUsers()
  const [activeTab, setActiveTab] = useState('overview')
  const { getNotificationHistory } = useNotifications()
  
  const currentAgent = users.find(a => a.id === currentUserId && a.role === 'agent') || 
                       users.find(a => a.role === 'agent') || 
                       { id: currentUserId, name: 'User', email: '', role: 'agent', agent_tier: 'standard', monthly_quota: 0, monthly_used: 0, performance_score: 0, created_at: new Date().toISOString() } as User
  const myBookings = getBookingsByAgent(currentUserId)
  const pendingBookings = myBookings.filter(b => b.status === 'pending')
  const approvedBookings = myBookings.filter(b => b.status === 'approved')
  const completedBookings = myBookings.filter(b => b.status === 'completed')

  const getNotificationStatusBadge = (bookingId: string, status: string) => {
    const history = getNotificationHistory(bookingId)
    if (status === 'approved') {
      const approvalNotification = history.find(h => h.type === 'booking_approved')
      if (approvalNotification) {
        return approvalNotification.sent ? (
          <Badge variant="outline" className="text-xs border-green-300 text-green-700">
            <Envelope className="w-3 h-3 mr-1" />
            Notified
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs border-red-300 text-red-700">
            <Bell className="w-3 h-3 mr-1" />
            Notification Failed
          </Badge>
        )
      }
    }
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-osus-secondary-300 text-osus-secondary-800 bg-osus-secondary-50">Pending</Badge>
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Approved</Badge>
      case 'completed':
        return <Badge className="bg-osus-primary-100 text-osus-primary-800 hover:bg-osus-primary-200">Completed</Badge>
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getComplexityBadge = (complexity?: string) => {
    if (!complexity) return null
    switch (complexity) {
      case 'quick':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Quick</Badge>
      case 'standard':
        return <Badge className="bg-osus-secondary-100 text-osus-secondary-800 hover:bg-osus-secondary-200">Standard</Badge>
      case 'complex':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Complex</Badge>
      default:
        return <Badge variant="outline">{complexity}</Badge>
    }
  }

  if (activeTab === 'new-booking') {
    return (
      <div>
        <div className="mb-6">
          <Button 
            onClick={() => setActiveTab('overview')} 
            variant="ghost" 
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <BookingForm 
          currentUserId={currentUserId} 
          onSubmit={() => setActiveTab('overview')}
        />
      </div>
    )
  }

  return (
    <PageTransition type="fade" className="p-6 max-w-7xl mx-auto bg-white min-h-screen">
      {/* Header */}
      <FadeInUp className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="relative">
              <motion.h1 
                className="text-3xl font-bold bg-gradient-to-r from-osus-burgundy to-osus-primary-800 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Welcome back, {currentAgent.name}
              </motion.h1>
              <FloatingAnimation className="absolute -top-1 -right-4">
                <Sparkle className="w-6 h-6 text-osus-secondary-500" />
              </FloatingAnimation>
            </div>
            <motion.p 
              className="text-osus-primary-700/80 mt-2 font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {currentAgent.tier ? (currentAgent.tier.charAt(0).toUpperCase() + currentAgent.tier.slice(1)) : 'Standard'} Agent • 
              <span className="inline-flex items-center gap-1 text-osus-secondary-600">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Target className="w-4 h-4" />
                </motion.div>
                Performance Score: {currentAgent.performance_score}/100
              </span>
            </motion.p>
          </div>
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <HoverScale>
              <CalendarExportButton bookings={approvedBookings} />
            </HoverScale>
            <HoverScale>
              <Button 
                onClick={() => setActiveTab('new-booking')} 
                className="flex items-center gap-2 bg-osus-burgundy hover:bg-osus-primary-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-3 text-base font-semibold"
              >
                <Plus className="w-5 h-5" />
                New Booking
              </Button>
            </HoverScale>
          </motion.div>
        </div>
      </FadeInUp>

      {/* Stats Cards */}
      <StaggerChildren className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StaggerChild>
          <CardAnimation>
            <Card className="border-osus-primary-200/50 shadow-md hover:shadow-lg transition-all duration-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-osus-primary-700 flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Target className="w-4 h-4" />
                  </motion.div>
                  Monthly Quota
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold text-osus-primary-800"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                >
                  {currentAgent.monthly_used || 0}/{currentAgent.monthly_quota || 0}
                </motion.div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <Progress 
                    value={((currentAgent.monthly_used || 0) / (currentAgent.monthly_quota || 1)) * 100} 
                    className="mt-2 [&>div]:bg-gradient-to-r [&>div]:from-osus-primary-500 [&>div]:to-osus-secondary-500"
                  />
                </motion.div>
                <p className="text-xs text-osus-primary-600 mt-1 font-medium">
                  {(currentAgent.monthly_quota || 0) - (currentAgent.monthly_used || 0)} slots remaining
                </p>
              </CardContent>
            </Card>
          </CardAnimation>
        </StaggerChild>

        <StaggerChild>
          <CardAnimation delay={0.1}>
            <Card className="border-osus-secondary-200/50 shadow-md hover:shadow-lg transition-all duration-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-osus-secondary-700 flex items-center gap-2">
                  <PulseAnimation>
                    <Clock className="w-4 h-4" />
                  </PulseAnimation>
                  Pending Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold text-osus-secondary-800"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
                >
                  {pendingBookings.length}
                </motion.div>
                <p className="text-xs text-osus-secondary-600 mt-1 font-medium">Awaiting approval</p>
              </CardContent>
            </Card>
          </CardAnimation>
        </StaggerChild>

        <StaggerChild>
          <CardAnimation delay={0.2}>
            <Card className="border-emerald-200/50 shadow-md hover:shadow-lg transition-all duration-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Lightning className="w-4 h-4" />
                  </motion.div>
                  Upcoming Shoots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold text-emerald-800"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4, type: "spring" }}
                >
                  {approvedBookings.length}
                </motion.div>
                <p className="text-xs text-emerald-600 mt-1 font-medium">Confirmed bookings</p>
              </CardContent>
            </Card>
          </CardAnimation>
        </StaggerChild>

        <StaggerChild>
          <CardAnimation delay={0.3}>
            <Card className="border-osus-primary-200/50 shadow-md hover:shadow-lg transition-all duration-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-osus-primary-700 flex items-center gap-2">
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <TrendUp className="w-4 h-4" />
                  </motion.div>
                  Performance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2 text-osus-primary-800">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5, type: "spring" }}
                  >
                    {currentAgent.performance_score}
                  </motion.span>
                  <motion.div 
                    className="w-2 h-2 bg-gradient-to-r from-osus-primary-500 to-osus-secondary-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
                <p className="text-xs text-osus-secondary-600 mt-1 font-medium">+5 this month</p>
              </CardContent>
            </Card>
          </CardAnimation>
        </StaggerChild>
      </StaggerChildren>

      {/* Tabs */}
      <FadeInUp delay={0.8}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <TabsList className="mb-6 bg-white border-2 border-osus-primary-300 shadow-sm">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingBookings.length})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approvedBookings.length})</TabsTrigger>
              <TabsTrigger value="calendar">Calendar & Notifications</TabsTrigger>
              <TabsTrigger value="notifications">Push Notifications</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="overview">
          {/* Daily AI Insights */}
          <div className="mb-6">
            <DailyAIInsights 
              bookings={myBookings}
              currentUser={currentAgent}
              userRole="agent"
            />
          </div>
          
          <StaggerChildren className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Bookings */}
            <StaggerChild>
              <CardAnimation>
                <Card className="border-osus-primary-200/50 shadow-lg bg-white">
              <CardHeader className="bg-osus-primary-100 border-b border-osus-primary-200">
                <CardTitle className="text-osus-primary-900 font-semibold flex items-center gap-2">
                  <CalendarBlank className="w-5 h-5" />
                  Recent Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-start justify-between p-3 border rounded-md">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{booking.location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarBlank className="w-3 h-3" />
                            {formatDate(booking.preferred_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {booking.shoot_complexity && SHOOT_COMPLEXITIES[booking.shoot_complexity] ? 
                              SHOOT_COMPLEXITIES[booking.shoot_complexity].duration + 'min' : 
                              booking.estimated_duration ? booking.estimated_duration + 'min' : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(booking.status)}
                        {getComplexityBadge(booking.shoot_complexity)}
                      </div>
                    </div>
                  ))}
                  {myBookings.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarBlank className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No bookings yet</p>
                      <Button 
                        onClick={() => setActiveTab('new-booking')} 
                        variant="outline" 
                        className="mt-3"
                      >
                        Create your first booking
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
                </Card>
              </CardAnimation>
            </StaggerChild>

            {/* Performance Insights */}
            <StaggerChild>
              <CardAnimation delay={0.2}>
                <Card className="border-osus-primary-200/50 shadow-lg bg-white">
              <CardHeader className="bg-osus-primary-100 border-b border-osus-primary-200">
                <CardTitle className="text-osus-primary-900 font-semibold flex items-center gap-2">
                  <TrendUp className="w-5 h-5" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Estimate Accuracy</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>On-Time Property Access</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Flexibility Score</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  
                  <div className="mt-4 p-4 bg-gradient-to-r from-osus-primary-50 to-osus-secondary-50 border border-osus-primary-200/30 rounded-lg">
                    <p className="text-sm font-semibold mb-2 text-osus-primary-800 flex items-center gap-2">
                      <Sparkle className="w-4 h-4" />
                      Daily AI Tips for Higher Priority
                    </p>
                    <ul className="text-xs text-osus-primary-700 space-y-1 font-medium">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-osus-secondary-500 rounded-full" />
                        Enable flexible scheduling for +5 points
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-osus-secondary-500 rounded-full" />
                        Book 7+ days in advance for +10 points
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-osus-secondary-500 rounded-full" />
                        Accurate estimates improve your score
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
                </Card>
              </CardAnimation>
            </StaggerChild>
          </StaggerChildren>
              </TabsContent>

              <TabsContent value="pending">
                <StaggerChildren className="space-y-4">
                  {pendingBookings.map((booking, index) => (
                    <StaggerChild key={booking.id}>
                      <CardAnimation delay={index * 0.1}>
                        <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{booking.location}</span>
                        {booking.shoot_complexity && getComplexityBadge(booking.shoot_complexity)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Preferred Date:</span> {formatDate(booking.preferred_date)}
                        </div>
                        <div>
                          <span className="font-medium">Priority Score:</span> {booking.priority_score}/100
                        </div>
                      </div>
                      {booking.backup_dates.length > 0 && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Backup Dates:</span> {booking.backup_dates.map(formatDate).join(', ')}
                        </div>
                      )}
                      {booking.special_requirements && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Special Requirements:</span> {booking.special_requirements}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(booking.status)}
                      <div className="text-xs text-muted-foreground">
                        Submitted {formatDateTime(booking.created_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
                        </Card>
                      </CardAnimation>
                    </StaggerChild>
                  ))}
                  {pendingBookings.length === 0 && (
                    <StaggerChild>
                      <CardAnimation>
                        <Card>
                          <CardContent className="p-8 text-center">
                            <CalendarBlank className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-muted-foreground">No pending requests</p>
                          </CardContent>
                        </Card>
                      </CardAnimation>
                    </StaggerChild>
                  )}
                </StaggerChildren>
              </TabsContent>

              <TabsContent value="approved">
                <StaggerChildren className="space-y-4">
                  {approvedBookings.map((booking, index) => (
                    <StaggerChild key={booking.id}>
                      <CardAnimation delay={index * 0.1}>
                        <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{booking.property_address}</span>
                        {getComplexityBadge(booking.shoot_complexity)}
                        {getNotificationStatusBadge(booking.id, booking.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Scheduled:</span> {formatDate(booking.scheduled_date || booking.preferred_date)}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {booking.shoot_complexity ? SHOOT_COMPLEXITIES[booking.shoot_complexity]?.duration || 90 : 90} minutes
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(booking.status)}
                      <CalendarExportButton booking={booking} />
                    </div>
                  </div>
                </CardContent>
                        </Card>
                      </CardAnimation>
                    </StaggerChild>
                  ))}
                  {approvedBookings.length === 0 && (
                    <StaggerChild>
                      <CardAnimation>
                        <Card>
                          <CardContent className="p-8 text-center">
                            <CalendarBlank className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-muted-foreground">No approved bookings</p>
                          </CardContent>
                        </Card>
                      </CardAnimation>
                    </StaggerChild>
                  )}
                </StaggerChildren>
              </TabsContent>

              <TabsContent value="calendar">
                <FadeInUp>
                  <CalendarNotificationCenter
                    currentUser={currentAgent}
                    userBookings={myBookings}
                    upcomingBookings={approvedBookings.filter(b => 
                      b.scheduled_date && new Date(b.scheduled_date) >= new Date()
                    )}
                  />
                </FadeInUp>
              </TabsContent>

              <TabsContent value="notifications">
                <StaggerChildren className="space-y-6">
                  <StaggerChild>
                    <CardAnimation>
                      <PushNotificationSettings />
                    </CardAnimation>
                  </StaggerChild>
                  <StaggerChild>
                    <CardAnimation delay={0.2}>
                      <PushNotificationDemo />
                    </CardAnimation>
                  </StaggerChild>
                </StaggerChildren>
              </TabsContent>

              <TabsContent value="history">
                <StaggerChildren className="space-y-4">
                  {completedBookings.map((booking, index) => (
                    <StaggerChild key={booking.id}>
                      <CardAnimation delay={index * 0.1}>
                        <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{booking.property_address}</span>
                        {getComplexityBadge(booking.shoot_complexity)}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Completed:</span> {formatDate(booking.updated_at)}
                        </div>
                        <div>
                          <span className="font-medium">Estimated:</span> {booking.estimated_duration}min
                        </div>
                        <div>
                          <span className="font-medium">Actual:</span> {booking.actual_duration || 'N/A'}min
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                </CardContent>
                        </Card>
                      </CardAnimation>
                    </StaggerChild>
                  ))}
                  {completedBookings.length === 0 && (
                    <StaggerChild>
                      <CardAnimation>
                        <Card>
                          <CardContent className="p-8 text-center">
                            <CalendarBlank className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-muted-foreground">No completed bookings</p>
                          </CardContent>
                        </Card>
                      </CardAnimation>
                    </StaggerChild>
                  )}
                </StaggerChildren>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </FadeInUp>
    </PageTransition>
  )
}