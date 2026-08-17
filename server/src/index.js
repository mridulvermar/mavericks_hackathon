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
import notificationsRouter from './routes/notifications.js'
import reportsRouter from './routes/reports.js'
import { setupSocketIO } from './socket/index.js'

const app  = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

// ── CORS & Security Middleware ──────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean)

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true)
    } else {
      callback(null, true)
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.options(/(.*)/, cors(corsOptions))

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
app.use('/api/notifications', notificationsRouter)
app.use('/api/reports',       reportsRouter)
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
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  },
})
setupSocketIO(io)

// ── Async Server Initialization ───────────────────
httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use — stop the other process or set a different PORT in .env\n`)
  } else {
    console.error(`\n❌ Server initialization error: ${err.message}\n`)
  }
  process.exit(1)
})

async function startServer() {
  try {
    // Await database connection BEFORE opening HTTP port
    await connectDB()

    httpServer.listen(PORT, () => {
      console.log(`🚀 Career 2.0 Server running on port ${PORT}`)
      console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`)
      console.log(`   Client URL  : ${CLIENT_URL}`)
      console.log(`   Health check: http://localhost:${PORT}/api/health\n`)
    })
  } catch (err) {
    console.error('❌ Failed to start server due to Database Connection failure:', err.message)
    process.exit(1)
  }
}

const gracefulShutdown = () => {
  httpServer.close(() => {
    process.exit(0)
  })
}
process.once('SIGUSR2', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

startServer()

export default app
