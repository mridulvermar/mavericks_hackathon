import { Router } from 'express'
import bcrypt from 'bcryptjs'
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
    const updateData = { ...req.body }
    delete updateData.role
    delete updateData.password
    delete updateData._id

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true, runValidators: true })
    if (!user) return next(createError('User not found.', 404))
    res.json({ success: true, message: 'Settings updated successfully!', user })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/users/me/password — Change Password with bcrypt verification
router.patch('/me/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' })
    }

    const user = await User.findById(req.user.id).select('+password')
    if (!user) return next(createError('User not found.', 404))

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect. Please try again.' })
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    res.json({ success: true, message: 'Password updated successfully! Please log in again with your new password.' })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/users/me/request-verification — Request Identity Verification
router.patch('/me/request-verification', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { verificationRequestPending: true },
      { new: true }
    )
    if (!user) return next(createError('User not found.', 404))
    res.json({
      success: true,
      message: 'Verification request submitted! Our safety team will review your profile shortly.',
      user,
    })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/users/me — Soft delete user account
router.delete('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { isDeleted: true }, { new: true })
    if (!user) return next(createError('User not found.', 404))
    res.json({ success: true, message: 'Your account has been deleted successfully.' })
  } catch (err) {
    next(err)
  }
})

export default router
