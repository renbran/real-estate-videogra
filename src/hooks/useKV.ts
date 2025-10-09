import { useState, useCallback, useEffect } from 'react'

/**
 * Production-ready replacement for GitHub Spark's useKV hook
 * Uses localStorage for persistence with proper error handling
 * Compatible with SSR and works in all environments
 */
export function useKV<T>(
  key: string, 
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state with localStorage value or default
  const [value, setValue] = useState<T>(() => {
    // Check if window is available (not SSR)
    if (typeof window === 'undefined') {
      return defaultValue
    }

    try {
      const storedValue = localStorage.getItem(`videoPro_kv_${key}`)
      if (storedValue !== null) {
        return JSON.parse(storedValue) as T
      }
    } catch (error) {
      console.warn(`[useKV] Failed to load "${key}" from localStorage:`, error)
    }

    return defaultValue
  })

  // Sync with localStorage when value changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(`videoPro_kv_${key}`, JSON.stringify(value))
    } catch (error) {
      console.warn(`[useKV] Failed to persist "${key}" to localStorage:`, error)
    }
  }, [key, value])

  // Memoized setter function that supports functional updates
  const setValueAndStore = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prevValue => {
      const resolvedValue = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(prevValue)
        : newValue

      // Persist to localStorage in the next tick to avoid blocking
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          try {
            localStorage.setItem(`videoPro_kv_${key}`, JSON.stringify(resolvedValue))
          } catch (error) {
            console.warn(`[useKV] Failed to persist "${key}" to localStorage:`, error)
          }
        }, 0)
      }

      return resolvedValue
    })
  }, [key])

  return [value, setValueAndStore]
}

/**
 * Clear all VideoPro KV storage
 * Useful for logout or reset functionality
 */
export function clearAllKV(): void {
  if (typeof window === 'undefined') return

  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('videoPro_kv_')) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.warn('[useKV] Failed to clear storage:', error)
  }
}
