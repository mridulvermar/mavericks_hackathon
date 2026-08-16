import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['provider', 'job_provider', 'admin'],
    default: 'provider',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  providerType: {
    type: String,
    enum: ['senior_citizen', 'homemaker', 'none'],
    default: 'senior_citizen',
  },
  age: Number,
  location: String,
  city: String,
  state: String,
  languages: [String],
  skills: [String],
  bio: String,
  profilePhoto: String,
  availability: [String],
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  verificationFlags: {
    mobileVerified: { type: Boolean, default: true },
    identityVerified: { type: Boolean, default: false },
    skillVerified: { type: Boolean, default: false },
  },
  verificationRequestPending: { type: Boolean, default: false },
  preferredLanguage: { type: String, default: 'English' },
  notificationPreferences: {
    jobs: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    payments: { type: Boolean, default: true },
    updates: { type: Boolean, default: false },
  },
  onboardingComplete: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.model('User', userSchema)
