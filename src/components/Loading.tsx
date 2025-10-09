import { Loader2 } from 'lucide-react'

/**
 * Full-page loading screen with branding
 */
export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blush-50 via-background to-blush-100 flex items-center justify-center">
      <div className="text-center">
        {/* Logo placeholder - replace with actual logo */}
        <div className="mb-6 flex justify-center">
          <div className="text-6xl font-bold bg-gradient-to-r from-burgundy-600 to-burgundy-800 bg-clip-text text-transparent">
            OSUS
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <Loader2 className="w-12 h-12 text-burgundy-600 animate-spin" />
        </div>

        <div className="text-burgundy-700 font-semibold text-lg mb-2">
          Loading Your Booking System...
        </div>

        <div className="text-burgundy-500 text-sm">
          Please wait a moment
        </div>
      </div>
    </div>
  )
}

/**
 * Inline loading spinner
 */
export function LoadingSpinner({ size = 'md', className = '' }: { 
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <Loader2 className={`animate-spin text-burgundy-600 ${sizeClasses[size]} ${className}`} />
  )
}

/**
 * Loading button with spinner
 */
export function LoadingButton({ 
  children, 
  isLoading, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }) {
  return (
    <button {...props} disabled={isLoading || props.disabled}>
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <LoadingSpinner size="sm" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

/**
 * Skeleton loader for content
 */
export function Skeleton({ 
  className = '', 
  variant = 'default' 
}: { 
  className?: string
  variant?: 'default' | 'text' | 'avatar' | 'card'
}) {
  const baseClass = 'animate-pulse bg-gray-200 rounded'
  
  const variantClasses = {
    default: 'h-4 w-full',
    text: 'h-4 w-3/4',
    avatar: 'h-12 w-12 rounded-full',
    card: 'h-48 w-full'
  }

  return (
    <div className={`${baseClass} ${variantClasses[variant]} ${className}`} />
  )
}

/**
 * Loading overlay for components
 */
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-3" />
        <p className="text-burgundy-700 font-medium">{message}</p>
      </div>
    </div>
  )
}

/**
 * Dashboard card skeleton
 */
export function DashboardCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <Skeleton variant="text" className="w-1/2" />
      <Skeleton variant="card" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}

/**
 * Table skeleton loader
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number, columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
