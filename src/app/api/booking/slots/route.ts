import { NextRequest, NextResponse } from 'next/server'
import { generateAvailableSlots } from '@/services/calendar/slotGeneration'
import { format } from 'date-fns'

export async function GET(req: NextRequest) {
  console.log('🚀 Slots API handler started')
  
  try {
    console.log('🚀 Slots API called with URL:', req.url)
    
    const { searchParams } = new URL(req.url)
    const providerId = searchParams.get('providerId')
    const serviceId = searchParams.get('serviceId')
    const dateStr = searchParams.get('date') // Format: YYYY-MM-DD
    
    console.log('📝 Parameters:', { providerId, serviceId, dateStr })
    
    if (!providerId || !serviceId || !dateStr) {
      console.log('❌ Missing parameters')
      return NextResponse.json(
        { error: 'Missing required parameters: providerId, serviceId, date' },
        { status: 400 }
      )
    }
    
    const date = new Date(dateStr + 'T00:00:00.000Z')
    if (isNaN(date.getTime())) {
      console.log('❌ Invalid date')
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }
    
    console.log('📅 About to call generateAvailableSlots...')
    
    // Test simple response first
    return NextResponse.json({ 
      message: 'API works', 
      parameters: { providerId, serviceId, dateStr },
      date: date.toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error in slots API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}