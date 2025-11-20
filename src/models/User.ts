import mongoose from 'mongoose';

export interface IUser {
  _id?: mongoose.Types.ObjectId;
  email: string;
  name: string;
  password?: string;
  roles: ('client' | 'provider' | 'admin')[];
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: false, // Optional for OAuth users
  },
  roles: {
    type: [{
      type: String,
      enum: ['client', 'provider', 'admin'],
    }],
    default: ['client'],
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    required: false,
  },
  verificationTokenExpires: {
    type: Date,
    required: false,
  },
}, {
  timestamps: true,
});

// Prevent re-compilation during hot reloads
export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);