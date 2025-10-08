import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LoadingSpinner, LoadingDots } from './LoadingSpinner'
import { Sparkle, Video, MapPin, Calendar } from '@phosphor-icons/react'

interface LoadingScreenProps {
  message?: string
  showProgress?: boolean
  duration?: number
  type?: 'spinner' | 'dots' | 'logo' | 'full'
  className?: string
}

export function LoadingScreen({ 
  message = 'Loading...', 
  showProgress = false,
  duration = 3000,
  type = 'full',
  className 
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentTip, setCurrentTip] = useState(0)

  const loadingTips = [
    "Preparing your videography booking experience...",
    "Connecting with professional videographers...",
    "Optimizing your property showcase...",
    "Setting up your personalized dashboard...",
    "Loading your booking history...",
    "Finalizing system configurations..."
  ]

  useEffect(() => {
    if (!showProgress) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + (100 / (duration / 100))
      })
    }, 100)

    return () => clearInterval(interval)
  }, [duration, showProgress])

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % loadingTips.length)
    }, 2000)

    return () => clearInterval(tipInterval)
  }, [])

  if (type === 'spinner') {
    return (
      <div className="flex items-center justify-center space-x-2">
        <LoadingSpinner size="md" />
        <span className="text-sm text-osus-primary-700">{message}</span>
      </div>
    )
  }

  if (type === 'dots') {
    return (
      <div className="flex flex-col items-center space-y-3">
        <LoadingDots size="lg" />
        <span className="text-sm text-osus-primary-700">{message}</span>
      </div>
    )
  }

  if (type === 'logo') {
    return (
      <motion.div 
        className="flex flex-col items-center space-y-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1] 
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="relative"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-osus-burgundy to-osus-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
            <Video size={32} className="text-white" />
          </div>
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7] 
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="absolute -top-1 -right-1"
          >
            <Sparkle size={16} className="text-osus-gold" />
          </motion.div>
        </motion.div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-osus-primary-800">OSUS VideoPro</h3>
          <p className="text-sm text-osus-primary-600">{message}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-gradient-to-br from-white via-osus-primary-50/30 to-osus-secondary-50/30 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}
    >
      <div className="text-center space-y-8 max-w-md px-6">
        {/* Main Logo Animation */}
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative mx-auto"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-osus-burgundy via-osus-primary-600 to-osus-primary-800 rounded-3xl flex items-center justify-center shadow-2xl">
            <Video size={48} className="text-white" />
          </div>
          
          {/* Floating Icons */}
          <motion.div
            animate={{ 
              y: [-5, 5, -5],
              rotate: [0, 15, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-2 -left-2"
          >
            <div className="w-8 h-8 bg-osus-gold rounded-full flex items-center justify-center shadow-lg">
              <Sparkle size={16} className="text-white" />
            </div>
          </motion.div>

          <motion.div
            animate={{ 
              y: [5, -5, 5],
              rotate: [0, -15, 0]
            }}
            transition={{ 
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute -bottom-2 -right-2"
          >
            <div className="w-8 h-8 bg-osus-secondary-500 rounded-full flex items-center justify-center shadow-lg">
              <Calendar size={16} className="text-white" />
            </div>
          </motion.div>

          <motion.div
            animate={{ 
              x: [3, -3, 3],
              rotate: [0, 10, 0]
            }}
            transition={{ 
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute top-1/2 -right-4"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
              <MapPin size={12} className="text-white" />
            </div>
          </motion.div>
        </motion.div>

        {/* Brand Name */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-osus-burgundy to-osus-primary-700 bg-clip-text text-transparent mb-2">
            OSUS Real Estate Brokerage
          </h1>
          <p className="text-osus-primary-600 text-lg font-medium">
            Professional Real Estate Videography
          </p>
        </motion.div>

        {/* Loading Animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <LoadingDots size="lg" variant="accent" />
          
          {/* Progress Bar */}
          {showProgress && (
            <div className="w-full max-w-xs mx-auto">
              <div className="h-2 bg-osus-primary-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-osus-burgundy to-osus-gold rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-osus-primary-500 mt-2">{Math.round(progress)}% Complete</p>
            </div>
          )}
        </motion.div>

        {/* Loading Tips */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="min-h-[50px] flex items-center justify-center"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTip}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-sm text-osus-primary-600 font-medium text-center"
            >
              {loadingTips[currentTip]}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Powered By */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-xs text-osus-primary-400"
        >
          Powered by Advanced AI & Real Estate Technology
        </motion.div>
      </div>
    </motion.div>
  )
}