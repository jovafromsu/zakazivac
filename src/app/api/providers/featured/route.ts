import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ProviderProfile from '@/models/ProviderProfile';
import Service from '@/models/Service';
import User from '@/models/User';

/**
 * @swagger
 * /api/providers/featured:
 *   get:
 *     tags:
 *       - Providers
 *     summary: Istaknuti provideri
 *     description: Vraća listu istaknutih providera sortiranih po rejtingu (maksimalno 6)
 *     responses:
 *       200:
 *         description: Lista istaknutih providera uspešno dohvaćena
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 providers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       businessName:
 *                         type: string
 *                       description:
 *                         type: string
 *                       contactInfo:
 *                         type: object
 *                       services:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             price:
 *                               type: number
 *                             duration:
 *                               type: number
 *       500:
 *         description: Server greška
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get featured providers (you can add a featured field later, for now get top rated)
    const providers = await ProviderProfile.find({ isActive: true })
      .sort({ rating: -1 }) // Sort by highest rating
      .limit(6);
    
    // Get services for each provider
    const providersWithServices = await Promise.all(
      providers.map(async (provider) => {
        const services = await Service.find({ providerId: provider._id })
          .select('name price duration')
          .limit(3);
        
        return {
          _id: provider._id.toString(),
          businessName: provider.businessName || 'Service Provider',
          description: provider.description,
          location: provider.location || 'Location not specified',
          category: provider.category || 'General Services',
          rating: provider.rating || 5.0,
          totalReviews: provider.totalReviews || 0,
          services: services.map(service => ({
            name: service.name,
            price: service.price,
            duration: service.duration
          }))
        };
      })
    );
    
    return NextResponse.json({
      providers: providersWithServices,
      total: providersWithServices.length
    });
    
  } catch (error) {
    console.error('Error fetching featured providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured providers' },
      { status: 500 }
    );
  }
}