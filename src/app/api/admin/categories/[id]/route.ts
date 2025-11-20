import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Category from '@/models/Category'
import Service from '@/models/Service'
import connectDB from '@/lib/mongodb'
import { withAdminAuth, AdminUser } from '@/lib/adminAuth'

const updateCategorySchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

interface RouteParams {
  params: { id: string }
}

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   get:
 *     tags: [Admin - Categories]
 *     summary: Get category by ID (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
export const GET = withAdminAuth(async (request: NextRequest, admin: AdminUser) => {
  await connectDB()
  
  // Extract ID from URL
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  const id = pathSegments[pathSegments.length - 1]
  
  try {
    const category = await Category.findById(id)

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    console.log('📋 Admin fetched category:', { adminId: admin.id, categoryId: id })
    
    return NextResponse.json({ category })
    
  } catch (error) {
    console.error('❌ Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
})

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   put:
 *     tags: [Admin - Categories]
 *     summary: Update category (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *               color:
 *                 type: string
 *                 pattern: ^#[0-9A-F]{6}$
 *               isActive:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Validation error or duplicate name
 *       404:
 *         description: Category not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
export const PUT = withAdminAuth(async (request: NextRequest, admin: AdminUser) => {
  await connectDB()
  
  // Extract ID from URL
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  const id = pathSegments[pathSegments.length - 1]
  
  try {
    const body = await request.json()
    const validatedData = updateCategorySchema.parse(body)
    
    console.log('✏️ Admin updating category:', { 
      adminId: admin.id, 
      categoryId: id,
      updates: Object.keys(validatedData)
    })
    
    // Check if category exists
    const existingCategory = await Category.findById(id)
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    // Check for duplicate name if name is being updated
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicateCategory = await Category.findOne({ 
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${validatedData.name}$`, 'i') }
      })
      
      if (duplicateCategory) {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 400 }
        )
      }
    }
    
    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      validatedData,
      { new: true, runValidators: true }
    )
    
    console.log('✅ Category updated successfully:', id)
    
    return NextResponse.json({
      message: 'Category updated successfully',
      category: updatedCategory,
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('❌ Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
})

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   delete:
 *     tags: [Admin - Categories]
 *     summary: Delete category (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force delete even if category has services
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Category has associated services
 *       404:
 *         description: Category not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
export const DELETE = withAdminAuth(async (request: NextRequest, admin: AdminUser) => {
  await connectDB()
  
  // Extract ID from URL
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  const id = pathSegments[pathSegments.length - 1]
  const { searchParams } = new URL(request.url)
  const force = searchParams.get('force') === 'true'
  
  try {
    console.log('🗑️ Admin deleting category:', { 
      adminId: admin.id, 
      categoryId: id, 
      force 
    })
    
    // Check if category exists
    const category = await Category.findById(id)
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    // Check if category has associated services
    const serviceCount = await Service.countDocuments({ category: id })
    
    if (serviceCount > 0 && !force) {
      return NextResponse.json(
        { 
          error: 'Category has associated services', 
          serviceCount,
          suggestion: 'Use force=true to delete anyway or reassign services first'
        },
        { status: 400 }
      )
    }
    
    // If forcing delete, remove category from all services
    if (force && serviceCount > 0) {
      await Service.updateMany(
        { category: id },
        { $unset: { category: 1 } }
      )
      console.log(`🔄 Removed category from ${serviceCount} services`)
    }
    
    // Delete category
    await Category.findByIdAndDelete(id)
    
    console.log('✅ Category deleted successfully:', id)
    
    return NextResponse.json({
      message: 'Category deleted successfully',
      removedFromServices: force ? serviceCount : 0,
    })
    
  } catch (error) {
    console.error('❌ Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
})