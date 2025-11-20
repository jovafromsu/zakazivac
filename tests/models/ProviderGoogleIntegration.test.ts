import { describe, it, expect, beforeEach } from '@jest/globals'
import mongoose from 'mongoose'
import ProviderGoogleIntegration from '@/models/ProviderGoogleIntegration'
import User from '@/models/User'
import ProviderProfile from '@/models/ProviderProfile'
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
      const integrationData = {
        providerId: testProviderProfile._id,
        googleAccountEmail: 'provider@gmail.com',
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        calendarId: 'primary',
        tokenExpiry: new Date(Date.now() + 3600000),
        isActive: true,
      }

      const integration = new ProviderGoogleIntegration(integrationData)
      const savedIntegration = await integration.save()

      expect(savedIntegration._id).toBeDefined()
      expect(savedIntegration.providerId.equals(testProviderProfile._id)).toBe(true)
      expect(savedIntegration.googleAccountEmail).toBe('provider@gmail.com')
      expect(savedIntegration.accessToken).toBe('access-token-123')
      expect(savedIntegration.refreshToken).toBe('refresh-token-456')
      expect(savedIntegration.calendarId).toBe('primary')
      expect(savedIntegration.isActive).toBe(true)
    })

    it('should set default values correctly', async () => {
      const integrationData = {
        providerId: testProviderProfile._id,
        googleAccountEmail: 'provider@gmail.com',
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        calendarId: 'primary',
      }

      const integration = new ProviderGoogleIntegration(integrationData)
      const savedIntegration = await integration.save()

      expect(savedIntegration.isActive).toBe(true)
      expect(savedIntegration.lastSyncAt).toBeUndefined()
    })

    it('should convert email to lowercase', async () => {
      const integrationData = {
        providerId: testProviderProfile._id,
        googleAccountEmail: 'PROVIDER@GMAIL.COM',
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        calendarId: 'primary',
      }

      const integration = new ProviderGoogleIntegration(integrationData)
      const savedIntegration = await integration.save()

      expect(savedIntegration.googleAccountEmail).toBe('provider@gmail.com')
    })
  })

  describe('Required Field Validation', () => {
    const requiredFields = ['providerId', 'googleAccountEmail', 'accessToken', 'refreshToken', 'calendarId']

    requiredFields.forEach(field => {
      it(`should throw validation error if ${field} is missing`, async () => {
        const integrationData = {
          providerId: testProviderProfile._id,
          googleAccountEmail: 'provider@gmail.com',
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456',
          calendarId: 'primary',
        }

        delete (integrationData as any)[field]
        const integration = new ProviderGoogleIntegration(integrationData)
        
        await expect(integration.save()).rejects.toThrow(`Path \`${field}\` is required`)
      })
    })

    it('should enforce unique providerId constraint', async () => {
      const integrationData = {
        providerId: testProviderProfile._id,
        googleAccountEmail: 'provider@gmail.com',
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        calendarId: 'primary',
      }

      // Create first integration
      await ProviderGoogleIntegration.create(integrationData)

      // Try to create duplicate
      const duplicateIntegration = new ProviderGoogleIntegration(integrationData)
      await expect(duplicateIntegration.save()).rejects.toThrow()
    })
  })

  describe('Token Management', () => {
    it('should handle token expiration correctly', async () => {
      const expiredDate = new Date(Date.now() - 3600000) // 1 hour ago
      const integrationData = {
        providerId: testProviderProfile._id,
        googleAccountEmail: 'provider@gmail.com',
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        calendarId: 'primary',
        tokenExpiry: expiredDate,
      }

      const integration = new ProviderGoogleIntegration(integrationData)
      const savedIntegration = await integration.save()

      expect(savedIntegration.tokenExpiry).toEqual(expiredDate)
    })

    it('should update tokens when refreshed', async () => {
      const integration = await ProviderGoogleIntegration.create({
        providerId: testProviderProfile._id,
        googleAccountEmail: 'provider@gmail.com',
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        calendarId: 'primary',
      })

      integration.accessToken = 'new-access-token'
      integration.refreshToken = 'new-refresh-token'
      integration.tokenExpiry = new Date(Date.now() + 7200000) // 2 hours from now
      
      const updatedIntegration = await integration.save()

      expect(updatedIntegration.accessToken).toBe('new-access-token')
      expect(updatedIntegration.refreshToken).toBe('new-refresh-token')
      expect(updatedIntegration.tokenExpiry).toBeDefined()
    })
  })

  describe('Queries and Operations', () => {
    it('should find integrations by provider', async () => {
      await ProviderGoogleIntegration.create({
        providerId: testProviderProfile._id,
        googleAccountEmail: 'provider@gmail.com',
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        calendarId: 'primary',
      })

      const integrations = await ProviderGoogleIntegration.find({ 
        providerId: testProviderProfile._id 
      })

      expect(integrations).toHaveLength(1)
      expect(integrations[0].providerId.equals(testProviderProfile._id)).toBe(true)
    })

    it('should support lean queries for better performance', async () => {
      await ProviderGoogleIntegration.create({
        providerId: testProviderProfile._id,
        googleAccountEmail: 'provider@gmail.com',
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        calendarId: 'primary',
      })

      const leanIntegration = await ProviderGoogleIntegration
        .findOne({ providerId: testProviderProfile._id })
        .lean()

      expect(Array.isArray(leanIntegration) || leanIntegration?._id).toBeDefined()
      expect(typeof (leanIntegration as any)?.save).toBe('undefined')
    })
  })

  describe('Timestamps', () => {
    it('should update updatedAt timestamp on modification', async () => {
      const integration = await ProviderGoogleIntegration.create({
        providerId: testProviderProfile._id,
        googleAccountEmail: 'provider@gmail.com',
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        calendarId: 'primary',
      })

      const originalUpdatedAt = integration.updatedAt
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100))
      
      integration.accessToken = 'updated-access-token'
      await integration.save()

      expect(integration.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })
  })
})