import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },
  itemType: {
    type: String,
    enum: ['opportunity', 'product', 'service'],
    default: 'opportunity',
  },
  itemId: String,
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
  customerName: {
    type: String,
    default: 'Priya Mehta',
  },
  providerName: {
    type: String,
    default: 'Lakshmi Ammal',
  },
  customerId: String,
  providerId: String,
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String,
  time: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  pay: String,
  amount: Number,
  totalAmount: Number,
  location: String,
  notes: String,
  icon: {
    type: String,
    default: '💼',
  },
}, { timestamps: true })

export default mongoose.model('Booking', bookingSchema)
