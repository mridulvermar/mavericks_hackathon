import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const mockUsers = [
  { id: 'demo-user', name: 'Sunita Sharma', phone: '9876543210', role: 'worker', city: 'Jaipur', skills: ['Cooking', 'Embroidery'], rating: 4.8, verified: true },
]

router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, user: { ...req.user, ...mockUsers[0] } })
})

router.patch('/me', authenticate, (req, res) => {
  res.json({ success: true, message: 'Profile updated!', user: req.user })
})

export default router
