import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Booking from '@/models/Booking'
import ProviderProfile from '@/models/ProviderProfile'
import ProviderGoogleIntegration from '@/models/ProviderGoogleIntegration'
import { deleteGoogleCalendarEvent } from '@/services/calendar/googleCalendarService'
import connectDB from '@/lib/mongodb'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { action } = await req.json()
    
    if (action !== 'cancel') {
      return NextResponse.json(
        { error: 'Invalid action. Only "cancel" is supported' },
        { status: 400 }
      )
    }
    
    await connectDB()
    
    const { id } = await params
    
    // Find booking and check ownership
    const booking = await Booking.findById(id)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    
    // Check if user can cancel this booking
    const canCancel = booking.clientId.toString() === session.user.id ||
      (session.user.roles?.includes('provider') && 
       await ProviderProfile.exists({ userId: session.user.id, _id: booking.providerId }))
    
    if (!canCancel) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Update booking status
    booking.status = 'cancelled'
    await booking.save()
    
    // Try to delete Google Calendar event
    if (booking.googleEventId) {
      try {
        const googleIntegration = await ProviderGoogleIntegration.findOne({
          providerId: booking.providerId,
          isActive: true,
        })
        
        if (googleIntegration) {
          const deleted = await deleteGoogleCalendarEvent(
            googleIntegration,
            booking.googleEventId
          )
          
          if (deleted) {
            booking.syncStatus = 'ok'
          } else {
            booking.syncStatus = 'failed'
          }
          await booking.save()
        }
      } catch (error) {
        console.error('Error deleting Google Calendar event:', error)
        booking.syncStatus = 'failed'
        await booking.save()
      }
    }
    
    await booking.populate([
      { path: 'serviceId', select: 'name durationMinutes price' },
      { path: 'providerId', select: 'businessName' },
      { path: 'clientId', select: 'name email' }
    ])
    
    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !session.user.roles?.includes('provider')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    await connectDB()
    
    const { id } = await params
    
    // Find booking and check ownership
    const booking = await Booking.findById(id)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    
    // Check if provider owns this booking
    const providerProfile = await ProviderProfile.findOne({ userId: session.user.id })
    if (!providerProfile || booking.providerId.toString() !== providerProfile._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Delete Google Calendar event if exists
    if (booking.googleEventId) {
      try {
        const googleIntegration = await ProviderGoogleIntegration.findOne({
          providerId: booking.providerId,
          isActive: true,
        })
        
        if (googleIntegration) {
          await deleteGoogleCalendarEvent(googleIntegration, booking.googleEventId)
        }
      } catch (error) {
        console.error('Error deleting Google Calendar event:', error)
        // Continue with booking deletion even if Google Calendar deletion fails
      }
    }
    
    // Delete booking
    await Booking.findByIdAndDelete(id)
    
    return NextResponse.json({ message: 'Booking deleted successfully' })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}