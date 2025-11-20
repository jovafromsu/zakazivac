import { describe, it, expect, beforeEach } from '@jest/globals'
import mongoose from 'mongoose'
import Service from '@/models/Service'
import ProviderProfile from '@/models/ProviderProfile'
import Category from '@/models/Category'
import User from '@/models/User'
import { createMockService } from '../utils/testHelpers'
import DatabaseTestUtils from '../utils/databaseUtils'

describe('Service Model', () => {
  let testProvider: any
  let testCategory: any

  beforeEach(async () => {
    await DatabaseTestUtils.cleanDatabase()
    
    // Create test user and provider profile
    const testUser = await User.create({
      email: 'provider@example.com',
      name: 'Test Provider',
      roles: ['provider'],
      emailVerified: true,
    })

    testProvider = await ProviderProfile.create({
      userId: testUser._id,
      businessName: 'Test Business',
      timezone: 'Europe/Belgrade',
    })

    // Create test category
    testCategory = await Category.create({
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test category description',
      createdBy: testUser._id,
      isActive: true,
    })
  })

  describe('Schema Validation', () => {
    it('should create a valid service with all required fields', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Test Service',
        description: 'Test service description',
        categoryId: testCategory._id,
        durationMinutes: 60,
        price: 10000, // 100 EUR in dinars
        isActive: true,
      }

      const service = new Service(serviceData)
      const savedService = await service.save()

      expect(savedService._id).toBeDefined()
      expect(savedService.providerId.equals(testProvider._id)).toBe(true)
      expect(savedService.name).toBe(serviceData.name)
      expect(savedService.description).toBe(serviceData.description)
      expect(savedService.categoryId?.equals(testCategory._id)).toBe(true)
      expect(savedService.durationMinutes).toBe(serviceData.durationMinutes)
      expect(savedService.price).toBe(serviceData.price)
      expect(savedService.isActive).toBe(true)
      expect(savedService.createdAt).toBeInstanceOf(Date)
      expect(savedService.updatedAt).toBeInstanceOf(Date)
    })

    it('should create service without optional fields', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Minimal Service',
        durationMinutes: 30,
        price: 5000,
      }

      const service = new Service(serviceData)
      const savedService = await service.save()

      expect(savedService.name).toBe('Minimal Service')
      expect(savedService.description).toBeUndefined()
      expect(savedService.categoryId).toBeUndefined()
      expect(savedService.isActive).toBe(true) // default value
    })

    it('should trim whitespace from string fields', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: '  Test Service  ',
        description: '  Service description with spaces  ',
        durationMinutes: 45,
        price: 7500,
      }

      const service = new Service(serviceData)
      const savedService = await service.save()

      expect(savedService.name).toBe('Test Service')
      expect(savedService.description).toBe('Service description with spaces')
    })

    it('should set isActive to true by default', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Default Active Service',
        durationMinutes: 60,
        price: 8000,
      }

      const service = new Service(serviceData)
      const savedService = await service.save()

      expect(savedService.isActive).toBe(true)
    })
  })

  describe('Schema Validation Errors', () => {
    it('should throw validation error if providerId is missing', async () => {
      const serviceData = {
        name: 'Test Service',
        durationMinutes: 60,
        price: 10000,
      }

      const service = new Service(serviceData)
      
      await expect(service.save()).rejects.toThrow('Path `providerId` is required')
    })

    it('should throw validation error if name is missing', async () => {
      const serviceData = {
        providerId: testProvider._id,
        durationMinutes: 60,
        price: 10000,
      }

      const service = new Service(serviceData)
      
      await expect(service.save()).rejects.toThrow('Path `name` is required')
    })

    it('should throw validation error if durationMinutes is missing', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Test Service',
        price: 10000,
      }

      const service = new Service(serviceData)
      
      await expect(service.save()).rejects.toThrow('Path `durationMinutes` is required')
    })

    it('should throw validation error if price is missing', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Test Service',
        durationMinutes: 60,
      }

      const service = new Service(serviceData)
      
      await expect(service.save()).rejects.toThrow('Path `price` is required')
    })

    it('should throw validation error for invalid providerId format', async () => {
      const serviceData = {
        providerId: 'invalid-object-id',
        name: 'Test Service',
        durationMinutes: 60,
        price: 10000,
      }

      const service = new Service(serviceData)
      
      await expect(service.save()).rejects.toThrow()
    })

    it('should throw validation error for invalid categoryId format', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Test Service',
        categoryId: 'invalid-object-id',
        durationMinutes: 60,
        price: 10000,
      }

      const service = new Service(serviceData)
      
      await expect(service.save()).rejects.toThrow()
    })
  })

  describe('Duration Validation', () => {
    it('should accept valid duration values', async () => {
      const validDurations = [15, 30, 45, 60, 90, 120, 180, 240, 300, 360, 420, 480]

      for (const duration of validDurations) {
        const serviceData = {
          providerId: testProvider._id,
          name: `Service ${duration}min`,
          durationMinutes: duration,
          price: 5000,
        }

        const service = new Service(serviceData)
        const savedService = await service.save()

        expect(savedService.durationMinutes).toBe(duration)
      }
    })

    it('should reject duration less than 15 minutes', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Too Short Service',
        durationMinutes: 10,
        price: 5000,
      }

      const service = new Service(serviceData)
      
      await expect(service.save()).rejects.toThrow()
    })

    it('should reject duration greater than 480 minutes (8 hours)', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Too Long Service',
        durationMinutes: 500,
        price: 5000,
      }

      const service = new Service(serviceData)
      
      await expect(service.save()).rejects.toThrow()
    })

    it('should allow decimal duration values but store as number', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Decimal Duration Service',
        durationMinutes: 45.5,
        price: 5000,
      }

      const service = new Service(serviceData)
      const savedService = await service.save()
      
      // Mongoose stores decimal as-is for Number type
      expect(savedService.durationMinutes).toBe(45.5)
      expect(typeof savedService.durationMinutes).toBe('number')
    })
  })

  describe('Price Validation', () => {
    it('should accept valid price values', async () => {
      const validPrices = [0, 1000, 5000, 10000, 50000, 100000]

      for (const price of validPrices) {
        const serviceData = {
          providerId: testProvider._id,
          name: `Service ${price}RSD`,
          durationMinutes: 60,
          price: price,
        }

        const service = new Service(serviceData)
        const savedService = await service.save()

        expect(savedService.price).toBe(price)
      }
    })

    it('should accept price of 0 for free services', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Free Service',
        durationMinutes: 30,
        price: 0,
      }

      const service = new Service(serviceData)
      const savedService = await service.save()

      expect(savedService.price).toBe(0)
    })

    it('should reject negative prices', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Negative Price Service',
        durationMinutes: 60,
        price: -1000,
      }

      const service = new Service(serviceData)
      
      await expect(service.save()).rejects.toThrow()
    })

    it('should handle decimal prices', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Decimal Price Service',
        durationMinutes: 60,
        price: 9999.99,
      }

      const service = new Service(serviceData)
      const savedService = await service.save()

      expect(savedService.price).toBe(9999.99)
    })
  })

  describe('Active Status Management', () => {
    it('should filter active services', async () => {
      const activeService = {
        providerId: testProvider._id,
        name: 'Active Service',
        durationMinutes: 60,
        price: 8000,
        isActive: true,
      }

      const inactiveService = {
        providerId: testProvider._id,
        name: 'Inactive Service',
        durationMinutes: 45,
        price: 6000,
        isActive: false,
      }

      await Service.create([activeService, inactiveService])

      const activeServices = await Service.find({ isActive: true })
      expect(activeServices).toHaveLength(1)
      expect(activeServices[0].name).toBe('Active Service')

      const allServices = await Service.find({})
      expect(allServices).toHaveLength(2)
    })

    it('should allow toggling service status', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Toggle Service',
        durationMinutes: 60,
        price: 8000,
      }

      const service = await Service.create(serviceData)
      expect(service.isActive).toBe(true)

      service.isActive = false
      const updatedService = await service.save()
      expect(updatedService.isActive).toBe(false)

      service.isActive = true
      const reactivatedService = await service.save()
      expect(reactivatedService.isActive).toBe(true)
    })
  })

  describe('Model Relations and Population', () => {
    it('should populate provider profile', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Populate Test Service',
        durationMinutes: 60,
        price: 8000,
      }

      const service = await Service.create(serviceData)
      const populatedService = await Service.findById(service._id)
        .populate('providerId', 'businessName contactInfo')

      expect(populatedService).toBeDefined()
      expect(populatedService?.providerId).toBeDefined()
      
      if (typeof populatedService?.providerId === 'object' && populatedService?.providerId !== null) {
        expect((populatedService.providerId as any).businessName).toBe(testProvider.businessName)
      }
    })

    it('should populate category information', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Category Test Service',
        categoryId: testCategory._id,
        durationMinutes: 60,
        price: 8000,
      }

      const service = await Service.create(serviceData)
      const populatedService = await Service.findById(service._id)
        .populate('categoryId', 'name description')

      expect(populatedService).toBeDefined()
      expect(populatedService?.categoryId).toBeDefined()
      
      if (typeof populatedService?.categoryId === 'object' && populatedService?.categoryId !== null) {
        expect((populatedService.categoryId as any).name).toBe(testCategory.name)
      }
    })

    it('should handle missing category gracefully', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'No Category Service',
        durationMinutes: 60,
        price: 8000,
      }

      const service = await Service.create(serviceData)
      const populatedService = await Service.findById(service._id)
        .populate('categoryId')

      expect(populatedService).toBeDefined()
      expect(populatedService?.categoryId).toBeUndefined()
    })
  })

  describe('Queries and Aggregations', () => {
    it('should find services by provider', async () => {
      // Create another provider for comparison
      const anotherUser = await User.create({
        email: 'provider2@example.com',
        name: 'Another Provider',
        roles: ['provider'],
      })

      const anotherProvider = await ProviderProfile.create({
        userId: anotherUser._id,
        businessName: 'Another Business',
      })

      const services = [
        {
          providerId: testProvider._id,
          name: 'Service 1',
          durationMinutes: 60,
          price: 8000,
        },
        {
          providerId: testProvider._id,
          name: 'Service 2',
          durationMinutes: 45,
          price: 6000,
        },
        {
          providerId: anotherProvider._id,
          name: 'Other Service',
          durationMinutes: 30,
          price: 4000,
        },
      ]

      await Service.insertMany(services)

      const providerServices = await Service.find({ providerId: testProvider._id })
      expect(providerServices).toHaveLength(2)
      
      const serviceNames = providerServices.map(s => s.name)
      expect(serviceNames).toContain('Service 1')
      expect(serviceNames).toContain('Service 2')
    })

    it('should find services by category', async () => {
      const anotherCategory = await Category.create({
        name: 'Another Category',
        slug: 'another-category',
        description: 'Another test category',
        createdBy: testProvider.userId,
      })

      const services = [
        {
          providerId: testProvider._id,
          name: 'Category 1 Service',
          categoryId: testCategory._id,
          durationMinutes: 60,
          price: 8000,
        },
        {
          providerId: testProvider._id,
          name: 'Category 2 Service',
          categoryId: anotherCategory._id,
          durationMinutes: 45,
          price: 6000,
        },
        {
          providerId: testProvider._id,
          name: 'No Category Service',
          durationMinutes: 30,
          price: 4000,
        },
      ]

      await Service.insertMany(services)

      const categoryServices = await Service.find({ categoryId: testCategory._id })
      expect(categoryServices).toHaveLength(1)
      expect(categoryServices[0].name).toBe('Category 1 Service')

      const uncategorizedServices = await Service.find({ categoryId: { $exists: false } })
      expect(uncategorizedServices).toHaveLength(1)
      expect(uncategorizedServices[0].name).toBe('No Category Service')
    })

    it('should support price range queries', async () => {
      const services = [
        { providerId: testProvider._id, name: 'Cheap Service', durationMinutes: 30, price: 3000 },
        { providerId: testProvider._id, name: 'Mid Service', durationMinutes: 60, price: 8000 },
        { providerId: testProvider._id, name: 'Expensive Service', durationMinutes: 90, price: 15000 },
      ]

      await Service.insertMany(services)

      const affordableServices = await Service.find({ price: { $lte: 8000 } })
      expect(affordableServices).toHaveLength(2)

      const premiumServices = await Service.find({ price: { $gte: 10000 } })
      expect(premiumServices).toHaveLength(1)
      expect(premiumServices[0].name).toBe('Expensive Service')
    })

    it('should support duration range queries', async () => {
      const services = [
        { providerId: testProvider._id, name: 'Quick Service', durationMinutes: 30, price: 5000 },
        { providerId: testProvider._id, name: 'Standard Service', durationMinutes: 60, price: 8000 },
        { providerId: testProvider._id, name: 'Long Service', durationMinutes: 120, price: 12000 },
      ]

      await Service.insertMany(services)

      const shortServices = await Service.find({ durationMinutes: { $lte: 60 } })
      expect(shortServices).toHaveLength(2)

      const longServices = await Service.find({ durationMinutes: { $gte: 90 } })
      expect(longServices).toHaveLength(1)
      expect(longServices[0].name).toBe('Long Service')
    })

    it('should support aggregation for statistics', async () => {
      const services = [
        { providerId: testProvider._id, name: 'Service 1', durationMinutes: 30, price: 3000 },
        { providerId: testProvider._id, name: 'Service 2', durationMinutes: 60, price: 8000 },
        { providerId: testProvider._id, name: 'Service 3', durationMinutes: 90, price: 12000 },
      ]

      await Service.insertMany(services)

      const stats = await Service.aggregate([
        { $match: { providerId: testProvider._id } },
        {
          $group: {
            _id: null,
            totalServices: { $sum: 1 },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
            avgDuration: { $avg: '$durationMinutes' },
          }
        }
      ])

      expect(stats).toHaveLength(1)
      expect(stats[0].totalServices).toBe(3)
      expect(stats[0].avgPrice).toBe(7666.666666666667)
      expect(stats[0].minPrice).toBe(3000)
      expect(stats[0].maxPrice).toBe(12000)
      expect(stats[0].avgDuration).toBe(60)
    })
  })

  describe('Timestamps and Updates', () => {
    it('should update updatedAt timestamp on modification', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Original Service',
        durationMinutes: 60,
        price: 8000,
      }

      const service = new Service(serviceData)
      const savedService = await service.save()
      
      const originalUpdatedAt = savedService.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      savedService.name = 'Updated Service'
      const updatedService = await savedService.save()

      expect(updatedService.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
      expect(updatedService.name).toBe('Updated Service')
    })

    it('should maintain createdAt timestamp on updates', async () => {
      const serviceData = {
        providerId: testProvider._id,
        name: 'Test Service',
        durationMinutes: 60,
        price: 8000,
      }

      const service = new Service(serviceData)
      const savedService = await service.save()
      
      const originalCreatedAt = savedService.createdAt

      savedService.price = 9000
      const updatedService = await savedService.save()

      expect(updatedService.createdAt.getTime()).toBe(originalCreatedAt.getTime())
    })
  })
})