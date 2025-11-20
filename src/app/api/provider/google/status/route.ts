import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ProviderGoogleIntegration from '@/models/ProviderGoogleIntegration';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('Google status API session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      roles: session?.user?.roles,
      isProvider: session?.user?.roles?.includes('provider')
    });
    
    if (!session?.user) {
      console.log('No session or user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.roles?.includes('provider')) {
      console.log('User is not a provider, roles:', session.user.roles);
      return NextResponse.json({ error: 'Only providers can access this endpoint' }, { status: 403 });
    }

    await connectDB();
    
    const integration = await ProviderGoogleIntegration.findOne({
      providerId: session.user.id
    });

    if (!integration) {
      return NextResponse.json({
        isConnected: false
      });
    }

    // Check if tokens are still valid (simplified check)
    const now = new Date();
    const isTokenValid = !integration.expiresAt || integration.expiresAt > now;

    console.log('Google integration status:', {
      hasAccessToken: !!integration.accessToken,
      hasRefreshToken: !!integration.refreshToken,
      expiresAt: integration.expiresAt?.toISOString(),
      isTokenValid,
      now: now.toISOString()
    });

    return NextResponse.json({
      isConnected: !!integration.accessToken && isTokenValid,
      email: integration.email,
      connectedAt: integration.createdAt?.toISOString()
    });

  } catch (error) {
    console.error('Error checking Google integration status:', error);
    return NextResponse.json(
      { error: 'Failed to check integration status' },
      { status: 500 }
    );
  }
}