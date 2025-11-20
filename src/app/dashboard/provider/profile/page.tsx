'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
}

interface ProviderProfile {
  _id?: string;
  businessName: string;
  description?: string;
  contactInfo: ContactInfo;
  timezone: string;
  isActive: boolean;
}

export default function ProviderProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<ProviderProfile>({
    businessName: '',
    description: '',
    contactInfo: {
      phone: '',
      email: '',
      address: ''
    },
    timezone: 'Europe/Belgrade',
    isActive: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load profile data
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/provider/profile');
        
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
        } else if (response.status === 404) {
          // No profile exists yet, use defaults
          console.log('No profile found, using defaults');
        } else if (response.status === 401) {
          // Unauthorized - session expired or not authenticated
          console.log('Authentication required');
          window.location.href = '/auth/signin';
          return;
        } else {
          // Try to parse error message
          let errorMessage = 'Failed to load profile';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If response is not JSON, use status text
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load profile data' });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [session, status]);

  const handleSave = async () => {
    if (!session) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/provider/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setMessage({ type: 'success', text: 'Profile saved successfully!' });
      } else if (response.status === 401) {
        // Session expired or not authenticated
        setMessage({ type: 'error', text: 'Authentication required. Please sign in again.' });
        setTimeout(() => {
          window.location.href = '/auth/signin';
        }, 2000);
      } else {
        // Try to parse error message
        let errorMessage = 'Failed to save profile';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text or generic message
          errorMessage = response.statusText || `HTTP ${response.status} error`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: keyof ProviderProfile | string, value: any) => {
    if (field.startsWith('contactInfo.')) {
      const contactField = field.split('.')[1] as keyof ContactInfo;
      setProfile(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [contactField]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600">Please sign in to manage your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provider Profile</h1>
          <p className="text-gray-600">Manage your business information and settings</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Basic details about your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={profile.businessName}
                onChange={(e) => updateProfile('businessName', e.target.value)}
                placeholder="Enter your business name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={profile.description || ''}
                onChange={(e) => updateProfile('description', e.target.value)}
                placeholder="Describe your services and business"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={profile.timezone}
                onChange={(e) => updateProfile('timezone', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Europe/Belgrade">Europe/Belgrade</option>
                <option value="Europe/Zagreb">Europe/Zagreb</option>
                <option value="Europe/Sarajevo">Europe/Sarajevo</option>
                <option value="Europe/Skopje">Europe/Skopje</option>
                <option value="Europe/Podgorica">Europe/Podgorica</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              How clients can reach you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.contactInfo.email || ''}
                onChange={(e) => updateProfile('contactInfo.email', e.target.value)}
                placeholder="your.email@example.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.contactInfo.phone || ''}
                onChange={(e) => updateProfile('contactInfo.phone', e.target.value)}
                placeholder="+381 11 123 4567"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={profile.contactInfo.address || ''}
                onChange={(e) => updateProfile('contactInfo.address', e.target.value)}
                placeholder="Your business address"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Profile visibility and availability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Profile Active</Label>
                <p className="text-sm text-gray-600">
                  When active, clients can find and book with you
                </p>
              </div>
              <Switch
                id="isActive"
                checked={profile.isActive}
                onCheckedChange={(checked) => updateProfile('isActive', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving || !profile.businessName.trim()}
            className="w-32"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
}