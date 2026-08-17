import { Router } from 'express'
import mongoose from 'mongoose'

const router = Router()

router.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState
  const dbLabels = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }

  res.json({
    success: true,
    service: 'Career 2.0 API',
    version: '0.1.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      status: dbLabels[dbStatus] || 'unknown',
      connected: dbStatus === 1,
    },
    features: {
      gemini:     !!process.env.GEMINI_API_KEY,
      speech:     !!process.env.GOOGLE_SPEECH_KEY,
      translate:  !!process.env.GOOGLE_TRANSLATE_KEY,
      maps:       !!process.env.GOOGLE_MAPS_KEY,
      payments:   !!process.env.RAZORPAY_KEY_ID,
    },
  })
})

export default router
