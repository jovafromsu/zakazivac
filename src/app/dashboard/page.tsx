'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Briefcase, UserCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'
import { getDashboardUrl, getAvailableDashboards, isMultiRoleUser } from '@/lib/redirects'

/**
 * Main dashboard router page
 * Automatically redirects users to their appropriate dashboard based on roles
 * Shows dashboard selection for multi-role users
 */
export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading session

    if (!session?.user) {
      // Not authenticated, redirect to signin
      router.push('/auth/signin?callbackUrl=/dashboard')
      return
    }

    const userRoles = session.user.roles || []
    const dashboardUrl = getDashboardUrl(userRoles)
    
    // If user has single role, redirect immediately
    if (dashboardUrl !== null) {
      router.push(dashboardUrl)
      return
    }

    // Multi-role users stay on this page to choose
  }, [session, status, router])

  // Loading state
  if (status === 'loading') {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Loading Dashboard...
            </h2>
            <p className="text-gray-600">
              Determining your access level...
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  // Not authenticated
  if (!session?.user) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Dashboard Access Required</CardTitle>
              <CardDescription>
                Please sign in to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/signin?callbackUrl=/dashboard">
                <Button className="w-full">
                  Sign In to Continue
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    )
  }

  // Multi-role user - show dashboard selection
  const userRoles = session.user.roles || []
  const availableDashboards = getAvailableDashboards(userRoles)
  const isMultiRole = isMultiRoleUser(userRoles)

  if (!isMultiRole || availableDashboards.length === 0) {
    // This shouldn't happen, but handle edge case
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md">
            <CardHeader className="text-center">
              <CardTitle>No Dashboard Access</CardTitle>
              <CardDescription>
                Your account doesn't have access to any dashboards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Contact support if you believe this is an error.
              </p>
              <Link href="/profile">
                <Button variant="outline" className="w-full">
                  Go to Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              You have access to multiple dashboards. Select the one you want to use.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-3xl mx-auto">
            {availableDashboards.map((dashboard) => {
              const IconComponent = dashboard.role === 'admin' ? Shield : 
                                   dashboard.role === 'provider' ? Briefcase : UserCircle
              
              const colorClasses = {
                admin: 'border-red-200 hover:border-red-300 hover:bg-red-50',
                provider: 'border-blue-200 hover:border-blue-300 hover:bg-blue-50', 
                client: 'border-green-200 hover:border-green-300 hover:bg-green-50'
              }

              const iconColors = {
                admin: 'text-red-600',
                provider: 'text-blue-600',
                client: 'text-green-600'
              }

              return (
                <Link key={dashboard.role} href={dashboard.url}>
                  <Card className={`h-full transition-all duration-200 cursor-pointer ${colorClasses[dashboard.role as keyof typeof colorClasses]}`}>
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto mb-4 p-4 rounded-full bg-gray-100">
                        <IconComponent className={`w-8 h-8 ${iconColors[dashboard.role as keyof typeof iconColors]}`} />
                      </div>
                      <CardTitle className="text-xl mb-2">{dashboard.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        {dashboard.description}
                      </p>
                      <Button variant="outline" className="w-full group">
                        Access Dashboard
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-700 text-sm mb-3">
              Need to manage your account settings?
            </p>
            <Link href="/profile">
              <Button variant="ghost">
                Go to Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}