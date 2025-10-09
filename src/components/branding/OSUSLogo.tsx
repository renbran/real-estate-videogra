import osusLogo from '@/assets/images/osus-logo.svg'

interface OSUSLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function OSUSLogo({ className = '', size = 'md', showText = true }: OSUSLogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8', 
    lg: 'h-12'
  }

  if (showText) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img 
          src={osusLogo} 
          alt="OSUS Properties" 
          className={`w-auto ${sizeClasses[size]}`}
        />
        <div className="h-6 w-px bg-border"></div>
        <div className={`font-bold text-primary ${size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-lg'}`}>
          VideoPro
        </div>
      </div>
    )
  }

  return (
    <img 
      src={osusLogo} 
      alt="OSUS Properties" 
      className={`w-auto ${sizeClasses[size]} ${className}`}
    />
  )
}