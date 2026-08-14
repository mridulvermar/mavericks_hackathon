import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product or Service name is required'],
    trim: true,
  },
  title: String,
  itemType: {
    type: String,
    enum: ['product', 'service'],
    default: 'product',
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  seller: {
    type: String,
    default: 'Local Artisan',
  },
  sellerVerified: {
    type: Boolean,
    default: true,
  },
  price: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Price is required'],
  },
  location: {
    type: String,
    default: 'Chennai',
  },
  city: {
    type: String,
    default: 'Chennai',
  },
  coordinates: {
    lat: { type: Number, default: 13.0827 },
    lng: { type: Number, default: 80.2707 },
  },
  rating: {
    type: Number,
    default: 4.8,
  },
  reviews: {
    type: Number,
    default: 12,
  },
  emoji: {
    type: String,
    default: '📦',
  },
  image: String,
  images: [String],
  description: {
    type: String,
    default: 'Handmade item',
  },
  highlights: [String],
  stock: {
    type: Number,
    default: 1,
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  badge: String,
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true })

export default mongoose.model('Product', productSchema)
