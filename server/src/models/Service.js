import mongoose from 'mongoose'

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: String,
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  priceType: { type: String, enum: ['per_hour', 'per_session', 'fixed'], default: 'per_session' },
  images: [String],
  location: String,
  rating: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Service', serviceSchema)
