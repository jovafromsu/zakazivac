import mongoose from 'mongoose'

/**
 * Database test utilities for MongoDB operations
 */
export class DatabaseTestUtils {
  /**
   * Clean all collections in the test database
   */
  static async cleanDatabase(): Promise<void> {
    const collections = mongoose.connection.collections
    
    const promises = Object.keys(collections).map(async (key) => {
      const collection = collections[key]
      await collection.deleteMany({})
    })
    
    await Promise.all(promises)
  }

  /**
   * Drop all collections and indexes
   */
  static async dropDatabase(): Promise<void> {
    await mongoose.connection.dropDatabase()
  }

  /**
   * Create test indexes for better performance
   */
  static async createTestIndexes(): Promise<void> {
    // Create indexes for commonly used fields in tests
    const collections = mongoose.connection.collections
    
    // User collection indexes
    if (collections.users) {
      await collections.users.createIndex({ email: 1 }, { unique: true })
      await collections.users.createIndex({ roles: 1 })
    }
    
    // Provider profile indexes
    if (collections.providerprofiles) {
      await collections.providerprofiles.createIndex({ userId: 1 }, { unique: true })
      await collections.providerprofiles.createIndex({ isActive: 1 })
    }
    
    // Service indexes
    if (collections.services) {
      await collections.services.createIndex({ providerId: 1 })
      await collections.services.createIndex({ categoryId: 1 })
      await collections.services.createIndex({ isActive: 1 })
    }
    
    // Booking indexes
    if (collections.bookings) {
      await collections.bookings.createIndex({ clientId: 1 })
      await collections.bookings.createIndex({ providerId: 1 })
      await collections.bookings.createIndex({ startTime: 1 })
      await collections.bookings.createIndex({ status: 1 })
    }
  }

  /**
   * Get database connection state
   */
  static getConnectionState(): string {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting']
    return states[mongoose.connection.readyState] || 'unknown'
  }

  /**
   * Wait for database connection
   */
  static async waitForConnection(timeout = 10000): Promise<void> {
    const start = Date.now()
    
    while (mongoose.connection.readyState !== 1) {
      if (Date.now() - start > timeout) {
        throw new Error(`Database connection timeout after ${timeout}ms`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  /**
   * Get collection statistics
   */
  static async getCollectionStats(): Promise<Record<string, number>> {
    const collections = mongoose.connection.collections
    const stats: Record<string, number> = {}
    
    for (const [name, collection] of Object.entries(collections)) {
      stats[name] = await collection.countDocuments()
    }
    
    return stats
  }

  /**
   * Seed test data
   */
  static async seedTestData(): Promise<{
    users: any[]
    providers: any[]
    services: any[]
    categories: any[]
    bookings: any[]
  }> {
    // Import models
    const User = mongoose.models.User || require('@/models/User').default
    const ProviderProfile = mongoose.models.ProviderProfile || require('@/models/ProviderProfile').default
    const Service = mongoose.models.Service || require('@/models/Service').default
    const Category = mongoose.models.Category || require('@/models/Category').default
    const Booking = mongoose.models.Booking || require('@/models/Booking').default
    
    // Clean existing data
    await this.cleanDatabase()
    
    // Create test categories
    const categories = await Category.insertMany([
      {
        name: 'Wellness & Spa',
        description: 'Wellness and spa services',
        isActive: true,
      },
      {
        name: 'Medical Services',
        description: 'Medical and healthcare services',
        isActive: true,
      },
      {
        name: 'Beauty Services',
        description: 'Beauty and cosmetic services',
        isActive: true,
      },
    ])
    
    // Create test users
    const users = await User.insertMany([
      {
        email: 'client@test.com',
        name: 'Test Client',
        roles: ['client'],
        emailVerified: true,
      },
      {
        email: 'provider@test.com',
        name: 'Test Provider',
        roles: ['provider'],
        emailVerified: true,
      },
      {
        email: 'admin@test.com',
        name: 'Test Admin',
        roles: ['admin'],
        emailVerified: true,
      },
      {
        email: 'multiprovider@test.com',
        name: 'Multi Role Provider',
        roles: ['client', 'provider'],
        emailVerified: true,
      },
    ])
    
    // Create provider profiles
    const providers = await ProviderProfile.insertMany([
      {
        userId: users[1]._id, // Test Provider
        businessName: 'Test Wellness Center',
        description: 'Premium wellness and spa services',
        contactInfo: {
          phone: '+381601234567',
          email: 'business@test.com',
          address: 'Test Street 123, Belgrade',
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
      },
      {
        userId: users[3]._id, // Multi Role Provider
        businessName: 'Multi Service Provider',
        description: 'Multiple services provider',
        contactInfo: {
          phone: '+381607654321',
          email: 'multi@test.com',
          address: 'Multi Street 456, Belgrade',
        },
        timezone: 'Europe/Belgrade',
        isActive: true,
        availabilitySettings: {
          monday: { enabled: true, start: '08:00', end: '18:00' },
          tuesday: { enabled: true, start: '08:00', end: '18:00' },
          wednesday: { enabled: true, start: '08:00', end: '18:00' },
          thursday: { enabled: true, start: '08:00', end: '18:00' },
          friday: { enabled: true, start: '08:00', end: '18:00' },
          saturday: { enabled: true, start: '09:00', end: '15:00' },
          sunday: { enabled: false, start: '09:00', end: '15:00' },
        },
      },
    ])
    
    // Create test services
    const services = await Service.insertMany([
      {
        providerId: providers[0]._id,
        name: 'Massage Therapy',
        description: 'Relaxing massage therapy session',
        categoryId: categories[0]._id,
        durationMinutes: 60,
        price: 8000, // 80 EUR in dinars
        isActive: true,
      },
      {
        providerId: providers[0]._id,
        name: 'Facial Treatment',
        description: 'Professional facial treatment',
        categoryId: categories[2]._id,
        durationMinutes: 90,
        price: 10000, // 100 EUR in dinars
        isActive: true,
      },
      {
        providerId: providers[1]._id,
        name: 'Medical Consultation',
        description: 'General medical consultation',
        categoryId: categories[1]._id,
        durationMinutes: 30,
        price: 5000, // 50 EUR in dinars
        isActive: true,
      },
    ])
    
    // Create test bookings
    const bookings = await Booking.insertMany([
      {
        clientId: users[0]._id,
        providerId: providers[0]._id,
        serviceId: services[0]._id,
        startTime: new Date('2024-12-15T10:00:00.000Z'),
        endTime: new Date('2024-12-15T11:00:00.000Z'),
        status: 'confirmed',
        totalPrice: 8000,
        notes: 'Regular massage session',
      },
      {
        clientId: users[3]._id,
        providerId: providers[1]._id,
        serviceId: services[2]._id,
        startTime: new Date('2024-12-16T14:00:00.000Z'),
        endTime: new Date('2024-12-16T14:30:00.000Z'),
        status: 'pending',
        totalPrice: 5000,
        notes: 'Medical checkup',
      },
    ])
    
    return {
      users: users.map(u => u.toObject()),
      providers: providers.map(p => p.toObject()),
      services: services.map(s => s.toObject()),
      categories: categories.map(c => c.toObject()),
      bookings: bookings.map(b => b.toObject()),
    }
  }
}

export default DatabaseTestUtils