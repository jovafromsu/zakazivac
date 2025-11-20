import { 
  startOfDay, 
  endOfDay, 
  addMinutes, 
  isAfter, 
  isBefore, 
  format, 
  parse,
  isWithinInterval,
  isSameDay 
} from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import ProviderProfile from '@/models/ProviderProfile'
import Booking from '@/models/Booking'
import Service from '@/models/Service'
import connectDB from '@/lib/mongodb'

export interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
}

export interface BusyInterval {
  start: Date
  end: Date
  title?: string
}

/**
 * Get busy intervals for a provider on a specific date
 * This includes existing bookings and Google Calendar events
 */
export async function getBusyIntervalsForProviderOnDate(
  providerId: string, 
  date: Date,
  timezone: string = 'Europe/Belgrade'
): Promise<BusyInterval[]> {
  await connectDB()
  
  const busyIntervals: BusyInterval[] = []
  
  try {
    // Get existing bookings for this date
    const startOfTargetDay = startOfDay(date)
    const endOfTargetDay = endOfDay(date)
    
    const existingBookings = await Booking.find({
      providerId,
      start: {
        $gte: startOfTargetDay,
        $lte: endOfTargetDay
      },
      status: { $in: ['confirmed', 'pending'] }
    }).populate('serviceId')
    
    // Add booking intervals
    for (const booking of existingBookings) {
      const service = booking.serviceId as any
      if (service?.duration) {
        const bookingStart = new Date(booking.start)
        const bookingEnd = addMinutes(bookingStart, service.duration)
        
        busyIntervals.push({
          start: bookingStart,
          end: bookingEnd,
          title: `Booking: ${service.name}`
        })
      }
    }
    
    console.log(`Found ${busyIntervals.length} busy intervals for provider ${providerId} on ${format(date, 'yyyy-MM-dd')}`)
    
  } catch (error) {
    console.error('Error getting busy intervals:', error)
  }
  
  return busyIntervals
}

/**
 * Generate available time slots for a provider on a specific date
 */
export async function generateAvailableSlots(
  providerId: string,
  serviceId: string,
  date: Date,
  timezone: string = 'Europe/Belgrade'
): Promise<TimeSlot[]> {
  await connectDB()
  
  try {
    console.log(`🔍 Generating slots for provider ${providerId}, service ${serviceId}, date ${format(date, 'yyyy-MM-dd')}`)
    
    // Get provider profile with availability settings
    const providerProfile = await ProviderProfile.findOne({ userId: providerId })
    if (!providerProfile || !providerProfile.availabilitySettings) {
      console.log('❌ No provider profile or availability settings found')
      return []
    }
    
    // Get service details
    const service = await Service.findById(serviceId)
    if (!service) {
      console.log('❌ Service not found')
      return []
    }
    
    const { availabilitySettings } = providerProfile
    const dayOfWeek = format(date, 'EEEE').toLowerCase() // monday, tuesday, etc.
    
    // Check if provider works on this day
    if (!availabilitySettings[dayOfWeek]?.enabled) {
      console.log(`❌ Provider doesn't work on ${dayOfWeek}`)
      return []
    }
    
    const daySettings = availabilitySettings[dayOfWeek]
    const bufferTime = availabilitySettings.bufferTime || 15
    const serviceDuration = service.duration
    
    // Get busy intervals (existing bookings)
    const busyIntervals = await getBusyIntervalsForProviderOnDate(providerId, date, timezone)
    
    // Generate time slots
    const slots: TimeSlot[] = []
    
    // Parse working hours
    const workStart = parse(daySettings.startTime, 'HH:mm', date)
    const workEnd = parse(daySettings.endTime, 'HH:mm', date)
    
    let currentTime = workStart
    
    while (isBefore(currentTime, workEnd)) {
      const slotEnd = addMinutes(currentTime, serviceDuration)
      
      // Check if slot end time is within working hours
      if (isAfter(slotEnd, workEnd)) {
        break
      }
      
      // Check if slot conflicts with breaks
      let conflictsWithBreak = false
      if (daySettings.breaks) {
        for (const breakPeriod of daySettings.breaks) {
          const breakStart = parse(breakPeriod.startTime, 'HH:mm', date)
          const breakEnd = parse(breakPeriod.endTime, 'HH:mm', date)
          
          // Check if slot overlaps with break
          if (
            (isWithinInterval(currentTime, { start: breakStart, end: breakEnd }) ||
             isWithinInterval(slotEnd, { start: breakStart, end: breakEnd }) ||
             (isBefore(currentTime, breakStart) && isAfter(slotEnd, breakEnd)))
          ) {
            conflictsWithBreak = true
            break
          }
        }
      }
      
      if (conflictsWithBreak) {
        currentTime = addMinutes(currentTime, 15) // Move to next 15-minute slot
        continue
      }
      
      // Check if slot conflicts with busy intervals
      let conflictsWithBooking = false
      for (const busyInterval of busyIntervals) {
        if (
          (isWithinInterval(currentTime, { start: busyInterval.start, end: busyInterval.end }) ||
           isWithinInterval(slotEnd, { start: busyInterval.start, end: busyInterval.end }) ||
           (isBefore(currentTime, busyInterval.start) && isAfter(slotEnd, busyInterval.end)))
        ) {
          conflictsWithBooking = true
          break
        }
      }
      
      // Check if slot is in the past
      const now = new Date()
      const isPast = isBefore(currentTime, now)
      
      const available = !conflictsWithBooking && !isPast
      
      slots.push({
        startTime: format(currentTime, 'HH:mm'),
        endTime: format(slotEnd, 'HH:mm'),
        available
      })
      
      // Move to next slot (add buffer time)
      currentTime = addMinutes(currentTime, serviceDuration + bufferTime)
    }
    
    console.log(`✅ Generated ${slots.length} slots (${slots.filter(s => s.available).length} available)`)
    
    return slots
    
  } catch (error) {
    console.error('Error generating available slots:', error)
    return []
  }
}