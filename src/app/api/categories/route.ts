import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Lista aktivnih kategorija
 *     description: Vraća sve aktivne kategorije dostupne za selekciju
 *     responses:
 *       200:
 *         description: Lista kategorija uspešno dohvaćena
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Server greška
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET() {
  try {
    await connectDB()
    
    const categories = await Category.find({ isActive: true })
      .select('name slug description color icon sortOrder')
      .sort({ sortOrder: 1, name: 1 })
    
    const response = NextResponse.json({ categories })
    
    // Add cache headers (5 minutes)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    
    return response
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}