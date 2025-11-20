import { describe, it, expect, beforeEach, jest, beforeAll } from '@jest/globals'
import { GET } from '@/app/api/admin/stats/route'
import User from '@/models/User'
import ProviderProfile from '@/models/ProviderProfile'
import Category from '@/models/Category'
import DatabaseTestUtils from '../../utils/databaseUtils'
import { createMockRequest } from '../../utils/testHelpers'
import { createAdminSession, setMockSession } from '../../utils/nextAuthMock'

// Mock next-auth
const mockGetServerSession = jest.fn()
jest.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}))

// Mock headers with proper Headers-like object
const mockHeaders = {
  getAll: jest.fn(() => []),
  get: jest.fn(() => null),
  has: jest.fn(() => false),
  forEach: jest.fn(),
  keys: jest.fn(() => []),
  values: jest.fn(() => []),
  entries: jest.fn(() => []),
}

jest.mock('next/headers', () => ({
  headers: jest.fn(() => mockHeaders),
  cookies: jest.fn(() => new Map()),
}))

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}))

// Mock the entire adminAuth module to avoid NextAuth issues
const mockRequireAdminAuth = jest.fn()
jest.mock('@/lib/adminAuth', () => ({
  requireAdminAuth: mockRequireAdminAuth,
}))

describe('/api/admin/stats', () => {
  let adminUser: any
  let regularUser: any

  beforeEach(async () => {
    await DatabaseTestUtils.cleanDatabase()
    jest.clearAllMocks()
    
    // Create admin user
    adminUser = await User.create({
      email: 'admin@example.com',
      name: 'Admin User',
      roles: ['admin'],
      emailVerified: true,
    })

    // Create regular user
    regularUser = await User.create({
      email: 'user@example.com',
      name: 'Regular User',
      roles: ['client'],
      emailVerified: true,
    })
  })

  describe('GET /api/admin/stats', () => {
    it('should return comprehensive stats for admin user', async () => {
      // Seed test data
      const { users, providers, categories } = await DatabaseTestUtils.seedTestData()

      const mockSession = createAdminSession(adminUser._id.toString())
      mockRequireAdminAuth.mockResolvedValue({ id: adminUser._id.toString(), email: adminUser.email, name: adminUser.name, roles: ["admin"] })

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.stats).toBeDefined()
      
      // User statistics
      expect(responseData.stats.users.total).toBeGreaterThanOrEqual(users.length + 2) // +2 for admin and regular user
      expect(responseData.stats.users.clients).toBeGreaterThan(0)
      expect(responseData.stats.users.providers).toBeGreaterThan(0)
      expect(responseData.stats.users.admins).toBeGreaterThanOrEqual(1)
      expect(responseData.stats.users.verified).toBeGreaterThan(0)
      
      // Provider statistics
      expect(responseData.stats.providers.total).toBeGreaterThanOrEqual(providers.length)
      expect(responseData.stats.providers.active).toBeDefined()
      expect(responseData.stats.providers.inactive).toBeDefined()
      
      // Category statistics
      expect(responseData.stats.categories.total).toBeGreaterThanOrEqual(categories.length)
      expect(responseData.stats.categories.active).toBeDefined()
      
      // System information
      expect(responseData.stats.system).toBeDefined()
      expect(responseData.stats.system.uptime).toBeDefined()
      expect(responseData.stats.system.database).toBe('Connected')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Authentication required')
    })

    it('should return 403 for non-admin user', async () => {
      const mockSession = {
        user: {
          id: regularUser._id.toString(),
          email: regularUser.email,
          roles: ['client'],
        },
      }
      
      mockRequireAdminAuth.mockResolvedValue({ id: adminUser._id.toString(), email: adminUser.email, name: adminUser.name, roles: ["admin"] })

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.error).toBe('Admin access required')
    })

    it('should return 403 for provider user without admin role', async () => {
      const providerUser = await User.create({
        email: 'provider@example.com',
        name: 'Provider User',
        roles: ['provider'],
        emailVerified: true,
      })

      const mockSession = {
        user: {
          id: providerUser._id.toString(),
          email: providerUser.email,
          roles: ['provider'],
        },
      }
      
      mockRequireAdminAuth.mockResolvedValue({ id: adminUser._id.toString(), email: adminUser.email, name: adminUser.name, roles: ["admin"] })

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.error).toBe('Admin access required')
    })

    it('should handle empty database correctly', async () => {
      const mockSession = createAdminSession(adminUser._id.toString())
      mockRequireAdminAuth.mockResolvedValue({ id: adminUser._id.toString(), email: adminUser.email, name: adminUser.name, roles: ["admin"] })

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.stats.users.total).toBe(2) // admin + regular user
      expect(responseData.stats.users.admins).toBe(1)
      expect(responseData.stats.providers.total).toBe(0)
      expect(responseData.stats.categories.total).toBe(0)
    })

    it('should calculate user role statistics correctly', async () => {
      // Create users with different roles
      await User.create([
        { email: 'client1@example.com', name: 'Client 1', roles: ['client'], emailVerified: true },
        { email: 'client2@example.com', name: 'Client 2', roles: ['client'], emailVerified: false },
        { email: 'provider1@example.com', name: 'Provider 1', roles: ['provider'], emailVerified: true },
        { email: 'provider2@example.com', name: 'Provider 2', roles: ['provider'], emailVerified: true },
        { email: 'multi@example.com', name: 'Multi Role', roles: ['client', 'provider'], emailVerified: true },
      ])

      const mockSession = createAdminSession(adminUser._id.toString())
      mockRequireAdminAuth.mockResolvedValue({ id: adminUser._id.toString(), email: adminUser.email, name: adminUser.name, roles: ["admin"] })

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      
      // Total users: 2 existing + 5 new = 7
      expect(responseData.stats.users.total).toBe(7)
      expect(responseData.stats.users.clients).toBe(4) // 2 pure clients + 1 multi-role + 1 regular user
      expect(responseData.stats.users.providers).toBe(3) // 2 pure providers + 1 multi-role
      expect(responseData.stats.users.admins).toBe(1)
      expect(responseData.stats.users.verified).toBe(6) // All except client2
    })

    it('should calculate provider statistics correctly', async () => {
      // Create provider profiles
      const provider1User = await User.create({
        email: 'provider1@example.com',
        name: 'Provider 1',
        roles: ['provider'],
        emailVerified: true,
      })

      const provider2User = await User.create({
        email: 'provider2@example.com',
        name: 'Provider 2', 
        roles: ['provider'],
        emailVerified: true,
      })

      const provider3User = await User.create({
        email: 'provider3@example.com',
        name: 'Provider 3',
        roles: ['provider'],
        emailVerified: true,
      })

      await ProviderProfile.create([
        { userId: provider1User._id, businessName: 'Business 1', isActive: true },
        { userId: provider2User._id, businessName: 'Business 2', isActive: true },
        { userId: provider3User._id, businessName: 'Business 3', isActive: false },
      ])

      const mockSession = createAdminSession(adminUser._id.toString())
      mockRequireAdminAuth.mockResolvedValue({ id: adminUser._id.toString(), email: adminUser.email, name: adminUser.name, roles: ["admin"] })

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.stats.providers.total).toBe(3)
      expect(responseData.stats.providers.active).toBe(2)
      expect(responseData.stats.providers.inactive).toBe(1)
    })

    it('should calculate category statistics correctly', async () => {
      await Category.create([
        { name: 'Active Category 1', slug: 'active-category-1', isActive: true, createdBy: adminUser._id },
        { name: 'Active Category 2', slug: 'active-category-2', isActive: true, createdBy: adminUser._id },
        { name: 'Inactive Category 1', slug: 'inactive-category-1', isActive: false, createdBy: adminUser._id },
        { name: 'Inactive Category 2', slug: 'inactive-category-2', isActive: false, createdBy: adminUser._id },
      ])

      const mockSession = createAdminSession(adminUser._id.toString())
      mockRequireAdminAuth.mockResolvedValue({ id: adminUser._id.toString(), email: adminUser.email, name: adminUser.name, roles: ["admin"] })

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.stats.categories.total).toBe(4)
      expect(responseData.stats.categories.active).toBe(2)
      expect(responseData.stats.categories.inactive).toBe(2)
    })

    it('should include system uptime information', async () => {
      const mockSession = createAdminSession(adminUser._id.toString())
      mockRequireAdminAuth.mockResolvedValue({ id: adminUser._id.toString(), email: adminUser.email, name: adminUser.name, roles: ["admin"] })

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.stats.system.uptime).toBeDefined()
      expect(typeof responseData.stats.system.uptime).toBe('string')
      
      // Uptime should be in format like "0d 0h 0m 1s"
      expect(responseData.stats.system.uptime).toMatch(/\d+d \d+h \d+m \d+s/)
    })

    it('should include database connection status', async () => {
      const mockSession = createAdminSession(adminUser._id.toString())
      mockRequireAdminAuth.mockResolvedValue({ id: adminUser._id.toString(), email: adminUser.email, name: adminUser.name, roles: ["admin"] })

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.stats.system.database).toBe('Connected')
    })

    it('should include application version', async () => {
      const mockSession = createAdminSession(adminUser._id.toString())
      mockRequireAdminAuth.mockResolvedValue({ id: adminUser._id.toString(), email: adminUser.email, name: adminUser.name, roles: ["admin"] })

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.stats.system.version).toBeDefined()
      expect(typeof responseData.stats.system.version).toBe('string')
    })

    it('should handle multi-role users correctly in statistics', async () => {
      // Create users with multiple roles
      await User.create([
        { email: 'multi1@example.com', name: 'Multi 1', roles: ['client', 'provider'], emailVerified: true },
        { email: 'multi2@example.com', name: 'Multi 2', roles: ['provider', 'admin'], emailVerified: true },
        { email: 'client@example.com', name: 'Pure Client', roles: ['client'], emailVerified: true },
      ])

      const mockSession = createAdminSession(adminUser._id.toString())
      mockRequireAdminAuth.mockResolvedValue({ id: adminUser._id.toString(), email: adminUser.email, name: adminUser.name, roles: ["admin"] })

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      
      // Each user should be counted in each role they have
      const stats = responseData.stats.users
      expect(stats.clients).toBe(3) // multi1 + client + regularUser
      expect(stats.providers).toBe(2) // multi1 + multi2
      expect(stats.admins).toBe(2) // adminUser + multi2
    })

    it('should handle database errors gracefully', async () => {
      // Don't mock the session to trigger an error in the middleware
      mockGetServerSession.mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Internal server error')
    })

    it('should log admin access for audit purposes', async () => {
      const consoleSpy = jest.spyOn(console, 'log')
      
      const mockSession = createAdminSession(adminUser._id.toString())
      mockRequireAdminAuth.mockResolvedValue({ id: adminUser._id.toString(), email: adminUser.email, name: adminUser.name, roles: ["admin"] })

      const request = createMockRequest({
        method: 'GET',
      })

      await GET(request)

      // Verify that admin access was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('📊 Admin fetching dashboard stats')
      )

      consoleSpy.mockRestore()
    })
  })
})