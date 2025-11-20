import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ProviderProfile from '@/models/ProviderProfile';
import Service from '@/models/Service';
import User from '@/models/User';
import Category from '@/models/Category';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'rating';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    // Build search filter - only show active providers
    const filter: any = { isActive: true };
    
    if (query) {
      filter.$or = [
        { businessName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    
    // Handle category filtering through services
    let categoryFilter = {};
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category, isActive: true });
      if (categoryDoc) {
        categoryFilter = { categoryId: categoryDoc._id };
      }
    }
    
    // Build sort object
    let sortObj: any = {};
    switch (sort) {
      case 'rating':
        sortObj = { rating: -1 };
        break;
      case 'reviews':
        sortObj = { totalReviews: -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'price_low':
      case 'price_high':
        sortObj = { businessName: 1 }; // Will sort by service prices later
        break;
      default:
        sortObj = { rating: -1 };
    }
    
    // If category filtering, first find providers who have services in that category
    let providerIds: any = {};
    if (category && Object.keys(categoryFilter).length > 0) {
      const servicesInCategory = await Service.find({
        ...categoryFilter,
        isActive: true
      }).distinct('providerId');
      
      filter._id = { $in: servicesInCategory };
    }
    
    // Get providers with pagination
    const skip = (page - 1) * limit;
    const providers = await ProviderProfile.find(filter)
      .populate('userId', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);
    
    const total = await ProviderProfile.countDocuments(filter);
    
    // Get services for each provider and format response
    const providersWithServices = await Promise.all(
      providers.map(async (provider) => {
        // Get services with category filtering if needed
        const serviceFilter: any = { providerId: provider._id, isActive: true };
        if (Object.keys(categoryFilter).length > 0) {
          Object.assign(serviceFilter, categoryFilter);
        }
        
        const services = await Service.find(serviceFilter)
          .populate('categoryId', 'name slug color icon')
          .select('name price durationMinutes categoryId')
          .sort({ price: sort === 'price_high' ? -1 : 1 })
          .limit(5);
        
        // Determine primary category from services
        const categories = services
          .filter(s => s.categoryId)
          .map(s => s.categoryId);
        const primaryCategory = categories[0] || null;
        
        return {
          _id: provider._id.toString(),
          businessName: provider.businessName || 'Service Provider',
          description: provider.description,
          location: provider.contactInfo?.address || 'Location not specified',
          category: primaryCategory?.name || 'General Services',
          rating: 4.8, // TODO: Implement real ratings
          totalReviews: 12, // TODO: Implement real reviews
          services: services.map(service => ({
            name: service.name,
            price: service.price,
            duration: service.durationMinutes
          }))
        };
      })
    );
    
    // If sorting by price, sort the results by minimum service price
    if (sort === 'price_low' || sort === 'price_high') {
      providersWithServices.sort((a, b) => {
        const aMinPrice = a.services.length > 0 ? Math.min(...a.services.map(s => s.price)) : 0;
        const bMinPrice = b.services.length > 0 ? Math.min(...b.services.map(s => s.price)) : 0;
        
        return sort === 'price_low' ? aMinPrice - bMinPrice : bMinPrice - aMinPrice;
      });
    }
    
    return NextResponse.json({
      providers: providersWithServices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error searching providers:', error);
    return NextResponse.json(
      { error: 'Failed to search providers' },
      { status: 500 }
    );
  }
}