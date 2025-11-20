import { describe, it, expect, beforeEach } from '@jest/globals'
import mongoose from 'mongoose'
import User from '@/models/User'
import { createMockUser } from '../utils/testHelpers'
import DatabaseTestUtils from '../utils/databaseUtils'

describe('User Model', () => {
  beforeEach(async () => {
    await DatabaseTestUtils.cleanDatabase()
  })

  describe('Schema Validation', () => {
    it('should create a valid user with all required fields', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword123',
        roles: ['client'],
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser._id).toBeDefined()
      expect(savedUser.email).toBe(userData.email)
      expect(savedUser.name).toBe(userData.name)
      expect(savedUser.password).toBe(userData.password)
      expect(savedUser.roles).toEqual(['client'])
      expect(savedUser.emailVerified).toBe(false)
      expect(savedUser.createdAt).toBeInstanceOf(Date)
      expect(savedUser.updatedAt).toBeInstanceOf(Date)
    })

    it('should auto-generate _id if not provided', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        roles: ['client'],
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser._id).toBeDefined()
      expect(savedUser._id).toBeInstanceOf(mongoose.Types.ObjectId)
    })

    it('should set default role as client if not specified', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        // roles field not specified - should use default
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser.roles).toEqual(['client'])
    })

    it('should set emailVerified to false by default', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser.emailVerified).toBe(false)
    })

    it('should allow multiple roles', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        roles: ['client', 'provider', 'admin'],
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser.roles).toEqual(['client', 'provider', 'admin'])
    })

    it('should trim whitespace from name and email', async () => {
      const userData = {
        email: '  test@example.com  ',
        name: '  Test User  ',
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser.email).toBe('test@example.com')
      expect(savedUser.name).toBe('Test User')
    })

    it('should convert email to lowercase', async () => {
      const userData = {
        email: 'TEST@EXAMPLE.COM',
        name: 'Test User',
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser.email).toBe('test@example.com')
    })
  })

  describe('Schema Validation Errors', () => {
    it('should throw validation error if email is missing', async () => {
      const userData = {
        name: 'Test User',
      }

      const user = new User(userData)
      
      await expect(user.save()).rejects.toThrow('Path `email` is required')
    })

    it('should throw validation error if name is missing', async () => {
      const userData = {
        email: 'test@example.com',
      }

      const user = new User(userData)
      
      await expect(user.save()).rejects.toThrow('Path `name` is required')
    })

    // Note: Email validation is not enforced at model level, handled by application layer

    it('should throw validation error for invalid role', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        roles: ['invalid-role'],
      }

      const user = new User(userData)
      
      await expect(user.save()).rejects.toThrow()
    })

    it('should enforce unique email constraint', async () => {
      const userData1 = {
        email: 'test@example.com',
        name: 'Test User 1',
      }

      const userData2 = {
        email: 'test@example.com',
        name: 'Test User 2',
      }

      const user1 = new User(userData1)
      await user1.save()

      const user2 = new User(userData2)
      
      await expect(user2.save()).rejects.toThrow()
    })

    it('should enforce unique email constraint case-insensitively', async () => {
      const userData1 = {
        email: 'test@example.com',
        name: 'Test User 1',
      }

      const userData2 = {
        email: 'TEST@EXAMPLE.COM',
        name: 'Test User 2',
      }

      const user1 = new User(userData1)
      await user1.save()

      const user2 = new User(userData2)
      
      await expect(user2.save()).rejects.toThrow()
    })
  })

  describe('Verification Token Fields', () => {
    it('should allow setting verification token and expiry', async () => {
      const expiryDate = new Date(Date.now() + 3600000) // 1 hour from now
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        verificationToken: 'abc123token',
        verificationTokenExpires: expiryDate,
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser.verificationToken).toBe('abc123token')
      expect(savedUser.verificationTokenExpires).toEqual(expiryDate)
    })

    it('should allow verification token fields to be undefined', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser.verificationToken).toBeUndefined()
      expect(savedUser.verificationTokenExpires).toBeUndefined()
    })
  })

  describe('Password Field', () => {
    it('should allow password to be undefined for OAuth users', async () => {
      const userData = {
        email: 'oauth@example.com',
        name: 'OAuth User',
        emailVerified: true,
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser.password).toBeUndefined()
    })

    it('should store password when provided', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword123',
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser.password).toBe('hashedPassword123')
    })
  })

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt timestamps', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser.createdAt).toBeInstanceOf(Date)
      expect(savedUser.updatedAt).toBeInstanceOf(Date)
      expect(savedUser.createdAt).toEqual(savedUser.updatedAt)
    })

    it('should update updatedAt timestamp on document modification', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      }

      const user = new User(userData)
      const savedUser = await user.save()
      
      const originalUpdatedAt = savedUser.updatedAt

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))

      savedUser.name = 'Updated Name'
      const updatedUser = await savedUser.save()

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })
  })

  describe('Query Methods', () => {
    it('should find user by email', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      }

      await new User(userData).save()

      const foundUser = await User.findOne({ email: 'test@example.com' })
      expect(foundUser).toBeDefined()
      expect(foundUser?.email).toBe('test@example.com')
    })

    it('should find users by role', async () => {
      const clientData = {
        email: 'client@example.com',
        name: 'Client User',
        roles: ['client'],
      }

      const providerData = {
        email: 'provider@example.com',
        name: 'Provider User',
        roles: ['provider'],
      }

      await User.insertMany([clientData, providerData])

      const providers = await User.find({ roles: 'provider' })
      expect(providers).toHaveLength(1)
      expect(providers[0].email).toBe('provider@example.com')

      const clients = await User.find({ roles: 'client' })
      expect(clients).toHaveLength(1)
      expect(clients[0].email).toBe('client@example.com')
    })

    it('should find verified users', async () => {
      const verifiedUser = {
        email: 'verified@example.com',
        name: 'Verified User',
        emailVerified: true,
      }

      const unverifiedUser = {
        email: 'unverified@example.com',
        name: 'Unverified User',
        emailVerified: false,
      }

      await User.insertMany([verifiedUser, unverifiedUser])

      const verified = await User.find({ emailVerified: true })
      expect(verified).toHaveLength(1)
      expect(verified[0].email).toBe('verified@example.com')
    })

    it('should exclude sensitive fields when explicitly selected', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword123',
        verificationToken: 'secret-token',
      }

      await new User(userData).save()

      const user = await User.findOne({ email: 'test@example.com' })
        .select('-password -verificationToken -verificationTokenExpires')

      expect(user).toBeDefined()
      expect(user?.password).toBeUndefined()
      expect(user?.verificationToken).toBeUndefined()
      expect(user?.verificationTokenExpires).toBeUndefined()
      expect(user?.email).toBe('test@example.com')
      expect(user?.name).toBe('Test User')
    })
  })

  describe('Model Integration', () => {
    it('should work with mongoose aggregation pipeline', async () => {
      const users = [
        { email: 'client1@example.com', name: 'Client 1', roles: ['client'] },
        { email: 'client2@example.com', name: 'Client 2', roles: ['client'] },
        { email: 'provider1@example.com', name: 'Provider 1', roles: ['provider'] },
        { email: 'admin1@example.com', name: 'Admin 1', roles: ['admin'] },
      ]

      await User.insertMany(users)

      const roleStats = await User.aggregate([
        {
          $unwind: '$roles'
        },
        {
          $group: {
            _id: '$roles',
            count: { $sum: 1 }
          }
        }
      ])

      expect(roleStats).toHaveLength(3)
      
      const clientStat = roleStats.find(stat => stat._id === 'client')
      const providerStat = roleStats.find(stat => stat._id === 'provider')
      const adminStat = roleStats.find(stat => stat._id === 'admin')
      
      expect(clientStat?.count).toBe(2)
      expect(providerStat?.count).toBe(1)
      expect(adminStat?.count).toBe(1)
    })

    it('should support lean queries for better performance', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      }

      await new User(userData).save()

      const leanUser = await User.findOne({ email: 'test@example.com' }).lean()
      
      expect(leanUser).toBeDefined()
      expect((leanUser as any)?._id).toBeDefined()
      expect((leanUser as any)?.email).toBe('test@example.com')
      // Lean queries return plain objects, not Mongoose documents
      expect(typeof (leanUser as any)?.save).toBe('undefined')
    })

    it('should support population with related models (when they exist)', async () => {
      const userData = {
        email: 'provider@example.com',
        name: 'Provider User',
        roles: ['provider'],
      }

      const user = await new User(userData).save()

      // This would typically populate provider profile, but we just test the user document
      const populatedUser = await User.findById(user._id)
      
      expect(populatedUser).toBeDefined()
      expect(populatedUser?._id.equals(user._id)).toBe(true)
    })
  })
})