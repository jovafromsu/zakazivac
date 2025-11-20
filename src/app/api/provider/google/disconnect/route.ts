import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ProviderGoogleIntegration from '@/models/ProviderGoogleIntegration';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.roles?.includes('provider')) {
      return NextResponse.json({ error: 'Only providers can access this endpoint' }, { status: 403 });
    }

    await connectDB();
    
    // Remove Google integration
    await ProviderGoogleIntegration.findOneAndDelete({
      providerId: session.user.id
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Google Calendar' },
      { status: 500 }
    );
  }
}