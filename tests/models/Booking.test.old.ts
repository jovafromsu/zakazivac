import { describe, it, expect, beforeEach } from '@jest/globals'
import mongoose from 'mongoose'
import Booking from '@/models/Booking'
import User from '@/models/User'
import ProviderProfile from '@/models/ProviderProfile'
import Service from '@/models/Service'
import Category from '@/models/Category'
import { createMockBooking } from '../utils/testHelpers'
import DatabaseTestUtils from '../utils/databaseUtils'

describe('Booking Model', () => {
  let testClient: any
  let testProvider: any
  let testProviderProfile: any
  let testService: any
  let testCategory: any

  beforeEach(async () => {
    await DatabaseTestUtils.cleanDatabase()
    
    // Create test users
    testClient = await User.create({
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

    // Create provider profile
    testProviderProfile = await ProviderProfile.create({
      userId: testProvider._id,
      businessName: 'Test Business',
      timezone: 'Europe/Belgrade',
    })

    // Create category and service
    testCategory = await Category.create({
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test category description',
      createdBy: testProvider._id,
    })

    testService = await Service.create({
      providerId: testProviderProfile._id,
      name: 'Test Service',
      categoryId: testCategory._id,
      durationMinutes: 60,
      price: 8000,
    })
  })

  describe('Schema Validation', () => {
    it('should create a valid booking with all required fields', async () => {
      const startTime = new Date('2024-12-01T10:00:00.000Z')
      const endTime = new Date('2024-12-01T11:00:00.000Z')

      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        startTime,
        endTime,
        status: 'confirmed',
        totalPrice: 8000,
        notes: 'Test booking notes',
      }

      const booking = new Booking(bookingData)
      const savedBooking = await booking.save()

      expect(savedBooking._id).toBeDefined()
      expect(savedBooking.clientId.equals(testClient._id)).toBe(true)
      expect(savedBooking.providerId.equals(testProviderProfile._id)).toBe(true)
      expect(savedBooking.serviceId.equals(testService._id)).toBe(true)
      expect(savedBooking.startTime).toEqual(startTime)
      expect(savedBooking.endTime).toEqual(endTime)
      expect(savedBooking.status).toBe('confirmed')
      expect(savedBooking.totalPrice).toBe(8000)
      expect(savedBooking.notes).toBe('Test booking notes')
      expect(savedBooking.createdAt).toBeInstanceOf(Date)
      expect(savedBooking.updatedAt).toBeInstanceOf(Date)
    })

    it('should create booking with minimal required fields', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        startTime: new Date('2024-12-01T10:00:00.000Z'),
        endTime: new Date('2024-12-01T11:00:00.000Z'),
        totalPrice: 8000,
      }

      const booking = new Booking(bookingData)
      const savedBooking = await booking.save()

      expect(savedBooking.status).toBe('pending') // default value
      expect(savedBooking.notes).toBeUndefined()
      expect(savedBooking.googleCalendarEventId).toBeNull()
    })

    it('should trim whitespace from notes field', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        startTime: new Date('2024-12-01T10:00:00.000Z'),
        endTime: new Date('2024-12-01T11:00:00.000Z'),
        totalPrice: 8000,
        notes: '  Important booking notes  ',
      }

      const booking = new Booking(bookingData)
      const savedBooking = await booking.save()

      expect(savedBooking.notes).toBe('Important booking notes')
    })
  })

  describe('Schema Validation Errors', () => {
    const requiredFields = ['clientId', 'providerId', 'serviceId', 'startTime', 'endTime', 'totalPrice']

    requiredFields.forEach(field => {
      it(`should throw validation error if ${field} is missing`, async () => {
        const bookingData: any = {
          clientId: testClient._id,
          providerId: testProviderProfile._id,
          serviceId: testService._id,
          startTime: new Date('2024-12-01T10:00:00.000Z'),
          endTime: new Date('2024-12-01T11:00:00.000Z'),
          totalPrice: 8000,
        }

        delete bookingData[field]
        const booking = new Booking(bookingData)
        
        await expect(booking.save()).rejects.toThrow(`Path \`${field}\` is required`)
      })
    })

    it('should throw validation error for invalid status', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        startTime: new Date('2024-12-01T10:00:00.000Z'),
        endTime: new Date('2024-12-01T11:00:00.000Z'),
        totalPrice: 8000,
        status: 'invalid-status',
      }

      const booking = new Booking(bookingData)
      
      await expect(booking.save()).rejects.toThrow()
    })

    it('should throw validation error for negative totalPrice', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        startTime: new Date('2024-12-01T10:00:00.000Z'),
        endTime: new Date('2024-12-01T11:00:00.000Z'),
        totalPrice: -1000,
      }

      const booking = new Booking(bookingData)
      
      await expect(booking.save()).rejects.toThrow()
    })
  })

  describe('Status Management', () => {
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no-show']

    validStatuses.forEach(status => {
      it(`should accept status: ${status}`, async () => {
        const bookingData = {
          clientId: testClient._id,
          providerId: testProviderProfile._id,
          serviceId: testService._id,
          startTime: new Date('2024-12-01T10:00:00.000Z'),
          endTime: new Date('2024-12-01T11:00:00.000Z'),
          totalPrice: 8000,
          status,
        }

        const booking = new Booking(bookingData)
        const savedBooking = await booking.save()

        expect(savedBooking.status).toBe(status)
      })
    })

    it('should default status to pending', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        startTime: new Date('2024-12-01T10:00:00.000Z'),
        endTime: new Date('2024-12-01T11:00:00.000Z'),
        totalPrice: 8000,
      }

      const booking = new Booking(bookingData)
      const savedBooking = await booking.save()

      expect(savedBooking.status).toBe('pending')
    })
  })

  describe('Date and Time Validation', () => {
    it('should enforce that endTime is after startTime', async () => {
      const startTime = new Date('2024-12-01T11:00:00.000Z')
      const endTime = new Date('2024-12-01T10:00:00.000Z') // Before start time

      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        startTime,
        endTime,
        totalPrice: 8000,
      }

      const booking = new Booking(bookingData)
      
      // Note: Add custom validation in schema if needed
      await expect(booking.save()).rejects.toThrow()
    })

    it('should handle different time zones correctly', async () => {
      const startTime = new Date('2024-12-01T10:00:00.000Z')
      const endTime = new Date('2024-12-01T11:00:00.000Z')

      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        startTime,
        endTime,
        totalPrice: 8000,
      }

      const booking = new Booking(bookingData)
      const savedBooking = await booking.save()

      expect(savedBooking.startTime.getTime()).toBe(startTime.getTime())
      expect(savedBooking.endTime.getTime()).toBe(endTime.getTime())
    })
  })

  describe('Google Calendar Integration', () => {
    it('should allow storing Google Calendar event ID', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        startTime: new Date('2024-12-01T10:00:00.000Z'),
        endTime: new Date('2024-12-01T11:00:00.000Z'),
        totalPrice: 8000,
        googleCalendarEventId: 'google-event-123',
      }

      const booking = new Booking(bookingData)
      const savedBooking = await booking.save()

      expect(savedBooking.googleCalendarEventId).toBe('google-event-123')
    })

    it('should default Google Calendar event ID to null', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        startTime: new Date('2024-12-01T10:00:00.000Z'),
        endTime: new Date('2024-12-01T11:00:00.000Z'),
        totalPrice: 8000,
      }

      const booking = new Booking(bookingData)
      const savedBooking = await booking.save()

      expect(savedBooking.googleCalendarEventId).toBeNull()
    })
  })

  describe('Model Relations and Population', () => {
    it('should populate client information', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        startTime: new Date('2024-12-01T10:00:00.000Z'),
        endTime: new Date('2024-12-01T11:00:00.000Z'),
        totalPrice: 8000,
      }

      const booking = await Booking.create(bookingData)
      const populatedBooking = await Booking.findById(booking._id)
        .populate('clientId', 'name email')

      expect(populatedBooking).toBeDefined()
      expect(populatedBooking?.clientId).toBeDefined()
      
      if (typeof populatedBooking?.clientId === 'object' && populatedBooking?.clientId !== null) {
        expect((populatedBooking.clientId as any).email).toBe(testClient.email)
        expect((populatedBooking.clientId as any).name).toBe(testClient.name)
      }
    })

    it('should populate service information', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        startTime: new Date('2024-12-01T10:00:00.000Z'),
        endTime: new Date('2024-12-01T11:00:00.000Z'),
        totalPrice: 8000,
      }

      const booking = await Booking.create(bookingData)
      const populatedBooking = await Booking.findById(booking._id)
        .populate('serviceId', 'name durationMinutes price')

      expect(populatedBooking).toBeDefined()
      expect(populatedBooking?.serviceId).toBeDefined()
      
      if (typeof populatedBooking?.serviceId === 'object' && populatedBooking?.serviceId !== null) {
        expect((populatedBooking.serviceId as any).name).toBe(testService.name)
        expect((populatedBooking.serviceId as any).price).toBe(testService.price)
      }
    })

    it('should populate multiple relations', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        startTime: new Date('2024-12-01T10:00:00.000Z'),
        endTime: new Date('2024-12-01T11:00:00.000Z'),
        totalPrice: 8000,
      }

      const booking = await Booking.create(bookingData)
      const populatedBooking = await Booking.findById(booking._id)
        .populate('clientId', 'name email')
        .populate('providerId', 'businessName')
        .populate('serviceId', 'name price')

      expect(populatedBooking?.clientId).toBeDefined()
      expect(populatedBooking?.providerId).toBeDefined()
      expect(populatedBooking?.serviceId).toBeDefined()
    })
  })

  describe('Queries and Filtering', () => {
    it('should find bookings by client', async () => {
      const anotherClient = await User.create({
        email: 'client2@example.com',
        name: 'Another Client',
        roles: ['client'],
      })

      const bookings = [
        {
          clientId: testClient._id,
          providerId: testProviderProfile._id,
          serviceId: testService._id,
          startTime: new Date('2024-12-01T10:00:00.000Z'),
          endTime: new Date('2024-12-01T11:00:00.000Z'),
          totalPrice: 8000,
        },
        {
          clientId: anotherClient._id,
          providerId: testProviderProfile._id,
          serviceId: testService._id,
          startTime: new Date('2024-12-01T14:00:00.000Z'),
          endTime: new Date('2024-12-01T15:00:00.000Z'),
          totalPrice: 8000,
        },
      ]

      await Booking.insertMany(bookings)

      const clientBookings = await Booking.find({ clientId: testClient._id })
      expect(clientBookings).toHaveLength(1)
    })

    it('should find bookings by status', async () => {
      const bookings = [
        {
          clientId: testClient._id,
          providerId: testProviderProfile._id,
          serviceId: testService._id,
          startTime: new Date('2024-12-01T10:00:00.000Z'),
          endTime: new Date('2024-12-01T11:00:00.000Z'),
          totalPrice: 8000,
          status: 'confirmed',
        },
        {
          clientId: testClient._id,
          providerId: testProviderProfile._id,
          serviceId: testService._id,
          startTime: new Date('2024-12-01T14:00:00.000Z'),
          endTime: new Date('2024-12-01T15:00:00.000Z'),
          totalPrice: 8000,
          status: 'pending',
        },
      ]

      await Booking.insertMany(bookings)

      const confirmedBookings = await Booking.find({ status: 'confirmed' })
      expect(confirmedBookings).toHaveLength(1)

      const pendingBookings = await Booking.find({ status: 'pending' })
      expect(pendingBookings).toHaveLength(1)
    })

    it('should find bookings by date range', async () => {
      const bookings = [
        {
          clientId: testClient._id,
          providerId: testProviderProfile._id,
          serviceId: testService._id,
          startTime: new Date('2024-12-01T10:00:00.000Z'),
          endTime: new Date('2024-12-01T11:00:00.000Z'),
          totalPrice: 8000,
        },
        {
          clientId: testClient._id,
          providerId: testProviderProfile._id,
          serviceId: testService._id,
          startTime: new Date('2024-12-15T10:00:00.000Z'),
          endTime: new Date('2024-12-15T11:00:00.000Z'),
          totalPrice: 8000,
        },
      ]

      await Booking.insertMany(bookings)

      const decemberBookings = await Booking.find({
        startTime: {
          $gte: new Date('2024-12-01T00:00:00.000Z'),
          $lt: new Date('2024-12-10T00:00:00.000Z'),
        }
      })

      expect(decemberBookings).toHaveLength(1)
    })
  })

  describe('Timestamps and Updates', () => {
    it('should update updatedAt timestamp on modification', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        startTime: new Date('2024-12-01T10:00:00.000Z'),
        endTime: new Date('2024-12-01T11:00:00.000Z'),
        totalPrice: 8000,
        status: 'pending',
      }

      const booking = new Booking(bookingData)
      const savedBooking = await booking.save()
      
      const originalUpdatedAt = savedBooking.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      savedBooking.status = 'confirmed'
      const updatedBooking = await savedBooking.save()

      expect(updatedBooking.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
      expect(updatedBooking.status).toBe('confirmed')
    })
  })
})