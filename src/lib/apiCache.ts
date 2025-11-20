import { useState, useEffect, useCallback } from 'react'

// API utility za optimizovane pozive
export class APICache {
  private static cache = new Map<string, { data: any, timestamp: number, ttl: number }>()
  
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }
  
  static set<T>(key: string, data: T, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  static clear(): void {
    this.cache.clear()
  }
}

// Optimizovan fetch sa cache
export const cachedFetch = async <T>(
  url: string, 
  options: RequestInit = {},
  cacheKey?: string,
  ttl: number = 60000
): Promise<T> => {
  const key = cacheKey || `${url}_${JSON.stringify(options)}`
  
  // Pokušaj iz cache
  const cached = APICache.get<T>(key)
  if (cached) {
    console.log(`📋 Cache hit for: ${url}`)
    return cached
  }
  
  console.log(`🌐 Fetching: ${url}`)
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const data = await response.json()
  
  // Sačuvaj u cache
  APICache.set(key, data, ttl)
  
  return data
}

// Hook za optimizovane API pozive
export const useOptimizedFetch = <T>(url: string, dependencies: any[] = []) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const result = await cachedFetch<T>(url, {}, `optimized_${url}`, 120000) // 2 min cache
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [url])
  
  useEffect(() => {
    fetchData()
  }, [fetchData, ...dependencies])
  
  return { data, loading, error, refetch: fetchData }
}