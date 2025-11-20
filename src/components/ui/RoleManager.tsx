'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, CheckCircle } from 'lucide-react';

interface UserRoles {
  roles: string[];
}

export default function RoleManager() {
  const { data: session, update } = useSession();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    try {
      const response = await fetch('/api/user/role');
      if (response.ok) {
        const data: UserRoles = await response.json();
        setUserRoles(data.roles);
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProviderRole = async () => {
    setAdding(true);
    try {
      const response = await fetch('/api/user/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'provider' }),
      });

      if (response.ok) {
        const data: UserRoles = await response.json();
        setUserRoles(data.roles);
        
        // Update session to reflect new roles
        await update();
        
        // Refresh page to update navigation
        window.location.reload();
      }
    } catch (error) {
      console.error('Error adding provider role:', error);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const isProvider = userRoles.includes('provider');
  const isClient = userRoles.includes('client');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Type</CardTitle>
        <CardDescription>
          Manage your account roles and permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {isClient && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Client
            </Badge>
          )}
          {isProvider && (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Provider
            </Badge>
          )}
        </div>

        {!isProvider && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              Want to offer your services? Become a provider to:
            </div>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Create and manage your service offerings</li>
              <li>Set your availability and pricing</li>
              <li>Connect with Google Calendar</li>
              <li>Accept bookings from clients</li>
            </ul>
            <Button
              onClick={addProviderRole}
              disabled={adding}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {adding ? 'Upgrading...' : 'Become a Provider'}
            </Button>
          </div>
        )}

        {isProvider && (
          <div className="text-sm text-green-600">
            ✓ You can access the provider dashboard and manage your services
          </div>
        )}
      </CardContent>
    </Card>
  );
}