import { NextRequest, NextResponse } from 'next/server'
import { format, addMinutes } from 'date-fns'
import connectDB from '@/lib/mongodb'
import ProviderProfile from '@/models/ProviderProfile'
import Booking from '@/models/Booking'
import Service from '@/models/Service'

interface TimeSlot {
  start: Date
  end: Date
}

/**
 * @swagger
 * /api/slots:
 *   get:
 *     tags:
 *       - Availability
 *     summary: Dostupni termini za rezervaciju
 *     description: Vraća listu dostupnih termina za specifičan provider, servis i datum
 *     parameters:
 *       - in: query
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID providera
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID usluge
 *         example: "507f1f77bcf86cd799439012"
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Datum za koji se traže termini (YYYY-MM-DD)
 *         example: "2025-11-20"
 *     responses:
 *       200:
 *         description: Lista dostupnih termina
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 slots:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TimeSlot'
 *       400:
 *         description: Nedostaju potrebni parametri
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
export async function GET(req: NextRequest) {
  console.log('🚀 Slots API handler started')
  
  try {
    const { searchParams } = new URL(req.url)
    const providerId = searchParams.get('providerId')
    const serviceId = searchParams.get('serviceId')
    const dateStr = searchParams.get('date')
    
    console.log('📝 Parameters:', { providerId, serviceId, dateStr })
    
    if (!providerId || !serviceId || !dateStr) {
      console.log('❌ Missing parameters')
      return NextResponse.json(
        { error: 'Missing required parameters: providerId, serviceId, date' },
        { status: 400 }
      )
    }
    
    const date = new Date(dateStr + 'T00:00:00.000Z')
    if (isNaN(date.getTime())) {
      console.log('❌ Invalid date')
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }
    
    await connectDB()
    console.log('✅ Connected to DB')
    
    // Get provider profile with availability settings
    const providerProfile = await ProviderProfile.findById(providerId)
    
    console.log('👤 Found provider profile:', !!providerProfile)
    console.log('⚙️ Has availability settings:', !!providerProfile?.availabilitySettings)
    console.log('🔍 Full provider profile:', JSON.stringify(providerProfile, null, 2))
    
    if (!providerProfile || !providerProfile.availabilitySettings) {
      console.log('❌ Provider or availability settings not found')
      return NextResponse.json({ slots: [] })
    }
    
    // Get day of week (0 = Sunday, 6 = Saturday) 
    const dayOfWeek = date.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    
    console.log('📅 Day of week:', dayOfWeek, '(' + dayName + ')')
    
    const daySchedule = providerProfile.availabilitySettings.weekSchedule[dayName]
    
    console.log('📋 Day schedule:', daySchedule)
    
    if (!daySchedule || !daySchedule.isEnabled) {
      console.log('❌ Provider not available on', dayName)
      return NextResponse.json({ slots: [] })
    }
    
    // Get service details
    const service = await Service.findById(serviceId)
    if (!service) {
      console.log('❌ Service not found')
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }
    
    console.log('🛠️ Service duration:', service.durationMinutes, 'minutes')
    
    // Get existing bookings for this day
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    const bookings = await Booking.find({
      providerId,
      start: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['confirmed', 'pending'] },
    }).select('start end')
    
    console.log('📅 Found', bookings.length, 'existing bookings')
    
    // Generate available slots
    const slots: TimeSlot[] = []
    const [startHour, startMinute] = daySchedule.workingHours.start.split(':').map(Number)
    const [endHour, endMinute] = daySchedule.workingHours.end.split(':').map(Number)
    
    const workStart = new Date(date)
    workStart.setHours(startHour, startMinute, 0, 0)
    const workEnd = new Date(date)
    workEnd.setHours(endHour, endMinute, 0, 0)
    
    console.log('⏰ Work hours:', workStart.toISOString(), 'to', workEnd.toISOString())
    
    let currentTime = new Date(workStart)
    const stepMinutes = 30 // Default step, can be made configurable
    
    while (currentTime < workEnd) {
      const slotStart = new Date(currentTime)
      const slotEnd = addMinutes(slotStart, service.durationMinutes)
      
      // Check if slot end is within working hours
      if (slotEnd <= workEnd) {
        // Check if slot overlaps with any existing booking
        const isAvailable = !bookings.some(booking => 
          (slotStart < booking.end && slotEnd > booking.start)
        )
        
        // Check if slot overlaps with any break
        const isInBreak = daySchedule.breaks?.some((breakTime: any) => {
          const [breakStartHour, breakStartMinute] = breakTime.start.split(':').map(Number)
          const [breakEndHour, breakEndMinute] = breakTime.end.split(':').map(Number)
          
          const breakStart = new Date(date)
          breakStart.setHours(breakStartHour, breakStartMinute, 0, 0)
          const breakEnd = new Date(date)
          breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0)
          
          return (slotStart < breakEnd && slotEnd > breakStart)
        })
        
        if (isAvailable && !isInBreak) {
          slots.push({
            start: slotStart,
            end: slotEnd,
          })
        }
      }
      
      // Move to next slot
      currentTime = addMinutes(currentTime, stepMinutes)
    }
    
    // Filter out past slots
    const now = new Date()
    const availableSlots = slots.filter(slot => slot.start > now)
    
    console.log('✅ Generated', availableSlots.length, 'available slots')
    
    // Format for response
    const formattedSlots = availableSlots.map(slot => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
      time: format(slot.start, 'HH:mm'),
      startTime: format(slot.start, 'HH:mm'),
      endTime: format(slot.end, 'HH:mm'),
      available: true
    }))
    
    return NextResponse.json({ slots: formattedSlots })
    
  } catch (error) {
    console.error('❌ Error in slots API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}