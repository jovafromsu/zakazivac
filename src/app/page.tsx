'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCategories } from '@/hooks/useCategories';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  Users,
  CheckCircle,
  Calendar,
  ArrowRight,
  User,
  LogOut
} from 'lucide-react';

interface FeaturedProvider {
  _id: string;
  businessName: string;
  description?: string;
  location: string;
  category: string;
  rating: number;
  totalReviews: number;
  services: Array<{
    name: string;
    price: number;
    duration: number;
  }>;
}

export default function HomePage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [featuredProviders, setFeaturedProviders] = useState<FeaturedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const { categories } = useCategories();

  useEffect(() => {
    fetchFeaturedProviders();
  }, []);

  const fetchFeaturedProviders = async () => {
    try {
      const response = await fetch('/api/providers/featured');
      if (response.ok) {
        const data = await response.json();
        setFeaturedProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Error fetching featured providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (searchLocation) params.append('location', searchLocation);
    
    window.location.href = `/browse?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Book Your Next
              <span className="text-blue-600 block">Service Instantly</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Discover and book appointments with trusted service providers in your area. 
              From beauty salons to fitness trainers, find exactly what you need.
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="What service are you looking for?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>
                <div>
                  <Input
                    placeholder="Enter your location"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>
                <Button onClick={handleSearch} className="h-12 text-lg font-semibold">
                  Search <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Popular Categories */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <Link 
                  key={category._id}
                  href={`/browse?category=${encodeURIComponent(category.slug)}`}
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  style={{ borderColor: category.color + '40', color: category.color }}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Zakazivač?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make booking services simple, fast, and reliable for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Discovery</h3>
              <p className="text-gray-600">
                Find the perfect service provider with our smart search and filtering system.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Booking</h3>
              <p className="text-gray-600">
                Book appointments in real-time with automatic confirmation and calendar sync.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trusted Providers</h3>
              <p className="text-gray-600">
                All providers are verified with reviews and ratings from real customers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Providers Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Providers
            </h2>
            <p className="text-xl text-gray-600">
              Top-rated service providers in your area
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : featuredProviders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProviders.slice(0, 6).map((provider) => (
                <Card key={provider._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {provider.businessName}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {provider.location}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-medium text-gray-900">{provider.rating}</span>
                        <span className="text-xs text-gray-700 ml-1">
                          ({provider.totalReviews})
                        </span>
                      </div>
                    </div>

                    {provider.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {provider.description}
                      </p>
                    )}

                    <div className="mb-4">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {provider.category}
                      </span>
                    </div>

                    {provider.services.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Starting from:</p>
                        <p className="font-semibold text-lg">
                          ${Math.min(...provider.services.map(s => s.price))}
                        </p>
                      </div>
                    )}

                    <Link href={`/provider/${provider._id}`}>
                      <Button className="w-full">
                        View Profile & Book
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No featured providers yet
              </h3>
              <p className="text-gray-600 mb-6">
                Be among the first to discover amazing service providers in your area.
              </p>
              <Link href="/browse">
                <Button>Browse All Providers</Button>
              </Link>
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/browse">
              <Button variant="outline" className="px-8">
                View All Providers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of satisfied customers who book their services with Zakazivač
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse">
              <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-50">
                Find a Provider
              </Button>
            </Link>
            <Link href="/auth/signup?role=provider">
              <Button size="lg" className="bg-blue-700 hover:bg-blue-800">
                Become a Provider
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
