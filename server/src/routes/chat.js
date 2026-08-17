import { Router } from 'express'
import mongoose from 'mongoose'
import Message from '../models/Message.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

// Default demo conversations
export const mockConversations = [
  {
    _id: 'c1',
    id: 'c1',
    name: 'Priya Mehta',
    role: 'Employer / Customer',
    lastMsg: 'Great! See you tomorrow at 4pm 😊',
    time: '2:30 PM',
    unread: 2,
    avatar: '👩',
    online: true,
  },
  {
    _id: 'c2',
    id: 'c2',
    name: 'Kavitha Swaminathan',
    role: 'Employer / Customer',
    lastMsg: 'Can you stitch silk blouse embroidery?',
    time: '11:00 AM',
    unread: 0,
    avatar: '👩‍💼',
    online: true,
  },
  {
    _id: 'c3',
    id: 'c3',
    name: 'Rahul Kumar',
    role: 'Student',
    lastMsg: 'Thank you for the Maths tutoring class!',
    time: 'Yesterday',
    unread: 1,
    avatar: '👨',
    online: false,
  },
]

// Default demo messages store for c1
export const mockMessagesStore = {
  c1: [
    { _id: 'm1', id: 'm1', text: 'Namaste! I saw your cooking class listing.', sender: 'other', senderName: 'Priya Mehta', time: '10:00 AM' },
    { _id: 'm2', id: 'm2', text: 'Namaste Ji! Yes, I teach traditional South Indian cooking.', sender: 'me', senderName: 'Lakshmi Ammal', time: '10:05 AM' },
    { _id: 'm3', id: 'm3', text: 'How much do you charge per session?', sender: 'other', senderName: 'Priya Mehta', time: '10:06 AM' },
    { _id: 'm4', id: 'm4', text: '₹600 per session of 2 hours. Includes all ingredients.', sender: 'me', senderName: 'Lakshmi Ammal', time: '10:10 AM' },
    { _id: 'm5', id: 'm5', text: 'Great! See you tomorrow at 4pm 😊', sender: 'other', senderName: 'Priya Mehta', time: '10:12 AM' },
  ],
  c2: [
    { _id: 'm6', id: 'm6', text: 'Hello! I need bridal blouse embroidery.', sender: 'other', senderName: 'Kavitha Swaminathan', time: '11:00 AM' },
    { _id: 'm7', id: 'm7', text: 'Namaste! I do custom Aari needle embroidery work.', sender: 'me', senderName: 'Meenakshi Sundaram', time: '11:05 AM' },
  ],
  c3: [
    { _id: 'm8', id: 'm8', text: 'Are you available for 10th Maths tutoring?', sender: 'other', senderName: 'Rahul Kumar', time: 'Yesterday' },
    { _id: 'm9', id: 'm9', text: 'Yes, I teach Algebra and Geometry on weekends.', sender: 'me', senderName: 'Ravi Kumar', time: 'Yesterday' },
  ],
}

// ── GET /api/chat/conversations ──────────────────────────────────────
router.get('/conversations', optionalAuth, (req, res) => {
  res.json({
    success: true,
    data: mockConversations,
    total: mockConversations.length,
  })
})

// ── GET /api/chat/conversations/:id/messages ────────────────────────
router.get('/conversations/:id/messages', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params
    let messages = []

    if (mongoose.connection.readyState === 1) {
      messages = await Message.find({ conversationId: id }).sort({ createdAt: 1 }).lean()
    }

    if (!messages || messages.length === 0) {
      messages = mockMessagesStore[id] || []
    }

    // Deduplicate any repeated messages
    const seen = new Set()
    const unique = []
    for (const m of messages) {
      const idKey = String(m._id || m.id || '')
      const contentKey = `${m.conversationId}_${m.senderId || m.senderName}_${m.text}_${m.timestamp || m.time}`
      if (!seen.has(idKey) && !seen.has(contentKey)) {
        if (idKey) seen.add(idKey)
        seen.add(contentKey)
        unique.push(m)
      }
    }

    res.json({ success: true, data: unique })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages.' })
  }
})

// ── POST /api/chat/messages (HTTP fallback send) ────────────────────
router.post('/messages', optionalAuth, async (req, res) => {
  try {
    const { conversationId, text, senderName, senderId, clientMsgId } = req.body
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' })
    }

    const roomId = conversationId || 'c1'
    const newMsg = {
      _id: clientMsgId || String(Date.now()),
      id: clientMsgId || String(Date.now()),
      clientMsgId,
      conversationId: roomId,
      text: text.trim(),
      sender: 'me',
      senderId: senderId || 'me',
      senderName: senderName || 'Lakshmi Ammal',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    }

    if (mongoose.connection.readyState === 1) {
      const created = await Message.create({
        conversationId: roomId,
        senderId: newMsg.senderId,
        senderName: newMsg.senderName,
        text: newMsg.text,
        timestamp: newMsg.time,
        sender: 'me',
      })
      if (created) {
        newMsg._id = String(created._id)
      }
    }

    if (!mockMessagesStore[roomId]) {
      mockMessagesStore[roomId] = []
    }
    mockMessagesStore[roomId].push(newMsg)

    res.status(201).json({ success: true, data: newMsg })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send message.' })
  }
})

export default router
