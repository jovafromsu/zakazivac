'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Search,
  Settings,
  History,
  Star
} from 'lucide-react';
import Link from 'next/link';

interface Booking {
  _id: string;
  service: {
    name: string;
    price: number;
  };
  provider: {
    businessName: string;
    location: string;
  };
  selectedDate: string;
  selectedTime: string;
  status: string;
  totalAmount: number;
}

export default function ClientDashboard() {
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await fetch('/api/booking', {
        headers: {
          'Cache-Control': 'max-age=60' // Cache na 1 minut
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      fetchBookings();
    }
  }, [session, fetchBookings]);

  const { upcomingBookings, pastBookings } = useMemo(() => {
    const now = new Date();
    const upcoming = bookings.filter(booking => 
      booking.status === 'confirmed' && new Date(booking.selectedDate) > now
    );
    const past = bookings.filter(booking => 
      new Date(booking.selectedDate) <= now || booking.status === 'completed'
    );
    return { upcomingBookings: upcoming, pastBookings: past };
  }, [bookings]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
              <p className="text-gray-600">Welcome back, {session?.user.name}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/browse">
                <Button className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Find Services
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900">Upcoming Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingBookings.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900">Total Bookings</CardTitle>
                <History className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bookings.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900">Account Type</CardTitle>
                <User className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {session?.user.roles?.includes('client') && (
                    <Badge variant="secondary">Client</Badge>
                  )}
                  {session?.user.roles?.includes('provider') && (
                    <Badge>Provider</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Your scheduled appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBookings.slice(0, 5).map((booking) => (
                    <div key={booking._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{booking.service.name}</h3>
                        <p className="text-sm text-gray-600">{booking.provider.businessName}</p>
                        <div className="flex items-center text-sm text-gray-700 mt-1 space-x-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(booking.selectedDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {booking.selectedTime}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {booking.provider.location}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">${booking.totalAmount}</div>
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming appointments</h3>
                  <p className="text-gray-700 mb-4">Start by browsing available services</p>
                  <Link href="/browse">
                    <Button>Find Services</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your booking history</CardDescription>
            </CardHeader>
            <CardContent>
              {pastBookings.length > 0 ? (
                <div className="space-y-4">
                  {pastBookings.slice(0, 3).map((booking) => (
                    <div key={booking._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{booking.service.name}</h3>
                        <p className="text-sm text-gray-600">{booking.provider.businessName}</p>
                        <div className="flex items-center text-sm text-gray-700 mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(booking.selectedDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{booking.status}</Badge>
                        <div className="text-sm text-gray-700 mt-1">
                          ${booking.totalAmount}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-700">No past bookings yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/browse">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                    <Search className="w-6 h-6" />
                    <span>Find Services</span>
                  </Button>
                </Link>
                
                <Link href="/profile">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                    <User className="w-6 h-6" />
                    <span>My Profile</span>
                  </Button>
                </Link>
                
                <Link href="/dashboard/client/bookings">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                    <History className="w-6 h-6" />
                    <span>All Bookings</span>
                  </Button>
                </Link>

                {session?.user.roles?.includes('provider') && (
                  <Link href="/dashboard/provider">
                    <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                      <Settings className="w-6 h-6" />
                      <span>Provider Dashboard</span>
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}