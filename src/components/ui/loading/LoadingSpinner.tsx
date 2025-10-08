import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'secondary' | 'accent'
  className?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const variantClasses = {
    default: 'border-osus-primary-500 border-t-transparent',
    secondary: 'border-osus-secondary-500 border-t-transparent',
    accent: 'border-osus-gold border-t-transparent'
  }

  return (
    <div 
      className={cn(
        'animate-spin rounded-full border-2',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function LoadingDots({ 
  size = 'md', 
  variant = 'default',
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5', 
    xl: 'w-3 h-3'
  }

  const variantClasses = {
    default: 'bg-osus-primary-500',
    secondary: 'bg-osus-secondary-500',
    accent: 'bg-osus-gold'
  }

  return (
    <div className={cn('flex space-x-1 justify-center items-center', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-bounce',
            sizeClasses[size],
            variantClasses[variant]
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}

export function LoadingPulse({ 
  size = 'md',
  variant = 'default', 
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }

  const variantClasses = {
    default: 'bg-osus-primary-500/20',
    secondary: 'bg-osus-secondary-500/20',
    accent: 'bg-osus-gold/20'
  }

  return (
    <div className={cn('relative', className)}>
      <div 
        className={cn(
          'absolute inset-0 rounded-full animate-ping',
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      <div 
        className={cn(
          'relative rounded-full animate-pulse',
          sizeClasses[size],
          variantClasses[variant].replace('/20', '/40')
        )}
      />
    </div>
  )
}