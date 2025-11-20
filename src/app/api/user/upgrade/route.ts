import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Update user with provider role if not already present
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.roles.includes('provider')) {
      user.roles.push('provider');
      await user.save();
    }

    return NextResponse.json({ 
      success: true,
      message: 'Provider role added successfully',
      roles: user.roles
    });
  } catch (error) {
    console.error('Error adding provider role:', error);
    return NextResponse.json(
      { error: 'Failed to add provider role' },
      { status: 500 }
    );
  }
}