'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getPostLoginRedirect } from '@/lib/redirects'
import PageLayout from '@/components/PageLayout'

/**
 * Post-authentication redirect handler
 * Automatically redirects users to appropriate dashboard based on their roles
 */
export default function AuthRedirectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session?.user) {
      // Not authenticated, redirect to signin
      router.push('/auth/signin')
      return
    }

    // Get appropriate redirect URL based on user roles
    const redirectUrl = getPostLoginRedirect(session.user.roles || [])
    
    // Add small delay to prevent flash
    setTimeout(() => {
      router.push(redirectUrl)
    }, 100)
    
  }, [session, status, router])

  // Show loading state while redirecting
  return (
    <PageLayout>
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Welcome back!
          </h2>
          <p className="text-gray-600">
            Redirecting you to your dashboard...
          </p>
        </div>
      </div>
    </PageLayout>
  )
}