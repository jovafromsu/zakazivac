import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Booking from '@/models/Booking'
import Service from '@/models/Service'
import ProviderProfile from '@/models/ProviderProfile'
import ProviderGoogleIntegration from '@/models/ProviderGoogleIntegration'
import User from '@/models/User'
import { getBusyIntervalsForProviderOnDate } from '@/services/calendar/slotGeneration'
import { createGoogleCalendarEvent, deleteGoogleCalendarEvent } from '@/services/calendar/googleCalendarService'
import connectDB from '@/lib/mongodb'
import { z } from 'zod'
import { addMinutes } from 'date-fns'

const bookingSchema = z.object({
  providerId: z.string(),
  serviceId: z.string(),
  start: z.string(), // ISO date string
  note: z.string().optional(),
})

/**
 * @swagger
 * /api/booking:
 *   get:
 *     tags:
 *       - Bookings
 *     summary: Lista rezervacija korisnika
 *     description: Vraća sve rezervacije trenutno ulogovanog korisnika
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista rezervacija uspešno dohvaćena
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Neautorizovani pristup
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Server greška
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    await connectDB()
    
    const { searchParams } = new URL(req.url)
    const isProvider = session.user.roles?.includes('provider')
    const isClient = session.user.roles?.includes('client')
    
    let query: any = {}
    
    if (isProvider && !isClient) {
      // Provider can see all their bookings
      const providerProfile = await ProviderProfile.findOne({ userId: session.user.id })
      if (!providerProfile) {
        return NextResponse.json({ bookings: [] })
      }
      query.providerId = providerProfile._id
    } else if (isClient) {
      // Client can see only their bookings
      query.clientId = session.user.id
    }
    
    const bookings = await Booking.find(query)
      .populate('serviceId', 'name duration price')
      .populate('providerId', 'businessName')
      .populate('clientId', 'name email')
      .select('_id serviceId providerId clientId start end status note syncStatus createdAt')
      .sort({ start: -1 })
      .lean()
      .limit(50) // Ograniči na poslednih 50 booking-a
    
    const response = NextResponse.json({ bookings })
    // Dodaj cache headers
    response.headers.set('Cache-Control', 'max-age=60, stale-while-revalidate=30')
    response.headers.set('CDN-Cache-Control', 'max-age=120')
    return response
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * @swagger
 * /api/booking:
 *   post:
 *     tags:
 *       - Bookings
 *     summary: Kreiranje nove rezervacije
 *     description: Kreira novu rezervaciju za ulogovanog klijenta
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - providerId
 *               - serviceId
 *               - start
 *             properties:
 *               providerId:
 *                 type: string
 *                 description: ID providera
 *                 example: "507f1f77bcf86cd799439011"
 *               serviceId:
 *                 type: string
 *                 description: ID usluge
 *                 example: "507f1f77bcf86cd799439012"
 *               start:
 *                 type: string
 *                 format: date-time
 *                 description: Početno vreme rezervacije (ISO string)
 *                 example: "2025-11-20T10:00:00.000Z"
 *               note:
 *                 type: string
 *                 description: Dodatne napomene za rezervaciju
 *                 example: "Molim vas da me kontaktirate unapred"
 *     responses:
 *       201:
 *         description: Rezervacija uspešno kreirana
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 booking:
 *                   $ref: '#/components/schemas/Booking'
 *                 message:
 *                   type: string
 *                   example: "Booking created successfully"
 *       400:
 *         description: Neispravni podaci ili slot nije dostupan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Neautorizovani pristup
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Provider ili servis nije pronađen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Server greška
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🎯 Booking API - POST request started')
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    console.log('📋 Booking request body:', JSON.stringify(body, null, 2))
    
    const validatedData = bookingSchema.parse(body)
    console.log('✅ Validation passed:', validatedData)
    
    await connectDB()
    
    // Get service to calculate end time
    const service = await Service.findById(validatedData.serviceId)
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }
    
    const start = new Date(validatedData.start)
    const end = addMinutes(start, service.durationMinutes)
    
    // Validate that the slot is still available
    const busyIntervals = await getBusyIntervalsForProviderOnDate(
      validatedData.providerId,
      start
    )
    
    const isSlotBusy = busyIntervals.some(interval =>
      (start < interval.end && end > interval.start)
    )
    
    if (isSlotBusy) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      )
    }
    
    // Create booking
    const booking = await Booking.create({
      providerId: validatedData.providerId,
      serviceId: validatedData.serviceId,
      clientId: session.user.id,
      start,
      end,
      note: validatedData.note,
      status: 'confirmed',
    })
    
    // Try to create Google Calendar event
    try {
      const googleIntegration = await ProviderGoogleIntegration.findOne({
        providerId: validatedData.providerId,
        isActive: true,
      })
      
      if (googleIntegration) {
        const client = await User.findById(session.user.id)
        const googleEventId = await createGoogleCalendarEvent(googleIntegration, {
          start,
          end,
          serviceName: service.name,
          clientName: client?.name || 'Unknown Client',
          clientEmail: client?.email || '',
          note: validatedData.note,
        })
        
        if (googleEventId) {
          booking.googleEventId = googleEventId
          booking.syncStatus = 'ok'
          await booking.save()
        } else {
          booking.syncStatus = 'failed'
          await booking.save()
        }
      }
    } catch (error) {
      console.error('Error creating Google Calendar event:', error)
      booking.syncStatus = 'failed'
      await booking.save()
    }
    
    await booking.populate([
      { path: 'serviceId', select: 'name durationMinutes price' },
      { path: 'providerId', select: 'businessName' },
      { path: 'clientId', select: 'name email' }
    ])
    
    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}