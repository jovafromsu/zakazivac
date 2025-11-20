import mongoose from 'mongoose';

export interface IProviderProfile {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  businessName: string;
  description?: string;
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };
  timezone: string;
  isActive: boolean;
  availabilitySettings?: any;
  createdAt: Date;
  updatedAt: Date;
}

const providerProfileSchema = new mongoose.Schema<IProviderProfile>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  businessName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  contactInfo: {
    phone: String,
    email: String,
    address: String,
  },
  timezone: {
    type: String,
    required: true,
    default: 'Europe/Belgrade',
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  availabilitySettings: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    strict: false,
  },
}, {
  timestamps: true,
});

export default mongoose.models.ProviderProfile || mongoose.model<IProviderProfile>('ProviderProfile', providerProfileSchema);