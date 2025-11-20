import '@testing-library/jest-dom'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'

// Set required environment variables for API route imports
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db'
}
if (!process.env.MAILGUN_API_KEY) {
  process.env.MAILGUN_API_KEY = 'test-key'
}
if (!process.env.MAILGUN_DOMAIN) {
  process.env.MAILGUN_DOMAIN = 'test-domain'
}

// Global test configuration
let mongoServer: MongoMemoryServer

// Setup before all tests
beforeAll(async () => {
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri)
})

// Cleanup after all tests
afterAll(async () => {
  // Disconnect from database
  await mongoose.disconnect()
  
  // Stop MongoDB Memory Server
  await mongoServer?.stop()
})

// Clean up between each test
beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections
  
  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
})

// Additional cleanup
afterEach(async () => {
  // Clear any remaining mocks or timers
  jest.clearAllMocks()
  jest.clearAllTimers()
})

// Global test timeout
jest.setTimeout(30000)

// Mock environment variables for tests
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true,
  configurable: true
})
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Mock console methods to reduce noise in tests (optional)
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    // Only suppress known test-related warnings
    if (
      args[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
      args[0]?.includes?.('Warning: `ReactDOMTestUtils.act`')
    ) {
      return
    }
    originalConsoleError(...args)
  }
  
  console.warn = (...args) => {
    // Suppress known warnings during tests
    if (
      args[0]?.includes?.('componentWillReceiveProps') ||
      args[0]?.includes?.('componentWillUpdate')
    ) {
      return
    }
    originalConsoleWarn(...args)
  }
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

// Export test utilities
export { mongoServer }