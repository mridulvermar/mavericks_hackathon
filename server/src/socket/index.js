import mongoose from 'mongoose'
import Message from '../models/Message.js'
import { inMemoryMessages } from '../routes/chat.js'
import { sendNotification } from '../routes/notifications.js'

const connectedUsers = new Map() // userId → socketId

export const setupSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)

    // User identifies themselves and joins personal room
    socket.on('user:join', (userId) => {
      if (!userId) return
      connectedUsers.set(userId, socket.id)
      socket.join(`user:${userId}`)
      io.emit('user:online', { userId, online: true })
      console.log(`👤 User ${userId} joined & online`)
    })

    // Join a specific conversation or booking chat room
    socket.on('chat:join', (roomId) => {
      if (!roomId) return
      socket.join(`chat:${roomId}`)
      console.log(`💬 Socket ${socket.id} joined room chat:${roomId}`)
    })

    // Send real-time chat message
    socket.on('chat:message', async (data) => {
      const {
        clientMsgId,
        roomId,
        conversationId,
        message,
        senderId,
        senderName,
        recipientId,
        recipientName,
        opportunityTitle,
        opportunityId,
        bookingId,
        text,
      } = data
      const targetRoom = roomId || conversationId || 'c_default'
      const messageText = text || message?.text || ''

      if (!messageText.trim()) return

      // Deduplication check: if message with clientMsgId already exists, don't duplicate
      if (clientMsgId) {
        if (mongoose.connection.readyState === 1) {
          try {
            const existing = await Message.findOne({ clientMsgId }).lean()
            if (existing) {
              const existingPayload = {
                ...existing,
                _id: String(existing._id),
                id: String(existing._id),
              }
              io.to(`chat:${targetRoom}`).emit('chat:message', existingPayload)
              return
            }
          } catch (e) {
            console.error('Error checking existing message:', e)
          }
        }
        const inMemExisting = inMemoryMessages.find((m) => m.clientMsgId === clientMsgId)
        if (inMemExisting) {
          io.to(`chat:${targetRoom}`).emit('chat:message', inMemExisting)
          return
        }
      }

      // Check if recipient is active in the same chat room
      const roomSockets = io.sockets.adapter.rooms.get(`chat:${targetRoom}`)
      const roomSize = roomSockets ? roomSockets.size : 0
      const computedStatus = roomSize > 1 ? 'read' : 'delivered'
      const nowIso = new Date().toISOString()
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      const msgData = {
        _id: clientMsgId || String(Date.now()),
        id: clientMsgId || String(Date.now()),
        clientMsgId: clientMsgId || String(Date.now()),
        conversationId: targetRoom,
        text: messageText.trim(),
        senderId: senderId || 'u_user',
        sender: 'other', // Sender determination happens on client relative to currentUserId
        senderName: senderName || 'User',
        recipientId: recipientId || '',
        recipientName: recipientName || '',
        opportunityTitle: opportunityTitle || null,
        opportunityId: opportunityId || null,
        bookingId: bookingId || null,
        status: computedStatus,
        time: nowTime,
        timestamp: nowTime,
        createdAt: nowIso,
      }

      // Persist in MongoDB if active
      if (mongoose.connection.readyState === 1) {
        try {
          const created = await Message.create({
            clientMsgId: msgData.clientMsgId,
            conversationId: targetRoom,
            senderId: msgData.senderId,
            senderName: msgData.senderName,
            recipientId: msgData.recipientId,
            recipientName: msgData.recipientName,
            opportunityTitle: msgData.opportunityTitle,
            opportunityId: msgData.opportunityId,
            bookingId: msgData.bookingId,
            text: msgData.text,
            status: msgData.status,
            timestamp: msgData.timestamp,
          })
          if (created) {
            msgData._id = String(created._id)
            msgData.id = String(created._id)
            msgData.createdAt = created.createdAt ? created.createdAt.toISOString() : nowIso
          }
        } catch (err) {
          console.error('Error saving socket message to DB:', err)
        }
      }

      if (msgData.recipientId) {
        sendNotification({
          userId: msgData.recipientId,
          title: `New Message from ${msgData.senderName}`,
          message: msgData.text,
          type: 'chat',
          link: '/chat',
        }).catch((err) => console.error('Error sending message notification:', err))
      }

      inMemoryMessages.push(msgData)

      // Broadcast message to everyone in the chat room
      io.to(`chat:${targetRoom}`).emit('chat:message', msgData)

      // Also directly emit chat:message to recipient's personal user room so their conversation list & notifications update in real time
      if (msgData.recipientId) {
        io.to(`user:${msgData.recipientId}`).emit('chat:message', msgData)
        io.to(`user:${msgData.recipientId}`).emit('chat:notification', {
          conversationId: targetRoom,
          senderName: msgData.senderName,
          text: msgData.text,
          opportunityTitle: msgData.opportunityTitle,
        })
      }

      // Also notify sender's personal room for multi-tab sync
      if (msgData.senderId) {
        io.to(`user:${msgData.senderId}`).emit('chat:message', msgData)
      }
    })

    // Typing indicator
    socket.on('chat:typing', ({ roomId, userId, isTyping }) => {
      if (roomId) {
        socket.to(`chat:${roomId}`).emit('chat:typing', { userId, isTyping })
      }
    })

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`)
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId)
          io.emit('user:online', { userId, online: false })
          break
        }
      }
    })
  })
}

