import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { GET } from '@/app/api/admin/stats/route'
import User from '@/models/User'
import ProviderProfile from '@/models/ProviderProfile'
import Category from '@/models/Category'
import DatabaseTestUtils from '../../utils/databaseUtils'
import { createMockRequest } from '../../utils/testHelpers'
import { createAdminSession, setMockSession, setupNextAuthMocks } from '../../utils/nextAuthMock'

// Setup all mocks
setupNextAuthMocks()

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
      setMockSession(mockSession)

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
      expect(responseData.stats.providers.total).toBe(providers.length)
      expect(responseData.stats.providers.active).toBeGreaterThan(0)
      
      // Category statistics
      expect(responseData.stats.categories.total).toBe(categories.length)
      expect(responseData.stats.categories.active).toBeGreaterThan(0)
      
      // System information
      expect(responseData.stats.system.uptime).toBeDefined()
      expect(responseData.stats.system.version).toBeDefined()
      expect(responseData.stats.system.database).toBe('Connected')
    })

    it('should return 401 for unauthenticated user', async () => {
      setMockSession(null)

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Authentication required')
    })

    it('should return 401 for non-admin user', async () => {
      const mockSession = {
        user: {
          id: regularUser._id.toString(),
          email: regularUser.email,
          roles: ['client'],
        },
      }
      
      setMockSession(mockSession)

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
      
      setMockSession(mockSession)

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.error).toBe('Admin access required')
    })

    it('should handle empty database correctly', async () => {
      // Clean all data except admin user
      await ProviderProfile.deleteMany({})
      await Category.deleteMany({})
      await User.deleteMany({ _id: { $ne: adminUser._id } })

      const mockSession = {
        user: {
          id: adminUser._id.toString(),
          email: adminUser.email,
          roles: ['admin'],
        },
      }
      
      setMockSession(mockSession)

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.stats.users.total).toBe(1) // Only admin user
      expect(responseData.stats.users.admins).toBe(1)
      expect(responseData.stats.providers.total).toBe(0)
      expect(responseData.stats.categories.total).toBe(0)
    })

    it('should calculate user role statistics correctly', async () => {
      // Create users with different role combinations
      await User.create([
        { email: 'client1@example.com', name: 'Client 1', roles: ['client'], emailVerified: true },
        { email: 'client2@example.com', name: 'Client 2', roles: ['client'], emailVerified: false },
        { email: 'provider1@example.com', name: 'Provider 1', roles: ['provider'], emailVerified: true },
        { email: 'multi1@example.com', name: 'Multi 1', roles: ['client', 'provider'], emailVerified: true },
        { email: 'admin2@example.com', name: 'Admin 2', roles: ['admin'], emailVerified: true },
      ])

      const mockSession = {
        user: {
          id: adminUser._id.toString(),
          email: adminUser.email,
          roles: ['admin'],
        },
      }
      
      setMockSession(mockSession)

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      
      // Total users: 2 existing + 5 new = 7
      expect(responseData.stats.users.total).toBe(7)
      
      // Clients: 1 existing + 3 new (client1, client2, multi1) = 4
      expect(responseData.stats.users.clients).toBe(4)
      
      // Providers: 2 new (provider1, multi1) = 2
      expect(responseData.stats.users.providers).toBe(2)
      
      // Admins: 2 existing + 1 new (admin2) = 3
      expect(responseData.stats.users.admins).toBe(3)
      
      // Verified: all except client2 = 6
      expect(responseData.stats.users.verified).toBe(6)
    })

    it('should calculate provider statistics correctly', async () => {
      // Create providers with different statuses
      const providerUsers = await User.create([
        { email: 'activeprov1@example.com', name: 'Active Provider 1', roles: ['provider'] },
        { email: 'activeprov2@example.com', name: 'Active Provider 2', roles: ['provider'] },
        { email: 'inactiveprov@example.com', name: 'Inactive Provider', roles: ['provider'] },
      ])

      await ProviderProfile.create([
        { userId: providerUsers[0]._id, businessName: 'Active Business 1', isActive: true },
        { userId: providerUsers[1]._id, businessName: 'Active Business 2', isActive: true },
        { userId: providerUsers[2]._id, businessName: 'Inactive Business', isActive: false },
      ])

      const mockSession = {
        user: {
          id: adminUser._id.toString(),
          email: adminUser.email,
          roles: ['admin'],
        },
      }
      
      setMockSession(mockSession)

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
      // Create categories with different statuses
      await Category.create([
        { name: 'Active Category 1', slug: 'active-category-1', isActive: true, createdBy: adminUser._id },
        { name: 'Active Category 2', slug: 'active-category-2', isActive: true, createdBy: adminUser._id },
        { name: 'Inactive Category 1', slug: 'inactive-category-1', isActive: false, createdBy: adminUser._id },
        { name: 'Inactive Category 2', slug: 'inactive-category-2', isActive: false, createdBy: adminUser._id },
      ])

      const mockSession = {
        user: {
          id: adminUser._id.toString(),
          email: adminUser.email,
          roles: ['admin'],
        },
      }
      
      setMockSession(mockSession)

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
      const mockSession = {
        user: {
          id: adminUser._id.toString(),
          email: adminUser.email,
          roles: ['admin'],
        },
      }
      
      setMockSession(mockSession)

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.stats.system.uptime).toBeDefined()
      expect(typeof responseData.stats.system.uptime).toBe('string')
      
      // Uptime should be a reasonable string
      expect(responseData.stats.system.uptime.length).toBeGreaterThan(0)
    })

    it('should include database connection status', async () => {
      const mockSession = {
        user: {
          id: adminUser._id.toString(),
          email: adminUser.email,
          roles: ['admin'],
        },
      }
      
      setMockSession(mockSession)

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.stats.system.database).toBe('Connected')
    })

    it('should include application version', async () => {
      const mockSession = {
        user: {
          id: adminUser._id.toString(),
          email: adminUser.email,
          roles: ['admin'],
        },
      }
      
      setMockSession(mockSession)

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
        { email: 'multi1@example.com', name: 'Multi 1', roles: ['client', 'provider'] },
        { email: 'multi2@example.com', name: 'Multi 2', roles: ['provider', 'admin'] },
        { email: 'multi3@example.com', name: 'Multi 3', roles: ['client', 'provider', 'admin'] },
      ])

      const mockSession = {
        user: {
          id: adminUser._id.toString(),
          email: adminUser.email,
          roles: ['admin'],
        },
      }
      
      setMockSession(mockSession)

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      
      // Each user should be counted in each role they have
      const stats = responseData.stats.users
      
      // Clients: 1 existing + 2 new (multi1, multi3) = 3
      expect(stats.clients).toBe(3)
      
      // Providers: 3 new (multi1, multi2, multi3) = 3
      expect(stats.providers).toBe(3)
      
      // Admins: 1 existing + 2 new (multi2, multi3) = 3
      expect(stats.admins).toBe(3)
    })

    it('should handle database errors gracefully', async () => {
      const mockSession = {
        user: {
          id: adminUser._id.toString(),
          email: adminUser.email,
          roles: ['admin'],
        },
      }
      
      setMockSession(mockSession)

      // Mock User.countDocuments to throw an error
      const originalCountDocuments = User.countDocuments
      User.countDocuments = jest.fn(() => Promise.reject(new Error('Database error'))) as any

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Internal server error')

      // Restore original method
      User.countDocuments = originalCountDocuments
    })

    it('should log admin access for audit purposes', async () => {
      // Mock console.log to capture log output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      const mockSession = {
        user: {
          id: adminUser._id.toString(),
          email: adminUser.email,
          roles: ['admin'],
        },
      }
      
      setMockSession(mockSession)

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