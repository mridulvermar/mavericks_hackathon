import { Router } from 'express'
import mongoose from 'mongoose'
import Message from '../models/Message.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

// In-memory fallback message store for when DB is temporarily disconnected (starts empty - no fake data)
export const inMemoryMessages = []

// Helper to format conversation summary from a list of messages
function buildConversationsList(messages, currentUserId) {
  const convMap = new Map()

  for (const m of messages) {
    const convId = m.conversationId
    if (!convId) continue

    const existing = convMap.get(convId)
    const mTime = new Date(m.createdAt || Date.now()).getTime()

    // Determine other party name
    let otherName = ''
    if (currentUserId) {
      if (String(m.senderId) === String(currentUserId)) {
        otherName = m.recipientName || ''
      } else {
        otherName = m.senderName || ''
      }
    } else {
      otherName = m.recipientName || m.senderName || ''
    }

    if (!existing || mTime > existing.latestTime) {
      let otherRole = 'Direct Message'
      if (m.opportunityTitle) {
        otherRole = `Job: ${m.opportunityTitle}`
      }

      convMap.set(convId, {
        _id: convId,
        id: convId,
        conversationId: convId,
        name: otherName || existing?.name || (m.opportunityTitle ? (String(m.senderId) === String(currentUserId) ? 'Job Provider' : 'Job Applicant') : 'Contact'),
        role: otherRole,
        opportunityTitle: m.opportunityTitle || existing?.opportunityTitle || null,
        opportunityId: m.opportunityId || existing?.opportunityId || null,
        recipientId: m.recipientId || existing?.recipientId || '',
        recipientName: m.recipientName || existing?.recipientName || '',
        senderId: m.senderId || existing?.senderId || '',
        senderName: m.senderName || existing?.senderName || '',
        lastMsg: m.text,
        time: m.timestamp || new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latestTime: mTime,
        unread: 0,
        avatar: m.opportunityTitle ? '💼' : '👤',
        online: true,
      })
    } else if (otherName && (!existing.name || existing.name === 'Job Seeker' || existing.name === 'Job Provider' || existing.name === 'Connected User' || existing.name === 'Contact')) {
      existing.name = otherName
    }
  }

  // Count unreads for current user if applicable
  if (currentUserId) {
    for (const m of messages) {
      if (String(m.recipientId) === String(currentUserId) && m.status !== 'read') {
        const item = convMap.get(m.conversationId)
        if (item) {
          item.unread = (item.unread || 0) + 1
        }
      }
    }
  }

  return Array.from(convMap.values()).sort((a, b) => b.latestTime - a.latestTime)
}

// ── GET /api/chat/conversations ──────────────────────────────────────
router.get('/conversations', optionalAuth, async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.query.userId || null
    let messages = []

    if (mongoose.connection.readyState === 1) {
      let filter = {}
      if (currentUserId) {
        filter = {
          $or: [
            { senderId: currentUserId },
            { recipientId: currentUserId },
            { conversationId: { $regex: currentUserId, $options: 'i' } },
          ],
        }
      }
      messages = await Message.find(filter).sort({ createdAt: -1 }).lean()
    } else {
      messages = inMemoryMessages.filter(m => {
        if (!currentUserId) return true
        return m.senderId === currentUserId || m.recipientId === currentUserId || (m.conversationId && m.conversationId.includes(currentUserId))
      })
    }

    const conversations = buildConversationsList(messages, currentUserId)

    res.json({
      success: true,
      data: conversations,
      total: conversations.length,
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch conversations.', data: [] })
  }
})

// ── GET /api/chat/conversations/:id/messages ────────────────────────
router.get('/conversations/:id/messages', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params
    let messages = []

    if (mongoose.connection.readyState === 1) {
      messages = await Message.find({ conversationId: id }).sort({ createdAt: 1 }).lean()
    } else {
      messages = inMemoryMessages.filter(m => m.conversationId === id)
    }

    // Deduplicate any repeated messages by ID or clientMsgId
    const seen = new Set()
    const unique = []
    for (const m of messages) {
      const idKey = String(m._id || m.id || m.clientMsgId || '')
      const contentKey = `${m.conversationId}_${m.senderId || m.senderName}_${m.text}_${m.timestamp || m.time}`
      if (!seen.has(idKey) && !seen.has(contentKey)) {
        if (idKey) seen.add(idKey)
        seen.add(contentKey)
        unique.push({
          ...m,
          _id: m._id ? String(m._id) : (m.id || idKey),
          id: m._id ? String(m._id) : (m.id || idKey),
        })
      }
    }

    res.json({ success: true, data: unique })
  } catch (error) {
    console.error('Error fetching conversation messages:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch messages.', data: [] })
  }
})

// ── POST /api/chat/messages (HTTP fallback send) ────────────────────
router.post('/messages', optionalAuth, async (req, res) => {
  try {
    const {
      conversationId,
      text,
      senderName,
      senderId,
      recipientId,
      recipientName,
      opportunityTitle,
      opportunityId,
      bookingId,
      clientMsgId,
    } = req.body

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' })
    }

    const roomId = conversationId || 'c_default'
    const newMsg = {
      _id: clientMsgId || String(Date.now()),
      id: clientMsgId || String(Date.now()),
      clientMsgId: clientMsgId || String(Date.now()),
      conversationId: roomId,
      text: text.trim(),
      sender: 'me',
      senderId: senderId || req.user?.id || 'me',
      senderName: senderName || req.user?.name || 'User',
      recipientId: recipientId || '',
      recipientName: recipientName || '',
      opportunityTitle: opportunityTitle || null,
      opportunityId: opportunityId || null,
      bookingId: bookingId || null,
      status: 'sent',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    }

    if (mongoose.connection.readyState === 1) {
      const created = await Message.create({
        conversationId: roomId,
        senderId: newMsg.senderId,
        senderName: newMsg.senderName,
        recipientId: newMsg.recipientId,
        recipientName: newMsg.recipientName,
        opportunityTitle: newMsg.opportunityTitle,
        opportunityId: newMsg.opportunityId,
        bookingId: newMsg.bookingId,
        text: newMsg.text,
        status: newMsg.status,
        timestamp: newMsg.time,
      })
      if (created) {
        newMsg._id = String(created._id)
        newMsg.id = String(created._id)
      }
    }

    inMemoryMessages.push(newMsg)

    res.status(201).json({ success: true, data: newMsg })
  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({ success: false, message: 'Failed to send message.' })
  }
})

export default router

