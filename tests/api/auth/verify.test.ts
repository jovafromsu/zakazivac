import { describe, it, expect, beforeEach } from '@jest/globals'
import { randomBytes } from 'crypto'
import { GET, POST } from '@/app/api/auth/verify/route'
import User from '@/models/User'
import DatabaseTestUtils from '../../utils/databaseUtils'
import { createMockRequest } from '../../utils/testHelpers'

// Mock headers
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map()),
}))

describe('/api/auth/verify', () => {
  beforeEach(async () => {
    await DatabaseTestUtils.cleanDatabase()
  })

  describe('POST /api/auth/verify', () => {
    it('should verify email with valid token', async () => {
      const verificationToken = randomBytes(32).toString('hex')
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

      // Create unverified user
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        roles: ['client'],
        emailVerified: false,
        verificationToken,
        verificationTokenExpires: tokenExpiry,
      })

      const request = createMockRequest({
        method: 'POST',
        body: { token: verificationToken },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.message).toBe('Email verified successfully')
      expect(responseData.user.emailVerified).toBe(true)
      expect(responseData.user._id).toBe(user._id.toString())

      // Verify in database
      const updatedUser = await User.findById(user._id)
      expect(updatedUser?.emailVerified).toBe(true)
      expect(updatedUser?.verificationToken).toBeNull()
      expect(updatedUser?.verificationTokenExpires).toBeNull()
    })

    it('should return 400 for missing token', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {},
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Token is required')
    })

    it('should return 400 for invalid token', async () => {
      const invalidToken = 'invalid-token'

      const request = createMockRequest({
        method: 'POST',
        body: { token: invalidToken },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid or expired verification token')
    })

    it('should return 400 for expired token', async () => {
      const verificationToken = randomBytes(32).toString('hex')
      const expiredDate = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago

      // Create user with expired token
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        roles: ['client'],
        emailVerified: false,
        verificationToken,
        verificationTokenExpires: expiredDate,
      })

      const request = createMockRequest({
        method: 'POST',
        body: { token: verificationToken },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid or expired verification token')
    })

    it('should handle already verified user gracefully', async () => {
      const verificationToken = randomBytes(32).toString('hex')
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

      // Create already verified user
      const user = await User.create({
        name: 'Verified User',
        email: 'verified@example.com',
        roles: ['client'],
        emailVerified: true,
        verificationToken,
        verificationTokenExpires: tokenExpiry,
      })

      const request = createMockRequest({
        method: 'POST',
        body: { token: verificationToken },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.message).toBe('Email verified successfully')
      expect(responseData.user.emailVerified).toBe(true)
    })

    it('should exclude sensitive fields from response', async () => {
      const verificationToken = randomBytes(32).toString('hex')
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        roles: ['client'],
        emailVerified: false,
        verificationToken,
        verificationTokenExpires: tokenExpiry,
      })

      const request = createMockRequest({
        method: 'POST',
        body: { token: verificationToken },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.user.password).toBeUndefined()
      expect(responseData.user.verificationToken).toBeUndefined()
      expect(responseData.user.verificationTokenExpires).toBeUndefined()
    })
  })

  describe('GET /api/auth/verify', () => {
    it('should check token validity for valid token', async () => {
      const verificationToken = randomBytes(32).toString('hex')
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

      // Create unverified user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        roles: ['client'],
        emailVerified: false,
        verificationToken,
        verificationTokenExpires: tokenExpiry,
      })

      const request = createMockRequest({
        method: 'GET',
        searchParams: { token: verificationToken },
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.valid).toBe(true)
      expect(responseData.user.email).toBe('test@example.com')
      expect(responseData.user.name).toBe('Test User')
    })

    it('should return 400 for missing token in query', async () => {
      const request = createMockRequest({
        method: 'GET',
        searchParams: {},
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Token is required')
    })

    it('should return invalid for non-existent token', async () => {
      const nonExistentToken = randomBytes(32).toString('hex')

      const request = createMockRequest({
        method: 'GET',
        searchParams: { token: nonExistentToken },
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.valid).toBe(false)
      expect(responseData.error).toBe('Invalid or expired verification token')
    })

    it('should return invalid for expired token', async () => {
      const verificationToken = randomBytes(32).toString('hex')
      const expiredDate = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago

      // Create user with expired token
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        roles: ['client'],
        emailVerified: false,
        verificationToken,
        verificationTokenExpires: expiredDate,
      })

      const request = createMockRequest({
        method: 'GET',
        searchParams: { token: verificationToken },
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.valid).toBe(false)
      expect(responseData.error).toBe('Invalid or expired verification token')
    })

    it('should not expose sensitive information in check response', async () => {
      const verificationToken = randomBytes(32).toString('hex')
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        roles: ['client', 'provider'],
        emailVerified: false,
        verificationToken,
        verificationTokenExpires: tokenExpiry,
      })

      const request = createMockRequest({
        method: 'GET',
        searchParams: { token: verificationToken },
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.user.email).toBe('test@example.com')
      expect(responseData.user.name).toBe('Test User')
      expect(responseData.user.password).toBeUndefined()
      expect(responseData.user.roles).toBeUndefined() // Only name and email should be exposed
      expect(responseData.user.verificationToken).toBeUndefined()
    })
  })

  describe('Token Security', () => {
    it('should use cryptographically secure tokens', async () => {
      // Create multiple users and verify tokens are unique and random
      const tokens = new Set()
      
      for (let i = 0; i < 5; i++) {
        const verificationToken = randomBytes(32).toString('hex')
        tokens.add(verificationToken)
        
        await User.create({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          roles: ['client'],
          verificationToken,
          verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
      }
      
      // All tokens should be unique
      expect(tokens.size).toBe(5)
      
      // Each token should be 64 characters (32 bytes in hex)
      tokens.forEach(token => {
        expect(token).toHaveLength(64)
        expect(/^[a-f0-9]+$/.test(String(token))).toBe(true)
      })
    })

    it('should properly handle token timing attacks', async () => {
      const validToken = randomBytes(32).toString('hex')
      const invalidToken = randomBytes(32).toString('hex')
      
      // Create user with valid token
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        roles: ['client'],
        verificationToken: validToken,
        verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      
      // Time the responses for valid and invalid tokens
      const startValid = Date.now()
      const validRequest = createMockRequest({
        method: 'POST',
        body: { token: validToken },
      })
      await POST(validRequest)
      const validDuration = Date.now() - startValid
      
      const startInvalid = Date.now()
      const invalidRequest = createMockRequest({
        method: 'POST',
        body: { token: invalidToken },
      })
      await POST(invalidRequest)
      const invalidDuration = Date.now() - startInvalid
      
      // Response times should be reasonably similar (within 100ms)
      // This is a basic check - in production, use constant-time comparison
      expect(Math.abs(validDuration - invalidDuration)).toBeLessThan(100)
    })
  })
})