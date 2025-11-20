import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import ProviderGoogleIntegration from '@/models/ProviderGoogleIntegration'
import connectDB from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // This is the user ID
    const error = searchParams.get('error')
    
    if (error) {
      return NextResponse.redirect(
        new URL('/dashboard/provider/integrations?error=access_denied', req.url)
      )
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/provider/integrations?error=invalid_request', req.url)
      )
    }
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)
    
    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()
    
    // Get calendar list to find primary calendar
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    
    let calendarList, primaryCalendar
    try {
      calendarList = await calendar.calendarList.list()
      primaryCalendar = calendarList.data.items?.find(cal => cal.primary)
    } catch (calendarError: any) {
      console.error('Google Calendar API Error:', calendarError)
      
      // Check if it's the specific API not enabled error
      if (calendarError.code === 403 && calendarError.message?.includes('Calendar API has not been used')) {
        return NextResponse.redirect(
          new URL('/dashboard/provider/integrations?error=calendar_api_disabled', req.url)
        )
      }
      
      return NextResponse.redirect(
        new URL('/dashboard/provider/integrations?error=calendar_access_failed', req.url)
      )
    }
    
    if (!primaryCalendar?.id) {
      return NextResponse.redirect(
        new URL('/dashboard/provider/integrations?error=no_calendar', req.url)
      )
    }
    
    await connectDB()
    
    const integrationData = {
      providerId: state,
      email: userInfo.data.email!,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      calendarId: primaryCalendar.id,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      lastSyncAt: new Date(),
    };
    
    console.log('Saving Google integration:', {
      providerId: state,
      email: userInfo.data.email,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      calendarId: primaryCalendar.id,
      expiresAt: integrationData.expiresAt?.toISOString()
    });
    
    // Save or update integration directly with user ID
    const result = await ProviderGoogleIntegration.findOneAndUpdate(
      { providerId: state },
      integrationData,
      { upsert: true, new: true }
    );
    
    console.log('Integration saved successfully:', result._id);
    
    return NextResponse.redirect(
      new URL('/dashboard/provider/integrations?success=true', req.url)
    )
  } catch (error) {
    console.error('Error in Google OAuth callback:', error)
    return NextResponse.redirect(
      new URL('/dashboard/provider/integrations?error=server_error', req.url)
    )
  }
}