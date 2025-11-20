import { describe, it, expect, beforeEach } from '@jest/globals'
import mongoose from 'mongoose'
import ProviderGoogleIntegration from '@/models/ProviderGoogleIntegration'
import User from '@/models/User'
import ProviderProfile from '@/models/ProviderProfile'
import { createMockGoogleIntegration } from '../utils/testHelpers'
import DatabaseTestUtils from '../utils/databaseUtils'

describe('ProviderGoogleIntegration Model', () => {
  let testProvider: any
  let testProviderProfile: any

  beforeEach(async () => {
    await DatabaseTestUtils.cleanDatabase()
    
    // Create test provider user
    testProvider = await User.create({
      email: 'provider@example.com',
      name: 'Test Provider',
      roles: ['provider'],
      emailVerified: true,
    })

    // Create provider profile
    testProviderProfile = await ProviderProfile.create({
      userId: testProvider._id,
      businessName: 'Test Business',
      timezone: 'Europe/Belgrade',
    })
  })

  describe('Schema Validation', () => {
    it('should create a valid Google integration with all required fields', async () => {
      const tokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now
      
      const integrationData = {
        providerId: testProviderProfile._id,
        googleAccountEmail: 'provider@gmail.com',
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        calendarId: 'primary',
        tokenExpiry,
        isActive: true,
      }

      const integration = new ProviderGoogleIntegration(integrationData)
      const savedIntegration = await integration.save()

      expect(savedIntegration._id).toBeDefined()
      expect(savedIntegration.providerId.equals(testProviderProfile._id)).toBe(true)
      expect(savedIntegration.googleAccountEmail).toBe(integrationData.googleAccountEmail)
      expect(savedIntegration.accessToken).toBe(integrationData.accessToken)
      expect(savedIntegration.refreshToken).toBe(integrationData.refreshToken)
      expect(savedIntegration.calendarId).toBe(integrationData.calendarId)
      expect(savedIntegration.expiresAt).toEqual(expiresAt)
      expect(savedIntegration.email).toBe(integrationData.email)
      expect(savedIntegration.createdAt).toBeInstanceOf(Date)
      expect(savedIntegration.updatedAt).toBeInstanceOf(Date)
    })

    it('should create integration without optional email field', async () => {
      const integrationData = {
        userId: testProvider._id,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresAt: new Date(Date.now() + 3600000),
      }

      const integration = new ProviderGoogleIntegration(integrationData)
      const savedIntegration = await integration.save()

      expect(savedIntegration.email).toBeUndefined()
      expect(savedIntegration.accessToken).toBe('access-token-123')
    })

    it('should trim whitespace from string fields', async () => {
      const integrationData = {
        userId: testProvider._id,
        accessToken: '  access-token-with-spaces  ',
        refreshToken: '  refresh-token-with-spaces  ',
        expiresAt: new Date(Date.now() + 3600000),
        email: '  provider@gmail.com  ',
      }

      const integration = new ProviderGoogleIntegration(integrationData)
      const savedIntegration = await integration.save()

      expect(savedIntegration.accessToken).toBe('access-token-with-spaces')
      expect(savedIntegration.refreshToken).toBe('refresh-token-with-spaces')
      expect(savedIntegration.email).toBe('provider@gmail.com')
    })

    it('should convert email to lowercase', async () => {
      const integrationData = {
        userId: testProvider._id,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresAt: new Date(Date.now() + 3600000),
        email: 'PROVIDER@GMAIL.COM',
      }

      const integration = new ProviderGoogleIntegration(integrationData)
      const savedIntegration = await integration.save()

      expect(savedIntegration.email).toBe('provider@gmail.com')
    })
  })

  describe('Schema Validation Errors', () => {
    const requiredFields = ['userId', 'accessToken', 'refreshToken', 'expiresAt']

    requiredFields.forEach(field => {
      it(`should throw validation error if ${field} is missing`, async () => {
        const integrationData: any = {
          userId: testProvider._id,
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456',
          expiresAt: new Date(Date.now() + 3600000),
        }

        delete integrationData[field]
        const integration = new ProviderGoogleIntegration(integrationData)
        
        await expect(integration.save()).rejects.toThrow(`Path \`${field}\` is required`)
      })
    })

    it('should throw validation error for invalid userId format', async () => {
      const integrationData = {
        userId: 'invalid-object-id',
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresAt: new Date(Date.now() + 3600000),
      }

      const integration = new ProviderGoogleIntegration(integrationData)
      
      await expect(integration.save()).rejects.toThrow()
    })

    it('should throw validation error for invalid email format', async () => {
      const integrationData = {
        userId: testProvider._id,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresAt: new Date(Date.now() + 3600000),
        email: 'invalid-email-format',
      }

      const integration = new ProviderGoogleIntegration(integrationData)
      
      await expect(integration.save()).rejects.toThrow()
    })

    it('should enforce unique userId constraint', async () => {
      const integrationData1 = {
        userId: testProvider._id,
        accessToken: 'access-token-1',
        refreshToken: 'refresh-token-1',
        expiresAt: new Date(Date.now() + 3600000),
      }

      const integrationData2 = {
        userId: testProvider._id,
        accessToken: 'access-token-2',
        refreshToken: 'refresh-token-2',
        expiresAt: new Date(Date.now() + 3600000),
      }

      const integration1 = new ProviderGoogleIntegration(integrationData1)
      await integration1.save()

      const integration2 = new ProviderGoogleIntegration(integrationData2)
      
      await expect(integration2.save()).rejects.toThrow()
    })
  })

  describe('Token Management', () => {
    it('should handle token expiration correctly', async () => {
      const pastDate = new Date(Date.now() - 3600000) // 1 hour ago
      const futureDate = new Date(Date.now() + 3600000) // 1 hour from now

      const expiredIntegration = {
        userId: testProvider._id,
        accessToken: 'expired-token',
        refreshToken: 'refresh-token-123',
        expiresAt: pastDate,
      }

      const validIntegration = {
        userId: new mongoose.Types.ObjectId(),
        accessToken: 'valid-token',
        refreshToken: 'refresh-token-456',
        expiresAt: futureDate,
      }

      await ProviderGoogleIntegration.create([expiredIntegration, validIntegration])

      // Find expired tokens
      const expiredTokens = await ProviderGoogleIntegration.find({
        expiresAt: { $lt: new Date() }
      })
      expect(expiredTokens).toHaveLength(1)
      expect(expiredTokens[0].accessToken).toBe('expired-token')

      // Find valid tokens
      const validTokens = await ProviderGoogleIntegration.find({
        expiresAt: { $gt: new Date() }
      })
      expect(validTokens).toHaveLength(1)
      expect(validTokens[0].accessToken).toBe('valid-token')
    })

    it('should update tokens when refreshed', async () => {
      const integrationData = {
        userId: testProvider._id,
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
      }

      const integration = await ProviderGoogleIntegration.create(integrationData)
      const originalUpdatedAt = integration.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      // Update tokens
      integration.accessToken = 'new-access-token'
      integration.refreshToken = 'new-refresh-token'
      integration.expiresAt = new Date(Date.now() + 7200000) // 2 hours from now
      
      const updatedIntegration = await integration.save()

      expect(updatedIntegration.accessToken).toBe('new-access-token')
      expect(updatedIntegration.refreshToken).toBe('new-refresh-token')
      expect(updatedIntegration.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })
  })

  describe('Model Relations and Population', () => {
    it('should populate user information', async () => {
      const integrationData = {
        userId: testProvider._id,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresAt: new Date(Date.now() + 3600000),
      }

      const integration = await ProviderGoogleIntegration.create(integrationData)
      const populatedIntegration = await ProviderGoogleIntegration.findById(integration._id)
        .populate('userId', 'name email roles')

      expect(populatedIntegration).toBeDefined()
      expect(populatedIntegration?.userId).toBeDefined()
      
      if (typeof populatedIntegration?.userId === 'object' && populatedIntegration?.userId !== null) {
        expect((populatedIntegration.userId as any).email).toBe(testProvider.email)
        expect((populatedIntegration.userId as any).name).toBe(testProvider.name)
        expect((populatedIntegration.userId as any).roles).toContain('provider')
      }
    })

    it('should support lean queries for better performance', async () => {
      const integrationData = {
        userId: testProvider._id,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresAt: new Date(Date.now() + 3600000),
        email: 'provider@gmail.com',
      }

      await ProviderGoogleIntegration.create(integrationData)

      const leanIntegration = await ProviderGoogleIntegration.findOne({
        userId: testProvider._id
      }).lean()

      expect(leanIntegration).toBeDefined()
      expect(leanIntegration?._id).toBeDefined()
      expect(leanIntegration?.accessToken).toBe('access-token-123')
      expect(leanIntegration?.email).toBe('provider@gmail.com')
      // Lean queries return plain objects
      expect(typeof leanIntegration?.save).toBe('undefined')
    })
  })

  describe('Security and Privacy', () => {
    it('should exclude sensitive fields when explicitly selected', async () => {
      const integrationData = {
        userId: testProvider._id,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresAt: new Date(Date.now() + 3600000),
        email: 'provider@gmail.com',
      }

      await ProviderGoogleIntegration.create(integrationData)

      const safeIntegration = await ProviderGoogleIntegration.findOne({
        userId: testProvider._id
      }).select('-accessToken -refreshToken')

      expect(safeIntegration).toBeDefined()
      expect(safeIntegration?.accessToken).toBeUndefined()
      expect(safeIntegration?.refreshToken).toBeUndefined()
      expect(safeIntegration?.email).toBe('provider@gmail.com')
      expect(safeIntegration?.expiresAt).toBeInstanceOf(Date)
    })

    it('should allow checking integration status without exposing tokens', async () => {
      const integrationData = {
        userId: testProvider._id,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresAt: new Date(Date.now() + 3600000),
        email: 'provider@gmail.com',
      }

      await ProviderGoogleIntegration.create(integrationData)

      const integrationExists = await ProviderGoogleIntegration.exists({
        userId: testProvider._id
      })

      expect(integrationExists).toBeTruthy()
      expect(integrationExists?._id).toBeDefined()
    })
  })

  describe('Queries and Operations', () => {
    it('should find integrations by user', async () => {
      const anotherProvider = await User.create({
        email: 'provider2@example.com',
        name: 'Another Provider',
        roles: ['provider'],
      })

      const integrations = [
        {
          userId: testProvider._id,
          accessToken: 'token-1',
          refreshToken: 'refresh-1',
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          userId: anotherProvider._id,
          accessToken: 'token-2',
          refreshToken: 'refresh-2',
          expiresAt: new Date(Date.now() + 3600000),
        },
      ]

      await ProviderGoogleIntegration.insertMany(integrations)

      const providerIntegration = await ProviderGoogleIntegration.findOne({
        userId: testProvider._id
      })
      
      expect(providerIntegration).toBeDefined()
      expect(providerIntegration?.accessToken).toBe('token-1')

      const allIntegrations = await ProviderGoogleIntegration.find({})
      expect(allIntegrations).toHaveLength(2)
    })

    it('should support aggregation for integration statistics', async () => {
      const now = new Date()
      const future = new Date(Date.now() + 3600000)
      const past = new Date(Date.now() - 3600000)

      const integrations = [
        {
          userId: testProvider._id,
          accessToken: 'valid-token',
          refreshToken: 'refresh-1',
          expiresAt: future,
        },
        {
          userId: new mongoose.Types.ObjectId(),
          accessToken: 'expired-token',
          refreshToken: 'refresh-2',
          expiresAt: past,
        },
      ]

      await ProviderGoogleIntegration.insertMany(integrations)

      const stats = await ProviderGoogleIntegration.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            valid: {
              $sum: {
                $cond: [{ $gt: ['$expiresAt', now] }, 1, 0]
              }
            },
            expired: {
              $sum: {
                $cond: [{ $lte: ['$expiresAt', now] }, 1, 0]
              }
            }
          }
        }
      ])

      expect(stats).toHaveLength(1)
      expect(stats[0].total).toBe(2)
      expect(stats[0].valid).toBe(1)
      expect(stats[0].expired).toBe(1)
    })
  })

  describe('Timestamps and Updates', () => {
    it('should update updatedAt timestamp on modification', async () => {
      const integrationData = {
        userId: testProvider._id,
        accessToken: 'original-token',
        refreshToken: 'original-refresh',
        expiresAt: new Date(Date.now() + 3600000),
      }

      const integration = new ProviderGoogleIntegration(integrationData)
      const savedIntegration = await integration.save()
      
      const originalUpdatedAt = savedIntegration.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      savedIntegration.accessToken = 'updated-token'
      const updatedIntegration = await savedIntegration.save()

      expect(updatedIntegration.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
      expect(updatedIntegration.accessToken).toBe('updated-token')
    })

    it('should maintain createdAt timestamp on updates', async () => {
      const integrationData = {
        userId: testProvider._id,
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: new Date(Date.now() + 3600000),
      }

      const integration = new ProviderGoogleIntegration(integrationData)
      const savedIntegration = await integration.save()
      
      const originalCreatedAt = savedIntegration.createdAt

      savedIntegration.accessToken = 'new-token'
      const updatedIntegration = await savedIntegration.save()

      expect(updatedIntegration.createdAt.getTime()).toBe(originalCreatedAt.getTime())
    })
  })
})