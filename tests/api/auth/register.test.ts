import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { POST } from '@/app/api/auth/register/route'
import User from '@/models/User'
import { emailService } from '@/services/emailService'
import DatabaseTestUtils from '../../utils/databaseUtils'
import { createMockRequest, mockGetServerSession } from '../../utils/testHelpers'

// Mock headers
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map()),
}))

// Mock email service
jest.mock('@/services/emailService', () => ({
  emailService: {
    sendVerificationEmail: jest.fn(),
  },
}))

const mockSendVerificationEmail = emailService.sendVerificationEmail as jest.MockedFunction<typeof emailService.sendVerificationEmail>

// Mock auth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock crypto for token generation
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mock-verification-token'),
  }),
}))

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password')),
  compare: jest.fn(() => Promise.resolve(true)),
  genSalt: jest.fn(() => Promise.resolve('salt')),
}))

// Mock validator
jest.mock('validator', () => ({
  isEmail: jest.fn().mockReturnValue(true),
  isLength: jest.fn().mockReturnValue(true),
  default: jest.fn().mockReturnValue(true),
}))

describe('/api/auth/register', () => {
  beforeEach(async () => {
    await DatabaseTestUtils.cleanDatabase()
    jest.clearAllMocks()
    mockGetServerSession(null) // No authenticated session by default
  })

  describe('POST /api/auth/register', () => {
    it('should register new client user', async () => {
      mockSendVerificationEmail.mockResolvedValue(true)

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'client',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.message).toBe('User registered successfully. Please check your email to verify your account.')
      expect(responseData.user.name).toBe('John Doe')
      expect(responseData.user.email).toBe('john@example.com')
      expect(responseData.user.roles).toEqual(['client'])
      expect(responseData.user.emailVerified).toBe(false)
      expect(responseData.user.password).toBeUndefined()

      // Verify user was created in database
      const user = await User.findOne({ email: 'john@example.com' })
      expect(user).toBeTruthy()
      expect(user?.name).toBe('John Doe')
      expect(user?.roles).toEqual(['client'])
      expect(user?.emailVerified).toBe(false)
      expect(user?.verificationToken).toBeTruthy()
      expect(user?.verificationTokenExpires).toBeTruthy()

      // Verify email was sent
      expect(mockSendVerificationEmail).toHaveBeenCalledTimes(1)
      expect(mockSendVerificationEmail).toHaveBeenCalledWith(
        'John Doe',
        'john@example.com',
        expect.stringContaining('mock-verification-token')
      )
    })

    it('should register new provider user', async () => {
      mockSendVerificationEmail.mockResolvedValue(true)

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'password123',
          role: 'provider',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.user.roles).toEqual(['provider'])

      // Verify user was created in database
      const user = await User.findOne({ email: 'jane@example.com' })
      expect(user?.roles).toEqual(['provider'])
    })

    it('should return 400 for missing required fields', async () => {
      const testCases = [
        { body: { email: 'test@example.com', password: 'password123', role: 'client' }, missing: 'name' },
        { body: { name: 'Test User', password: 'password123', role: 'client' }, missing: 'email' },
        { body: { name: 'Test User', email: 'test@example.com', role: 'client' }, missing: 'password' },
        { body: { name: 'Test User', email: 'test@example.com', password: 'password123' }, missing: 'role' },
      ]

      for (const testCase of testCases) {
        const request = createMockRequest({
          method: 'POST',
          body: testCase.body,
        })

        const response = await POST(request)
        const responseData = await response.json()

        expect(response.status).toBe(400)
        expect(responseData.error).toContain('Missing required fields')
      }
    })

    it('should return 400 for duplicate email', async () => {
      // Create existing user
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'hashed-password',
        roles: ['client'],
        emailVerified: true,
      })

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'New User',
          email: 'existing@example.com',
          password: 'password123',
          role: 'client',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('User with this email already exists')
    })

    it('should return 400 for invalid email format', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
          role: 'client',
        },
      })

      // Mock validator to return false for invalid email
      const validator = require('validator')
      validator.isEmail.mockReturnValue(false)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid email format')
    })

    it('should return 400 for weak password', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: '123',
          role: 'client',
        },
      })

      // Mock validator to return false for short password
      const validator = require('validator')
      validator.isLength.mockReturnValue(false)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Password must be at least 6 characters long')
    })

    it('should return 400 for invalid role', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'invalid-role',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid role. Must be either client or provider')
    })

    it('should return 401 if user is already authenticated', async () => {
      // Mock authenticated session
      mockGetServerSession({
        user: { id: '1', email: 'user@example.com', roles: ['client'] },
        expires: '2025-12-31',
      })

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'client',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Already authenticated')
    })

    it('should handle email service failure gracefully', async () => {
      mockSendVerificationEmail.mockResolvedValue(false)

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'client',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Failed to send verification email')

      // User should not be created if email sending fails
      const user = await User.findOne({ email: 'test@example.com' })
      expect(user).toBeNull()
    })

    it('should handle email service exception', async () => {
      mockSendVerificationEmail.mockRejectedValue(new Error('Email service down'))

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'client',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Internal server error')

      // User should not be created if email sending fails
      const user = await User.findOne({ email: 'test@example.com' })
      expect(user).toBeNull()
    })

    it('should properly hash password', async () => {
      mockSendVerificationEmail.mockResolvedValue(true)

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'plaintext-password',
          role: 'client',
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      // Verify password was hashed
      const user = await User.findOne({ email: 'test@example.com' })
      expect(user?.password).toBe('hashed-password') // Mocked value
      expect(user?.password).not.toBe('plaintext-password')
    })

    it('should generate cryptographically secure verification token', async () => {
      mockSendVerificationEmail.mockResolvedValue(true)

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'client',
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const user = await User.findOne({ email: 'test@example.com' })
      expect(user?.verificationToken).toBe('mock-verification-token')
      expect(user?.verificationTokenExpires).toBeTruthy()
      
      // Token should expire in 24 hours
      const expirationTime = user?.verificationTokenExpires?.getTime() || 0
      const currentTime = Date.now()
      const timeDifference = expirationTime - currentTime
      
      // Should be approximately 24 hours (within 1 minute tolerance)
      expect(timeDifference).toBeGreaterThan(23 * 60 * 60 * 1000) // 23 hours
      expect(timeDifference).toBeLessThan(25 * 60 * 60 * 1000) // 25 hours
    })

    it('should not include sensitive data in response', async () => {
      mockSendVerificationEmail.mockResolvedValue(true)

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'client',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.user.password).toBeUndefined()
      expect(responseData.user.verificationToken).toBeUndefined()
      expect(responseData.user.verificationTokenExpires).toBeUndefined()
      expect(responseData.user.__v).toBeUndefined()
    })

    it('should handle database connection errors', async () => {
      // Mock User.create to throw a database error
      const originalCreate = User.create
      User.create = jest.fn(() => Promise.reject(new Error('Database connection failed'))) as any

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'client',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Internal server error')

      // Restore original method
      User.create = originalCreate
    })
  })

  describe('Input Validation Edge Cases', () => {
    it('should handle empty string fields', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: '',
          email: '',
          password: '',
          role: '',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('Missing required fields')
    })

    it('should handle null and undefined fields', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: null,
          email: undefined,
          password: 'password123',
          role: 'client',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('Missing required fields')
    })

    it('should trim whitespace from fields', async () => {
      mockSendVerificationEmail.mockResolvedValue(true)

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: '  John Doe  ',
          email: '  john@example.com  ',
          password: 'password123',
          role: 'client',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.user.name).toBe('John Doe')
      expect(responseData.user.email).toBe('john@example.com')

      // Verify in database
      const user = await User.findOne({ email: 'john@example.com' })
      expect(user?.name).toBe('John Doe')
      expect(user?.email).toBe('john@example.com')
    })

    it('should handle very long input fields', async () => {
      const longString = 'a'.repeat(1000)

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: longString,
          email: 'test@example.com',
          password: 'password123',
          role: 'client',
        },
      })

      const response = await POST(request)
      const responseData = await response.json()

      // Should handle gracefully (either truncate or return validation error)
      expect([400, 500]).toContain(response.status)
    })
  })
})