import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ProviderProfile from '@/models/ProviderProfile';
import Service from '@/models/Service';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    // Get provider profile - only if active
    const provider = await ProviderProfile.findOne({ _id: id, isActive: true })
      .populate('userId', 'name email');
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found or inactive' },
        { status: 404 }
      );
    }
    
    // Get provider's active services only
    const services = await Service.find({ providerId: id, isActive: true })
      .select('name description price durationMinutes')
      .sort({ name: 1 });
    
    // Format provider data
    const providerData = {
      _id: provider._id.toString(),
      businessName: provider.businessName || 'Service Provider',
      description: provider.description,
      location: provider.location || 'Location not specified',
      category: provider.category || 'General Services',
      rating: provider.rating || 5.0,
      totalReviews: provider.totalReviews || 0,
      phone: provider.phone,
      email: provider.userId?.email,
      services: services.map(service => ({
        _id: service._id.toString(),
        name: service.name,
        description: service.description,
        price: service.price,
        durationMinutes: service.durationMinutes
      })),
      availability: [] // TODO: Add availability logic later
    };
    
    return NextResponse.json({
      provider: providerData
    });
    
  } catch (error) {
    console.error('Error fetching provider details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider details' },
      { status: 500 }
    );
  }
}