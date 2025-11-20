'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { User, LogOut } from 'lucide-react'

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Zakazivač
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/browse" className="text-gray-600 hover:text-gray-900">
              Browse Providers
            </Link>
            {session?.user.roles?.includes('provider') && (
              <Link href="/dashboard/provider" className="text-gray-600 hover:text-gray-900">
                Provider Dashboard
              </Link>
            )}
            {session?.user.roles?.includes('admin') && (
              <Link href="/dashboard/admin" className="text-gray-600 hover:text-gray-900">
                Admin Dashboard
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-3">
            {session ? (
              <>
                <Link href="/profile">
                  <Button variant="outline" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button - can be expanded later */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" className="p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}