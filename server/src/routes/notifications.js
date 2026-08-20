import { Router } from 'express'
import mongoose from 'mongoose'
import Notification from '../models/Notification.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// Default fallback in-memory notifications for offline / mock mode
export let mockNotifications = [
  {
    _id: 'n1',
    id: 'n1',
    user: 'u_customer',
    title: 'Application Received',
    message: 'Your application for Home Cooking Class was sent to employer Lakshmi Ammal.',
    type: 'booking',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'n2',
    id: 'n2',
    user: 'u_provider',
    title: 'New Booking Request',
    message: 'A client sent a request for Custom Saree Blouse Stitching.',
    type: 'booking',
    read: false,
    createdAt: new Date().toISOString(),
  },
]

/**
 * Helper to push notification to DB or fallback memory
 */
export async function sendNotification({ userId, title, message, type = 'booking', link = '' }) {
  try {
    if (mongoose.connection.readyState === 1 && userId && mongoose.Types.ObjectId.isValid(userId)) {
      await Notification.create({ user: userId, title, message, type, link, read: false })
    } else {
      mockNotifications.unshift({
        _id: `n_${Date.now()}`,
        id: `n_${Date.now()}`,
        user: userId || 'all',
        title,
        message,
        type,
        link,
        read: false,
        createdAt: new Date().toISOString(),
      })
    }
  } catch (err) {
    console.error('Error creating notification:', err)
  }
}

// GET /api/notifications — Fetch notifications for logged-in user
router.get('/', authenticate, async (req, res) => {
  try {
    let notifications = []
    if (mongoose.connection.readyState === 1) {
      notifications = await Notification.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
    }
    if (!notifications || notifications.length === 0) {
      notifications = [...mockNotifications]
    }
    res.json({ success: true, data: notifications })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' })
  }
})

// PATCH /api/notifications/:id/read — Mark notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      await Notification.findByIdAndUpdate(id, { read: true })
    } else {
      const item = mockNotifications.find(n => n._id === id || n.id === id)
      if (item) item.read = true
    }
    res.json({ success: true, message: 'Notification marked as read.' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification.' })
  }
})

export default router
