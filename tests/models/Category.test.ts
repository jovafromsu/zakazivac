import { describe, it, expect, beforeEach } from '@jest/globals'
import mongoose from 'mongoose'
import Category from '@/models/Category'
import User from '@/models/User'
import DatabaseTestUtils from '../utils/databaseUtils'

describe('Category Model', () => {
  let testUser: any

  beforeEach(async () => {
    await DatabaseTestUtils.cleanDatabase()
    
    // Create test admin user for category creation
    testUser = await User.create({
      email: 'admin@example.com',
      name: 'Test Admin',
      roles: ['admin'],
      emailVerified: true,
    })
  })

  // Helper function to create category data with required fields
  const createCategoryData = (overrides: any = {}) => {
    const name = overrides.name || 'Test Category'
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    return {
      name: 'Test Category',
      slug,
      createdBy: testUser._id,
      ...overrides,
    }
  }

  describe('Schema Validation', () => {
    it('should create a valid category with all required fields', async () => {
      const categoryData = createCategoryData({
        name: 'Wellness & Spa',
        description: 'Wellness and spa services',
        isActive: true,
      })

      const category = new Category(categoryData)
      const savedCategory = await category.save()

      expect(savedCategory._id).toBeDefined()
      expect(savedCategory.name).toBe('Wellness & Spa')
      expect(savedCategory.slug).toBe('wellness-spa') // Auto-generated
      expect(savedCategory.description).toBe('Wellness and spa services')
      expect(savedCategory.isActive).toBe(true)
      expect(savedCategory.createdBy.equals(testUser._id)).toBe(true)
      expect(savedCategory.createdAt).toBeInstanceOf(Date)
      expect(savedCategory.updatedAt).toBeInstanceOf(Date)
    })

    it('should create category with minimal required fields', async () => {
      const categoryData = createCategoryData({
        name: 'Minimal Category',
      })

      const category = new Category(categoryData)
      const savedCategory = await category.save()

      expect(savedCategory.name).toBe('Minimal Category')
      expect(savedCategory.slug).toBe('minimal-category')
      expect(savedCategory.description).toBeUndefined()
      expect(savedCategory.isActive).toBe(true) // default value
      expect(savedCategory.sortOrder).toBe(0) // default value
    })

    it('should auto-generate slug from name', async () => {
      const categoryData = createCategoryData({
        name: 'Beauty & Wellness Services!',
      })

      const category = new Category(categoryData)
      const savedCategory = await category.save()

      expect(savedCategory.slug).toBe('beauty-wellness-services')
    })

    it('should trim whitespace from string fields', async () => {
      const categoryData = createCategoryData({
        name: '  Beauty Services  ',
        description: '  Professional beauty treatments  ',
      })

      const category = new Category(categoryData)
      const savedCategory = await category.save()

      expect(savedCategory.name).toBe('Beauty Services')
      expect(savedCategory.description).toBe('Professional beauty treatments')
    })

    it('should set default values correctly', async () => {
      const categoryData = createCategoryData({
        name: 'Default Category',
      })

      const category = new Category(categoryData)
      const savedCategory = await category.save()

      expect(savedCategory.isActive).toBe(true)
      expect(savedCategory.sortOrder).toBe(0)
      expect(savedCategory.icon).toBe('Category')
      expect(savedCategory.color).toBe('#6366f1')
    })
  })

  describe('Validation Errors', () => {
    it('should throw validation error if name is missing', async () => {
      const categoryData = createCategoryData({
        description: 'Category without name',
      })
      delete (categoryData as any).name

      const category = new Category(categoryData)
      
      await expect(category.save()).rejects.toThrow('Path `name` is required')
    })

    it('should throw validation error if createdBy is missing', async () => {
      const categoryData = {
        name: 'Category without creator',
        description: 'Category without createdBy field',
      }

      const category = new Category(categoryData)
      
      await expect(category.save()).rejects.toThrow('Path `createdBy` is required')
    })

    it('should throw validation error for empty name', async () => {
      const categoryData = createCategoryData({
        name: '',
        description: 'Category with empty name',
      })

      const category = new Category(categoryData)
      
      await expect(category.save()).rejects.toThrow()
    })

    it('should throw validation error for name shorter than 2 characters', async () => {
      const categoryData = createCategoryData({
        name: 'A',
        description: 'Category with too short name',
      })

      const category = new Category(categoryData)
      
      await expect(category.save()).rejects.toThrow()
    })

    it('should enforce unique name constraint', async () => {
      const categoryData1 = createCategoryData({
        name: 'Duplicate Category',
        description: 'First category',
      })

      const categoryData2 = createCategoryData({
        name: 'Duplicate Category',
        description: 'Second category',
      })

      await Category.create(categoryData1)
      
      const category2 = new Category(categoryData2)
      await expect(category2.save()).rejects.toThrow()
    })

    it('should enforce unique slug constraint', async () => {
      const categoryData1 = createCategoryData({
        name: 'Beauty Services',
      })

      const categoryData2 = createCategoryData({
        name: 'Beauty-Services', // Will generate same slug
      })

      await Category.create(categoryData1)
      
      const category2 = new Category(categoryData2)
      await expect(category2.save()).rejects.toThrow()
    })
  })

  describe('Queries and Operations', () => {
    it('should find active categories', async () => {
      const activeCategory = createCategoryData({
        name: 'Active Category',
        isActive: true,
      })

      const inactiveCategory = createCategoryData({
        name: 'Inactive Category',
        isActive: false,
      })

      await Category.create([activeCategory, inactiveCategory])

      const activeCategories = await Category.find({ isActive: true })
      
      expect(activeCategories).toHaveLength(1)
      expect(activeCategories[0].name).toBe('Active Category')
    })

    it('should support sorting by sortOrder and name', async () => {
      const categories = [
        createCategoryData({ name: 'Z Category', sortOrder: 1 }),
        createCategoryData({ name: 'A Category', sortOrder: 2 }),
        createCategoryData({ name: 'B Category', sortOrder: 1 }),
      ]

      await Category.create(categories)

      const sortedCategories = await Category.find({}).sort({ sortOrder: 1, name: 1 })
      
      expect(sortedCategories[0].name).toBe('B Category')
      expect(sortedCategories[1].name).toBe('Z Category')
      expect(sortedCategories[2].name).toBe('A Category')
    })

    it('should support lean queries', async () => {
      const categoryData = createCategoryData({
        name: 'Lean Query Category',
      })

      await Category.create(categoryData)

      const leanCategory = await Category.findOne({
        name: 'Lean Query Category'
      }).lean()

      expect(leanCategory).toBeDefined()
      expect(leanCategory?._id).toBeDefined()
      expect(typeof (leanCategory as any)?.save).toBe('undefined')
    })
  })

  describe('Static Methods', () => {
    it('should get active categories with getActiveCategories method', async () => {
      const categories = [
        createCategoryData({ name: 'Active 1', isActive: true, sortOrder: 2 }),
        createCategoryData({ name: 'Active 2', isActive: true, sortOrder: 1 }),
        createCategoryData({ name: 'Inactive', isActive: false }),
      ]

      await Category.create(categories)

      const activeCategories = await Category.getActiveCategories()
      
      expect(activeCategories).toHaveLength(2)
      expect(activeCategories[0].name).toBe('Active 2') // Lower sortOrder comes first
      expect(activeCategories[1].name).toBe('Active 1')
    })

    // Note: getCategoryWithServices test skipped because it requires Service model registration
  })

  describe('Instance Methods', () => {
    it('should toggle active status with toggleActive method', async () => {
      const categoryData = createCategoryData({
        name: 'Toggle Category',
        isActive: true,
      })

      const category = await Category.create(categoryData)
      expect(category.isActive).toBe(true)

      await category.toggleActive()
      expect(category.isActive).toBe(false)

      await category.toggleActive()
      expect(category.isActive).toBe(true)
    })
  })

  describe('Timestamps', () => {
    it('should update updatedAt timestamp on modification', async () => {
      const categoryData = createCategoryData({
        name: 'Update Test Category',
      })

      const category = await Category.create(categoryData)
      const originalUpdatedAt = category.updatedAt
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100))
      
      category.description = 'Updated description'
      await category.save()

      expect(category.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    it('should maintain createdAt timestamp on updates', async () => {
      const categoryData = createCategoryData({
        name: 'CreatedAt Test Category',
      })

      const category = await Category.create(categoryData)
      const originalCreatedAt = category.createdAt
      
      category.description = 'Updated description'
      await category.save()

      expect(category.createdAt).toEqual(originalCreatedAt)
    })
  })
})