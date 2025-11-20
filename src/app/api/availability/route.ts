/**
 * @swagger
 * /api/availability:
 *   get:
 *     tags:
 *       - Availability
 *     summary: Dohvata podešavanja dostupnosti providera
 *     description: Vraća kompletan raspored rada i podešavanja dostupnosti trenutno ulogovanog providera
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Podešavanja dostupnosti uspešno dohvaćena
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 availability:
 *                   type: object
 *                   description: Kompletan raspored rada po danima
 *       401:
 *         description: Neautorizovani pristup
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Provider profil nije pronađen
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
 *   put:
 *     tags:
 *       - Availability
 *     summary: Ažurira podešavanja dostupnosti
 *     description: Ažurira raspored rada i podešavanja dostupnosti za trenutno ulogovanog providera
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               weekSchedule:
 *                 type: object
 *                 description: Raspored rada po danima u nedelji
 *               timezone:
 *                 type: string
 *                 description: Vremenska zona
 *                 example: "Europe/Belgrade"
 *               bufferTime:
 *                 type: number
 *                 description: Vreme između termina u minutima
 *                 example: 15
 *     responses:
 *       200:
 *         description: Podešavanja uspešno ažurirana
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Availability updated successfully"
 *       400:
 *         description: Neispravni podaci
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
 *       500:
 *         description: Server greška
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ProviderProfile from '@/models/ProviderProfile'
import connectDB from '@/lib/mongodb'
import { z } from 'zod'
import mongoose from 'mongoose'

const timeSlotSchema = z.object({
  start: z.string(),
  end: z.string()
})

const dayScheduleSchema = z.object({
  isEnabled: z.boolean(),
  workingHours: timeSlotSchema,
  breaks: z.array(timeSlotSchema)
})

const weekScheduleSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema
})

const availabilitySchema = z.object({
  weekSchedule: weekScheduleSchema,
  bufferTime: z.number().min(0).max(120),
  advanceBookingDays: z.number().min(1).max(365),
  minimumNoticeHours: z.number().min(0).max(168),
  timezone: z.string()
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (!session.user.roles?.includes('provider')) {
      return NextResponse.json({ 
        error: 'Provider role required',
        message: 'You need provider privileges to access availability settings. Please upgrade your account to provider status.'
      }, { status: 403 })
    }

    await connectDB()
    
    // Get provider profile
    const providerProfile = await ProviderProfile.findOne({ userId: session.user.id })
    if (!providerProfile) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
    }

    // Return availability settings (default if not set)
    const availability = providerProfile.availabilitySettings || {
      weekSchedule: {
        monday: { isEnabled: true, workingHours: { start: '09:00', end: '17:00' }, breaks: [] },
        tuesday: { isEnabled: true, workingHours: { start: '09:00', end: '17:00' }, breaks: [] },
        wednesday: { isEnabled: true, workingHours: { start: '09:00', end: '17:00' }, breaks: [] },
        thursday: { isEnabled: true, workingHours: { start: '09:00', end: '17:00' }, breaks: [] },
        friday: { isEnabled: true, workingHours: { start: '09:00', end: '17:00' }, breaks: [] },
        saturday: { isEnabled: false, workingHours: { start: '09:00', end: '17:00' }, breaks: [] },
        sunday: { isEnabled: false, workingHours: { start: '09:00', end: '17:00' }, breaks: [] }
      },
      bufferTime: 15,
      advanceBookingDays: 30,
      minimumNoticeHours: 2,
      timezone: 'Europe/Belgrade'
    }
    
    return NextResponse.json({ availability })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (!session.user.roles?.includes('provider')) {
      return NextResponse.json({ 
        error: 'Provider role required',
        message: 'You need provider privileges to save availability settings. Please upgrade your account to provider status.'
      }, { status: 403 })
    }

    const body = await req.json()
    console.log('🔧 Saving availability settings:', JSON.stringify(body, null, 2))
    
    const validatedData = availabilitySchema.parse(body)
    
    await connectDB()
    
    // Get provider profile
    let providerProfile = await ProviderProfile.findOne({ userId: session.user.id })
    
    // Auto-create provider profile if it doesn't exist
    if (!providerProfile) {
      const User = (await import('@/models/User')).default
      const user = await User.findById(session.user.id)
      
      providerProfile = await ProviderProfile.create({
        userId: session.user.id,
        businessName: user?.name || 'My Business',
        description: 'Professional services provider',
        contactInfo: {
          email: user?.email || session.user.email,
          phone: '',
          address: ''
        },
        timezone: validatedData.timezone,
        isActive: true,
        availabilitySettings: validatedData
      })
      
      console.log('✅ New provider profile created successfully')
      console.log('🔍 Created profile availability settings:', JSON.stringify(providerProfile.availabilitySettings, null, 2))
    } else {
      // Update existing provider profile
      console.log('💾 Updating existing provider profile with availability settings')
      
      // Use findOneAndUpdate instead of save() to avoid Mixed type issues
      const updatedProfile = await ProviderProfile.findOneAndUpdate(
        { userId: session.user.id },
        {
          $set: {
            availabilitySettings: validatedData,
            timezone: validatedData.timezone
          }
        },
        { 
          new: true, 
          runValidators: true 
        }
      )
      
      if (!updatedProfile) {
        throw new Error('Failed to update provider profile')
      }
      
      console.log('✅ Provider profile updated successfully using findOneAndUpdate')
      
      // Verify save worked - fetch fresh from DB
      const verification = await ProviderProfile.findOne({ userId: session.user.id }).lean() as any
      console.log('🔍 Verification - availability settings exists:', !!verification?.availabilitySettings)
      console.log('🔍 Saved settings:', JSON.stringify(verification?.availabilitySettings, null, 2))
    }
    
    console.log('📤 Returning success response')
    return NextResponse.json({ 
      message: 'Availability settings saved successfully',
      availability: validatedData 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error saving availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}