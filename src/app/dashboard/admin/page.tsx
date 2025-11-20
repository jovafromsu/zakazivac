'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  UserCheck, 
  Tags, 
  Activity,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface AdminStats {
  users: {
    total: number
    clients: number
    providers: number
    admins: number
    verified: number
    unverified: number
  }
  providers: {
    total: number
    active: number
    inactive: number
  }
  categories: {
    total: number
    active: number
    inactive: number
  }
  system: {
    uptime: string
    version: string
    environment: string
    databaseStatus: string
    lastBackup: string
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      
      if (response.ok) {
        setStats(data.stats)
      } else {
        setError(data.error || 'Failed to fetch admin statistics')
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      setError('Failed to load admin dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchAdminStats}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and management</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
            <CheckCircle className="w-3 h-3 mr-1" />
            System Healthy
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchAdminStats}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users.total}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.users.verified} verified users
            </p>
          </CardContent>
        </Card>

        {/* Active Providers */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Providers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.providers.active}</div>
            <p className="text-xs text-muted-foreground">
              Service providers active
            </p>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Categories</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.categories.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.categories.total} total categories
            </p>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">System Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.system.uptime}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user accounts, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{stats?.users.clients}</div>
                <div className="text-gray-600">Clients</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{stats?.users.providers}</div>
                <div className="text-gray-600">Providers</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">{stats?.users.admins}</div>
                <div className="text-gray-600">Admins</div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button asChild size="sm" className="flex-1">
                <Link href="/dashboard/admin/users">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href="/dashboard/admin/users?emailVerified=false">
                  View Unverified
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Management</CardTitle>
            <CardDescription>
              Manage service categories and organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{stats?.categories.active}</div>
                <div className="text-gray-600">Active</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-600">{stats?.categories.inactive}</div>
                <div className="text-gray-600">Inactive</div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button asChild size="sm" className="flex-1">
                <Link href="/dashboard/admin/categories">
                  <Tags className="w-4 h-4 mr-2" />
                  Manage Categories
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href="/dashboard/admin/categories/new">
                  + Add New
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Current system status and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Application</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Version:</span>
                  <span className="font-medium text-gray-900">{stats?.system.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Environment:</span>
                  <Badge variant="outline" className="text-xs">
                    {stats?.system.environment === 'production' ? 'Production' : 
                     stats?.system.environment === 'development' ? 'Development' : 'Unknown'}
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Database</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={`text-xs ${
                    stats?.system.databaseStatus === 'Connected' 
                      ? 'bg-green-100 text-green-800'
                      : stats?.system.databaseStatus === 'Connecting'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {stats?.system.databaseStatus || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Backup:</span>
                  <span className="font-medium text-gray-900">{stats?.system.lastBackup}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Uptime:</span>
                  <span className="font-medium text-gray-900">{stats?.system.uptime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className="text-xs bg-green-100 text-green-800">Healthy</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}