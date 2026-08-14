import mongoose from 'mongoose'

const opportunitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: String,
  category: { type: String, required: true, trim: true },
  pay: { type: String, required: true },
  location: String,
  type: { type: String, enum: ['Part-time', 'Full-time', 'Flexible', 'One-time'], default: 'Part-time' },
  urgent: { type: Boolean, default: false },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true })

export default mongoose.model('Opportunity', opportunitySchema)
