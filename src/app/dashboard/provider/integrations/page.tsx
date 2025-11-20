'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GoogleIntegration {
  isConnected: boolean;
  email?: string;
  connectedAt?: string;
}

export default function IntegrationsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [googleIntegration, setGoogleIntegration] = useState<GoogleIntegration>({
    isConnected: false
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    // Always try to fetch status - let the API handle authorization
    fetchGoogleIntegrationStatus();
    
    // Check for callback messages
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    
    if (error) {
      switch (error) {
        case 'calendar_api_disabled':
          setErrorMessage('Google Calendar API is not enabled. Please enable it in your Google Cloud Console and try again.');
          break;
        case 'calendar_access_failed':
          setErrorMessage('Failed to access Google Calendar. Please try again.');
          break;
        case 'no_calendar':
          setErrorMessage('No primary calendar found in your Google account.');
          break;
        case 'server_error':
          setErrorMessage('Server error occurred. Please try again.');
          break;
        case 'access_denied':
          setErrorMessage('Access denied. Please grant permissions to connect Google Calendar.');
          break;
        default:
          setErrorMessage('An unknown error occurred. Please try again.');
      }
      
      // Clear URL parameters after showing error
      setTimeout(() => {
        window.history.replaceState({}, '', '/dashboard/provider/integrations');
      }, 5000);
    }
    
    if (success === 'true') {
      setSuccessMessage('Google Calendar connected successfully!');
      // Force the integration state to be connected immediately
      setGoogleIntegration(prev => ({ ...prev, isConnected: true }));
      
      // Clear success message and URL parameters after delay
      setTimeout(() => {
        setSuccessMessage('');
        fetchGoogleIntegrationStatus(); // Final refresh
        window.history.replaceState({}, '', '/dashboard/provider/integrations');
      }, 3000);
    }
  }, [searchParams]);

  const fetchGoogleIntegrationStatus = async () => {
    try {
      const response = await fetch('/api/provider/google/status');
      if (response.ok) {
        const data = await response.json();
        console.log('Frontend received integration status:', data);
        setGoogleIntegration(data);
      } else if (response.status === 401) {
        console.log('Session not available, using default state');
        setGoogleIntegration({ isConnected: false });
      } else if (response.status === 403) {
        console.log('User is not a provider, using default state');
        setGoogleIntegration({ isConnected: false });
      } else {
        console.error('Failed to fetch integration status:', response.status);
        setGoogleIntegration({ isConnected: false });
      }
    } catch (error) {
      console.error('Error fetching Google integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/provider/google/connect', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authUrl) {
          // Redirect to Google OAuth
          window.location.href = data.authUrl;
        }
      }
    } catch (error) {
      console.error('Error connecting to Google:', error);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      const response = await fetch('/api/provider/google/disconnect', {
        method: 'POST'
      });
      
      if (response.ok) {
        setGoogleIntegration({ isConnected: false });
      }
    } catch (error) {
      console.error('Error disconnecting from Google:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-700">Loading integrations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-2">
          Connect your external services to sync appointments and availability
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Integration Error</h3>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              {errorMessage.includes('Google Calendar API is not enabled') && (
                <div className="mt-3">
                  <a
                    href="https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=133333388556"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Enable Google Calendar API
                    <svg className="ml-1 w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </Card>
      )}

      {/* Success Message */}
      {successMessage && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700 mt-1">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </Card>
      )}

      <div className="grid gap-6">
        {/* Google Calendar Integration */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Google Calendar Integration
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Sync your appointments and availability with Google Calendar
                </p>
                {googleIntegration.isConnected && googleIntegration.email && (
                  <p className="text-sm text-gray-700 mt-2">
                    Connected as: {googleIntegration.email}
                  </p>
                )}
                {googleIntegration.isConnected && googleIntegration.connectedAt && (
                  <p className="text-xs text-gray-600 mt-1">
                    Connected on: {new Date(googleIntegration.connectedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge 
                variant={googleIntegration.isConnected ? "default" : "secondary"}
              >
                {googleIntegration.isConnected ? "Connected" : "Not Connected"}
              </Badge>
              {googleIntegration.isConnected ? (
                <Button
                  variant="outline"
                  onClick={handleDisconnectGoogle}
                  className="text-red-600 hover:text-red-700"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  onClick={handleConnectGoogle}
                  disabled={connecting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {connecting ? "Connecting..." : "Connect Google Calendar"}
                </Button>
              )}
            </div>
          </div>
          
          {googleIntegration.isConnected && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-800">
                  Google Calendar is connected and syncing
                </span>
              </div>
              <ul className="mt-2 text-sm text-green-700 space-y-1">
                <li>• New bookings will automatically create events in your Google Calendar</li>
                <li>• Existing Google Calendar events will block availability slots</li>
                <li>• Cancelled bookings will remove events from your calendar</li>
              </ul>
            </div>
          )}

          {!googleIntegration.isConnected && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-yellow-800">
                  Google Calendar not connected
                </span>
              </div>
              <p className="mt-2 text-sm text-yellow-700">
                Connect your Google Calendar to automatically sync appointments and prevent double bookings.
              </p>
            </div>
          )}
        </Card>

        {/* Future integrations placeholder */}
        <Card className="p-6 opacity-60">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-600">
                  More Integrations Coming Soon
                </h3>
                <p className="text-sm text-gray-700 mt-1">
                  Outlook Calendar, Zoom, WhatsApp, and more
                </p>
              </div>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}