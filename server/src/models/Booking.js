import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'completed', 'cancelled'], default: 'pending' },
  date: String,
  time: String,
  totalAmount: Number,
  notes: String,
}, { timestamps: true })

export default mongoose.model('Booking', bookingSchema)
