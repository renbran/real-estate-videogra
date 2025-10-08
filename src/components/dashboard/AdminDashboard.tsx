import { useState } from 'react'
import { motion } from 'framer-motion'
import { useBookingAPI } from '@/hooks/useClientAPI'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Shield, 
  Users, 
  CalendarBlank, 
  TrendUp, 
  Settings, 
  Database,
  Lightning,
  Target,
  Crown,
  Sparkle,
  Clock,
  CheckCircle,
  XCircle,
  MapPin
} from '@phosphor-icons/react'
import { BookingRequest, User } from '@/lib/types'
import { formatDate, formatDateTime } from '@/lib/date-utils'
import { 
  PageTransition, 
  FadeInUp, 
  StaggerChildren, 
  StaggerChild, 
  CardAnimation, 
  FloatingAnimation 
} from '@/components/ui/animations/PageTransition'

interface AdminDashboardProps {
  currentUserId: string
}

export function AdminDashboard({ currentUserId }: AdminDashboardProps) {
  const { getBookings, getUsers } = useBookingAPI()
  const [activeTab, setActiveTab] = useState('overview')
  
  const allUsers = getUsers()
  const allBookings = getBookings()
  
  // Analytics
  const agents = allUsers.filter(u => u.role === 'agent')
  const managers = allUsers.filter(u => u.role === 'manager')
  const videographers = allUsers.filter(u => u.role === 'videographer')
  const admins = allUsers.filter(u => u.role === 'admin')
  
  const pendingBookings = allBookings.filter(b => b.status === 'pending')
  const approvedBookings = allBookings.filter(b => b.status === 'approved')
  const completedBookings = allBookings.filter(b => b.status === 'completed')
  const totalBookingsThisMonth = allBookings.filter(b => 
    new Date(b.created_at).getMonth() === new Date().getMonth()
  )
  
  const systemHealth = {
    activeUsers: allUsers.filter(u => u.is_active !== false).length,
    totalUsers: allUsers.length,
    bookingCompletionRate: completedBookings.length / (allBookings.length || 1) * 100,
    averagePerformanceScore: agents.reduce((sum, a) => sum + (a.performance_score || 0), 0) / (agents.length || 1)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-800 bg-yellow-50">Pending</Badge>
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-800">Approved</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800"><Crown className="w-3 h-3 mr-1" />Admin</Badge>
      case 'manager':
        return <Badge className="bg-blue-100 text-blue-800"><Settings className="w-3 h-3 mr-1" />Manager</Badge>
      case 'agent':
        return <Badge className="bg-green-100 text-green-800"><Users className="w-3 h-3 mr-1" />Agent</Badge>
      case 'videographer':
        return <Badge className="bg-orange-100 text-orange-800"><Lightning className="w-3 h-3 mr-1" />Videographer</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <PageTransition type="fade" className="p-6 max-w-7xl mx-auto bg-white min-h-screen">
      {/* Admin Header */}
      <FadeInUp className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="relative">
              <motion.h1 
                className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-osus-burgundy to-osus-primary-800 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                OSUS System Administration
              </motion.h1>
              <FloatingAnimation className="absolute -top-1 -right-6">
                <Crown className="w-8 h-8 text-purple-500" />
              </FloatingAnimation>
            </div>
            <motion.p 
              className="text-osus-primary-700/80 mt-2 font-medium flex items-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Shield className="w-4 h-4" />
              System Administrator • Full Access Control
              <Sparkle className="w-4 h-4 text-purple-400" />
            </motion.p>
          </div>
          
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Badge className="bg-purple-100 text-purple-800 px-3 py-1">
              <Database className="w-4 h-4 mr-1" />
              System Health: {Math.round(systemHealth.bookingCompletionRate)}%
            </Badge>
          </motion.div>
        </div>
      </FadeInUp>

      {/* System Stats Cards */}
      <StaggerChildren className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StaggerChild>
          <CardAnimation>
            <Card className="border-purple-200/50 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold text-purple-800"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                >
                  {allUsers.length}
                </motion.div>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-green-600 font-medium">{agents.length} Agents</span>
                  <span className="text-blue-600 font-medium">{managers.length} Managers</span>
                  <span className="text-orange-600 font-medium">{videographers.length} Video</span>
                </div>
              </CardContent>
            </Card>
          </CardAnimation>
        </StaggerChild>

        <StaggerChild>
          <CardAnimation delay={0.1}>
            <Card className="border-blue-200/50 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                  <CalendarBlank className="w-4 h-4" />
                  Active Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold text-blue-800"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
                >
                  {pendingBookings.length + approvedBookings.length}
                </motion.div>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-yellow-600 font-medium">{pendingBookings.length} Pending</span>
                  <span className="text-green-600 font-medium">{approvedBookings.length} Approved</span>
                </div>
              </CardContent>
            </Card>
          </CardAnimation>
        </StaggerChild>

        <StaggerChild>
          <CardAnimation delay={0.2}>
            <Card className="border-emerald-200/50 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-emerald-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                  <TrendUp className="w-4 h-4" />
                  Monthly Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold text-emerald-800"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4, type: "spring" }}
                >
                  {totalBookingsThisMonth.length}
                </motion.div>
                <p className="text-xs text-emerald-600 mt-1 font-medium">Bookings this month</p>
              </CardContent>
            </Card>
          </CardAnimation>
        </StaggerChild>

        <StaggerChild>
          <CardAnimation delay={0.3}>
            <Card className="border-osus-primary-200/50 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-osus-primary-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-osus-primary-700 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  System Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold text-osus-primary-800 flex items-center gap-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5, type: "spring" }}
                >
                  {Math.round(systemHealth.averagePerformanceScore)}%
                  <motion.div 
                    className="w-2 h-2 bg-green-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.div>
                <p className="text-xs text-osus-primary-600 mt-1 font-medium">Average score</p>
              </CardContent>
            </Card>
          </CardAnimation>
        </StaggerChild>
      </StaggerChildren>

      {/* Admin Tabs */}
      <FadeInUp delay={0.8}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <TabsList className="mb-6 bg-white border-2 border-purple-300 shadow-sm">
              <TabsTrigger value="overview">System Overview</TabsTrigger>
              <TabsTrigger value="users">Users ({allUsers.length})</TabsTrigger>
              <TabsTrigger value="bookings">Bookings ({allBookings.length})</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">System Settings</TabsTrigger>
            </TabsList>
          </motion.div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TabsContent value="overview">
              <StaggerChildren className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <StaggerChild>
                  <CardAnimation>
                    <Card className="border-osus-primary-200/50 shadow-lg bg-white">
                      <CardHeader className="bg-gradient-to-r from-osus-primary-100 to-purple-100 border-b border-osus-primary-200">
                        <CardTitle className="text-osus-primary-900 font-semibold flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Recent System Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {allBookings.slice(0, 5).map((booking) => (
                            <div key={booking.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition-colors">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium">{booking.location}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatDateTime(booking.created_at)}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(booking.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </CardAnimation>
                </StaggerChild>

                {/* System Health */}
                <StaggerChild>
                  <CardAnimation delay={0.2}>
                    <Card className="border-purple-200/50 shadow-lg bg-white">
                      <CardHeader className="bg-gradient-to-r from-purple-100 to-osus-secondary-100 border-b border-purple-200">
                        <CardTitle className="text-purple-900 font-semibold flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          System Health Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Active Users</span>
                              <span>{systemHealth.activeUsers}/{systemHealth.totalUsers}</span>
                            </div>
                            <Progress value={(systemHealth.activeUsers / systemHealth.totalUsers) * 100} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Booking Completion Rate</span>
                              <span>{Math.round(systemHealth.bookingCompletionRate)}%</span>
                            </div>
                            <Progress value={systemHealth.bookingCompletionRate} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Agent Performance</span>
                              <span>{Math.round(systemHealth.averagePerformanceScore)}%</span>
                            </div>
                            <Progress value={systemHealth.averagePerformanceScore} className="h-2" />
                          </div>

                          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-osus-primary-50 rounded-lg">
                            <p className="text-sm font-semibold text-purple-800 mb-1">
                              ✅ System Status: Healthy
                            </p>
                            <p className="text-xs text-purple-600">
                              All services operational • Last check: {new Date().toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardAnimation>
                </StaggerChild>
              </StaggerChildren>
            </TabsContent>

            <TabsContent value="users">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-osus-primary-800">User Management</h3>
                  <Badge variant="outline" className="border-purple-300 text-purple-700">
                    {allUsers.length} Total Users
                  </Badge>
                </div>
                
                <StaggerChildren className="space-y-3">
                  {allUsers.map((user, index) => (
                    <StaggerChild key={user.id}>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-osus-primary-800">{user.name}</span>
                                {getRoleBadge(user.role)}
                                {user.role === 'agent' && user.agent_tier && (
                                  <Badge variant="outline" className="text-xs">
                                    {user.agent_tier} tier
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              {user.role === 'agent' && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Performance: {user.performance_score}% • 
                                  Quota: {user.monthly_used || 0}/{user.monthly_quota || 0}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {user.is_active !== false ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                              <Button variant="outline" size="sm">
                                Manage
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </StaggerChild>
                  ))}
                </StaggerChildren>
              </div>
            </TabsContent>

            <TabsContent value="bookings">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-osus-primary-800">Booking Management</h3>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                      {pendingBookings.length} Pending
                    </Badge>
                    <Badge variant="outline" className="border-green-300 text-green-700">
                      {approvedBookings.length} Approved
                    </Badge>
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      {completedBookings.length} Completed
                    </Badge>
                  </div>
                </div>
                
                <StaggerChildren className="space-y-3">
                  {allBookings.map((booking, index) => (
                    <StaggerChild key={booking.id}>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">{booking.location}</span>
                                {getStatusBadge(booking.status)}
                              </div>
                              <div className="text-sm text-gray-600">
                                Agent: {allUsers.find(u => u.id === booking.agent_id)?.name || 'Unknown'} • 
                                Date: {formatDate(booking.preferred_date)} • 
                                Priority: {booking.priority_score}/100
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Created: {formatDateTime(booking.created_at)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                              {booking.status === 'pending' && (
                                <>
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                    Approve
                                  </Button>
                                  <Button variant="destructive" size="sm">
                                    Decline
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </StaggerChild>
                  ))}
                </StaggerChildren>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="text-center py-12">
                <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Advanced Analytics</h3>
                <p className="text-gray-500">
                  Comprehensive system analytics and reporting dashboard coming soon...
                </p>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="text-center py-12">
                <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">System Settings</h3>
                <p className="text-gray-500">
                  System configuration and administrative settings panel coming soon...
                </p>
              </div>
            </TabsContent>
          </motion.div>
        </Tabs>
      </FadeInUp>
    </PageTransition>
  )
}