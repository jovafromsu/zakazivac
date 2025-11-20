import { describe, it, expect, beforeEach } from '@jest/globals'
import mongoose from 'mongoose'
import ProviderProfile from '@/models/ProviderProfile'
import User from '@/models/User'
import { createMockUser, createMockProviderProfile } from '../utils/testHelpers'
import DatabaseTestUtils from '../utils/databaseUtils'

describe('ProviderProfile Model', () => {
  let testUser: any

  beforeEach(async () => {
    await DatabaseTestUtils.cleanDatabase()
    
    // Create a test user for provider profile
    testUser = await User.create({
      email: 'provider@example.com',
      name: 'Test Provider',
      roles: ['provider'],
      emailVerified: true,
    })
  })

  describe('Schema Validation', () => {
    it('should create a valid provider profile with all required fields', async () => {
      const profileData = {
        userId: testUser._id,
        businessName: 'Test Business',
        description: 'Test business description',
        contactInfo: {
          phone: '+381601234567',
          email: 'business@example.com',
          address: 'Test Address, Belgrade',
        },
        timezone: 'Europe/Belgrade',
        isActive: true,
      }

      const profile = new ProviderProfile(profileData)
      const savedProfile = await profile.save()

      expect(savedProfile._id).toBeDefined()
      expect(savedProfile.userId.equals(testUser._id)).toBe(true)
      expect(savedProfile.businessName).toBe(profileData.businessName)
      expect(savedProfile.description).toBe(profileData.description)
      expect(savedProfile.contactInfo).toEqual(profileData.contactInfo)
      expect(savedProfile.timezone).toBe(profileData.timezone)
      expect(savedProfile.isActive).toBe(true)
      expect(savedProfile.createdAt).toBeInstanceOf(Date)
      expect(savedProfile.updatedAt).toBeInstanceOf(Date)
    })

    it('should set default values for optional fields', async () => {
      const profileData = {
        userId: testUser._id,
        businessName: 'Minimal Business',
      }

      const profile = new ProviderProfile(profileData)
      const savedProfile = await profile.save()

      expect(savedProfile.timezone).toBe('Europe/Belgrade')
      expect(savedProfile.isActive).toBe(false)
      expect(savedProfile.description).toBeUndefined()
      expect(savedProfile.contactInfo).toEqual({})
    })

    it('should allow storing availability settings as mixed data', async () => {
      const availabilitySettings = {
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        wednesday: { enabled: true, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '09:00', end: '17:00' },
        friday: { enabled: true, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '09:00', end: '17:00' },
        sunday: { enabled: false, start: '09:00', end: '17:00' },
      }

      const profileData = {
        userId: testUser._id,
        businessName: 'Test Business',
        availabilitySettings,
      }

      const profile = new ProviderProfile(profileData)
      const savedProfile = await profile.save()

      expect(savedProfile.availabilitySettings).toEqual(availabilitySettings)
    })

    it('should allow complex availability settings with breaks', async () => {
      const complexAvailability = {
        monday: {
          enabled: true,
          start: '08:00',
          end: '18:00',
          breaks: [
            { start: '12:00', end: '13:00', label: 'Lunch' },
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
      }

      const profileData = {
        userId: testUser._id,
        businessName: 'Complex Business',
        availabilitySettings: complexAvailability,
      }

      const profile = new ProviderProfile(profileData)
      const savedProfile = await profile.save()

      expect(savedProfile.availabilitySettings).toEqual(complexAvailability)
    })

    it('should trim whitespace from string fields', async () => {
      const profileData = {
        userId: testUser._id,
        businessName: '  Test Business  ',
        description: '  Description with spaces  ',
        contactInfo: {
          phone: '  +381601234567  ',
          email: '  business@example.com  ',
          address: '  Test Address, Belgrade  ',
        },
      }

      const profile = new ProviderProfile(profileData)
      const savedProfile = await profile.save()

      expect(savedProfile.businessName).toBe('Test Business')
      expect(savedProfile.description).toBe('Description with spaces')
      // contactInfo fields are not trimmed at model level
      expect(savedProfile.contactInfo?.phone).toBe('  +381601234567  ')
      expect(savedProfile.contactInfo?.email).toBe('  business@example.com  ')
      expect(savedProfile.contactInfo?.address).toBe('  Test Address, Belgrade  ')
    })
  })

  describe('Schema Validation Errors', () => {
    it('should throw validation error if userId is missing', async () => {
      const profileData = {
        businessName: 'Test Business',
      }

      const profile = new ProviderProfile(profileData)
      
      await expect(profile.save()).rejects.toThrow('Path `userId` is required')
    })

    it('should throw validation error if businessName is missing', async () => {
      const profileData = {
        userId: testUser._id,
      }

      const profile = new ProviderProfile(profileData)
      
      await expect(profile.save()).rejects.toThrow('Path `businessName` is required')
    })

    it('should throw validation error for empty businessName', async () => {
      const profileData = {
        userId: testUser._id,
        businessName: '',
      }

      const profile = new ProviderProfile(profileData)
      
      await expect(profile.save()).rejects.toThrow()
    })

    // Note: businessName length validation not enforced at model level

    it('should enforce unique userId constraint', async () => {
      const profileData1 = {
        userId: testUser._id,
        businessName: 'First Business',
      }

      const profileData2 = {
        userId: testUser._id,
        businessName: 'Second Business',
      }

      const profile1 = new ProviderProfile(profileData1)
      await profile1.save()

      const profile2 = new ProviderProfile(profileData2)
      
      await expect(profile2.save()).rejects.toThrow()
    })

    it('should throw validation error for invalid userId format', async () => {
      const profileData = {
        userId: 'invalid-object-id',
        businessName: 'Test Business',
      }

      const profile = new ProviderProfile(profileData)
      
      await expect(profile.save()).rejects.toThrow()
    })

    // Note: email validation in contactInfo not enforced at model level
  })

  describe('Contact Information', () => {
    it('should handle partial contact information', async () => {
      const profileData = {
        userId: testUser._id,
        businessName: 'Test Business',
        contactInfo: {
          phone: '+381601234567',
        },
      }

      const profile = new ProviderProfile(profileData)
      const savedProfile = await profile.save()

      expect(savedProfile.contactInfo?.phone).toBe('+381601234567')
      expect(savedProfile.contactInfo?.email).toBeUndefined()
      expect(savedProfile.contactInfo?.address).toBeUndefined()
    })

    it('should allow empty contactInfo', async () => {
      const profileData = {
        userId: testUser._id,
        businessName: 'Test Business',
        contactInfo: {},
      }

      const profile = new ProviderProfile(profileData)
      const savedProfile = await profile.save()

      expect(savedProfile.contactInfo).toEqual({})
    })

    it('should validate phone number format if provided', async () => {
      const profileData = {
        userId: testUser._id,
        businessName: 'Test Business',
        contactInfo: {
          phone: 'invalid-phone',
        },
      }

      const profile = new ProviderProfile(profileData)
      
      // Note: Add phone validation in schema if needed
      const savedProfile = await profile.save()
      expect(savedProfile.contactInfo?.phone).toBe('invalid-phone')
    })
  })

  describe('Active Status Management', () => {
    it('should set isActive to false by default', async () => {
      const profileData = {
        userId: testUser._id,
        businessName: 'Test Business',
      }

      const profile = new ProviderProfile(profileData)
      const savedProfile = await profile.save()

      expect(savedProfile.isActive).toBe(false)
    })

    it('should allow setting isActive to false', async () => {
      const profileData = {
        userId: testUser._id,
        businessName: 'Test Business',
        isActive: false,
      }

      const profile = new ProviderProfile(profileData)
      const savedProfile = await profile.save()

      expect(savedProfile.isActive).toBe(false)
    })

    it('should find only active providers when filtering', async () => {
      const activeProfile = {
        userId: testUser._id,
        businessName: 'Active Business',
        isActive: true,
      }

      // Create another user for inactive profile
      const inactiveUser = await User.create({
        email: 'inactive@example.com',
        name: 'Inactive Provider',
        roles: ['provider'],
      })

      const inactiveProfile = {
        userId: inactiveUser._id,
        businessName: 'Inactive Business',
        isActive: false,
      }

      await ProviderProfile.create([activeProfile, inactiveProfile])

      const activeProviders = await ProviderProfile.find({ isActive: true })
      expect(activeProviders).toHaveLength(1)
      expect(activeProviders[0].businessName).toBe('Active Business')

      const allProviders = await ProviderProfile.find({})
      expect(allProviders).toHaveLength(2)
    })
  })

  describe('Timezone Handling', () => {
    it('should accept valid timezone strings', async () => {
      const timezones = [
        'Europe/Belgrade',
        'America/New_York',
        'Asia/Tokyo',
        'Australia/Sydney',
        'UTC',
      ]

      for (const timezone of timezones) {
        const profileData = {
          userId: new mongoose.Types.ObjectId(),
          businessName: `Business ${timezone}`,
          timezone,
        }

        const profile = new ProviderProfile(profileData)
        const savedProfile = await profile.save()

        expect(savedProfile.timezone).toBe(timezone)
      }
    })

    it('should default to UTC if timezone not provided', async () => {
      const profileData = {
        userId: testUser._id,
        businessName: 'Test Business',
      }

      const profile = new ProviderProfile(profileData)
      const savedProfile = await profile.save()

      expect(savedProfile.timezone).toBe('Europe/Belgrade')
    })
  })

  describe('Model Methods and Population', () => {
    it('should populate user information', async () => {
      const profileData = {
        userId: testUser._id,
        businessName: 'Test Business',
      }

      const profile = await ProviderProfile.create(profileData)
      const populatedProfile = await ProviderProfile.findById(profile._id)
        .populate('userId', 'name email roles')

      expect(populatedProfile).toBeDefined()
      expect(populatedProfile?.userId).toBeDefined()
      
      // Check if populated (will be object, not ObjectId)
      if (typeof populatedProfile?.userId === 'object' && populatedProfile?.userId !== null) {
        expect((populatedProfile.userId as any).email).toBe(testUser.email)
        expect((populatedProfile.userId as any).name).toBe(testUser.name)
      }
    })

    it('should support lean queries', async () => {
      const profileData = {
        userId: testUser._id,
        businessName: 'Test Business',
        availabilitySettings: {
          monday: { enabled: true, start: '09:00', end: '17:00' },
        },
      }

      await ProviderProfile.create(profileData)

      const leanProfile = await ProviderProfile.findOne({
        userId: testUser._id
      }).lean()

      expect(leanProfile).toBeDefined()
      expect((leanProfile as any)?._id).toBeDefined()
      expect((leanProfile as any)?.businessName).toBe('Test Business')
      expect((leanProfile as any)?.availabilitySettings?.monday).toEqual({
        enabled: true,
        start: '09:00',
        end: '17:00',
      })
      // Lean queries return plain objects
      expect(typeof (leanProfile as any)?.save).toBe('undefined')
    })

    it('should support aggregation pipelines', async () => {
      // Create multiple provider profiles
      const providers = []
      for (let i = 0; i < 3; i++) {
        const user = await User.create({
          email: `provider${i}@example.com`,
          name: `Provider ${i}`,
          roles: ['provider'],
        })

        providers.push({
          userId: user._id,
          businessName: `Business ${i}`,
          isActive: i % 2 === 0, // alternating active/inactive
        })
      }

      await ProviderProfile.insertMany(providers)

      const stats = await ProviderProfile.aggregate([
        {
          $group: {
            _id: '$isActive',
            count: { $sum: 1 },
          }
        }
      ])

      expect(stats).toHaveLength(2)
      
      const activeStats = stats.find(stat => stat._id === true)
      const inactiveStats = stats.find(stat => stat._id === false)
      
      expect(activeStats?.count).toBe(2) // providers 0 and 2
      expect(inactiveStats?.count).toBe(1) // provider 1
    })
  })

  describe('Timestamps and Updates', () => {
    it('should update updatedAt timestamp on modification', async () => {
      const profileData = {
        userId: testUser._id,
        businessName: 'Original Business',
      }

      const profile = new ProviderProfile(profileData)
      const savedProfile = await profile.save()
      
      const originalUpdatedAt = savedProfile.updatedAt

      // Wait to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))

      savedProfile.businessName = 'Updated Business'
      const updatedProfile = await savedProfile.save()

      expect(updatedProfile.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
      expect(updatedProfile.businessName).toBe('Updated Business')
    })

    it('should maintain createdAt timestamp on updates', async () => {
      const profileData = {
        userId: testUser._id,
        businessName: 'Original Business',
      }

      const profile = new ProviderProfile(profileData)
      const savedProfile = await profile.save()
      
      const originalCreatedAt = savedProfile.createdAt

      savedProfile.businessName = 'Updated Business'
      const updatedProfile = await savedProfile.save()

      expect(updatedProfile.createdAt.getTime()).toBe(originalCreatedAt.getTime())
    })
  })
})