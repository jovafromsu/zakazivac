'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Clock, 
  Settings, 
  Users, 
  BarChart3, 
  Wrench,
  LogOut
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/dashboard/provider', icon: BarChart3 },
  { name: 'Appointments', href: '/dashboard/provider/appointments', icon: Calendar },
  { name: 'Services', href: '/dashboard/provider/services', icon: Wrench },
  { name: 'Availability', href: '/dashboard/provider/availability', icon: Clock },
  { name: 'Integrations', href: '/dashboard/provider/integrations', icon: Settings },
  { name: 'Profile', href: '/dashboard/provider/profile', icon: Users },
]

export default function ProviderDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  // Show loading while session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Redirect to signin if not authenticated
  if (status === 'unauthenticated') {
    window.location.href = '/auth/signin'
    return null
  }

  // Check if user has provider role
  const isProvider = session?.user?.roles?.includes('provider')
  
  if (!isProvider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Provider Access Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need provider privileges to access this dashboard. Please upgrade your account to provider status.
            </p>
            <div className="space-y-4">
              <Link href="/profile" className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Upgrade to Provider
              </Link>
              <Link href="/dashboard/client" className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Go to Client Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Zakazivač Provider
              </h1>
            </div>
            
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        group flex items-center px-2 py-2 text-sm font-medium rounded-md
                        ${isActive
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon
                        className={`
                          mr-3 flex-shrink-0 h-5 w-5
                          ${isActive ? 'text-blue-500' : 'text-gray-600 group-hover:text-gray-700'}
                        `}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
              
              <div className="flex-shrink-0 px-2 py-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs text-gray-700">
                      {session?.user?.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1">
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}