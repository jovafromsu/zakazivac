'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail } from 'lucide-react'
import Link from 'next/link'

export default function SignupSuccess() {
  const searchParams = useSearchParams()
  const email = searchParams?.get('email') || ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">Registration Successful!</CardTitle>
          <CardDescription>
            We've sent a verification email to your inbox
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <Mail className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Verification email sent to:</span>
            </div>
            <p className="text-indigo-600 font-semibold break-all">
              {email}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Next Steps:</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>Set your password to complete registration</li>
              <li>Start using your Zakazivač account!</li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> The verification link expires in 24 hours. 
              If you don't verify your email within this time, you'll need to register again.
            </p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <a href={`mailto:${email}`} className="inline-flex items-center justify-center">
                <Mail className="mr-2 h-4 w-4" />
                Open Email App
              </a>
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              Didn't receive an email?{' '}
              <Link href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                Try registering again
              </Link>
            </div>
            
            <div className="text-center">
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-sm">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}