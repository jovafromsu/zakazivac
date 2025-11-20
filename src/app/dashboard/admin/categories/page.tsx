'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardSkeleton } from '@/components/ui/LoadingComponents'
import { 
  Trash2, 
  Edit, 
  Plus, 
  Search,
  Eye,
  EyeOff,
  AlertTriangle,
  Sparkles,
  Heart,
  Home,
  GraduationCap,
  Briefcase,
  Car,
  Dumbbell
} from 'lucide-react'

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  color: string
  icon?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  serviceCount?: number
  createdBy?: string | null // Just ID, not populated object
}

interface CategoryFormData {
  name: string
  description: string
  color: string
  icon: string
  isActive: boolean
}

const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
]

const ICON_OPTIONS = [
  'Sparkles', 'Briefcase', 'Heart', 'Dumbbell', 'GraduationCap', 'Car', 'Home', 'Search',
  'Eye', 'Edit', 'Trash2', 'Plus', 'AlertTriangle', 'EyeOff'
]

// Helper function to render Lucide icons
const renderIcon = (iconName: string, className: string = 'w-4 h-4') => {
  switch (iconName) {
    case 'Sparkles': return <Sparkles className={className} />
    case 'Heart': return <Heart className={className} />
    case 'Home': return <Home className={className} />
    case 'GraduationCap': return <GraduationCap className={className} />
    case 'Briefcase': return <Briefcase className={className} />
    case 'Car': return <Car className={className} />
    case 'Dumbbell': return <Dumbbell className={className} />
    case 'Search': return <Search className={className} />
    case 'Eye': return <Eye className={className} />
    case 'EyeOff': return <EyeOff className={className} />
    case 'Edit': return <Edit className={className} />
    case 'Trash2': return <Trash2 className={className} />
    case 'Plus': return <Plus className={className} />
    case 'AlertTriangle': return <AlertTriangle className={className} />
    default: return <Sparkles className={className} />
  }
}

export default function AdminCategoriesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: 'Sparkles',
    isActive: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.roles?.includes('admin')) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const url = `/api/admin/categories?includeInactive=true`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setCategories(data.categories)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.roles?.includes('admin')) {
      fetchCategories()
    }
  }, [session])

  // Filter categories
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesActive = showInactive || category.isActive
    return matchesSearch && matchesActive
  })
  


  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const url = editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories'
      const method = editingId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save category')
      }

      // Reset form and refresh data
      resetForm()
      await fetchCategories()
      
    } catch (error) {
      console.error('Error saving category:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to save category'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete category')
      }

      await fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete category'}`)
    }
  }

  // Handle toggle active status
  const handleToggleActive = async (category: Category) => {
    try {
      const response = await fetch(`/api/admin/categories/${category._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...category,
          isActive: !category.isActive 
        })
      })

      if (!response.ok) throw new Error('Failed to update category')
      await fetchCategories()
    } catch (error) {
      console.error('Error toggling category status:', error)
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(category._id)
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon || 'Sparkles',
      isActive: category.isActive
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      icon: 'Sparkles',
      isActive: true
    })
  }

  if (status === 'loading') {
    return <DashboardSkeleton />
  }

  if (!session?.user?.roles?.includes('admin')) {
    return null // Redirect is happening
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories Management</h1>
          <p className="text-muted-foreground">
            Manage service categories for providers
          </p>
        </div>
      </div>

      {/* Category Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? 'Edit Category' : 'Create New Category'}
          </CardTitle>
          <CardDescription>
            {editingId ? 'Update category information' : 'Add a new service category'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Beauty & Spa"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <div className="flex gap-2">
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="✨"
                    className="w-20"
                  />
                  <div className="flex gap-1 overflow-x-auto">
                    {ICON_OPTIONS.map((iconName) => (
                      <Button
                        key={iconName}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="px-2"
                        onClick={() => setFormData(prev => ({ ...prev, icon: iconName }))}
                        title={iconName}
                      >
                        {renderIcon(iconName)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (editingId ? 'Update' : 'Create')}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Categories ({filteredCategories.length})</CardTitle>
            <div className="flex gap-2">
              <div>
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowInactive(!showInactive)}
              >
                {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {showInactive ? 'Hide Inactive' : 'Show Inactive'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCategories.map((category) => (
                <div
                  key={category._id}
                  className={`p-4 border rounded-lg ${
                    !category.isActive ? 'bg-gray-50 border-gray-300' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {renderIcon(category.icon || 'Sparkles', 'w-5 h-5')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{category.name}</h3>
                          <Badge variant={category.isActive ? 'default' : 'secondary'}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {(category.serviceCount || 0) > 0 && (
                            <Badge variant="outline">
                              {category.serviceCount} services
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Slug: {category.slug} • Created: {new Date(category.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(category)}
                      >
                        {category.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category._id, category.name)}
                        disabled={(category.serviceCount || 0) > 0}
                        className={(category.serviceCount || 0) > 0 ? 'opacity-50' : ''}
                      >
                        {(category.serviceCount || 0) > 0 ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredCategories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No categories match your search.' : 'No categories found.'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}