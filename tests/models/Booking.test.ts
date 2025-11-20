import { describe, it, expect, beforeEach } from '@jest/globals'
import mongoose from 'mongoose'
import Booking from '@/models/Booking'
import User from '@/models/User'
import ProviderProfile from '@/models/ProviderProfile'
import Service from '@/models/Service'
import Category from '@/models/Category'
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
      const start = new Date('2024-12-01T10:00:00.000Z')
      const end = new Date('2024-12-01T11:00:00.000Z')

      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        start,
        end,
        status: 'confirmed',
        note: 'Test booking note',
      }

      const booking = new Booking(bookingData)
      const savedBooking = await booking.save()

      expect(savedBooking._id).toBeDefined()
      expect(savedBooking.clientId.toString()).toBe(testClient._id.toString())
      expect(savedBooking.providerId.toString()).toBe(testProviderProfile._id.toString())
      expect(savedBooking.serviceId.toString()).toBe(testService._id.toString())
      expect(savedBooking.start).toEqual(start)
      expect(savedBooking.end).toEqual(end)
      expect(savedBooking.status).toBe('confirmed')
      expect(savedBooking.note).toBe('Test booking note')
      expect(savedBooking.syncStatus).toBe('pending') // default value
    })

    it('should create booking with minimal required fields', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        start: new Date('2024-12-01T10:00:00.000Z'),
        end: new Date('2024-12-01T11:00:00.000Z'),
      }

      const booking = new Booking(bookingData)
      const savedBooking = await booking.save()

      expect(savedBooking._id).toBeDefined()
      expect(savedBooking.status).toBe('confirmed') // default status
      expect(savedBooking.syncStatus).toBe('pending') // default syncStatus
    })

    it('should trim whitespace from note field', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        start: new Date('2024-12-01T10:00:00.000Z'),
        end: new Date('2024-12-01T11:00:00.000Z'),
        note: '  Test note with spaces  ',
      }

      const booking = new Booking(bookingData)
      const savedBooking = await booking.save()

      expect(savedBooking.note).toBe('Test note with spaces')
    })
  })

  describe('Schema Validation Errors', () => {
    const requiredFields = ['clientId', 'providerId', 'serviceId', 'start', 'end']

    requiredFields.forEach(field => {
      it(`should throw validation error if ${field} is missing`, async () => {
        const bookingData = {
          clientId: testClient._id,
          providerId: testProviderProfile._id,
          serviceId: testService._id,
          start: new Date('2024-12-01T10:00:00.000Z'),
          end: new Date('2024-12-01T11:00:00.000Z'),
        }

        delete (bookingData as any)[field]
        const booking = new Booking(bookingData)
        
        await expect(booking.save()).rejects.toThrow(`Path \`${field}\` is required`)
      })
    })

    it('should throw validation error for invalid status', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        start: new Date('2024-12-01T10:00:00.000Z'),
        end: new Date('2024-12-01T11:00:00.000Z'),
        status: 'invalid-status',
      }

      const booking = new Booking(bookingData)
      await expect(booking.save()).rejects.toThrow()
    })
  })

  describe('Status Management', () => {
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed']

    validStatuses.forEach(status => {
      it(`should accept status: ${status}`, async () => {
        const bookingData = {
          clientId: testClient._id,
          providerId: testProviderProfile._id,
          serviceId: testService._id,
          start: new Date('2024-12-01T10:00:00.000Z'),
          end: new Date('2024-12-01T11:00:00.000Z'),
          status,
        }

        const booking = new Booking(bookingData)
        const savedBooking = await booking.save()

        expect(savedBooking.status).toBe(status)
      })
    })

    it('should default status to confirmed', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        start: new Date('2024-12-01T10:00:00.000Z'),
        end: new Date('2024-12-01T11:00:00.000Z'),
      }

      const booking = new Booking(bookingData)
      const savedBooking = await booking.save()

      expect(savedBooking.status).toBe('confirmed')
    })
  })

  describe('Date and Time Validation', () => {
    it('should enforce that end is after start', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        start: new Date('2024-12-01T11:00:00.000Z'),
        end: new Date('2024-12-01T10:00:00.000Z'), // end before start
      }

      const booking = new Booking(bookingData)
      // Should throw validation error because end is before start
      await expect(booking.save()).rejects.toThrow('End time must be after start time')
    })

    it('should handle different time zones correctly', async () => {
      const start = new Date('2024-12-01T10:00:00.000Z')
      const end = new Date('2024-12-01T11:00:00.000Z')

      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        start,
        end,
      }

      const booking = new Booking(bookingData)
      const savedBooking = await booking.save()

      expect(savedBooking.start.toISOString()).toBe(start.toISOString())
      expect(savedBooking.end.toISOString()).toBe(end.toISOString())
    })
  })

  describe('Google Calendar Integration', () => {
    it('should allow storing Google Calendar event ID', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        start: new Date('2024-12-01T10:00:00.000Z'),
        end: new Date('2024-12-01T11:00:00.000Z'),
        googleEventId: 'google-event-123',
      }

      const booking = new Booking(bookingData)
      const savedBooking = await booking.save()

      expect(savedBooking.googleEventId).toBe('google-event-123')
    })

    it('should default Google Calendar event ID to undefined', async () => {
      const bookingData = {
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        start: new Date('2024-12-01T10:00:00.000Z'),
        end: new Date('2024-12-01T11:00:00.000Z'),
      }

      const booking = new Booking(bookingData)
      const savedBooking = await booking.save()

      expect(savedBooking.googleEventId).toBeUndefined()
    })
  })

  describe('Model Relations and Population', () => {
    it('should populate client information', async () => {
      const booking = await Booking.create({
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        start: new Date('2024-12-01T10:00:00.000Z'),
        end: new Date('2024-12-01T11:00:00.000Z'),
      })

      const populatedBooking = await Booking.findById(booking._id).populate('clientId')
      expect(populatedBooking?.clientId).toBeDefined()
      expect((populatedBooking?.clientId as any).email).toBe('client@example.com')
    })

    it('should populate service information', async () => {
      const booking = await Booking.create({
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        start: new Date('2024-12-01T10:00:00.000Z'),
        end: new Date('2024-12-01T11:00:00.000Z'),
      })

      const populatedBooking = await Booking.findById(booking._id).populate('serviceId')
      expect(populatedBooking?.serviceId).toBeDefined()
      expect((populatedBooking?.serviceId as any).name).toBe('Test Service')
    })

    it('should populate multiple relations', async () => {
      const booking = await Booking.create({
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        start: new Date('2024-12-01T10:00:00.000Z'),
        end: new Date('2024-12-01T11:00:00.000Z'),
      })

      const populatedBooking = await Booking.findById(booking._id)
        .populate('clientId')
        .populate('serviceId')
        .populate('providerId')

      expect(populatedBooking?.clientId).toBeDefined()
      expect(populatedBooking?.serviceId).toBeDefined()
      expect(populatedBooking?.providerId).toBeDefined()
    })
  })

  describe('Queries and Filtering', () => {
    it('should find bookings by client', async () => {
      await Booking.create({
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        start: new Date('2024-12-01T10:00:00.000Z'),
        end: new Date('2024-12-01T11:00:00.000Z'),
      })

      const bookings = await Booking.find({ clientId: testClient._id })
      expect(bookings).toHaveLength(1)
      expect(bookings[0].clientId.toString()).toBe(testClient._id.toString())
    })

    it('should find bookings by status', async () => {
      await Booking.create({
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        start: new Date('2024-12-01T10:00:00.000Z'),
        end: new Date('2024-12-01T11:00:00.000Z'),
        status: 'pending',
      })

      const bookings = await Booking.find({ status: 'pending' })
      expect(bookings).toHaveLength(1)
      expect(bookings[0].status).toBe('pending')
    })

    it('should find bookings by date range', async () => {
      const targetDate = new Date('2024-12-01T10:00:00.000Z')
      
      await Booking.create({
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        start: targetDate,
        end: new Date('2024-12-01T11:00:00.000Z'),
      })

      const startRange = new Date('2024-12-01T00:00:00.000Z')
      const endRange = new Date('2024-12-02T00:00:00.000Z')

      const bookings = await Booking.find({
        start: {
          $gte: startRange,
          $lt: endRange
        }
      })

      expect(bookings).toHaveLength(1)
      expect(bookings[0].start.getTime()).toBe(targetDate.getTime())
    })
  })

  describe('Timestamps and Updates', () => {
    it('should update updatedAt timestamp on modification', async () => {
      const booking = await Booking.create({
        clientId: testClient._id,
        providerId: testProviderProfile._id,
        serviceId: testService._id,
        start: new Date('2024-12-01T10:00:00.000Z'),
        end: new Date('2024-12-01T11:00:00.000Z'),
      })

      const originalUpdatedAt = booking.updatedAt

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))

      booking.status = 'cancelled'
      const updatedBooking = await booking.save()

      expect(updatedBooking.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })
  })
})