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
  const createCategoryData = (overrides: any = {}) => ({
    name: 'Test Category',
    createdBy: testUser._id,
    ...overrides,
  })

  describe('Schema Validation', () => {
    it('should create a valid category with all required fields', async () => {
      const categoryData = createCategoryData({
        name: 'Wellness & Spa',
        description: 'Wellness and spa services',
        isActive: true,
      }))

      const category = new Category(categoryData)
      const savedCategory = await category.save()

      expect(savedCategory._id).toBeDefined()
      expect(savedCategory.name).toBe(categoryData.name)
      expect(savedCategory.description).toBe(categoryData.description)
      expect(savedCategory.isActive).toBe(true)
      expect(savedCategory.createdAt).toBeInstanceOf(Date)
      expect(savedCategory.updatedAt).toBeInstanceOf(Date)
    })

    it('should create category with minimal required fields', async () => {
      const categoryData = createCategoryData({
        name: 'Minimal Category',
      }))

      const category = new Category(categoryData)
      const savedCategory = await category.save()

      expect(savedCategory.name).toBe('Minimal Category')
      expect(savedCategory.description).toBeUndefined()
      expect(savedCategory.isActive).toBe(true) // default value
    })

    it('should trim whitespace from string fields', async () => {
      const categoryData = createCategoryData({
        name: '  Beauty Services  ',
        description: '  Professional beauty treatments  ',
      }))

      const category = new Category(categoryData)
      const savedCategory = await category.save()

      expect(savedCategory.name).toBe('Beauty Services')
      expect(savedCategory.description).toBe('Professional beauty treatments')
    })

    it('should set isActive to true by default', async () => {
      const categoryData = createCategoryData({
        name: 'Default Active Category',
      }))

      const category = new Category(categoryData)
      const savedCategory = await category.save()

      expect(savedCategory.isActive).toBe(true)
    })
  })

  describe('Schema Validation Errors', () => {
    it('should throw validation error if name is missing', async () => {
      const categoryData = createCategoryData({
        description: 'Category without name',
      }))
      delete (categoryData as any).name

      const category = new Category(categoryData)
      
      await expect(category.save()).rejects.toThrow('Path `name` is required')
    })

    it('should throw validation error for empty name', async () => {
      const categoryData = createCategoryData({
        name: '',
        description: 'Category with empty name',
      }))

      const category = new Category(categoryData)
      
      await expect(category.save()).rejects.toThrow()
    })

    it('should throw validation error for name shorter than 2 characters', async () => {
      const categoryData = createCategoryData({
        name: 'A',
      })

      const category = new Category(categoryData)
      
      await expect(category.save()).rejects.toThrow()
    })

    it('should enforce unique name constraint', async () => {
      const categoryData1 = {
        name: 'Duplicate Category',
        description: 'First category',
      })

      const categoryData2 = {
        name: 'Duplicate Category',
        description: 'Second category',
      })

      const category1 = new Category(categoryData1)
      await category1.save()

      const category2 = new Category(categoryData2)
      
      await expect(category2.save()).rejects.toThrow()
    })
  })

  describe('Active Status Management', () => {
    it('should filter active categories', async () => {
      const activeCategory = {
        name: 'Active Category',
        description: 'This category is active',
        isActive: true,
      })

      const inactiveCategory = {
        name: 'Inactive Category',
        description: 'This category is inactive',
        isActive: false,
      })

      await Category.create([activeCategory, inactiveCategory])

      const activeCategories = await Category.find({ isActive: true })
      expect(activeCategories).toHaveLength(1)
      expect(activeCategories[0].name).toBe('Active Category')

      const allCategories = await Category.find({})
      expect(allCategories).toHaveLength(2)
    })

    it('should allow toggling category status', async () => {
      const categoryData = createCategoryData({
        name: 'Toggle Category',
      })

      const category = await Category.create(categoryData)
      expect(category.isActive).toBe(true)

      category.isActive = false
      const updatedCategory = await category.save()
      expect(updatedCategory.isActive).toBe(false)

      category.isActive = true
      const reactivatedCategory = await category.save()
      expect(reactivatedCategory.isActive).toBe(true)
    })
  })

  describe('Queries and Operations', () => {
    it('should support text search on name and description', async () => {
      const categories = [
        { name: 'Medical Services', description: 'Healthcare and medical treatments' },
        { name: 'Beauty & Wellness', description: 'Beauty treatments and wellness services' },
        { name: 'Fitness Training', description: 'Personal training and fitness coaching' },
      ]

      await Category.insertMany(categories)

      // Search by name
      const medicalCategories = await Category.find({
        name: { $regex: 'Medical', $options: 'i' }
      }))
      expect(medicalCategories).toHaveLength(1)
      expect(medicalCategories[0].name).toBe('Medical Services')

      // Search by description
      const beautyCategories = await Category.find({
        description: { $regex: 'beauty', $options: 'i' }
      }))
      expect(beautyCategories).toHaveLength(1)
      expect(beautyCategories[0].name).toBe('Beauty & Wellness')
    })

    it('should support sorting by name', async () => {
      const categories = [
        { name: 'Zumba Classes' },
        { name: 'Art Therapy' },
        { name: 'Medical Consultation' },
      ]

      await Category.insertMany(categories)

      const sortedCategories = await Category.find({}).sort({ name: 1 })
      
      expect(sortedCategories[0].name).toBe('Art Therapy')
      expect(sortedCategories[1].name).toBe('Medical Consultation')
      expect(sortedCategories[2].name).toBe('Zumba Classes')
    })

    it('should support lean queries', async () => {
      const categoryData = createCategoryData({
        name: 'Lean Query Category',
        description: 'Testing lean queries',
      })

      await Category.create(categoryData)

      const leanCategory = await Category.findOne({
        name: 'Lean Query Category'
      })).lean()

      expect(leanCategory).toBeDefined()
      expect(leanCategory?._id).toBeDefined()
      expect(leanCategory?.name).toBe('Lean Query Category')
      // Lean queries return plain objects
      expect(typeof leanCategory?.save).toBe('undefined')
    })
  })

  describe('Timestamps and Updates', () => {
    it('should update updatedAt timestamp on modification', async () => {
      const categoryData = createCategoryData({
        name: 'Original Category',
        description: 'Original description',
      })

      const category = new Category(categoryData)
      const savedCategory = await category.save()
      
      const originalUpdatedAt = savedCategory.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      savedCategory.description = 'Updated description'
      const updatedCategory = await savedCategory.save()

      expect(updatedCategory.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
      expect(updatedCategory.description).toBe('Updated description')
    })

    it('should maintain createdAt timestamp on updates', async () => {
      const categoryData = createCategoryData({
        name: 'Test Category',
        description: 'Test description',
      })

      const category = new Category(categoryData)
      const savedCategory = await category.save()
      
      const originalCreatedAt = savedCategory.createdAt

      savedCategory.name = 'Updated Category'
      const updatedCategory = await savedCategory.save()

      expect(updatedCategory.createdAt.getTime()).toBe(originalCreatedAt.getTime())
    })
  })
})