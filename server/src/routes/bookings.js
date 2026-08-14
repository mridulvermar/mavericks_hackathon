import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const mockBookings = [
  { _id: 'b1', title: 'Home Cooking Class', client: 'Priya Mehta', date: new Date().toISOString(), status: 'upcoming', pay: '₹500' },
  { _id: 'b2', title: 'Embroidery Session', client: 'Anita Singh', date: new Date(Date.now() + 86400000).toISOString(), status: 'upcoming', pay: '₹800' },
]

router.get('/', authenticate, (req, res) => {
  res.json({ success: true, data: mockBookings })
})

router.patch('/:id/complete', authenticate, (req, res) => {
  res.json({ success: true, message: 'Booking marked as complete!' })
})

router.patch('/:id/cancel', authenticate, (req, res) => {
  res.json({ success: true, message: 'Booking cancelled.' })
})

export default router
