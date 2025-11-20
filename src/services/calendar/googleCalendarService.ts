import { google } from 'googleapis'
import { IProviderGoogleIntegration } from '@/models/ProviderGoogleIntegration'

export async function getGoogleCalendarBusyIntervals(
  integration: IProviderGoogleIntegration,
  startTime: Date,
  endTime: Date
): Promise<{ start: Date; end: Date }[]> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  })
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  
  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        items: [{ id: integration.calendarId }],
      },
    })
    
    const busyIntervals: { start: Date; end: Date }[] = []
    const calendarBusy = response.data.calendars?.[integration.calendarId]?.busy || []
    
    calendarBusy.forEach(busy => {
      if (busy.start && busy.end) {
        busyIntervals.push({
          start: new Date(busy.start),
          end: new Date(busy.end),
        })
      }
    })
    
    return busyIntervals
  } catch (error: any) {
    // If token expired, try to refresh
    if (error.code === 401) {
      await refreshGoogleToken(integration)
      // Retry the request
      return getGoogleCalendarBusyIntervals(integration, startTime, endTime)
    }
    
    console.error('Error fetching Google Calendar busy intervals:', error)
    throw error
  }
}

export async function createGoogleCalendarEvent(
  integration: IProviderGoogleIntegration,
  booking: {
    start: Date
    end: Date
    serviceName: string
    clientName: string
    clientEmail: string
    note?: string
  }
): Promise<string | null> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  })
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  
  try {
    const event = {
      summary: `${booking.serviceName} - ${booking.clientName}`,
      description: booking.note || `Booking for ${booking.serviceName}`,
      start: {
        dateTime: booking.start.toISOString(),
        timeZone: 'Europe/Belgrade',
      },
      end: {
        dateTime: booking.end.toISOString(),
        timeZone: 'Europe/Belgrade',
      },
      attendees: [
        { email: booking.clientEmail },
      ],
    }
    
    const response = await calendar.events.insert({
      calendarId: integration.calendarId,
      requestBody: event,
    })
    
    return response.data.id || null
  } catch (error: any) {
    // If token expired, try to refresh
    if (error.code === 401) {
      await refreshGoogleToken(integration)
      // Retry the request
      return createGoogleCalendarEvent(integration, booking)
    }
    
    console.error('Error creating Google Calendar event:', error)
    return null
  }
}

export async function deleteGoogleCalendarEvent(
  integration: IProviderGoogleIntegration,
  eventId: string
): Promise<boolean> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  })
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  
  try {
    await calendar.events.delete({
      calendarId: integration.calendarId,
      eventId: eventId,
    })
    
    return true
  } catch (error: any) {
    // If token expired, try to refresh
    if (error.code === 401) {
      await refreshGoogleToken(integration)
      // Retry the request
      return deleteGoogleCalendarEvent(integration, eventId)
    }
    
    console.error('Error deleting Google Calendar event:', error)
    return false
  }
}

async function refreshGoogleToken(integration: IProviderGoogleIntegration): Promise<void> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  
  oauth2Client.setCredentials({
    refresh_token: integration.refreshToken,
  })
  
  try {
    const { credentials } = await oauth2Client.refreshAccessToken()
    
    if (credentials.access_token) {
      // Update the integration with new access token
      const ProviderGoogleIntegration = require('@/models/ProviderGoogleIntegration').default
      await ProviderGoogleIntegration.findByIdAndUpdate(integration._id, {
        accessToken: credentials.access_token,
        tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
      })
      
      integration.accessToken = credentials.access_token
    }
  } catch (error) {
    console.error('Error refreshing Google token:', error)
    throw error
  }
}