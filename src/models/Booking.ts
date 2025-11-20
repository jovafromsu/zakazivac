import mongoose from 'mongoose';

export interface IBooking {
  _id?: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  start: Date;
  end: Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  note?: string;
  googleEventId?: string;
  syncStatus: 'ok' | 'failed' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new mongoose.Schema<IBooking>({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderProfile',
    required: true,
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled', 'completed'],
    default: 'confirmed',
  },
  note: {
    type: String,
    trim: true,
  },
  googleEventId: {
    type: String,
    sparse: true, // Allow null values, but if set, must be unique
  },
  syncStatus: {
    type: String,
    enum: ['ok', 'failed', 'pending'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
bookingSchema.index({ providerId: 1, start: 1 });
bookingSchema.index({ clientId: 1, start: 1 });
bookingSchema.index({ start: 1, end: 1 });
bookingSchema.index({ status: 1, start: 1 }); // Za filter po status-u
bookingSchema.index({ createdAt: 1 }); // Za sortiranje po datumu kreacije

// Validation: end must be after start
bookingSchema.pre('save', function(next) {
  if (this.end <= this.start) {
    next(new Error('End time must be after start time'));
  } else {
    next();
  }
});

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);