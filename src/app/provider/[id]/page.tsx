'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PageLayout from '@/components/PageLayout';
import { 
  MapPin, 
  Star, 
  Clock, 
  Phone,
  Mail,
  Calendar,
  ArrowLeft,
  Check,
  Users,
  LogIn
} from 'lucide-react';

interface Service {
  _id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
}

interface ProviderDetails {
  _id: string;
  businessName: string;
  description?: string;
  location: string;
  category: string;
  rating: number;
  totalReviews: number;
  phone?: string;
  email?: string;
  services: Service[];
  availability: any[];
}

export default function ProviderDetailPage() {
  const { data: session, status } = useSession();
  const { id } = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [provider, setProvider] = useState<ProviderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [sessionRefresh, setSessionRefresh] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProviderDetails();
    }
  }, [id]);

  // Refresh session when window regains focus (helpful after login redirect)
  useEffect(() => {
    const handleFocus = () => {
      // Force session refresh when user returns to tab
      window.dispatchEvent(new Event('visibilitychange'));
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);



  const fetchProviderDetails = async () => {
    try {
      const response = await fetch(`/api/providers/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProvider(data.provider);
      } else {
        console.error('Provider not found');
      }
    } catch (error) {
      console.error('Error fetching provider details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUrl = () => {
    if (typeof window === 'undefined') return '';
    const params = searchParams.toString();
    return `${window.location.origin}${pathname}${params ? `?${params}` : ''}`;
  };

  const handleBookService = (service: Service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  // Close modal if user signs out while modal is open
  useEffect(() => {
    if (showBookingModal && status === 'unauthenticated') {
      setShowBookingModal(false);
    }
  }, [status, showBookingModal]);

  // Force component re-render when session changes from loading to authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log('✅ PROVIDER PAGE Session authenticated:', session.user.name);
      // Force refresh of all session-dependent UI elements
      setSessionRefresh(prev => prev + 1);
    }
  }, [status, session?.user]);

  // Debug session state
  useEffect(() => {
    console.log('🔍 PROVIDER PAGE Session State:', {
      status,
      hasSession: !!session,
      userName: session?.user?.name,
      userRoles: session?.user?.roles,
      expires: session?.expires
    });
  }, [session, status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
        </div>
      </div>
    </PageLayout>
  );
}  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Provider Not Found</h2>
          <p className="text-gray-600 mb-6">
            The provider you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/browse">
            <Button>Browse Other Providers</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageLayout className="bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/browse" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Browse
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Provider Info */}
            <Card className="p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {provider.businessName}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {provider.location}
                  </div>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 mr-1" />
                    <span className="font-medium mr-2">{provider.rating}</span>
                    <span className="text-gray-700">({provider.totalReviews} reviews)</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {provider.category}
                  </span>
                </div>
              </div>

              {provider.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">About</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {provider.description}
                  </p>
                </div>
              )}

              {/* Contact Info */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {provider.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-600 mr-2" />
                      <span className="text-gray-600">{provider.phone}</span>
                    </div>
                  )}
                  {provider.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-600 mr-2" />
                      <span className="text-gray-600">{provider.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Services */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Services</h2>
              
              {provider.services.length > 0 ? (
                <div className="space-y-4">
                  {provider.services.map((service) => (
                    <div key={service._id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
                          {service.description && (
                            <p className="text-gray-600 mb-3">{service.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-700">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {service.duration} mins
                            </div>
                            <div className="font-semibold text-lg text-gray-900">
                              ${service.price}
                            </div>
                          </div>
                        </div>
                        {status === 'loading' ? (
                          <Button disabled className="ml-4">
                            <div className="w-4 h-4 mr-2 animate-pulse bg-gray-300 rounded"></div>
                            Loading...
                          </Button>
                        ) : session ? (
                          <Button 
                            onClick={() => handleBookService(service)}
                            className="ml-4"
                          >
                            Book Now
                          </Button>
                        ) : (
                          <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(getCurrentUrl())}`}>
                            <Button variant="outline" className="ml-4">
                              <LogIn className="w-4 h-4 mr-2" />
                              Sign In to Book
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-700">No services available at the moment.</p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Quick Book Card */}
            <Card className="p-6 mb-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Instant booking confirmation
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Calendar sync available
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Secure payment processing
                </div>
              </div>

              {provider.services.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Starting from</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${Math.min(...provider.services.map(s => s.price))}
                  </p>
                </div>
              )}

              {status === 'loading' ? (
                <Button size="lg" disabled className="w-full">
                  <div className="w-4 h-4 mr-2 animate-pulse bg-gray-300 rounded"></div>
                  Loading...
                </Button>
              ) : session ? (
                <Link href={`/book/${provider._id}`}>
                  <Button size="lg" className="w-full">
                    <Calendar className="mr-2 w-4 h-4" />
                    View Availability
                  </Button>
                </Link>
              ) : (
                <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(getCurrentUrl())}`}>
                  <Button size="lg" variant="outline" className="w-full">
                    <LogIn className="mr-2 w-4 h-4" />
                    Sign In to Book
                  </Button>
                </Link>
              )}
            </Card>

            {/* Reviews Preview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Reviews</h3>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="font-medium text-gray-900">{provider.rating}</span>
                </div>
              </div>
              
              {provider.totalReviews > 0 ? (
                <div>
                  <p className="text-gray-600 mb-4">
                    Based on {provider.totalReviews} review{provider.totalReviews !== 1 ? 's' : ''}
                  </p>
                  <Button variant="outline" className="w-full">
                    Read All Reviews
                  </Button>
                </div>
              ) : (
                <p className="text-gray-700 text-sm">No reviews yet</p>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Modal - Only show when session is not loading */}
      {showBookingModal && selectedService && status !== 'loading' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Book {selectedService.name}</h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">{selectedService.name}</span>
                <span className="font-semibold">${selectedService.price}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                {selectedService.duration} minutes
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Choose your preferred date and time for this service.
            </p>

            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowBookingModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              {status !== 'authenticated' ? (
                <Button disabled className="flex-1 w-full">
                  <div className="w-4 h-4 mr-2 animate-pulse bg-gray-300 rounded"></div>
                  Loading...
                </Button>
              ) : session ? (
                <Link href={`/book/${provider._id}?service=${selectedService._id}`} className="flex-1">
                  <Button className="w-full">
                    Continue to Booking
                  </Button>
                </Link>
              ) : (
                <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(getCurrentUrl())}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In First
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}