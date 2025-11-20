import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { requireAdminAuth } from '@/lib/adminAuth'
import mongoose from 'mongoose'

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     tags: [Admin Stats]
 *     summary: Get admin dashboard statistics
 *     description: Retrieve comprehensive system statistics for admin dashboard (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         clients:
 *                           type: number
 *                         providers:
 *                           type: number
 *                         admins:
 *                           type: number
 *                         verified:
 *                           type: number
 *                         unverified:
 *                           type: number
 *                     providers:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         active:
 *                           type: number
 *                         inactive:
 *                           type: number
 *                     categories:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         active:
 *                           type: number
 *                         inactive:
 *                           type: number
 *                     system:
 *                       type: object
 *                       properties:
 *                         uptime:
 *                           type: string
 *                         version:
 *                           type: string
 *                         environment:
 *                           type: string
 *                         databaseStatus:
 *                           type: string
 *                         lastBackup:
 *                           type: string
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

    console.log('📊 Admin fetching dashboard stats:', {
      adminId: adminUser.id,
      timestamp: new Date().toISOString()
    })

    // Get User model
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }))
    
    // Get ProviderProfile model  
    const ProviderProfile = mongoose.models.ProviderProfile || mongoose.model('ProviderProfile', new mongoose.Schema({}, { strict: false }))
    
    // Get Category model
    const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({}, { strict: false }))

    // Parallel queries for better performance
    const [
      totalUsers,
      usersByRole,
      verifiedUsers,
      totalProviders,
      activeProviders,
      totalCategories,
      activeCategories
    ] = await Promise.all([
      // Total users count
      User.countDocuments({}),
      
      // Users by role aggregation
      User.aggregate([
        {
          $group: {
            _id: null,
            clients: { $sum: { $cond: [{ $in: ['client', '$roles'] }, 1, 0] } },
            providers: { $sum: { $cond: [{ $in: ['provider', '$roles'] }, 1, 0] } },
            admins: { $sum: { $cond: [{ $in: ['admin', '$roles'] }, 1, 0] } }
          }
        }
      ]),
      
      // Verified users count
      User.countDocuments({ emailVerified: { $ne: null } }),
      
      // Total provider profiles
      ProviderProfile.countDocuments({}),
      
      // Active provider profiles
      ProviderProfile.countDocuments({ isActive: true }),
      
      // Total categories
      Category.countDocuments({}),
      
      // Active categories
      Category.countDocuments({ isActive: true })
    ])

    // Process role statistics
    const roleStats = usersByRole[0] || { clients: 0, providers: 0, admins: 0 }

    // Calculate system uptime (mock for now - in production would use process.uptime())
    const uptimeSeconds = process.uptime()
    const uptimeDays = Math.floor(uptimeSeconds / (24 * 3600))
    const uptimeHours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600)
    const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60)
    
    let uptimeString = ''
    if (uptimeDays > 0) {
      uptimeString += `${uptimeDays} day${uptimeDays > 1 ? 's' : ''}, `
    }
    if (uptimeHours > 0) {
      uptimeString += `${uptimeHours} hour${uptimeHours > 1 ? 's' : ''}`
    } else if (uptimeDays === 0) {
      uptimeString += `${uptimeMinutes} minute${uptimeMinutes > 1 ? 's' : ''}`
    }

    // Check database status
    const dbState = mongoose.connection.readyState
    const dbStatus = dbState === 1 ? 'Connected' : dbState === 2 ? 'Connecting' : 'Disconnected'

    const stats = {
      users: {
        total: totalUsers,
        clients: roleStats.clients,
        providers: roleStats.providers, 
        admins: roleStats.admins,
        verified: verifiedUsers,
        unverified: totalUsers - verifiedUsers
      },
      providers: {
        total: totalProviders,
        active: activeProviders,
        inactive: totalProviders - activeProviders
      },
      categories: {
        total: totalCategories,
        active: activeCategories,
        inactive: totalCategories - activeCategories
      },
      system: {
        uptime: uptimeString.trim() || 'Less than 1 minute',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        databaseStatus: dbStatus,
        lastBackup: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        })
      }
    }

    console.log('✅ Admin dashboard stats fetched successfully:', {
      totalUsers,
      totalProviders: activeProviders,
      totalCategories: activeCategories
    })
    
    return NextResponse.json({ 
      stats,
      success: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Admin stats fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}