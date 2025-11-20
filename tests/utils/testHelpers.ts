import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import { AuthOptions } from 'next-auth'

// Mock user data factory
export const createMockUser = (overrides: Partial<any> = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  name: 'Test User',
  roles: ['client'],
  emailVerified: true,
  password: 'hashedPassword',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockProvider = (overrides: Partial<any> = {}) => ({
  ...createMockUser({
    roles: ['provider'],
    email: 'provider@example.com',
    name: 'Test Provider',
    ...overrides,
  }),
})

export const createMockAdmin = (overrides: Partial<any> = {}) => ({
  ...createMockUser({
    roles: ['admin'],
    email: 'admin@example.com',
    name: 'Test Admin',
    ...overrides,
  }),
})

// Mock provider profile factory
export const createMockProviderProfile = (overrides: Partial<any> = {}) => ({
  _id: '507f1f77bcf86cd799439012',
  userId: '507f1f77bcf86cd799439011',
  businessName: 'Test Business',
  description: 'Test business description',
  contactInfo: {
    phone: '+381601234567',
    email: 'business@example.com',
    address: 'Test Address, Belgrade',
  },
  timezone: 'Europe/Belgrade',
  isActive: true,
  availabilitySettings: {
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '17:00' },
    sunday: { enabled: false, start: '09:00', end: '17:00' },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Mock service factory
export const createMockService = (overrides: Partial<any> = {}) => ({
  _id: '507f1f77bcf86cd799439013',
  providerId: '507f1f77bcf86cd799439012',
  name: 'Test Service',
  description: 'Test service description',
  categoryId: '507f1f77bcf86cd799439014',
  durationMinutes: 60,
  price: 100,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Mock category factory
export const createMockCategory = (overrides: Partial<any> = {}) => ({
  _id: '507f1f77bcf86cd799439014',
  name: 'Test Category',
  slug: 'test-category',
  description: 'Test category description',
  isActive: true,
  sortOrder: 0,
  createdBy: new mongoose.Types.ObjectId(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Mock booking factory
export const createMockBooking = (overrides: Partial<any> = {}) => ({
  _id: '507f1f77bcf86cd799439015',
  clientId: '507f1f77bcf86cd799439011',
  providerId: '507f1f77bcf86cd799439012',
  serviceId: '507f1f77bcf86cd799439013',
  start: new Date('2024-12-01T10:00:00.000Z'),
  end: new Date('2024-12-01T11:00:00.000Z'),
  status: 'confirmed',
  note: 'Test booking notes',
  googleEventId: null,
  syncStatus: 'ok',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Mock Google integration factory
export const createMockGoogleIntegration = (overrides: Partial<any> = {}) => ({
  _id: '507f1f77bcf86cd799439016',
  providerId: new mongoose.Types.ObjectId(),
  googleAccountEmail: 'provider@gmail.com',
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  calendarId: 'primary',
  tokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Mock NextAuth session factory
export const createMockSession = (user: any = createMockUser()) => ({
  user: {
    id: user._id || user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
    image: null,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
})

// Mock NextRequest factory
export const createMockRequest = (options: {
  method?: string
  url?: string
  body?: any
  headers?: Record<string, string>
  searchParams?: Record<string, string>
} = {}) => {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    body,
    headers = {},
    searchParams = {},
  } = options

  const mockUrl = new URL(url)
  
  // Add search params
  Object.entries(searchParams).forEach(([key, value]) => {
    mockUrl.searchParams.set(key, value)
  })

  const mockRequest = {
    method,
    url: mockUrl.toString(),
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers,
    }),
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as NextRequest

  // Add URL property
  Object.defineProperty(mockRequest, 'url', {
    value: mockUrl.toString(),
    writable: false,
  })

  return mockRequest
}

// Mock getServerSession
export const mockGetServerSession = (session: any = null) => {
  const mockedGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
  mockedGetServerSession.mockResolvedValue(session)
  return mockedGetServerSession
}

// Clear all mocks helper
export const clearAllMocks = () => {
  jest.clearAllMocks()
  jest.clearAllTimers()
}

// Database utilities
export const cleanDatabase = async () => {
  const mongoose = require('mongoose')
  const collections = mongoose.connection.collections
  
  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
}

// Test database connection
export const connectTestDatabase = async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server')
  const mongoose = require('mongoose')
  
  const mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  
  await mongoose.connect(mongoUri)
  
  return { mongoServer, mongoUri }
}

// Disconnect test database
export const disconnectTestDatabase = async (mongoServer: any) => {
  const mongoose = require('mongoose')
  await mongoose.disconnect()
  await mongoServer?.stop()
}