import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Category from '@/models/Category'
import connectDB from '@/lib/mongodb'
import { withAdminAuth } from '@/lib/adminAuth'

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
})

/**
 * @swagger
 * /api/admin/categories:
 *   get:
 *     tags: [Admin - Categories]
 *     summary: Get all categories (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive categories
 *       - in: query
 *         name: withServiceCount
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include service count for each category
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
export const GET = withAdminAuth(async (request: NextRequest, admin) => {
  await connectDB()
  
  const { searchParams } = new URL(request.url)
  const includeInactive = searchParams.get('includeInactive') === 'true'
  const withServiceCount = searchParams.get('withServiceCount') === 'true'
  
  console.log('🔍 Admin fetching categories:', { 
    adminId: admin.id, 
    includeInactive, 
    withServiceCount 
  })
  
  try {
    let query = Category.find()
    
    if (!includeInactive) {
      query = query.where({ isActive: true })
    }
    
    if (withServiceCount) {
      query = query.populate('serviceCount')
    }
    
    query = query
      .sort({ sortOrder: 1, name: 1 })
    
    const categories = await query.exec()
    
    console.log('✅ Categories fetched successfully:', categories.length)
    
    return NextResponse.json({
      categories,
      total: categories.length,
    })
    
  } catch (error) {
    console.error('❌ Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
})

/**
 * @swagger
 * /api/admin/categories:
 *   post:
 *     tags: [Admin - Categories]
 *     summary: Create new category (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               icon:
 *                 type: string
 *                 description: Lucide icon name
 *               color:
 *                 type: string
 *                 pattern: ^#[0-9A-F]{6}$
 *                 description: Hex color code
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               sortOrder:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error or duplicate category
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
export const POST = withAdminAuth(async (request: NextRequest, admin) => {
  await connectDB()
  
  try {
    const body = await request.json()
    const validatedData = categorySchema.parse(body)
    
    console.log('📝 Admin creating category:', { 
      adminId: admin.id, 
      categoryName: validatedData.name 
    })
    
    // Check for duplicate name/slug
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${validatedData.name}$`, 'i') }
    })
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      )
    }
    
    // Create category
    const category = await Category.create({
      ...validatedData,
      createdBy: admin.id,
    })
    
    console.log('✅ Category created successfully:', category._id)
    
    return NextResponse.json({
      message: 'Category created successfully',
      category,
    }, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('❌ Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
})