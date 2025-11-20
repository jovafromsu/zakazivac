'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Settings, Calendar, Search, Shield, Briefcase, UserCircle } from 'lucide-react';
import Link from 'next/link';
import RoleManager from '@/components/ui/RoleManager';
import { getAvailableDashboards, isMultiRoleUser } from '@/lib/redirects';
import PageLayout from '@/components/PageLayout';

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!session) {
    redirect('/auth/signin');
  }

  const userRoles = session.user.roles || [];
  const isProvider = userRoles.includes('provider');
  const isClient = userRoles.includes('client');
  const isAdmin = userRoles.includes('admin');
  const isMultiRole = isMultiRoleUser(userRoles);
  const availableDashboards = getAvailableDashboards(userRoles);

  return (
    <PageLayout>
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">Manage your account and preferences</p>
          </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <div className="text-lg">{session.user.name}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <div className="text-lg">{session.user.email}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Account Type</label>
                <div className="flex gap-2 mt-1">
                  {isAdmin && <Badge variant="destructive">Admin</Badge>}
                  {isProvider && <Badge variant="default">Provider</Badge>}
                  {isClient && <Badge variant="secondary">Client</Badge>}
                  {isMultiRole && <Badge variant="outline">Multi-Role</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Management */}
          <RoleManager />

          {/* Dashboard Access */}
          {isMultiRole ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Choose Dashboard
                </CardTitle>
                <CardDescription>
                  You have access to multiple dashboards. Select the one you want to use.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableDashboards.map((dashboard) => {
                  const IconComponent = dashboard.role === 'admin' ? Shield : 
                                       dashboard.role === 'provider' ? Briefcase : UserCircle;
                  return (
                    <Link key={dashboard.role} href={dashboard.url}>
                      <Button variant="outline" className="w-full justify-start text-left h-auto p-4">
                        <div className="flex items-start gap-3">
                          <IconComponent className="w-5 h-5 mt-0.5 text-blue-600" />
                          <div>
                            <div className="font-medium">{dashboard.label}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {dashboard.description}
                            </div>
                          </div>
                        </div>
                      </Button>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Single dashboard access */}
                {availableDashboards.length > 0 && (
                  <Link href={availableDashboards[0].url}>
                    <Button variant="default" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      Go to {availableDashboards[0].label}
                    </Button>
                  </Link>
                )}
                
                {/* Common actions based on roles */}
                {isClient && (
                  <Link href="/browse">
                    <Button variant="outline" className="w-full justify-start">
                      <Search className="w-4 h-4 mr-2" />
                      Browse Services
                    </Button>
                  </Link>
                )}
                
                {isProvider && (
                  <Link href="/dashboard/provider/integrations">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Integrations
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Account Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent bookings and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700">
                No recent activity to display
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </PageLayout>
  );
}