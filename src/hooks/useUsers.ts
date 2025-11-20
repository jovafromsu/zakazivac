import { useOptimizedFetch, APICache } from '@/lib/apiCache'
import { useState, useCallback } from 'react'

interface User {
  _id: string
  name: string
  email: string
  roles: string[]
  emailVerified: boolean
  createdAt: string
  providerProfile?: {
    businessName: string
    isActive: boolean
  }
}

interface Pagination {
  total: number
  pages: number
  current: number
  limit: number
}

interface UsersResponse {
  users: User[]
  pagination: Pagination
}

interface UserFilters {
  search?: string
  role?: string
  emailVerified?: string
  page?: number
  limit?: number
}

/**
 * Optimized hook for fetching admin users with caching and filtering
 */
export const useAdminUsers = (filters: UserFilters = {}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<UsersResponse | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.search) params.append('search', filters.search)
      if (filters.role) params.append('role', filters.role)
      if (filters.emailVerified) params.append('emailVerified', filters.emailVerified)
      
      const url = `/api/admin/users?${params.toString()}`
      const cacheKey = `admin_users_${params.toString()}`
      
      // Check cache first (30 seconds for user data)
      const cached = APICache.get<UsersResponse>(cacheKey)
      if (cached) {
        console.log('📋 Cache hit for admin users')
        setData(cached)
        setLoading(false)
        return cached
      }

      console.log('🌐 Fetching admin users:', url)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Cache for 30 seconds (users change more frequently than categories)
      APICache.set(cacheKey, result, 30000)
      
      setData(result)
      return result
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [filters.page, filters.limit, filters.search, filters.role, filters.emailVerified])

  const invalidateCache = useCallback(() => {
    // Clear all user-related cache entries
    APICache.clear()
    console.log('🗑️ Admin users cache cleared')
  }, [])

  return {
    users: data?.users || [],
    pagination: data?.pagination || null,
    loading,
    error,
    fetchUsers,
    invalidateCache
  }
}

/**
 * Hook for individual user operations
 */
export const useUserOperations = () => {
  const [loading, setLoading] = useState(false)
  
  const updateUser = useCallback(async (userId: string, userData: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }
      
      // Clear cache after successful update
      APICache.clear()
      
      return await response.json()
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteUser = useCallback(async (userId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }
      
      // Clear cache after successful deletion
      APICache.clear()
      
      return await response.json()
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    updateUser,
    deleteUser,
    loading
  }
}

export type { User, Pagination, UserFilters }