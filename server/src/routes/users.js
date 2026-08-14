import { Router } from 'express'
import User from '../models/User.js'
import { authenticate } from '../middleware/auth.js'
import { createError } from '../middleware/errorHandler.js'

const router = Router()

// GET /api/users/me — Get user profile from MongoDB Atlas
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return next(createError('User not found.', 404))
    res.json({ success: true, user })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/users/me — Update user profile in MongoDB Atlas
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true, runValidators: true })
    if (!user) return next(createError('User not found.', 404))
    res.json({ success: true, message: 'Profile updated!', user })
  } catch (err) {
    next(err)
  }
})

export default router
