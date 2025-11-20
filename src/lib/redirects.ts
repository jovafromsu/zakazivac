/**
 * Utility functions for handling post-authentication redirects
 * Based on user roles and application requirements
 */

export interface UserRole {
  roles: string[]
}

/**
 * Determines the appropriate dashboard URL based on user roles
 * Follows priority: admin > provider > client
 * Returns null for multi-role users (they should go to profile page for selection)
 */
export function getDashboardUrl(roles: string[]): string | null {
  if (!roles || roles.length === 0) {
    return '/dashboard/client' // Default fallback
  }

  // Check for multi-role users (they need to choose)
  const validRoles = roles.filter(role => ['admin', 'provider', 'client'].includes(role))
  if (validRoles.length > 1) {
    return null // Multi-role users go to profile page
  }

  // Single role users get direct redirect
  if (roles.includes('admin')) {
    return '/dashboard/admin'
  }
  
  if (roles.includes('provider')) {
    return '/dashboard/provider'
  }
  
  if (roles.includes('client')) {
    return '/dashboard/client'
  }

  // Fallback for unknown roles
  return '/dashboard/client'
}

/**
 * Gets the post-login redirect URL based on user roles
 * Returns profile page for multi-role users, dashboard for single-role users
 */
export function getPostLoginRedirect(roles: string[]): string {
  const dashboardUrl = getDashboardUrl(roles)
  
  if (dashboardUrl === null) {
    // Multi-role user - send to profile for role selection
    return '/profile'
  }
  
  return dashboardUrl
}

/**
 * Gets available dashboard options for a user based on their roles
 */
export function getAvailableDashboards(roles: string[]): Array<{
  role: string
  label: string
  url: string
  description: string
}> {
  const dashboards = []
  
  if (roles.includes('admin')) {
    dashboards.push({
      role: 'admin',
      label: 'Admin Dashboard',
      url: '/dashboard/admin',
      description: 'Manage users, settings and system administration'
    })
  }
  
  if (roles.includes('provider')) {
    dashboards.push({
      role: 'provider',
      label: 'Provider Dashboard', 
      url: '/dashboard/provider',
      description: 'Manage services, bookings and availability'
    })
  }
  
  if (roles.includes('client')) {
    dashboards.push({
      role: 'client',
      label: 'Client Dashboard',
      url: '/dashboard/client', 
      description: 'View bookings and manage appointments'
    })
  }
  
  return dashboards
}

/**
 * Check if user has multiple valid roles
 */
export function isMultiRoleUser(roles: string[]): boolean {
  const validRoles = roles.filter(role => ['admin', 'provider', 'client'].includes(role))
  return validRoles.length > 1
}