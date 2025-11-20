import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ProviderProfile from '@/models/ProviderProfile'
import connectDB from '@/lib/mongodb'
import { z } from 'zod'

const providerProfileSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  description: z.string().optional(),
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
  }).optional(),
  timezone: z.string().default('Europe/Belgrade'),
})

/**
 * @swagger
 * /api/providers:
 *   get:
 *     tags:
 *       - Providers
 *     summary: Lista aktivnih providera
 *     description: Vraća listu svih aktivnih providera ili specifičan profil po userId
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: ID korisnika za dohvatanje specifičnog profila
 *     responses:
 *       200:
 *         description: Lista providera uspešno dohvaćena
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/ProviderProfile'
 *                 - type: object
 *                   properties:
 *                     providers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProviderProfile'
 *       500:
 *         description: Server greška
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (userId) {
      const profile = await ProviderProfile.findOne({ userId }).populate('userId', 'name email')
      return NextResponse.json({ profile })
    }
    
    // Get all active providers for public listing
    const providers = await ProviderProfile.find({ isActive: true })
      .populate('userId', 'name email')
      .select('userId businessName description contactInfo timezone createdAt')
      .lean()
      .limit(100) // Ograniči broj rezultata
    
    const response = NextResponse.json({ providers })
    // Cache providers lista duže jer se ređe menja
    response.headers.set('Cache-Control', 'max-age=300, stale-while-revalidate=60')
    return response
  } catch (error) {
    console.error('Error fetching providers:', error)
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
    const validatedData = providerProfileSchema.parse(body)
    
    await connectDB()
    
    // Check if profile already exists
    const existingProfile = await ProviderProfile.findOne({ userId: session.user.id })
    if (existingProfile) {
      return NextResponse.json(
        { error: 'Provider profile already exists' },
        { status: 400 }
      )
    }
    
    const profile = await ProviderProfile.create({
      userId: session.user.id,
      ...validatedData,
    })
    
    await profile.populate('userId', 'name email')
    
    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error creating provider profile:', error)
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
    const validatedData = providerProfileSchema.parse(body)
    
    await connectDB()
    
    const profile = await ProviderProfile.findOneAndUpdate(
      { userId: session.user.id },
      validatedData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email')
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    
    return NextResponse.json({ profile })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating provider profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}