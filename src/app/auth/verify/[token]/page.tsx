'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface VerificationData {
  valid: boolean
  user?: {
    email: string
    name: string
  }
  error?: string
}

export default function VerifyPage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string
  
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')

  // Check token validity on component mount
  useEffect(() => {
    if (!token) {
      setError('No verification token provided')
      setLoading(false)
      return
    }

    checkTokenValidity()
  }, [token])

  const checkTokenValidity = async () => {
    try {
      const response = await fetch(`/api/auth/verify?token=${token}`)
      const data = await response.json()
      
      if (response.ok && data.valid) {
        setVerificationData(data)
      } else {
        setError(data.error || 'Invalid verification token')
      }
    } catch (error) {
      console.error('Token check error:', error)
      setError('Failed to verify token')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setVerified(true)
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin?message=Account verified successfully!')
        }, 3000)
      } else {
        setError(data.error || 'Verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setError('Failed to verify account')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <h1 className="text-xl font-semibold">Checking verification token...</h1>
            <p className="text-gray-600 text-center">Please wait while we verify your token.</p>
          </div>
        </Card>
      </div>
    )
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
            <h1 className="text-2xl font-bold text-green-800">Account Verified!</h1>
            <p className="text-gray-600 text-center">
              Your account has been successfully verified. You will be redirected to sign in shortly.
            </p>
            <div className="pt-4">
              <Link href="/auth/signin">
                <Button className="w-full">
                  Continue to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !verificationData?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-16 w-16 text-red-600" />
            <h1 className="text-2xl font-bold text-red-800">Verification Failed</h1>
            <p className="text-gray-600 text-center">
              {error || 'The verification link is invalid or has expired.'}
            </p>
            <div className="space-y-3 pt-4 w-full">
              <Link href="/auth/signup" className="block">
                <Button variant="outline" className="w-full">
                  Register Again
                </Button>
              </Link>
              <Link href="/auth/signin" className="block">
                <Button variant="ghost" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verify Your Account</h1>
          <p className="text-gray-600 mt-2">
            Hello <span className="font-semibold">{verificationData.user?.name}</span>!
            <br />
            Please set your password to complete registration.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {verificationData.user?.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                <div className="text-sm text-red-800">{error}</div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting || !password || !confirmPassword}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying Account...
              </>
            ) : (
              'Verify Account & Set Password'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}