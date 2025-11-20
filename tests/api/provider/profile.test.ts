import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { GET, PUT } from '@/app/api/provider/profile/route'
import User from '@/models/User'
import ProviderProfile from '@/models/ProviderProfile'
import DatabaseTestUtils from '../../utils/databaseUtils'
import { createMockRequest } from '../../utils/testHelpers'
import { createMockGetServerSession, createProviderSession, mockNextJSContext } from '../../utils/nextAuthMock'

// Mock Next.js context
mockNextJSContext()

// Mock next-auth with proper session handling
const mockGetServerSession = createMockGetServerSession()
jest.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}))

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}))

describe('/api/provider/profile', () => {
  let testUser: any
  let testProvider: any
  let testProviderProfile: any

  beforeEach(async () => {
    await DatabaseTestUtils.cleanDatabase()
    jest.clearAllMocks()
    
    // Create test users
    testUser = await User.create({
      email: 'client@example.com',
      name: 'Test Client',
      roles: ['client'],
      emailVerified: true,
    })

    testProvider = await User.create({
      email: 'provider@example.com',
      name: 'Test Provider', 
      roles: ['provider'],
      emailVerified: true,
    })

    testProviderProfile = await ProviderProfile.create({
      userId: testProvider._id,
      businessName: 'Test Business',
      description: 'Test business description',
      contactInfo: {
        phone: '+381601234567',
        email: 'business@example.com',
        address: 'Test Address, Belgrade',
      },
      timezone: 'Europe/Belgrade',
      isActive: true,
    })
  })

  describe('GET /api/provider/profile', () => {
    it('should return provider profile for authenticated provider', async () => {
      const mockSession = {
        user: {
          id: testProvider._id.toString(),
          email: testProvider.email,
          roles: ['provider'],
        },
      }
      
      mockGetServerSession.mockResolvedValue(mockSession)

      const request = createMockRequest({
        method: 'GET',
      })

      const response = await GET()
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.profile.businessName).toBe('Test Business')
      expect(responseData.profile.description).toBe('Test business description')
      expect(responseData.profile.contactInfo.phone).toBe('+381601234567')
      expect(responseData.profile.timezone).toBe('Europe/Belgrade')
      expect(responseData.profile.isActive).toBe(true)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const response = await GET()
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should return 403 for non-provider user', async () => {
      const mockSession = {
        user: {
          id: testUser._id.toString(),
          email: testUser.email,
          roles: ['client'],
        },
      }
      
      mockGetServerSession.mockResolvedValue(mockSession)

      const response = await GET()
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.error).toBe('User is not a provider')
    })

    it('should return 404 for provider without profile', async () => {
      // Create provider without profile
      const newProvider = await User.create({
        email: 'newprovider@example.com',
        name: 'New Provider',
        roles: ['provider'],
        emailVerified: true,
      })

      const mockSession = {
        user: {
          id: newProvider._id.toString(),
          email: newProvider.email,
          roles: ['provider'],
        },
      }
      
      mockGetServerSession.mockResolvedValue(mockSession)

      const response = await GET()
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toBe('Provider profile not found')
    })

    it('should return 404 for non-existent user', async () => {
      const mockSession = {
        user: {
          id: 'nonexistent@example.com',
          email: 'nonexistent@example.com',
          roles: ['provider'],
        },
      }
      
      mockGetServerSession.mockResolvedValue(mockSession)

      const response = await GET()
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toBe('User not found')
    })
  })

  describe('PUT /api/provider/profile', () => {
    it('should update existing provider profile', async () => {
      const mockSession = {
        user: {
          id: testProvider._id.toString(),
          email: testProvider.email,
          roles: ['provider'],
        },
      }
      
      mockGetServerSession.mockResolvedValue(mockSession)

      const updateData = {
        businessName: 'Updated Business Name',
        description: 'Updated description',
        contactInfo: {
          phone: '+381607654321',
          email: 'updated@example.com',
          address: 'Updated Address, Belgrade',
        },
        timezone: 'America/New_York',
        isActive: false,
      }

      const request = createMockRequest({
        method: 'PUT',
        body: updateData,
      })

      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.message).toBe('Profile updated successfully')
      expect(responseData.profile.businessName).toBe('Updated Business Name')
      expect(responseData.profile.description).toBe('Updated description')
      expect(responseData.profile.contactInfo.phone).toBe('+381607654321')
      expect(responseData.profile.timezone).toBe('America/New_York')
      expect(responseData.profile.isActive).toBe(false)

      // Verify database was updated
      const updatedProfile = await ProviderProfile.findOne({ userId: testProvider._id })
      expect(updatedProfile?.businessName).toBe('Updated Business Name')
    })

    it('should create new provider profile if none exists', async () => {
      // Create provider without profile
      const newProvider = await User.create({
        email: 'newprovider@example.com',
        name: 'New Provider',
        roles: ['provider'],
        emailVerified: true,
      })

      const mockSession = {
        user: {
          id: newProvider._id.toString(),
          email: newProvider.email,
          roles: ['provider'],
        },
      }
      
      mockGetServerSession.mockResolvedValue(mockSession)

      const profileData = {
        businessName: 'New Business',
        description: 'New business description',
        timezone: 'Europe/Belgrade',
        isActive: true,
      }

      const request = createMockRequest({
        method: 'PUT',
        body: profileData,
      })

      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.message).toBe('Profile created successfully')
      expect(responseData.profile.businessName).toBe('New Business')
      expect(responseData.profile.userId.toString()).toBe(newProvider._id.toString())

      // Verify profile was created in database
      const createdProfile = await ProviderProfile.findOne({ userId: newProvider._id })
      expect(createdProfile).toBeDefined()
      expect(createdProfile?.businessName).toBe('New Business')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = createMockRequest({
        method: 'PUT',
        body: { businessName: 'Test' },
      })

      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should return 403 for non-provider user', async () => {
      const mockSession = {
        user: {
          id: testUser._id.toString(),
          email: testUser.email,
          roles: ['client'],
        },
      }
      
      mockGetServerSession.mockResolvedValue(mockSession)

      const request = createMockRequest({
        method: 'PUT',
        body: { businessName: 'Test' },
      })

      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.error).toBe('User is not a provider')
    })

    it('should validate required fields', async () => {
      const mockSession = {
        user: {
          id: testProvider._id.toString(),
          email: testProvider.email,
          roles: ['provider'],
        },
      }
      
      mockGetServerSession.mockResolvedValue(mockSession)

      const invalidData = {
        businessName: '', // Empty business name
        timezone: 'Europe/Belgrade',
      }

      const request = createMockRequest({
        method: 'PUT',
        body: invalidData,
      })

      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('Business name is required')
    })

    it('should validate email format in contactInfo', async () => {
      const mockSession = {
        user: {
          id: testProvider._id.toString(),
          email: testProvider.email,
          roles: ['provider'],
        },
      }
      
      mockGetServerSession.mockResolvedValue(mockSession)

      const invalidData = {
        businessName: 'Valid Business',
        contactInfo: {
          email: 'invalid-email-format',
        },
        timezone: 'Europe/Belgrade',
      }

      const request = createMockRequest({
        method: 'PUT',
        body: invalidData,
      })

      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBeDefined()
    })

    it('should handle partial updates correctly', async () => {
      const mockSession = {
        user: {
          id: testProvider._id.toString(),
          email: testProvider.email,
          roles: ['provider'],
        },
      }
      
      mockGetServerSession.mockResolvedValue(mockSession)

      const partialUpdateData = {
        businessName: 'Partially Updated Business',
        // Not updating other fields
      }

      const request = createMockRequest({
        method: 'PUT',
        body: partialUpdateData,
      })

      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.profile.businessName).toBe('Partially Updated Business')
      // Other fields should remain unchanged
      expect(responseData.profile.description).toBe('Test business description')
      expect(responseData.profile.timezone).toBe('Europe/Belgrade')
    })

    it('should trim whitespace from string fields', async () => {
      const mockSession = {
        user: {
          id: testProvider._id.toString(),
          email: testProvider.email,
          roles: ['provider'],
        },
      }
      
      mockGetServerSession.mockResolvedValue(mockSession)

      const dataWithSpaces = {
        businessName: '  Trimmed Business  ',
        description: '  Trimmed description  ',
        contactInfo: {
          phone: '  +381601111111  ',
          email: '  trimmed@example.com  ',
        },
      }

      const request = createMockRequest({
        method: 'PUT',
        body: dataWithSpaces,
      })

      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.profile.businessName).toBe('Trimmed Business')
      expect(responseData.profile.description).toBe('Trimmed description')
      expect(responseData.profile.contactInfo.phone).toBe('+381601111111')
      expect(responseData.profile.contactInfo.email).toBe('trimmed@example.com')
    })
  })

  describe('Availability Settings', () => {
    it('should update availability settings', async () => {
      const mockSession = {
        user: {
          id: testProvider._id.toString(),
          email: testProvider.email,
          roles: ['provider'],
        },
      }
      
      mockGetServerSession.mockResolvedValue(mockSession)

      const availabilityData = {
        businessName: 'Business with Availability',
        availabilitySettings: {
          monday: { enabled: true, start: '08:00', end: '18:00' },
          tuesday: { enabled: true, start: '09:00', end: '17:00' },
          wednesday: { enabled: false, start: '09:00', end: '17:00' },
          thursday: { enabled: true, start: '09:00', end: '17:00' },
          friday: { enabled: true, start: '09:00', end: '16:00' },
          saturday: { enabled: false, start: '09:00', end: '17:00' },
          sunday: { enabled: false, start: '09:00', end: '17:00' },
        },
      }

      const request = createMockRequest({
        method: 'PUT',
        body: availabilityData,
      })

      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.profile.availabilitySettings).toEqual(availabilityData.availabilitySettings)

      // Verify in database
      const updatedProfile = await ProviderProfile.findOne({ userId: testProvider._id })
      expect(updatedProfile?.availabilitySettings).toEqual(availabilityData.availabilitySettings)
    })

    it('should handle complex availability with breaks', async () => {
      const mockSession = {
        user: {
          id: testProvider._id.toString(),
          email: testProvider.email,
          roles: ['provider'],
        },
      }
      
      mockGetServerSession.mockResolvedValue(mockSession)

      const complexAvailability = {
        businessName: 'Complex Schedule Business',
        availabilitySettings: {
          monday: {
            enabled: true,
            start: '08:00',
            end: '18:00',
            breaks: [
              { start: '12:00', end: '13:00', label: 'Lunch Break' },
              { start: '15:00', end: '15:15', label: 'Coffee Break' },
            ],
          },
          tuesday: {
            enabled: true,
            start: '09:00',
            end: '17:00',
            customSlots: [
              { start: '09:00', end: '10:30' },
              { start: '11:00', end: '12:30' },
              { start: '14:00', end: '17:00' },
            ],
          },
        },
      }

      const request = createMockRequest({
        method: 'PUT',
        body: complexAvailability,
      })

      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.profile.availabilitySettings.monday.breaks).toHaveLength(2)
      expect(responseData.profile.availabilitySettings.tuesday.customSlots).toHaveLength(3)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockSession = {
        user: {
          id: testProvider._id.toString(),
          email: testProvider.email,
          roles: ['provider'],
        },
      }
      
      mockGetServerSession.mockResolvedValue(mockSession)

      // Mock ProviderProfile.findOneAndUpdate to throw an error
      const originalFindOneAndUpdate = ProviderProfile.findOneAndUpdate
      ProviderProfile.findOneAndUpdate = jest.fn(() => Promise.reject(new Error('Database error'))) as any

      const request = createMockRequest({
        method: 'PUT',
        body: { businessName: 'Test Business' },
      })

      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Internal server error')

      // Restore original method
      ProviderProfile.findOneAndUpdate = originalFindOneAndUpdate
    })

    it('should handle invalid JSON in request body', async () => {
      const mockSession = {
        user: {
          id: testProvider._id.toString(),
          email: testProvider.email,
          roles: ['provider'],
        },
      }
      
      mockGetServerSession.mockResolvedValue(mockSession)

      const request = {
        json: jest.fn(() => Promise.reject(new Error('Invalid JSON'))),
      } as any

      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid request body')
    })
  })
})