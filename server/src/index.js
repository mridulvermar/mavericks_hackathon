import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { connectDB } from './config/db.js'
import { errorHandler } from './middleware/errorHandler.js'
import healthRouter  from './routes/health.js'
import authRouter    from './routes/auth.js'
import userRouter    from './routes/users.js'
import oppRouter     from './routes/opportunities.js'
import bookingRouter from './routes/bookings.js'
import chatRouter    from './routes/chat.js'
import aiRouter      from './routes/ai.js'
import productsRouter from './routes/products.js'
import earningsRouter from './routes/earnings.js'
import { setupSocketIO } from './socket/index.js'

const app  = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

// ── CORS & Security Middleware ──────────────────
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
}))
app.options('*', cors())

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// Rate limiting — generous for hackathon demo
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please wait a few minutes and try again.' },
})
app.use('/api/', limiter)

// ── Body Parsing ─────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Routes ────────────────────────────────────────
app.use('/api/health',        healthRouter)
app.use('/api/auth',          authRouter)
app.use('/api/users',         userRouter)
app.use('/api/opportunities', oppRouter)
app.use('/api/products',      productsRouter)
app.use('/api/bookings',      bookingRouter)
app.use('/api/earnings',      earningsRouter)
app.use('/api/chat',          chatRouter)
app.use('/api/ai',            aiRouter)

// ── 404 Handler ───────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  })
})

// ── Centralized Error Handler ──────────────────────
app.use(errorHandler)

// ── Socket.IO ─────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173'],
    credentials: true,
  },
})
setupSocketIO(io)

// ── Async Server Initialization ───────────────────
async function startServer() {
  try {
    // Await database connection BEFORE opening HTTP port
    await connectDB()

    httpServer.listen(PORT, () => {
      console.log(`🤲 SilverHands Server running on port ${PORT}`)
      console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`)
      console.log(`   Client URL  : ${CLIENT_URL}`)
      console.log(`   Health check: http://localhost:${PORT}/api/health\n`)
    })
  } catch (err) {
    console.error('❌ Failed to start server due to Database Connection failure.')
    process.exit(1)
  }
}

startServer()

export default app
