'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Users, 
  Tags, 
  BarChart3, 
  Settings,
  Shield,
  Home,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AdminLayoutProps {
  children: ReactNode
}

interface QuickStats {
  totalUsers: number
  activeProviders: number
  totalCategories: number
}

const adminNavItems = [
  {
    title: 'Overview',
    href: '/dashboard/admin',
    icon: BarChart3,
    description: 'Analytics and system overview'
  },
  {
    title: 'Users',
    href: '/dashboard/admin/users',
    icon: Users,
    description: 'Manage all users and roles'
  },
  {
    title: 'Categories',
    href: '/dashboard/admin/categories',
    icon: Tags,
    description: 'Manage service categories'
  },
  {
    title: 'System Settings',
    href: '/dashboard/admin/settings',
    icon: Settings,
    description: 'Application configuration'
  },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null)
  const { data: session, status } = useSession()
  const pathname = usePathname()

  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        const response = await fetch('/api/admin/stats')
        const data = await response.json()
        
        if (response.ok) {
          setQuickStats({
            totalUsers: data.stats.users.total,
            activeProviders: data.stats.providers.active,
            totalCategories: data.stats.categories.active
          })
        }
      } catch (error) {
        console.error('Failed to fetch quick stats:', error)
      }
    }

    if (session?.user?.roles?.includes('admin')) {
      fetchQuickStats()
    }
  }, [session])

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
    
    if (status === 'authenticated' && !session?.user?.roles?.includes('admin')) {
      redirect('/dashboard')
    }
  }, [status, session])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session?.user?.roles?.includes('admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have admin privileges.</p>
          <Button asChild>
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/admin" className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-indigo-600" />
                <span className="text-xl font-bold text-gray-900">Admin Panel</span>
              </Link>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                System Administrator
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Main Dashboard
                </Link>
              </Button>
              
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                  <p className="text-xs text-gray-500">{session.user.email}</p>
                </div>
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive 
                        ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`
                      flex-shrink-0 -ml-1 mr-3 h-5 w-5
                      ${isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{item.title}</span>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    </div>
                  </Link>
                )
              })}
            </nav>

            {/* Quick Stats Card */}
            <div className="mt-8 bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Users:</span>
                  <span className="font-medium text-gray-900">{quickStats?.totalUsers ?? '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active Providers:</span>
                  <span className="font-medium text-gray-900">{quickStats?.activeProviders ?? '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Categories:</span>
                  <span className="font-medium text-gray-900">{quickStats?.totalCategories ?? '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}