'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PageLayout from '@/components/PageLayout'

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roles: ['client'] as ('client' | 'provider')[],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          roles: formData.roles,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/auth/signup/success?email=${encodeURIComponent(formData.email)}`)
      } else {
        setError(data.error || 'An error occurred')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = (role: 'client' | 'provider', checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        roles: [...prev.roles, role]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        roles: prev.roles.filter(r => r !== role)
      }))
    }
  }

  return (
    <PageLayout>
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Sign Up</CardTitle>
          <CardDescription className="text-center">
            Create your Zakazivač account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="text-blue-800 text-sm">
                  <strong>How it works:</strong>
                  <br />
                  We'll send you a verification email with a link to set your password and activate your account.
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I want to:
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes('client')}
                    onChange={(e) => handleRoleChange('client', e.target.checked)}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  Book appointments (Client)
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes('provider')}
                    onChange={(e) => handleRoleChange('provider', e.target.checked)}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  Offer services (Provider)
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || formData.roles.length === 0}
            >
              {isLoading ? 'Sending verification email...' : 'Send Verification Email'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </PageLayout>
  )
}