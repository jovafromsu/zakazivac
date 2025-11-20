'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Globe, 
  Mail, 
  Shield, 
  CreditCard, 
  Calendar,
  Bell,
  Database,
  Smartphone,
  Clock,
  Save,
  RefreshCw,
  AlertCircle,
  Check
} from 'lucide-react'
import { AccessibleToast } from '@/components/ui/AccessibleFeedback'

interface SystemSettings {
  // Application Settings
  appName: string
  appDescription: string
  defaultTimezone: string
  defaultLanguage: string
  defaultCurrency: string
  
  // Booking Settings
  defaultBookingDuration: number // minutes
  maxAdvanceBookingDays: number
  minAdvanceBookingHours: number
  allowSameDayBooking: boolean
  defaultCancellationHours: number
  
  // Email Settings
  emailEnabled: boolean
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUser: string
  smtpPassword: string
  fromEmail: string
  fromName: string
  
  // Notification Settings
  bookingConfirmationEmail: boolean
  bookingReminderEmail: boolean
  cancellationNotificationEmail: boolean
  reminderHoursBefore: number
  
  // Security Settings
  sessionTimeoutMinutes: number
  maxLoginAttempts: number
  lockoutDurationMinutes: number
  requireEmailVerification: boolean
  passwordMinLength: number
  passwordRequireSpecialChar: boolean
  
  // File Upload Settings
  maxFileUploadSize: number // MB
  allowedFileTypes: string[]
  
  // Integration Settings
  googleCalendarEnabled: boolean
  enableWebhooks: boolean
  webhookUrl: string
  
  // Business Settings
  businessName: string
  businessAddress: string
  businessPhone: string
  businessEmail: string
  taxRate: number
  commissionRate: number
}

const defaultSettings: SystemSettings = {
  appName: 'Zakazivač',
  appDescription: 'Professional appointment booking system',
  defaultTimezone: 'Europe/Belgrade',
  defaultLanguage: 'sr',
  defaultCurrency: 'RSD',
  
  defaultBookingDuration: 60,
  maxAdvanceBookingDays: 90,
  minAdvanceBookingHours: 2,
  allowSameDayBooking: true,
  defaultCancellationHours: 24,
  
  emailEnabled: true,
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: true,
  smtpUser: '',
  smtpPassword: '',
  fromEmail: '',
  fromName: '',
  
  bookingConfirmationEmail: true,
  bookingReminderEmail: true,
  cancellationNotificationEmail: true,
  reminderHoursBefore: 24,
  
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  requireEmailVerification: true,
  passwordMinLength: 8,
  passwordRequireSpecialChar: true,
  
  maxFileUploadSize: 5,
  allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf'],
  
  googleCalendarEnabled: false,
  enableWebhooks: false,
  webhookUrl: '',
  
  businessName: '',
  businessAddress: '',
  businessPhone: '',
  businessEmail: '',
  taxRate: 0,
  commissionRate: 0
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [toast, setToast] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      
      if (response.ok) {
        setSettings({ ...defaultSettings, ...data.settings })
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to load settings' })
      }
    } catch (error) {
      console.error('Settings fetch error:', error)
      setToast({ type: 'error', message: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setToast({ type: 'success', message: 'Settings saved successfully' })
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Settings save error:', error)
      setToast({ type: 'error', message: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (path: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [path]: value }))
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'booking', label: 'Booking', icon: Calendar },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'business', label: 'Business', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: Smartphone },
  ]

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure system-wide settings and preferences
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={fetchSettings}
            disabled={loading || saving}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Settings Content */}
      <div className="space-y-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Application Settings
                </CardTitle>
                <CardDescription>
                  Basic application configuration and localization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="appName">Application Name</Label>
                  <Input
                    id="appName"
                    value={settings.appName}
                    onChange={(e) => updateSetting('appName', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="appDescription">Description</Label>
                  <Input
                    id="appDescription"
                    value={settings.appDescription}
                    onChange={(e) => updateSetting('appDescription', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="defaultTimezone">Default Timezone</Label>
                  <Select 
                    value={settings.defaultTimezone} 
                    onValueChange={(value) => updateSetting('defaultTimezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Belgrade">Europe/Belgrade</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="defaultLanguage">Default Language</Label>
                  <Select 
                    value={settings.defaultLanguage} 
                    onValueChange={(value) => updateSetting('defaultLanguage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sr">Serbian (српски)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">German (Deutsch)</SelectItem>
                      <SelectItem value="fr">French (Français)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <Select 
                    value={settings.defaultCurrency} 
                    onValueChange={(value) => updateSetting('defaultCurrency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RSD">RSD (Serbian Dinar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  File Upload Settings
                </CardTitle>
                <CardDescription>
                  Configure file upload limits and allowed formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={settings.maxFileUploadSize}
                    onChange={(e) => updateSetting('maxFileUploadSize', parseInt(e.target.value) || 5)}
                  />
                </div>
                
                <div>
                  <Label>Allowed File Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'].map((type) => (
                      <Badge
                        key={type}
                        variant={settings.allowedFileTypes.includes(type) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const types = settings.allowedFileTypes.includes(type)
                            ? settings.allowedFileTypes.filter(t => t !== type)
                            : [...settings.allowedFileTypes, type]
                          updateSetting('allowedFileTypes', types)
                        }}
                      >
                        {type.toUpperCase()}
                        {settings.allowedFileTypes.includes(type) && (
                          <Check className="h-3 w-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Booking Settings */}
        {activeTab === 'booking' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Configuration
                </CardTitle>
                <CardDescription>
                  Configure default booking behavior and limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="defaultDuration">Default Booking Duration (minutes)</Label>
                  <Input
                    id="defaultDuration"
                    type="number"
                    value={settings.defaultBookingDuration}
                    onChange={(e) => updateSetting('defaultBookingDuration', parseInt(e.target.value) || 60)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxAdvanceDays">Max Advance Booking (days)</Label>
                  <Input
                    id="maxAdvanceDays"
                    type="number"
                    value={settings.maxAdvanceBookingDays}
                    onChange={(e) => updateSetting('maxAdvanceBookingDays', parseInt(e.target.value) || 90)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="minAdvanceHours">Min Advance Booking (hours)</Label>
                  <Input
                    id="minAdvanceHours"
                    type="number"
                    value={settings.minAdvanceBookingHours}
                    onChange={(e) => updateSetting('minAdvanceBookingHours', parseInt(e.target.value) || 2)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="sameDayBooking">Allow Same-Day Booking</Label>
                  <Switch
                    id="sameDayBooking"
                    checked={settings.allowSameDayBooking}
                    onCheckedChange={(checked) => updateSetting('allowSameDayBooking', checked)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="cancellationHours">Default Cancellation Hours</Label>
                  <Input
                    id="cancellationHours"
                    type="number"
                    value={settings.defaultCancellationHours}
                    onChange={(e) => updateSetting('defaultCancellationHours', parseInt(e.target.value) || 24)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional tabs would continue here... */}
        
        {/* Show info for other tabs */}
        {['email', 'notifications', 'security', 'business', 'integrations'].includes(activeTab) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings will be available in the next update.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Toast Notifications */}
      {toast && (
        <AccessibleToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          autoClose={true}
          duration={5000}
        />
      )}
    </div>
  )
}