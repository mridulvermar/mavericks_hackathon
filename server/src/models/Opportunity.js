import mongoose from 'mongoose'

const opportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  requirements: [String],
  skills: [String],
  languages: [String],
  pay: {
    type: String,
    required: [true, 'Pay range or amount is required'],
  },
  payNote: {
    type: String,
    default: 'Estimated pay based on market rates',
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
  },
  city: {
    type: String,
    default: 'Chennai',
  },
  coordinates: {
    lat: { type: Number, default: 13.0827 },
    lng: { type: Number, default: 80.2707 },
  },
  type: {
    type: String,
    enum: ['Part-time', 'Full-time', 'Flexible', 'Freelance', 'One-time'],
    default: 'Part-time',
  },
  kind: {
    type: String,
    enum: ['job', 'product_request'],
    default: 'job',
  },
  clientName: {
    type: String,
    default: 'Local Employer',
  },
  clientVerified: {
    type: Boolean,
    default: true,
  },
  urgent: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'fulfilled', 'closed'],
    default: 'open',
  },
  posted: {
    type: String,
    default: 'Recently',
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  postedById: {
    type: String,
  },
}, { timestamps: true })

export default mongoose.model('Opportunity', opportunitySchema)
