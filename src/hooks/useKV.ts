import { useState, useCallback } from 'react'

/**
 * Local replacement for GitHub Spark's useKV hook
 * Uses localStorage for persistence in development environment
 */
export function useKV<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`kv_${key}`)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error)
    }
    return defaultValue
  })

  const setValueAndStore = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prevValue => {
      try {
        const resolvedValue = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prevValue) : newValue
        localStorage.setItem(`kv_${key}`, JSON.stringify(resolvedValue))
        return resolvedValue
      } catch (error) {
        console.warn(`Failed to save ${key} to localStorage:`, error)
        return typeof newValue === 'function' ? (newValue as (prev: T) => T)(prevValue) : newValue
      }
    })
  }, [key])

  return [value, setValueAndStore]
}