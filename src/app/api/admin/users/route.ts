import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import User from '@/models/User'
import ProviderProfile from '@/models/ProviderProfile'
import connectDB from '@/lib/mongodb'
import { withAdminAuth } from '@/lib/adminAuth'

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  roles: z.array(z.enum(['client', 'provider', 'admin'])).optional(),
  emailVerified: z.boolean().optional(),
})

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin - Users]
 *     summary: Get all users with filters (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [client, provider, admin]
 *         description: Filter by user role
 *       - in: query
 *         name: emailVerified
 *         schema:
 *           type: boolean
 *         description: Filter by email verification status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: List of users with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     current:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
export const GET = withAdminAuth(async (request: NextRequest, admin) => {
  await connectDB()
  
  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  const emailVerified = searchParams.get('emailVerified')
  const search = searchParams.get('search')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit
  
  console.log('👥 Admin fetching users:', {
    adminId: admin.id,
    filters: { role, emailVerified, search, page, limit }
  })
  
  try {
    // Build query
    const query: any = {}
    
    if (role) {
      query.roles = { $in: [role] }
    }
    
    if (emailVerified !== null) {
      query.emailVerified = emailVerified === 'true'
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Get total count for pagination
    const total = await User.countDocuments(query)
    
    // Fetch users
    const users = await User.find(query)
      .select('-password -verificationToken -verificationTokenExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    // Add provider profile info for providers
    const usersWithProviderInfo = await Promise.all(
      users.map(async (user) => {
        if (user.roles.includes('provider')) {
          const providerProfile = await ProviderProfile.findOne({ userId: user._id })
            .select('businessName isActive')
            .lean()
          return {
            ...user,
            providerProfile
          }
        }
        return user
      })
    )
    
    const pagination = {
      total,
      pages: Math.ceil(total / limit),
      current: page,
      limit
    }
    
    console.log('✅ Users fetched successfully:', {
      count: users.length,
      total,
      page
    })
    
    const response = NextResponse.json({
      users: usersWithProviderInfo,
      pagination
    })
    
    // Cache for 30 seconds (shorter than categories due to frequent updates)
    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=30')
    
    return response
    
  } catch (error) {
    console.error('❌ Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
})