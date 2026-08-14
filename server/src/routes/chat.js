import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/conversations', authenticate, (req, res) => {
  res.json({
    success: true,
    data: [
      { _id: 'c1', name: 'Priya Mehta', lastMessage: 'See you tomorrow!', unread: 2 },
      { _id: 'c2', name: 'Rahul Kumar', lastMessage: 'Can you teach cooking?', unread: 0 },
    ],
  })
})

router.get('/conversations/:id/messages', authenticate, (req, res) => {
  res.json({
    success: true,
    data: [
      { _id: 'm1', text: 'Namaste!', sender: 'other', createdAt: new Date().toISOString() },
      { _id: 'm2', text: 'Namaste Ji!', sender: 'me', createdAt: new Date().toISOString() },
    ],
  })
})

export default router
