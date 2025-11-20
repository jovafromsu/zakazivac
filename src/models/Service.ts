import mongoose from 'mongoose';

export interface IService {
  _id?: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  categoryId?: mongoose.Types.ObjectId;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new mongoose.Schema<IService>({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderProfile',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false,
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 15,
    max: 480, // 8 hours max
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
serviceSchema.index({ providerId: 1, isActive: 1 });
serviceSchema.index({ categoryId: 1, isActive: 1 });
serviceSchema.index({ categoryId: 1, providerId: 1 });

export default mongoose.models.Service || mongoose.model<IService>('Service', serviceSchema);