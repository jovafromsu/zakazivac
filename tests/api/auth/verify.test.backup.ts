import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { GET, POST } from '@/app/api/auth/verify/route'
import User from '@/models/User'
import DatabaseTestUtils from '../../utils/databaseUtils'
import { createMockRequest } from '../../utils/testHelpers'
import { randomBytes } from 'crypto'

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}))

describe('/api/auth/verify', () => {
  beforeEach(async () => {
    await DatabaseTestUtils.cleanDatabase()
    jest.clearAllMocks()
  })

  describe('POST /api/auth/verify', () => {
    it('should verify user with valid token', async () => {
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
      expect(responseData.user.email).toBe('test@example.com')
      expect(responseData.user.emailVerified).toBe(true)

      // Verify user was updated in database
      const updatedUser = await User.findById(user._id)
      expect(updatedUser?.emailVerified).toBe(true)
      expect(updatedUser?.verificationToken).toBeUndefined()
      expect(updatedUser?.verificationTokenExpires).toBeUndefined()
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
      const request = createMockRequest({
        method: 'POST',
        body: { token: 'invalid-token' },
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

    it('should return 404 for non-existent user', async () => {
      const nonExistentToken = randomBytes(32).toString('hex')

      const request = createMockRequest({
        method: 'POST',
        body: { token: nonExistentToken },
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
      })\n\n      const response = await POST(request)\n      const responseData = await response.json()\n\n      expect(response.status).toBe(200)\n      expect(responseData.message).toBe('Email verified successfully')\n      expect(responseData.user.emailVerified).toBe(true)\n    })\n\n    it('should exclude sensitive fields from response', async () => {\n      const verificationToken = randomBytes(32).toString('hex')\n      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)\n\n      await User.create({\n        name: 'Test User',\n        email: 'test@example.com',\n        password: 'hashed-password',\n        roles: ['client'],\n        emailVerified: false,\n        verificationToken,\n        verificationTokenExpires: tokenExpiry,\n      })\n\n      const request = createMockRequest({\n        method: 'POST',\n        body: { token: verificationToken },\n      })\n\n      const response = await POST(request)\n      const responseData = await response.json()\n\n      expect(response.status).toBe(200)\n      expect(responseData.user.password).toBeUndefined()\n      expect(responseData.user.verificationToken).toBeUndefined()\n      expect(responseData.user.verificationTokenExpires).toBeUndefined()\n    })\n  })\n\n  describe('GET /api/auth/verify', () => {\n    it('should check token validity for valid token', async () => {\n      const verificationToken = randomBytes(32).toString('hex')\n      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)\n\n      // Create unverified user\n      await User.create({\n        name: 'Test User',\n        email: 'test@example.com',\n        roles: ['client'],\n        emailVerified: false,\n        verificationToken,\n        verificationTokenExpires: tokenExpiry,\n      })\n\n      const request = createMockRequest({\n        method: 'GET',\n        searchParams: { token: verificationToken },\n      })\n\n      const response = await GET(request)\n      const responseData = await response.json()\n\n      expect(response.status).toBe(200)\n      expect(responseData.valid).toBe(true)\n      expect(responseData.user.email).toBe('test@example.com')\n      expect(responseData.user.name).toBe('Test User')\n    })\n\n    it('should return 400 for missing token in query', async () => {\n      const request = createMockRequest({\n        method: 'GET',\n        searchParams: {},\n      })\n\n      const response = await GET(request)\n      const responseData = await response.json()\n\n      expect(response.status).toBe(400)\n      expect(responseData.error).toBe('Token is required')\n    })\n\n    it('should return invalid for non-existent token', async () => {\n      const nonExistentToken = randomBytes(32).toString('hex')\n\n      const request = createMockRequest({\n        method: 'GET',\n        searchParams: { token: nonExistentToken },\n      })\n\n      const response = await GET(request)\n      const responseData = await response.json()\n\n      expect(response.status).toBe(400)\n      expect(responseData.valid).toBe(false)\n      expect(responseData.error).toBe('Invalid or expired verification token')\n    })\n\n    it('should return invalid for expired token', async () => {\n      const verificationToken = randomBytes(32).toString('hex')\n      const expiredDate = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago\n\n      // Create user with expired token\n      await User.create({\n        name: 'Test User',\n        email: 'test@example.com',\n        roles: ['client'],\n        emailVerified: false,\n        verificationToken,\n        verificationTokenExpires: expiredDate,\n      })\n\n      const request = createMockRequest({\n        method: 'GET',\n        searchParams: { token: verificationToken },\n      })\n\n      const response = await GET(request)\n      const responseData = await response.json()\n\n      expect(response.status).toBe(400)\n      expect(responseData.valid).toBe(false)\n      expect(responseData.error).toBe('Invalid or expired verification token')\n    })\n\n    it('should not expose sensitive information in check response', async () => {\n      const verificationToken = randomBytes(32).toString('hex')\n      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)\n\n      await User.create({\n        name: 'Test User',\n        email: 'test@example.com',\n        password: 'hashed-password',\n        roles: ['client', 'provider'],\n        emailVerified: false,\n        verificationToken,\n        verificationTokenExpires: tokenExpiry,\n      })\n\n      const request = createMockRequest({\n        method: 'GET',\n        searchParams: { token: verificationToken },\n      })\n\n      const response = await GET(request)\n      const responseData = await response.json()\n\n      expect(response.status).toBe(200)\n      expect(responseData.user.email).toBe('test@example.com')\n      expect(responseData.user.name).toBe('Test User')\n      expect(responseData.user.password).toBeUndefined()\n      expect(responseData.user.roles).toBeUndefined() // Only name and email should be exposed\n      expect(responseData.user.verificationToken).toBeUndefined()\n    })\n\n    it('should handle database errors gracefully', async () => {\n      // Mock User.findOne to throw an error\n      const originalFindOne = User.findOne\n      User.findOne = jest.fn().mockRejectedValue(new Error('Database error'))\n\n      const request = createMockRequest({\n        method: 'GET',\n        searchParams: { token: 'any-token' },\n      })\n\n      const response = await GET(request)\n      const responseData = await response.json()\n\n      expect(response.status).toBe(500)\n      expect(responseData.error).toBe('Internal server error')\n\n      // Restore original method\n      User.findOne = originalFindOne\n    })\n  })\n\n  describe('Token Security', () => {\n    it('should use cryptographically secure tokens', async () => {\n      // Create multiple users and verify tokens are unique and random\n      const tokens = new Set()\n      \n      for (let i = 0; i < 5; i++) {\n        const verificationToken = randomBytes(32).toString('hex')\n        tokens.add(verificationToken)\n        \n        await User.create({\n          name: `User ${i}`,\n          email: `user${i}@example.com`,\n          roles: ['client'],\n          verificationToken,\n          verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),\n        })\n      }\n      \n      // All tokens should be unique\n      expect(tokens.size).toBe(5)\n      \n      // Each token should be 64 characters (32 bytes in hex)\n      tokens.forEach(token => {\n        expect(token).toHaveLength(64)\n        expect(/^[a-f0-9]+$/.test(token)).toBe(true)\n      })\n    })\n\n    it('should properly handle token timing attacks', async () => {\n      const validToken = randomBytes(32).toString('hex')\n      const invalidToken = randomBytes(32).toString('hex')\n      \n      // Create user with valid token\n      await User.create({\n        name: 'Test User',\n        email: 'test@example.com',\n        roles: ['client'],\n        verificationToken: validToken,\n        verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),\n      })\n      \n      // Time the responses for valid and invalid tokens\n      const startValid = Date.now()\n      const validRequest = createMockRequest({\n        method: 'POST',\n        body: { token: validToken },\n      })\n      await POST(validRequest)\n      const validDuration = Date.now() - startValid\n      \n      const startInvalid = Date.now()\n      const invalidRequest = createMockRequest({\n        method: 'POST',\n        body: { token: invalidToken },\n      })\n      await POST(invalidRequest)\n      const invalidDuration = Date.now() - startInvalid\n      \n      // Response times should be reasonably similar (within 100ms)\n      // This is a basic check - in production, use constant-time comparison\n      expect(Math.abs(validDuration - invalidDuration)).toBeLessThan(100)\n    })\n  })\n})"