'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui'
import { format } from 'date-fns'
import { Calendar, Clock, User, Phone, Mail } from 'lucide-react'

interface Booking {
  _id: string
  clientId: {
    _id: string
    name: string
    email: string
  } | null
  serviceId: {
    _id: string
    name: string
    durationMinutes: number
    price: number
  } | null
  start: string
  end: string
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  note?: string
  syncStatus: 'ok' | 'failed' | 'pending'
}

export default function ProviderAppointments() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/booking')
      const data = await response.json()
      
      if (data.bookings) {
        setBookings(data.bookings)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/booking/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      })

      if (response.ok) {
        fetchBookings() // Refresh the list
      } else {
        alert('Failed to cancel booking')
      }
    } catch (error) {
      console.error('Error canceling booking:', error)
      alert('Error canceling booking')
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getSyncStatusBadge = (syncStatus: string) => {
    const colors = {
      ok: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    }
    return colors[syncStatus as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const filteredBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.start)
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    switch (filter) {
      case 'today':
        return bookingDate >= today && bookingDate < tomorrow && booking.status !== 'cancelled'
      case 'upcoming':
        return bookingDate > now && booking.status !== 'cancelled'
      case 'past':
        return bookingDate <= now || booking.status === 'cancelled'
      default:
        return true
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <div className="flex space-x-2">
          {(['all', 'today', 'upcoming', 'past'] as const).map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterOption)}
              className="capitalize"
            >
              {filterOption}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <Card key={booking._id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">{booking.clientId?.name || 'Unknown Client'}</span>
                          <Badge className={getStatusBadge(booking.status)}>
                            {booking.status}
                          </Badge>
                          <Badge className={getSyncStatusBadge(booking.syncStatus)}>
                            {booking.syncStatus === 'ok' ? 'Synced' : 
                             booking.syncStatus === 'failed' ? 'Sync Failed' : 'Syncing...'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(booking.start), 'EEEE, MMMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(new Date(booking.start), 'HH:mm')} - 
                              {format(new Date(booking.end), 'HH:mm')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{booking.clientId?.email || 'No email'}</span>
                          </div>
                          <div>
                            <span className="font-medium">{booking.serviceId?.name || 'Service not found'}</span>
                            <span className="ml-2">${booking.serviceId?.price || 0}</span>
                          </div>
                        </div>
                        
                        {booking.note && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <strong>Note:</strong> {booking.note}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        {booking.status === 'confirmed' && new Date(booking.start) > new Date() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking._id)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Cancel
                          </Button>
                        )}
                        
                        {booking.status === 'confirmed' && new Date(booking.end) < new Date() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Mark as completed
                            }}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-700">
              No appointments found for the selected filter.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}