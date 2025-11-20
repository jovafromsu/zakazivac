import mongoose from 'mongoose';

export interface IProviderGoogleIntegration {
  _id?: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  googleAccountEmail: string;
  accessToken: string;
  refreshToken: string;
  calendarId: string;
  tokenExpiry?: Date;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const providerGoogleIntegrationSchema = new mongoose.Schema<IProviderGoogleIntegration>({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderProfile',
    required: true,
    unique: true,
  },
  googleAccountEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  calendarId: {
    type: String,
    required: true,
  },
  tokenExpiry: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastSyncAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

export default mongoose.models.ProviderGoogleIntegration || mongoose.model<IProviderGoogleIntegration>('ProviderGoogleIntegration', providerGoogleIntegrationSchema);