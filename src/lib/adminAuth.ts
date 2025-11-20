import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export interface AdminUser {
  id: string
  email: string
  name: string
  roles: string[]
}

/**
 * Middleware za proveru admin autorizacije
 * Koristi se u admin API routes
 */
export async function requireAdminAuth(request: NextRequest): Promise<AdminUser> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error('Unauthorized - No session')
  }
  
  if (!session.user.roles?.includes('admin')) {
    throw new Error('Forbidden - Admin role required')
  }
  
  return {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.name || '',
    roles: session.user.roles || []
  }
}

/**
 * Middleware za proveru provider ili admin autorizacije
 * Koristi se u provider API routes koji adminima takođe treba da budu dostupni
 */
export async function requireProviderOrAdminAuth(request: NextRequest): Promise<AdminUser> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error('Unauthorized - No session')
  }
  
  const hasProviderRole = session.user.roles?.includes('provider')
  const hasAdminRole = session.user.roles?.includes('admin')
  
  if (!hasProviderRole && !hasAdminRole) {
    throw new Error('Forbidden - Provider or Admin role required')
  }
  
  return {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.name || '',
    roles: session.user.roles || []
  }
}

/**
 * Utility funkcija za kreiranje standardnih error responses
 */
export function createAuthErrorResponse(error: string, status: number) {
  return Response.json(
    { error, timestamp: new Date().toISOString() },
    { status }
  )
}

/**
 * Admin guard HOC za API routes
 */
export function withAdminAuth(handler: (request: NextRequest, admin: AdminUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    try {
      const admin = await requireAdminAuth(request)
      return handler(request, admin)
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) {
        return createAuthErrorResponse('Authentication required', 401)
      }
      if (error.message.includes('Forbidden')) {
        return createAuthErrorResponse('Admin access required', 403)
      }
      return createAuthErrorResponse('Internal server error', 500)
    }
  }
}

/**
 * Provider/Admin guard HOC za API routes
 */
export function withProviderOrAdminAuth(handler: (request: NextRequest, user: AdminUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    try {
      const user = await requireProviderOrAdminAuth(request)
      return handler(request, user)
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) {
        return createAuthErrorResponse('Authentication required', 401)
      }
      if (error.message.includes('Forbidden')) {
        return createAuthErrorResponse('Provider or Admin access required', 403)
      }
      return createAuthErrorResponse('Internal server error', 500)
    }
  }
}