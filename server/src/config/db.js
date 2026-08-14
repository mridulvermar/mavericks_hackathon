import mongoose from 'mongoose'

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.warn('\n⚠️  MONGODB_URI is not set in .env')
    console.warn('   Server will run without database — API routes return mock data')
    console.warn('   To enable database: add MONGODB_URI to server/.env\n')
    return
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log('✅ MongoDB connected:', mongoose.connection.host)
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    console.warn('   Continuing in mock-data mode — database features unavailable\n')
    // Do NOT exit — allow frontend demo to continue
  }
}

export const isDBConnected = () =>
  mongoose.connection.readyState === 1
