import { useOptimizedFetch } from '@/lib/apiCache'

interface Category {
  _id: string
  name: string
  slug: string
  color: string
  icon?: string
  sortOrder?: number
}

interface CategoriesResponse {
  categories: Category[]
}

/**
 * Optimized hook for fetching categories with caching
 * Categories are cached for 5 minutes since they don't change frequently
 */
export const useCategories = () => {
  const { data, loading, error, refetch } = useOptimizedFetch<CategoriesResponse>(
    '/api/categories',
    [] // No dependencies - categories are static
  )

  return {
    categories: data?.categories || [],
    loading,
    error,
    refetch
  }
}

export type { Category }