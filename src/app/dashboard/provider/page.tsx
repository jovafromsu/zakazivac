'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, DollarSign, Users } from 'lucide-react'
import { format, startOfToday, endOfToday, startOfWeek, endOfWeek } from 'date-fns'

interface DashboardStats {
  todayBookings: number
  weekBookings: number
  totalRevenue: number
  totalClients: number
}

interface TodayBooking {
  id: string
  clientName: string
  serviceName: string
  start: string
  end: string
  status: string
}

export default function ProviderDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0,
    weekBookings: 0,
    totalRevenue: 0,
    totalClients: 0,
  })
  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([])
  const [googleStatus, setGoogleStatus] = useState<{
    connected: boolean
    accountEmail?: string
  }>({ connected: false })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    fetchGoogleIntegrationStatus()
  }, [])

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch bookings sa caching
      const bookingsResponse = await fetch('/api/booking', {
        headers: {
          'Cache-Control': 'max-age=120' // Cache na 2 minuta za provider
        }
      })
      const bookingsData = await bookingsResponse.json()
      
      if (bookingsData.bookings) {
        const bookings = bookingsData.bookings
        const today = new Date()
        const startToday = startOfToday()
        const endToday = endOfToday()
        const startWeek = startOfWeek(today, { weekStartsOn: 1 })
        const endWeek = endOfWeek(today, { weekStartsOn: 1 })
        
        // Calculate stats
        const todayCount = bookings.filter((booking: any) => {
          const bookingDate = new Date(booking.start)
          return bookingDate >= startToday && bookingDate <= endToday && 
                 booking.status !== 'cancelled'
        }).length
        
        const weekCount = bookings.filter((booking: any) => {
          const bookingDate = new Date(booking.start)
          return bookingDate >= startWeek && bookingDate <= endWeek && 
                 booking.status !== 'cancelled'
        }).length
        
        const revenue = bookings
          .filter((booking: any) => booking.status === 'completed')
          .reduce((sum: number, booking: any) => sum + (booking.serviceId?.price || 0), 0)
        
        const uniqueClients = new Set(
          bookings.map((booking: any) => booking.clientId._id)
        ).size
        
        setStats({
          todayBookings: todayCount,
          weekBookings: weekCount,
          totalRevenue: revenue,
          totalClients: uniqueClients,
        })
        
        // Set today's bookings
        const todaysBookings = bookings
          .filter((booking: any) => {
            const bookingDate = new Date(booking.start)
            return bookingDate >= startToday && bookingDate <= endToday &&
                   booking.status !== 'cancelled'
          })
          .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
          .slice(0, 5) // Show only next 5
          .map((booking: any) => ({
            id: booking._id,
            clientName: booking.clientId?.name || 'Unknown',
            serviceName: booking.serviceId?.name || 'Unknown Service',
            start: booking.start,
            end: booking.end,
            status: booking.status,
          }))
        
        setTodayBookings(todaysBookings)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }, []) // Closing the useCallback with dependency array
  
  const fetchGoogleIntegrationStatus = async () => {
    try {
      const response = await fetch('/api/provider/google/status')
      if (response.ok) {
        const data = await response.json()
        setGoogleStatus({
          connected: data.isConnected,
          accountEmail: data.email
        })
      } else {
        console.error('Failed to fetch Google status:', response.status)
        setGoogleStatus({ connected: false })
      }
    } catch (error) {
      console.error('Error fetching Google integration status:', error)
      setGoogleStatus({ connected: false })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="text-sm text-gray-700">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">This Week</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekBookings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your appointments for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todayBookings.length > 0 ? (
              <div className="space-y-3">
                {todayBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{booking.clientName}</p>
                      <p className="text-sm text-gray-600">{booking.serviceName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(booking.start), 'HH:mm')} - {format(new Date(booking.end), 'HH:mm')}
                      </p>
                      <p className="text-xs text-gray-700 capitalize">{booking.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700">No appointments scheduled for today.</p>
            )}
          </CardContent>
        </Card>

        {/* Google Calendar Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Google Calendar Integration</CardTitle>
            <CardDescription>Sync status and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  googleStatus.connected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {googleStatus.connected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              
              {googleStatus.connected && googleStatus.accountEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Account</span>
                  <span className="text-sm text-gray-600">{googleStatus.accountEmail}</span>
                </div>
              )}
              
              <div className="pt-2">
                <a
                  href="/dashboard/provider/integrations"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {googleStatus.connected ? 'Manage Integration' : 'Connect Google Calendar'}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}