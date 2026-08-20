import { Router } from 'express'
import mongoose from 'mongoose'
import Message from '../models/Message.js'
import { optionalAuth } from '../middleware/auth.js'
import { sendNotification } from './notifications.js'

const router = Router()

// In-memory fallback message store for when DB is temporarily disconnected (starts empty - no fake data)
export const inMemoryMessages = []

// Helper to format conversation summary from a list of messages
function buildConversationsList(messages, currentUserId, currentUserName) {
  const convMap = new Map()

  // First pass: group messages by conversationId
  for (const m of messages) {
    const convId = m.conversationId
    if (!convId) continue

    if (!convMap.has(convId)) {
      convMap.set(convId, [])
    }
    convMap.get(convId).push(m)
  }

  const result = []

  for (const [convId, group] of convMap.entries()) {
    // Sort chronological: oldest first, newest last
    group.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    const latestMsg = group[group.length - 1]
    const mTime = new Date(latestMsg.createdAt || Date.now()).getTime()

    // Determine opposite member's name and ID across the whole conversation thread
    let otherName = ''
    let otherId = ''
    const currentIdStr = String(currentUserId || '').trim()
    const myNameStr = String(currentUserName || '').trim().toLowerCase()

    for (const m of group) {
      const sId = String(m.senderId || '').trim()
      const rId = String(m.recipientId || '').trim()
      const sName = String(m.senderName || '').trim()
      const rName = String(m.recipientName || '').trim()

      if (currentIdStr && sId && sId !== currentIdStr) {
        if (sName && sName.toLowerCase() !== myNameStr) otherName = sName
        if (sId) otherId = sId
      } else if (currentIdStr && rId && rId !== currentIdStr) {
        if (rName && rName.toLowerCase() !== myNameStr) otherName = rName
        if (rId) otherId = rId
      } else if (sName && myNameStr && sName.toLowerCase() !== myNameStr) {
        otherName = sName
      } else if (rName && myNameStr && rName.toLowerCase() !== myNameStr) {
        otherName = rName
      }
    }

    // Default fallback if opposite name wasn't captured in message sender/recipient
    if (!otherName) {
      if (latestMsg.recipientName && String(latestMsg.senderId) === currentIdStr) {
        otherName = latestMsg.recipientName
      } else if (latestMsg.senderName && String(latestMsg.senderId) !== currentIdStr) {
        otherName = latestMsg.senderName
      } else {
        otherName = latestMsg.opportunityTitle ? 'Job Contact' : 'Direct Contact'
      }
    }

    let otherRole = 'Direct Message'
    if (latestMsg.opportunityTitle) {
      otherRole = `Job: ${latestMsg.opportunityTitle}`
    }

    // Count unread messages
    let unreadCount = 0
    if (currentIdStr) {
      for (const m of group) {
        if (String(m.recipientId) === currentIdStr && m.status !== 'read') {
          unreadCount++
        }
      }
    }

    result.push({
      _id: convId,
      id: convId,
      conversationId: convId,
      name: otherName,
      otherUserId: otherId,
      role: otherRole,
      opportunityTitle: latestMsg.opportunityTitle || null,
      opportunityId: latestMsg.opportunityId || null,
      recipientId: otherId || latestMsg.recipientId || '',
      recipientName: otherName,
      lastMsg: latestMsg.text,
      time: latestMsg.timestamp || latestMsg.time || new Date(latestMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      latestTime: mTime,
      unread: unreadCount,
      avatar: latestMsg.opportunityTitle ? '💼' : '👤',
      online: true,
    })
  }

  return result.sort((a, b) => b.latestTime - a.latestTime)
}

// ── GET /api/chat/conversations ──────────────────────────────────────
router.get('/conversations', optionalAuth, async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.query.userId || null
    const currentUserName = req.user?.name || req.query.userName || null
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

    const conversations = buildConversationsList(messages, currentUserId, currentUserName)

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

    if (newMsg.recipientId) {
      sendNotification({
        userId: newMsg.recipientId,
        title: `New Message from ${newMsg.senderName}`,
        message: newMsg.text,
        type: 'chat',
        link: '/chat'
      }).catch(err => console.error('Error sending message notification:', err))
    }

    inMemoryMessages.push(newMsg)

    // Broadcast through socket if available
    const io = req.app.get('io')
    if (io) {
      io.to(`chat:${roomId}`).emit('chat:message', newMsg)
      if (newMsg.recipientId) {
        io.to(`user:${newMsg.recipientId}`).emit('chat:message', newMsg)
      }
    }

    res.status(201).json({ success: true, data: newMsg })
  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({ success: false, message: 'Failed to send message.' })
  }
})

export default router

