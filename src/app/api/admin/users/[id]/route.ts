import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import User from '@/models/User'
import ProviderProfile from '@/models/ProviderProfile'
import Booking from '@/models/Booking'
import Service from '@/models/Service'
import connectDB from '@/lib/mongodb'
import { requireAdminAuth } from '@/lib/adminAuth'

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  roles: z.array(z.enum(['client', 'provider', 'admin'])).optional(),
  emailVerified: z.boolean().optional(),
})

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     tags: [Admin - Users]
 *     summary: Get user details by ID (admin only)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminAuth(request)
    await connectDB()
    
    const resolvedParams = await params
    const user = await User.findById(resolvedParams.id)
      .select('-password -verificationToken -verificationTokenExpires')
      .lean() as any
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Add provider profile if applicable
    let userData: any = { ...user }
    if (user.roles && user.roles.includes('provider')) {
      const providerProfile = await ProviderProfile.findOne({ userId: user._id }).lean()
      userData.providerProfile = providerProfile
    }
    
    console.log('✅ User details fetched:', { userId: resolvedParams.id, adminId: admin.id })
    
    return NextResponse.json({ user: userData })
    
  } catch (error: any) {
    console.error('❌ Error fetching user details:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     tags: [Admin - Users]
 *     summary: Update user details (admin only)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminAuth(request)
    await connectDB()
    
    const resolvedParams = await params
    console.log('🔄 Admin updating user:', { userId: resolvedParams.id, adminId: admin.id })
    
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)
    
    console.log('📝 Update data:', validatedData)
    
    // Check if user exists
    const user = await User.findById(resolvedParams.id)
    if (!user) {
      console.log('❌ User not found:', resolvedParams.id)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Prevent admin from removing their own admin role
    if (resolvedParams.id === admin.id && validatedData.roles && !validatedData.roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Cannot remove your own admin role' },
        { status: 400 }
      )
    }
    
    // Check if email already exists (if changing email)
    if (validatedData.email && validatedData.email !== user.email) {
      const existingUser = await User.findOne({ email: validatedData.email })
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }
    
    // Handle role changes
    const oldRoles = user.roles || []
    const newRoles = validatedData.roles || oldRoles
    
    console.log('👥 Role change:', { oldRoles, newRoles })
    
    // If adding provider role, create provider profile
    if (newRoles.includes('provider') && !oldRoles.includes('provider')) {
      const existingProvider = await ProviderProfile.findOne({ userId: user._id })
      if (!existingProvider) {
        console.log('🏢 Creating new provider profile for user:', user._id)
        await ProviderProfile.create({
          userId: user._id,
          businessName: user.name + "'s Business",
          description: 'New provider profile',
          category: [],
          contactInfo: {
            email: user.email,
            phone: '',
            address: '',
            website: ''
          },
          isActive: false,
          availabilitySettings: {
            workingDays: [1, 2, 3, 4, 5], // Monday to Friday
            workingHours: {
              start: '09:00',
              end: '17:00'
            },
            timeZone: 'Europe/Belgrade',
            slotDuration: 60,
            bufferTime: 15,
            advanceBookingDays: 30,
            minAdvanceHours: 2
          }
        })
      }
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      resolvedParams.id,
      validatedData,
      { new: true, runValidators: true }
    ).select('-password -verificationToken -verificationTokenExpires')
    
    console.log('✅ User updated successfully:', {
      userId: resolvedParams.id,
      adminId: admin.id,
      changes: validatedData,
      updatedRoles: updatedUser?.roles
    })
    
    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    })
    
  } catch (error: any) {
    console.error('❌ Error updating user:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     tags: [Admin - Users]
 *     summary: Delete user (admin only)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminAuth(request)
    await connectDB()
    
    const resolvedParams = await params
    console.log('🗑️ Admin deleting user:', { userId: resolvedParams.id, adminId: admin.id })
    
    // Check if user exists
    const user = await User.findById(resolvedParams.id)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Prevent admin from deleting themselves
    if (resolvedParams.id === admin.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }
    
    // Check for active bookings
    const activeBookings = await Booking.countDocuments({
      $or: [
        { userId: resolvedParams.id },
        { providerId: resolvedParams.id }
      ],
      status: { $in: ['confirmed', 'pending'] },
      selectedDate: { $gte: new Date() }
    })
    
    if (activeBookings > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete user with ${activeBookings} active booking(s). Please cancel or complete bookings first.` 
        },
        { status: 400 }
      )
    }
    
    // If user is a provider, clean up related data
    if (user.roles && user.roles.includes('provider')) {
      const providerProfile = await ProviderProfile.findOne({ userId: resolvedParams.id })
      if (providerProfile) {
        console.log('🧹 Cleaning up provider data for user:', resolvedParams.id)
        // Delete provider services
        await Service.deleteMany({ providerId: resolvedParams.id })
        
        // Delete provider profile
        await ProviderProfile.findByIdAndDelete(providerProfile._id)
      }
    }
    
    // Delete historical bookings (keep for audit purposes, just mark as deleted)
    await Booking.updateMany(
      { 
        $or: [
          { userId: resolvedParams.id },
          { providerId: resolvedParams.id }
        ]
      },
      { 
        $set: { 
          deletedAt: new Date(),
          deletedBy: admin.id
        }
      }
    )
    
    // Delete the user
    await User.findByIdAndDelete(resolvedParams.id)
    
    console.log('✅ User deleted successfully:', {
      userId: resolvedParams.id,
      adminId: admin.id,
      userEmail: user.email
    })
    
    return NextResponse.json({
      message: 'User deleted successfully'
    })
    
  } catch (error: any) {
    console.error('❌ Error deleting user:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}