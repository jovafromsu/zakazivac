import { useOptimizedFetch, APICache } from '@/lib/apiCache'
import { useState, useCallback } from 'react'

export interface ContactInfo {
  phone?: string
  email?: string
  address?: string
}

export interface ProviderProfile {
  _id?: string
  businessName: string
  description?: string
  contactInfo: ContactInfo
  timezone: string
  isActive: boolean
}

/**
 * Optimized hook for fetching provider profile with caching
 */
export const useProviderProfile = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProviderProfile | null>(null)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const cacheKey = 'provider_profile'
      
      // Check cache first (5 minutes)
      const cached = APICache.get<{ profile: ProviderProfile }>(cacheKey)
      if (cached) {
        console.log('📋 Cache hit for provider profile')
        setProfile(cached.profile)
        setLoading(false)
        return cached.profile
      }

      console.log('🌐 Fetching provider profile')
      
      const response = await fetch('/api/provider/profile')
      
      if (!response.ok) {
        if (response.status === 404) {
          // No profile exists yet - this is OK
          const defaultProfile: ProviderProfile = {
            businessName: '',
            description: '',
            contactInfo: {
              phone: '',
              email: '',
              address: ''
            },
            timezone: 'Europe/Belgrade',
            isActive: false
          }
          setProfile(defaultProfile)
          return defaultProfile
        }
        
        if (response.status === 401) {
          // Unauthorized - redirect to login
          window.location.href = '/auth/signin'
          return null
        }
        
        let errorMessage = 'Failed to load profile'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      
      // Cache for 5 minutes
      APICache.set(cacheKey, result, 300000)
      
      setProfile(result.profile)
      return result.profile
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile'
      setError(errorMessage)
      console.error('Error loading provider profile:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const saveProfile = useCallback(async (profileData: Partial<ProviderProfile>) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('💾 Saving provider profile')
      
      const response = await fetch('/api/provider/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to save profile'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      // Update cache with new data
      const cacheKey = 'provider_profile'
      APICache.set(cacheKey, result, 300000)
      
      setProfile(result.profile)
      return result.profile
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const invalidateCache = useCallback(() => {
    APICache.clear() // Clear all cache since we don't have delete method
    console.log('🗑️ Provider profile cache cleared')
  }, [])

  return {
    profile,
    loading,
    error,
    fetchProfile,
    saveProfile,
    invalidateCache
  }
}