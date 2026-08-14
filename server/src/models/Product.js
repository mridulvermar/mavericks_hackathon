import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: String,
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 1 },
  images: [String],
  active: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Product', productSchema)
