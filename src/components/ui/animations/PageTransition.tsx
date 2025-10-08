import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
  type?: 'fade' | 'slide' | 'scale' | 'blur'
}

const transitionVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },
  slide: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
    transition: { duration: 0.4, ease: "easeInOut" }
  },
  scale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.05, opacity: 0 },
    transition: { duration: 0.3, ease: "easeInOut" }
  },
  blur: {
    initial: { filter: 'blur(4px)', opacity: 0 },
    animate: { filter: 'blur(0px)', opacity: 1 },
    exit: { filter: 'blur(4px)', opacity: 0 },
    transition: { duration: 0.4 }
  }
}

export function PageTransition({ 
  children, 
  className = '', 
  type = 'fade' 
}: PageTransitionProps) {
  const variants = transitionVariants[type]
  
  return (
    <motion.div
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={variants.transition}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function FadeInUp({ 
  children, 
  delay = 0, 
  className = '' 
}: { 
  children: ReactNode
  delay?: number
  className?: string 
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function SlideInLeft({ 
  children, 
  delay = 0, 
  className = '' 
}: { 
  children: ReactNode
  delay?: number
  className?: string 
}) {
  return (
    <motion.div
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ScaleIn({ 
  children, 
  delay = 0, 
  className = '' 
}: { 
  children: ReactNode
  delay?: number
  className?: string 
}) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerChildren({ 
  children, 
  staggerDelay = 0.1, 
  className = '' 
}: { 
  children: ReactNode
  staggerDelay?: number
  className?: string 
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerChild({ 
  children, 
  className = '' 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <motion.div
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
      }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function FloatingAnimation({ 
  children, 
  className = '' 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <motion.div
      animate={{ 
        y: [0, -10, 0] 
      }}
      transition={{ 
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function PulseAnimation({ 
  children, 
  className = '' 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <motion.div
      animate={{ 
        scale: [1, 1.05, 1] 
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function HoverScale({ 
  children, 
  className = '',
  scale = 1.02 
}: { 
  children: ReactNode
  className?: string
  scale?: number 
}) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function CardAnimation({ 
  children, 
  delay = 0,
  className = '' 
}: { 
  children: ReactNode
  delay?: number
  className?: string 
}) {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ProgressBar({ 
  progress, 
  className = '',
  color = 'osus-primary' 
}: { 
  progress: number
  className?: string
  color?: string 
}) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <motion.div
        className={`h-2 bg-gradient-to-r from-${color}-500 to-${color}-600 rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  )
}

export function CountUp({ 
  end, 
  duration = 1, 
  className = '' 
}: { 
  end: number
  duration?: number
  className?: string 
}) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.5,
        onComplete: () => {
          // Animation for counting up would need additional logic
        }
      }}
    >
      {end}
    </motion.span>
  )
}