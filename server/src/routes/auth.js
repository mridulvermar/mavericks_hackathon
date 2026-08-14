import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { authenticate } from '../middleware/auth.js'
import { createError } from '../middleware/errorHandler.js'

const router = Router()

/**
 * Standardize Indian mobile numbers to 10 digits
 * Handles formats like +91 9876543210, 09876543210, +919876543210
 */
export const normalizePhone = (phone) => {
  if (!phone) return ''
  let cleaned = String(phone).replace(/\D/g, '')
  if (cleaned.length > 10 && cleaned.startsWith('91')) {
    cleaned = cleaned.slice(cleaned.length - 10)
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1)
  }
  return cleaned
}

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      providerType: user.providerType,
    },
    process.env.JWT_SECRET || 'silverhands_dev_secret',
    { expiresIn: '7d' }
  )
}

const sanitizeUser = (user) => {
  const u = user.toObject ? user.toObject() : { ...user }
  delete u.password
  return u
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, phone, password, role = 'provider', providerType = 'senior_citizen' } = req.body
    if (!name || !phone || !password) {
      return next(createError('Name, phone number, and password are required.'))
    }
    if (password.length < 6) {
      return next(createError('Password must be at least 6 characters long.'))
    }

    const cleanPhone = normalizePhone(phone)
    const cleanName = name.trim()

    if (!cleanPhone || cleanPhone.length < 10) {
      return next(createError('Please enter a valid 10-digit mobile number.'))
    }

    // Direct MongoDB Atlas query
    const existing = await User.findOne({ phone: cleanPhone })
    if (existing) {
      return next(createError('This phone number is already registered. Please sign in instead.', 409))
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await User.create({
      name: cleanName,
      phone: cleanPhone,
      password: hashedPassword,
      role: ['provider', 'customer', 'admin'].includes(role) ? role : 'provider',
      providerType: ['senior_citizen', 'homemaker', 'none'].includes(providerType) ? providerType : 'senior_citizen',
    })

    const token = generateToken(user)
    res.status(201).json({
      success: true,
      message: 'Account created successfully in MongoDB Atlas!',
      token,
      user: sanitizeUser(user),
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

    const cleanPhone = normalizePhone(phone)

    if (!cleanPhone || cleanPhone.length < 10) {
      return next(createError('Please enter a valid 10-digit mobile number.'))
    }

    // Direct MongoDB Atlas query
    const user = await User.findOne({ phone: cleanPhone }).select('+password')
    if (!user) {
      return next(createError('No account found with this mobile number. Please register first.', 401))
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return next(createError('Incorrect password. Please try again.', 401))
    }

    const token = generateToken(user)
    res.json({
      success: true,
      message: 'Signed in successfully!',
      token,
      user: sanitizeUser(user),
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Signed out successfully.',
  })
})

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return next(createError('User account not found.', 404))
    res.json({ success: true, user: sanitizeUser(user) })
  } catch (err) {
    next(err)
  }
})

// PUT /api/auth/onboarding
router.put('/onboarding', authenticate, async (req, res, next) => {
  try {
    const { role, providerType, name, age, location, languages, skills, bio } = req.body

    const updateFields = { onboardingComplete: true }
    if (role) updateFields.role = role
    if (providerType) updateFields.providerType = providerType
    if (name) updateFields.name = name.trim()
    if (age) updateFields.age = Number(age)
    if (location) updateFields.location = location.trim()
    if (languages) updateFields.languages = Array.isArray(languages) ? languages : [languages]
    if (skills) updateFields.skills = Array.isArray(skills) ? skills : [skills]
    if (bio) updateFields.bio = bio.trim()

    const user = await User.findByIdAndUpdate(req.user.id, updateFields, { new: true, runValidators: true })
    if (!user) return next(createError('User account not found.', 404))

    res.json({
      success: true,
      message: 'Onboarding completed in MongoDB Atlas!',
      user: sanitizeUser(user),
    })
  } catch (err) {
    next(err)
  }
})

export default router
