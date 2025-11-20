import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Service from '@/models/Service'
import ProviderProfile from '@/models/ProviderProfile'
import connectDB from '@/lib/mongodb'
import { z } from 'zod'

const serviceSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  durationMinutes: z.number().min(15).max(480),
  price: z.number().min(0),
  isActive: z.boolean().default(true),
})

/**
 * @swagger
 * /api/services:
 *   get:
 *     tags:
 *       - Services
 *     summary: Lista usluga providera
 *     description: Vraća sve usluge trenutno ulogovanog providera
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista usluga uspešno dohvaćena
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 services:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 *       401:
 *         description: Neautorizovani pristup - samo provideri
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
    console.log('Services API session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      roles: session?.user?.roles,
      isProvider: session?.user?.roles?.includes('provider')
    })
    
    if (!session?.user || !session.user.roles?.includes('provider')) {
      console.log('Unauthorized access to services API')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    // Get provider profile for current user
    let providerProfile = await ProviderProfile.findOne({ userId: session.user.id })
    console.log('Provider profile lookup:', {
      userId: session.user.id,
      foundProfile: !!providerProfile,
      profileId: providerProfile?._id
    })
    
    // Auto-create provider profile if it doesn't exist
    if (!providerProfile) {
      console.log('No provider profile found, creating one for userId:', session.user.id)
      try {
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
          timezone: 'Europe/Belgrade',
          isActive: true
        })
        
        console.log('Created provider profile:', providerProfile._id)
      } catch (createError) {
        console.error('Error creating provider profile:', createError)
        return NextResponse.json({ error: 'Could not create provider profile' }, { status: 500 })
      }
    }
    
    const services = await Service.find({ providerId: providerProfile._id, isActive: true })
      .populate('categoryId', 'name slug color icon')
      .select('-__v')
      .sort({ name: 1 })
    
    return NextResponse.json({ services })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !session.user.roles?.includes('provider')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const validatedData = serviceSchema.parse(body)
    
    await connectDB()
    
    // Get provider profile
    let providerProfile = await ProviderProfile.findOne({ userId: session.user.id })
    
    // Auto-create provider profile if it doesn't exist
    if (!providerProfile) {
      try {
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
          timezone: 'Europe/Belgrade',
          isActive: true
        })
      } catch (createError) {
        console.error('Error creating provider profile:', createError)
        return NextResponse.json({ error: 'Could not create provider profile' }, { status: 500 })
      }
    }
    
    const service = await Service.create({
      providerId: providerProfile._id,
      ...validatedData,
    })
    
    return NextResponse.json({ service }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error creating service:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !session.user.roles?.includes('provider')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const { serviceId, ...updateData } = body
    const validatedData = serviceSchema.parse(updateData)
    
    await connectDB()
    
    // Get provider profile to verify ownership
    const providerProfile = await ProviderProfile.findOne({ userId: session.user.id })
    if (!providerProfile) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
    }
    
    const service = await Service.findOneAndUpdate(
      { _id: serviceId, providerId: providerProfile._id },
      validatedData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name slug color icon')
    
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }
    
    return NextResponse.json({ service })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating service:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !session.user.roles?.includes('provider')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const serviceId = searchParams.get('serviceId')
    
    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 })
    }
    
    await connectDB()
    
    // Get provider profile to verify ownership
    const providerProfile = await ProviderProfile.findOne({ userId: session.user.id })
    if (!providerProfile) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
    }
    
    // Delete the service (or set isActive to false for soft delete)
    const service = await Service.findOneAndDelete({
      _id: serviceId, 
      providerId: providerProfile._id 
    })
    
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Service deleted successfully' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}