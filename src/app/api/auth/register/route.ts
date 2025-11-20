import { NextRequest, NextResponse } from 'next/server'
import User from '@/models/User'
import connectDB from '@/lib/mongodb'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { emailService } from '@/services/emailService'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  roles: z.array(z.enum(['client', 'provider'])).default(['client'])
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = registerSchema.parse(body)
    
    await connectDB()
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }
    
    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex')
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    console.log('📧 Generated verification token for:', validatedData.email)
    
    // Create user without password (will be set during verification)
    const user = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      roles: validatedData.roles,
      emailVerified: false,
      verificationToken,
      verificationTokenExpires,
    })
    
    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(
      validatedData.email,
      validatedData.name,
      verificationToken
    )
    
    if (!emailSent) {
      // If email fails, delete the user and return error
      await User.findByIdAndDelete(user._id)
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }
    
    console.log('✅ User registered and verification email sent:', validatedData.email)
    
    return NextResponse.json({
      message: 'Registration successful! Please check your email to verify your account and set your password.',
      email: validatedData.email,
    }, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}