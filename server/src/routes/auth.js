import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { isDBConnected } from '../config/db.js'
import { createError } from '../middleware/errorHandler.js'

const router = Router()

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, phone, password, role = 'worker' } = req.body
    if (!name || !phone || !password) {
      return next(createError('Name, phone number, and password are required.'))
    }

    // Demo mode — no DB
    if (!isDBConnected()) {
      const token = jwt.sign(
        { id: 'demo-user', name, phone, role },
        process.env.JWT_SECRET || 'silverhands_dev_secret',
        { expiresIn: '7d' }
      )
      return res.status(201).json({
        success: true,
        message: 'Account created! (Demo mode — no database)',
        token,
        user: { id: 'demo-user', name, phone, role },
      })
    }

    // DB mode
    const { default: User } = await import('../models/User.js')
    const existing = await User.findOne({ phone })
    if (existing) return next(createError('This phone number is already registered.', 409))

    const hashed = await bcrypt.hash(password, 12)
    const user = await User.create({ name, phone, password: hashed, role })

    const token = jwt.sign(
      { id: user._id, name: user.name, phone: user.phone, role: user.role },
      process.env.JWT_SECRET || 'silverhands_dev_secret',
      { expiresIn: '7d' }
    )
    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { id: user._id, name: user.name, phone: user.phone, role: user.role },
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) {
      return next(createError('Phone number and password are required.'))
    }

    // Demo mode
    if (!isDBConnected()) {
      const token = jwt.sign(
        { id: 'demo-user', name: 'Sunita Sharma', phone, role: 'worker' },
        process.env.JWT_SECRET || 'silverhands_dev_secret',
        { expiresIn: '7d' }
      )
      return res.json({
        success: true,
        message: 'Signed in! (Demo mode)',
        token,
        user: { id: 'demo-user', name: 'Sunita Sharma', phone, role: 'worker' },
      })
    }

    // DB mode
    const { default: User } = await import('../models/User.js')
    const user = await User.findOne({ phone }).select('+password')
    if (!user) return next(createError('No account found with this phone number.', 401))

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return next(createError('Incorrect password. Please try again.', 401))

    const token = jwt.sign(
      { id: user._id, name: user.name, phone: user.phone, role: user.role },
      process.env.JWT_SECRET || 'silverhands_dev_secret',
      { expiresIn: '7d' }
    )
    res.json({
      success: true,
      message: 'Signed in successfully!',
      token,
      user: { id: user._id, name: user.name, phone: user.phone, role: user.role },
    })
  } catch (err) {
    next(err)
  }
})

export default router
