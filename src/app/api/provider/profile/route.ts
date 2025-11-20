import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ProviderProfile from '@/models/ProviderProfile';
import User from '@/models/User';
import { z } from 'zod';

// Validation schema
const providerProfileSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').trim(),
  description: z.string().optional(),
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
  }).optional(),
  timezone: z.string().min(1, 'Timezone is required'),
  isActive: z.boolean(),
});

/**
 * @swagger
 * /api/provider/profile:
 *   get:
 *     tags:
 *       - Providers
 *     summary: Dohvata profil trenutno ulogovanog providera
 *     description: Vraća kompletne podatke o provider profilu trenutno ulogovanog korisnika
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provider profil uspešno dohvaćen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProviderProfile'
 *       401:
 *         description: Neautorizovani pristup
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Provider profil nije pronađen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Server greška
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// GET /api/provider/profile - Get current user's provider profile
export async function GET() {
  try {
    console.log('🔍 GET /api/provider/profile - Getting provider profile...');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has provider role
    if (!user.roles.includes('provider')) {
      console.log('❌ User does not have provider role');
      return NextResponse.json({ error: 'User is not a provider' }, { status: 403 });
    }

    // Find provider profile
    const providerProfile = await ProviderProfile.findOne({ userId: user._id });
    if (!providerProfile) {
      console.log('❌ Provider profile not found');
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
    }

    console.log('✅ Provider profile found');
    
    const response = NextResponse.json({ 
      profile: {
        _id: providerProfile._id,
        businessName: providerProfile.businessName,
        description: providerProfile.description,
        contactInfo: providerProfile.contactInfo || {},
        timezone: providerProfile.timezone,
        isActive: providerProfile.isActive,
      }
    });
    
    // Cache for 5 minutes for provider profile
    response.headers.set('Cache-Control', 'private, max-age=300, s-maxage=300');
    
    return response;

  } catch (error) {
    console.error('💥 Error in GET /api/provider/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/provider/profile:
 *   put:
 *     tags:
 *       - Providers
 *     summary: Ažurira ili kreira profil providera
 *     description: Ažurira postojeći provider profil ili kreira novi ako ne postoji
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - timezone
 *               - isActive
 *             properties:
 *               businessName:
 *                 type: string
 *                 description: Naziv biznisa
 *                 example: "Frizerski salon Milica"
 *               description:
 *                 type: string
 *                 description: Opis biznisa
 *                 example: "Profesionalna frizerska usluga sa 10 godina iskustva"
 *               contactInfo:
 *                 type: object
 *                 properties:
 *                   phone:
 *                     type: string
 *                     example: "+381601234567"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "kontakt@salon-milica.rs"
 *                   address:
 *                     type: string
 *                     example: "Knez Mihailova 15, Beograd"
 *               timezone:
 *                 type: string
 *                 description: Vremenska zona
 *                 example: "Europe/Belgrade"
 *               isActive:
 *                 type: boolean
 *                 description: Status aktivnosti profila
 *                 example: true
 *     responses:
 *       200:
 *         description: Profil uspešno ažuriran
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 profile:
 *                   $ref: '#/components/schemas/ProviderProfile'
 *       400:
 *         description: Neispravni podaci
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Neautorizovani pristup
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Server greška
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// PUT /api/provider/profile - Update or create provider profile
export async function PUT(request: NextRequest) {
  try {
    console.log('🔧 PUT /api/provider/profile - Updating provider profile...');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has provider role
    if (!user.roles.includes('provider')) {
      console.log('❌ User does not have provider role');
      return NextResponse.json({ error: 'User is not a provider' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    console.log('📥 Received profile data:', body);

    const validationResult = providerProfileSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error);
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const profileData = validationResult.data;

    // Update or create provider profile
    const updatedProfile = await ProviderProfile.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        businessName: profileData.businessName,
        description: profileData.description,
        contactInfo: profileData.contactInfo || {},
        timezone: profileData.timezone,
        isActive: profileData.isActive,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    console.log('✅ Provider profile updated successfully');
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        _id: updatedProfile._id,
        businessName: updatedProfile.businessName,
        description: updatedProfile.description,
        contactInfo: updatedProfile.contactInfo || {},
        timezone: updatedProfile.timezone,
        isActive: updatedProfile.isActive,
      }
    });

  } catch (error) {
    console.error('💥 Error in PUT /api/provider/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}