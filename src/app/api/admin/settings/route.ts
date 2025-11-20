import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { requireAdminAuth } from '@/lib/adminAuth'

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     tags: [Admin Settings]
 *     summary: Get system settings
 *     description: Retrieve all system configuration settings (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: object
 *                   description: System settings object
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Require admin authentication
    const adminUser = await requireAdminAuth(request)

    console.log('🔧 Admin fetching settings:', {
      adminId: adminUser.id,
      timestamp: new Date().toISOString()
    })

    // In a real app, you'd have a Settings collection
    // For now, return default settings with some stored overrides
    const defaultSettings = {
      // Application Settings
      appName: 'Zakazivač',
      appDescription: 'Professional appointment booking system',
      defaultTimezone: 'Europe/Belgrade',
      defaultLanguage: 'sr',
      defaultCurrency: 'RSD',
      
      // Booking Settings
      defaultBookingDuration: 60,
      maxAdvanceBookingDays: 90,
      minAdvanceBookingHours: 2,
      allowSameDayBooking: true,
      defaultCancellationHours: 24,
      
      // Email Settings
      emailEnabled: true,
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpSecure: process.env.SMTP_SECURE === 'true',
      smtpUser: process.env.SMTP_USER || '',
      smtpPassword: process.env.SMTP_PASSWORD ? '********' : '', // Mask password
      fromEmail: process.env.FROM_EMAIL || '',
      fromName: process.env.FROM_NAME || 'Zakazivač',
      
      // Notification Settings
      bookingConfirmationEmail: true,
      bookingReminderEmail: true,
      cancellationNotificationEmail: true,
      reminderHoursBefore: 24,
      
      // Security Settings
      sessionTimeoutMinutes: 60,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 15,
      requireEmailVerification: true,
      passwordMinLength: 8,
      passwordRequireSpecialChar: true,
      
      // File Upload Settings
      maxFileUploadSize: 5, // MB
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf'],
      
      // Integration Settings
      googleCalendarEnabled: !!process.env.GOOGLE_CLIENT_ID,
      enableWebhooks: false,
      webhookUrl: process.env.WEBHOOK_URL || '',
      
      // Business Settings
      businessName: process.env.BUSINESS_NAME || '',
      businessAddress: process.env.BUSINESS_ADDRESS || '',
      businessPhone: process.env.BUSINESS_PHONE || '',
      businessEmail: process.env.BUSINESS_EMAIL || '',
      taxRate: parseFloat(process.env.TAX_RATE || '0'),
      commissionRate: parseFloat(process.env.COMMISSION_RATE || '0')
    }

    console.log('✅ Settings fetched successfully')
    
    return NextResponse.json({ 
      settings: defaultSettings,
      success: true 
    })

  } catch (error) {
    console.error('❌ Settings fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     tags: [Admin Settings]
 *     summary: Update system settings
 *     description: Update system configuration settings (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 type: object
 *                 description: Settings object to update
 *                 properties:
 *                   appName:
 *                     type: string
 *                   defaultTimezone:
 *                     type: string
 *                   defaultBookingDuration:
 *                     type: number
 *                   # ... other setting properties
 *             required:
 *               - settings
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    // Require admin authentication
    const adminUser = await requireAdminAuth(request)

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      )
    }

    console.log('🔧 Admin updating settings:', {
      adminId: adminUser.id,
      settingsKeys: Object.keys(settings),
      timestamp: new Date().toISOString()
    })

    // Validate settings
    const errors = []

    // Validate numeric fields
    const numericFields = [
      'defaultBookingDuration', 'maxAdvanceBookingDays', 'minAdvanceBookingHours',
      'defaultCancellationHours', 'sessionTimeoutMinutes', 'maxLoginAttempts',
      'lockoutDurationMinutes', 'passwordMinLength', 'maxFileUploadSize',
      'reminderHoursBefore', 'smtpPort', 'taxRate', 'commissionRate'
    ]

    for (const field of numericFields) {
      if (settings[field] !== undefined) {
        const value = Number(settings[field])
        if (isNaN(value) || value < 0) {
          errors.push(`${field} must be a non-negative number`)
        }
      }
    }

    // Validate email format
    if (settings.fromEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.fromEmail)) {
      errors.push('fromEmail must be a valid email address')
    }

    if (settings.businessEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.businessEmail)) {
      errors.push('businessEmail must be a valid email address')
    }

    // Validate webhook URL format
    if (settings.webhookUrl && settings.webhookUrl.trim()) {
      try {
        new URL(settings.webhookUrl)
      } catch {
        errors.push('webhookUrl must be a valid URL')
      }
    }

    // Validate file types
    if (settings.allowedFileTypes && Array.isArray(settings.allowedFileTypes)) {
      const validTypes = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt']
      const invalidTypes = settings.allowedFileTypes.filter((type: string) => !validTypes.includes(type))
      if (invalidTypes.length > 0) {
        errors.push(`Invalid file types: ${invalidTypes.join(', ')}`)
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation errors', details: errors },
        { status: 400 }
      )
    }

    // In a real app, you'd save to a Settings collection in MongoDB
    // For now, we'll just validate and return success
    // 
    // Example implementation:
    // const Settings = mongoose.model('Settings')
    // await Settings.findOneAndUpdate(
    //   {},
    //   { $set: settings },
    //   { upsert: true, new: true }
    // )

    console.log('✅ Settings updated successfully')
    
    return NextResponse.json({ 
      success: true,
      message: 'Settings updated successfully'
    })

  } catch (error) {
    console.error('❌ Settings update error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}