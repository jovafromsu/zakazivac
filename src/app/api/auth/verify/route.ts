import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import User from '@/models/User'
import connectDB from '@/lib/mongodb'
import { z } from 'zod'

const verifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify email and set password
 *     description: Verifies user email using token and sets password for account activation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Email verification token
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Password to set for the account
 *     responses:
 *       200:
 *         description: Account verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     emailVerified:
 *                       type: boolean
 *       400:
 *         description: Invalid or expired token
 *       404:
 *         description: User not found
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = verifySchema.parse(body)
    
    await connectDB()
    
    console.log('🔍 Verifying token:', validatedData.token.substring(0, 8) + '...')
    
    // Find user by verification token
    const user = await User.findOne({
      verificationToken: validatedData.token,
      verificationTokenExpires: { $gt: new Date() }, // Token not expired
    })
    
    if (!user) {
      console.log('❌ Invalid or expired token')
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }
    
    console.log('✅ Valid token found for user:', user.email)
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    // Update user - verify email, set password, remove verification token
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          password: hashedPassword,
          emailVerified: true,
        },
        $unset: {
          verificationToken: 1,
          verificationTokenExpires: 1,
        }
      },
      { new: true }
    )
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to verify account' },
        { status: 500 }
      )
    }
    
    console.log('🎉 Account verified successfully for:', updatedUser.email)
    
    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser.toObject()
    
    return NextResponse.json({
      message: 'Account verified successfully! You can now sign in.',
      user: userWithoutPassword,
    }, { status: 200 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     tags: [Authentication]
 *     summary: Check verification token validity
 *     description: Checks if verification token is valid and returns user info
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification token to check
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Invalid or expired token
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }
    
    await connectDB()
    
    // Find user by verification token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    }).select('email name roles')
    
    if (!user) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      valid: true,
      user: {
        email: user.email,
        name: user.name,
      }
    }, { status: 200 })
    
  } catch (error) {
    console.error('Token check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}