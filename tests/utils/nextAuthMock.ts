/**
 * NextAuth Mocking Utilities for Jest Tests
 * Handles proper mocking of NextAuth getServerSession in API route tests
 */

import { DefaultSession } from 'next-auth'

interface MockSession extends DefaultSession {
  user: {
    id: string
    roles: string[]
  } & DefaultSession["user"]
}

// Global mock session storage for shared access
let globalMockSession: MockSession | null = null
let mockGetServerSessionFn: jest.MockedFunction<any> | null = null

// Mock implementation of getServerSession that doesn't require headers
export function createMockGetServerSession() {
  mockGetServerSessionFn = jest.fn().mockImplementation(async () => {
    // Return the globally stored mock session
    return globalMockSession
  })
  return mockGetServerSessionFn
}

// Get the current mock function
export function getMockGetServerSession() {
  return mockGetServerSessionFn
}

// Set the global mock session
export function setMockSession(session: MockSession | null) {
  globalMockSession = session
}

// Helper to create admin session
export function createAdminSession(userId: string = 'admin-user-id'): MockSession {
  return {
    user: {
      id: userId,
      email: 'admin@zakazivac.app',
      name: 'Admin User',
      roles: ['admin'],
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

// Helper to create provider session
export function createProviderSession(userId: string = 'provider-user-id'): MockSession {
  return {
    user: {
      id: userId,
      email: 'provider@example.com',
      name: 'Provider User',
      roles: ['provider'],
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

// Helper to create client session
export function createClientSession(userId: string = 'client-user-id'): MockSession {
  return {
    user: {
      id: userId,
      email: 'client@example.com',
      name: 'Client User',
      roles: ['client'],
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

// Setup complete NextAuth and Next.js mocking
export function setupNextAuthMocks() {
  // Mock next-auth completely
  jest.mock('next-auth', () => ({
    getServerSession: createMockGetServerSession(),
  }))

  // Mock headers to return proper Headers-like object
  const mockHeaders = {
    getAll: jest.fn(() => []),
    get: jest.fn(() => null),
    has: jest.fn(() => false),
    forEach: jest.fn(),
    keys: jest.fn(() => []),
    values: jest.fn(() => []),
    entries: jest.fn(() => []),
  }

  jest.mock('next/headers', () => ({
    headers: jest.fn(() => mockHeaders),
    cookies: jest.fn(() => new Map()),
  }))

  // Mock MongoDB connection
  jest.mock('@/lib/mongodb', () => ({
    __esModule: true,
    default: jest.fn(() => Promise.resolve()),
  }))
}

export default {
  createMockGetServerSession,
  setMockSession,
  createAdminSession,
  createProviderSession,
  createClientSession,
  setupNextAuthMocks,
}