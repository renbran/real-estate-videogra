import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  animate?: boolean
}

export function Skeleton({ className, animate = true }: SkeletonProps) {
  const baseClasses = "bg-gradient-to-r from-osus-primary-100 via-osus-primary-200 to-osus-primary-100 rounded-md"
  
  if (animate) {
    return (
      <motion.div
        className={cn(baseClasses, className)}
        animate={{ 
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          backgroundSize: '200% 100%'
        }}
      />
    )
  }
  
  return <div className={cn(baseClasses, className)} />
}

export function BookingCardSkeleton() {
  return (
    <div className="p-6 border border-osus-primary-200 rounded-lg space-y-4 bg-white shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

export function DashboardCardSkeleton() {
  return (
    <div className="border border-osus-primary-200 shadow-md rounded-lg bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}

export function UserProfileSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="grid grid-cols-4 gap-4 p-4 border-b border-osus-primary-100">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

export function MapSkeleton() {
  return (
    <div className="relative w-full h-64 bg-osus-primary-50 rounded-lg overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ 
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Mock map elements */}
      <div className="absolute top-4 left-4">
        <Skeleton className="h-8 w-20" />
      </div>
      
      <div className="absolute bottom-4 right-4">
        <Skeleton className="h-6 w-16" />
      </div>
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      
      {/* Mock roads */}
      <div className="absolute top-1/4 left-0 right-0">
        <Skeleton className="h-1 w-full" />
      </div>
      
      <div className="absolute bottom-1/4 left-0 right-0">
        <Skeleton className="h-1 w-3/4" />
      </div>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

export function NotificationSkeleton() {
  return (
    <div className="flex items-start space-x-3 p-4 border-b border-osus-primary-100">
      <Skeleton className="h-6 w-6 rounded-full flex-shrink-0 mt-1" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  )
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      
      {/* Events List */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
    </div>
  )
}