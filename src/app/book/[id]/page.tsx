'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PageLayout from '@/components/PageLayout';
import { 
  Calendar as CalendarIcon,
  Clock,
  ArrowLeft,
  User,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  LogIn
} from 'lucide-react';

interface Service {
  _id: string;
  name: string;
  price: number;
  duration: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface Provider {
  _id: string;
  businessName: string;
  location: string;
  services: Service[];
}

export default function BookingPage() {
  const { data: session, status } = useSession();
  const { id } = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get('service');
  
  const [provider, setProvider] = useState<Provider | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [error, setError] = useState('');

  const getCurrentUrl = () => {
    if (typeof window === 'undefined') return '';
    const params = searchParams.toString();
    return `${window.location.origin}${pathname}${params ? `?${params}` : ''}`;
  };

  useEffect(() => {
    if (id) {
      fetchProvider();
    }
  }, [id]);

  useEffect(() => {
    if (provider?.services && preselectedServiceId) {
      const service = provider.services.find(s => s._id === preselectedServiceId);
      if (service) {
        setSelectedService(service);
      }
    }
  }, [provider, preselectedServiceId]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedService, selectedDate]);

  // Debug session state
  useEffect(() => {
    console.log('🔍 BOOKING PAGE Session State:', {
      status,
      hasSession: !!session,
      userName: session?.user?.name,
      userRoles: session?.user?.roles,
      expires: session?.expires
    });
  }, [session, status]);



  const fetchProvider = async () => {
    try {
      const response = await fetch(`/api/providers/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProvider(data.provider);
      }
    } catch (error) {
      console.error('Error fetching provider:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedService || !selectedDate) return;
    
    try {
      const response = await fetch(
        `/api/slots?providerId=${id}&serviceId=${selectedService._id}&date=${selectedDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      setError('Please select service, date and time');
      return;
    }

    if (!customerInfo.name || !customerInfo.email) {
      setError('Please fill in your contact information');
      return;
    }

    setBookingLoading(true);
    setError('');

    try {
      // Create ISO datetime string from date and time
      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: id,
          serviceId: selectedService._id,
          start: startDateTime.toISOString(),
          note: `Customer: ${customerInfo.name}\nEmail: ${customerInfo.email}\nPhone: ${customerInfo.phone}`
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBookingComplete(true);
      } else {
        setError(data.error || 'Failed to create booking');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Generate date options for next 30 days
  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    
    return dates;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 bg-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking information...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Provider Not Found</h2>
          <Link href="/browse">
            <Button>Browse Other Providers</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Booking Confirmed!
          </h2>
          <p className="text-gray-600 mb-6">
            Your appointment has been successfully booked. You will receive a confirmation email shortly.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold mb-2">Booking Details:</h3>
            <p><strong>Service:</strong> {selectedService?.name}</p>
            <p><strong>Date:</strong> {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}</p>
            <p><strong>Time:</strong> {selectedTime}</p>
            <p><strong>Duration:</strong> {selectedService?.duration} minutes</p>
            <p><strong>Price:</strong> ${selectedService?.price}</p>
          </div>
          <div className="space-y-3">
            <Link href="/dashboard/client" className="block">
              <Button className="w-full">
                View My Bookings
              </Button>
            </Link>
            <Link href="/browse" className="block">
              <Button variant="outline" className="w-full">
                Browse More Services
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Check authentication - show login prompt for unauthenticated users
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 bg-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-20">
        <main className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Card className="max-w-md mx-4 p-8 text-center">
            <LogIn className="w-16 h-16 text-blue-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Sign In Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to be signed in to book appointments. Please sign in to continue with your booking.
            </p>
            {provider && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-sm text-gray-700 mb-2">You're trying to book with:</h3>
                <p className="text-lg font-medium text-gray-900">{provider.businessName}</p>
                <p className="text-sm text-gray-600">{provider.location}</p>
              </div>
            )}
            <div className="space-y-3">
              <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(getCurrentUrl())}`}>
                <Button className="w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In to Book
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="outline" className="w-full">
                  Create New Account
                </Button>
              </Link>
              <Link href="/browse">
                <Button variant="ghost" className="w-full text-sm">
                  ← Back to Browse
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse flex items-center space-x-2">
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                </div>
              ) : session ? (
                <div className="flex items-center space-x-3">
                  <span className="text-gray-700">
                    Hello, {session.user?.name}
                  </span>
                  <Link href="/dashboard/client">
                    <Button variant="outline">Dashboard</Button>
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href={`/provider/${id}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to {provider.businessName}
          </Link>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                selectedService ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Select Service</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div className={`h-full transition-all duration-300 ${
                selectedDate ? 'bg-blue-600 w-full' : selectedService ? 'bg-blue-600 w-1/2' : 'w-0'
              }`}></div>
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                selectedDate ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Select Time</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div className={`h-full bg-blue-600 transition-all duration-300 ${
                customerInfo.name && customerInfo.email ? 'w-full' : selectedTime ? 'w-1/2' : 'w-0'
              }`}></div>
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                customerInfo.name && customerInfo.email ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Confirm</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Selection */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">1. Select Service</h2>
              
              <div className="space-y-3">
                {provider.services.map((service) => (
                  <div
                    key={service._id}
                    onClick={() => setSelectedService(service)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedService?._id === service._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {service.duration} minutes
                        </div>
                      </div>
                      <div className="text-lg font-bold">${service.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Date & Time Selection */}
            {selectedService && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">2. Select Date & Time</h2>
                
                {/* Date Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime(''); // Reset time when date changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a date...</option>
                    {getDateOptions().map((date) => (
                      <option key={date.value} value={date.value}>
                        {date.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Times
                    </label>
                    
                    {availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {availableSlots.map((slot, index) => (
                          <button
                            key={`${slot.time}-${index}`}
                            onClick={() => slot.available && setSelectedTime(slot.time)}
                            disabled={!slot.available}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              selectedTime === slot.time
                                ? 'bg-blue-600 text-white'
                                : slot.available
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                : 'bg-gray-50 text-gray-600 cursor-not-allowed'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-700">No available time slots for this date.</p>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Customer Information */}
            {selectedService && selectedDate && selectedTime && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">3. Your Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                      <Input
                        placeholder="Enter your full name"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                      <Input
                        placeholder="Enter your phone number"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="p-6 sticky top-6">
              <h3 className="text-lg font-bold mb-4">Booking Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Provider</h4>
                  <p className="text-gray-600">{provider.businessName}</p>
                  <p className="text-sm text-gray-700">{provider.location}</p>
                </div>

                {selectedService && (
                  <div>
                    <h4 className="font-medium text-gray-900">Service</h4>
                    <p className="text-gray-600">{selectedService.name}</p>
                    <p className="text-sm text-gray-700">{selectedService.duration} minutes</p>
                  </div>
                )}

                {selectedDate && (
                  <div>
                    <h4 className="font-medium text-gray-900">Date</h4>
                    <p className="text-gray-600">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {selectedTime && (
                  <div>
                    <h4 className="font-medium text-gray-900">Time</h4>
                    <p className="text-gray-600">{selectedTime}</p>
                  </div>
                )}

                {selectedService && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total</span>
                      <span className="text-xl font-bold">${selectedService.price}</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleBooking}
                  disabled={!selectedService || !selectedDate || !selectedTime || !customerInfo.name || !customerInfo.email || bookingLoading}
                  className="w-full mt-6"
                >
                  {bookingLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Booking...
                    </div>
                  ) : (
                    <>
                      <CalendarIcon className="mr-2 w-4 h-4" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}