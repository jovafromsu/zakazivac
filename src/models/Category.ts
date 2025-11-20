import mongoose from 'mongoose'

export interface ICategory {
  _id?: mongoose.Types.ObjectId
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  createdBy: mongoose.Types.ObjectId
}

const categorySchema = new mongoose.Schema<ICategory>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    // Auto-generated from name
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true,
  },
  icon: {
    type: String,
    default: 'Category',
    // Lucide icon name
  },
  color: {
    type: String,
    default: '#6366f1',
    // Hex color for category badge/tag
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
    // For custom ordering in UI
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
})

// Indexes for better performance
// slug index is automatically created due to unique: true
categorySchema.index({ isActive: 1, sortOrder: 1 })
categorySchema.index({ createdBy: 1 })

// Virtual for service count (populated when needed)
categorySchema.virtual('serviceCount', {
  ref: 'Service',
  localField: '_id',
  foreignField: 'category',
  count: true,
})

// Pre-save middleware to generate slug from name
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
  next()
})

// Static methods
categorySchema.statics.getActiveCategories = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 })
}

categorySchema.statics.getCategoryWithServices = function(slug: string) {
  return this.findOne({ slug, isActive: true }).populate('serviceCount')
}

// Instance methods
categorySchema.methods.toggleActive = function() {
  this.isActive = !this.isActive
  return this.save()
}

// Prevent re-compilation during hot reloads
export default mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema)