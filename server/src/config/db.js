import mongoose from 'mongoose'

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.error('\n❌ FATAL: MONGODB_URI is not set in server/.env')
    process.exit(1)
  }

  // Safe diagnostic log (never exposes password)
  const maskedURI = uri.replace(/:([^@]+)@/, ':****@')
  console.log(`🔌 Attempting MongoDB Atlas Connection: ${maskedURI}`)

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000, // 15s timeout for Atlas TLS handshake
      socketTimeoutMS: 45000,
    })
    console.log(`\n🎉 ✅ MongoDB Atlas Connected Successfully!`)
    console.log(`   Cluster Host : ${conn.connection.host}`)
    console.log(`   Database Name: ${conn.connection.name}\n`)
    return conn
  } catch (err) {
    console.error('\n❌ FATAL: MongoDB Atlas Connection Failed!')
    console.error(`   Error Name   : ${err.name}`)
    console.error(`   Error Message: ${err.message}\n`)
    throw err
  }
}

export const isDBConnected = () => mongoose.connection.readyState === 1
