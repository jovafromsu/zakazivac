'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Clock, Plus, Trash2, Calendar, Save } from 'lucide-react'

interface TimeSlot {
  start: string
  end: string
}

interface DaySchedule {
  isEnabled: boolean
  workingHours: TimeSlot
  breaks: TimeSlot[]
}

interface WeekSchedule {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

interface AvailabilitySettings {
  weekSchedule: WeekSchedule
  bufferTime: number // minutes
  advanceBookingDays: number
  minimumNoticeHours: number
  timezone: string
}

const defaultDaySchedule: DaySchedule = {
  isEnabled: false,
  workingHours: { start: '09:00', end: '17:00' },
  breaks: []
}

const defaultSettings: AvailabilitySettings = {
  weekSchedule: {
    monday: { ...defaultDaySchedule, isEnabled: true },
    tuesday: { ...defaultDaySchedule, isEnabled: true },
    wednesday: { ...defaultDaySchedule, isEnabled: true },
    thursday: { ...defaultDaySchedule, isEnabled: true },
    friday: { ...defaultDaySchedule, isEnabled: true },
    saturday: defaultDaySchedule,
    sunday: defaultDaySchedule
  },
  bufferTime: 15,
  advanceBookingDays: 30,
  minimumNoticeHours: 2,
  timezone: 'Europe/Belgrade'
}

const dayNames = {
  monday: 'Ponedeljak',
  tuesday: 'Utorak', 
  wednesday: 'Sreda',
  thursday: 'Četvrtak',
  friday: 'Petak',
  saturday: 'Subota',
  sunday: 'Nedelja'
}

export default function ProviderAvailability() {
  const [settings, setSettings] = useState<AvailabilitySettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchAvailability()
  }, [])

  const fetchAvailability = async () => {
    try {
      console.log('📥 Fetching availability settings...')
      const response = await fetch('/api/availability')
      console.log('📥 Fetch response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📥 Fetched data:', data)
        if (data.availability) {
          setSettings(data.availability)
          console.log('✅ Settings loaded from server')
        }
      } else {
        console.error('❌ Failed to fetch availability:', response.status, response.statusText)
        if (response.status === 403) {
          const errorData = await response.json()
          alert(errorData.message || 'You need provider privileges to access availability settings.')
        }
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    console.log('🚀 Saving settings:', JSON.stringify(settings, null, 2))
    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      console.log('📡 Response status:', response.status)
      const responseData = await response.json()
      console.log('📡 Response data:', responseData)

      if (response.ok) {
        alert('Availability settings saved successfully!')
        // Refresh data to verify save
        await fetchAvailability()
      } else {
        const message = response.status === 403 ? 
          (responseData.message || 'You need provider privileges to save availability settings.') :
          (responseData.error || 'Unknown error')
        alert(`Error saving settings: ${message}`)
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      alert('Error saving settings')
    } finally {
      setIsSaving(false)
    }
  }

  const updateDaySchedule = (day: keyof WeekSchedule, updates: Partial<DaySchedule>) => {
    setSettings(prev => ({
      ...prev,
      weekSchedule: {
        ...prev.weekSchedule,
        [day]: {
          ...prev.weekSchedule[day],
          ...updates
        }
      }
    }))
  }

  const addBreak = (day: keyof WeekSchedule) => {
    const newBreak: TimeSlot = { start: '12:00', end: '13:00' }
    updateDaySchedule(day, {
      breaks: [...settings.weekSchedule[day].breaks, newBreak]
    })
  }

  const updateBreak = (day: keyof WeekSchedule, breakIndex: number, breakData: TimeSlot) => {
    const updatedBreaks = [...settings.weekSchedule[day].breaks]
    updatedBreaks[breakIndex] = breakData
    updateDaySchedule(day, { breaks: updatedBreaks })
  }

  const removeBreak = (day: keyof WeekSchedule, breakIndex: number) => {
    const updatedBreaks = settings.weekSchedule[day].breaks.filter((_, index) => index !== breakIndex)
    updateDaySchedule(day, { breaks: updatedBreaks })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Availability Settings</h1>
        <div className="animate-pulse">
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Availability Settings</h1>
          <p className="text-gray-600">Configure when you're available for appointments</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>Set your working hours for each day of the week</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(settings.weekSchedule).map(([day, schedule]) => (
            <div key={day} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={schedule.isEnabled}
                    onCheckedChange={(checked: boolean) => updateDaySchedule(day as keyof WeekSchedule, { isEnabled: checked })}
                  />
                  <Label className="text-sm font-medium">{dayNames[day as keyof typeof dayNames]}</Label>
                </div>
                {schedule.isEnabled && (
                  <Badge variant="secondary">Active</Badge>
                )}
              </div>

              {schedule.isEnabled && (
                <div className="space-y-4">
                  {/* Working Hours */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Start Time</Label>
                      <Input
                        type="time"
                        value={schedule.workingHours.start}
                        onChange={(e) => updateDaySchedule(day as keyof WeekSchedule, {
                          workingHours: { ...schedule.workingHours, start: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">End Time</Label>
                      <Input
                        type="time"
                        value={schedule.workingHours.end}
                        onChange={(e) => updateDaySchedule(day as keyof WeekSchedule, {
                          workingHours: { ...schedule.workingHours, end: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  {/* Breaks */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm text-gray-600">Breaks</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addBreak(day as keyof WeekSchedule)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Break
                      </Button>
                    </div>
                    
                    {schedule.breaks.map((breakTime: TimeSlot, index: number) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <Input
                          type="time"
                          value={breakTime.start}
                          onChange={(e) => updateBreak(day as keyof WeekSchedule, index, {
                            ...breakTime,
                            start: e.target.value
                          })}
                          className="flex-1"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={breakTime.end}
                          onChange={(e) => updateBreak(day as keyof WeekSchedule, index, {
                            ...breakTime,
                            end: e.target.value
                          })}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeBreak(day as keyof WeekSchedule, index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* General Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Buffer Time</span>
            </CardTitle>
            <CardDescription>Time between appointments for preparation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={settings.bufferTime}
                onChange={(e) => setSettings(prev => ({ ...prev, bufferTime: parseInt(e.target.value) || 0 }))}
                className="w-20"
                min="0"
                max="60"
              />
              <span className="text-sm text-gray-600">minutes</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Booking Rules</span>
            </CardTitle>
            <CardDescription>How far in advance clients can book</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">Maximum advance booking</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={settings.advanceBookingDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, advanceBookingDays: parseInt(e.target.value) || 0 }))}
                  className="w-20"
                  min="1"
                  max="365"
                />
                <span className="text-sm text-gray-600">days</span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-gray-600">Minimum notice required</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={settings.minimumNoticeHours}
                  onChange={(e) => setSettings(prev => ({ ...prev, minimumNoticeHours: parseInt(e.target.value) || 0 }))}
                  className="w-20"
                  min="0"
                  max="168"
                />
                <span className="text-sm text-gray-600">hours</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}