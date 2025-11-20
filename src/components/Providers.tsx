'use client'

import { SessionProvider } from 'next-auth/react'
import { AccessibilityProvider } from './AccessibilityProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AccessibilityProvider>
        {children}
      </AccessibilityProvider>
    </SessionProvider>
  )
}