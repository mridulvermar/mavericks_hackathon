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

      // Check if recipient is active in the same chat room
      const roomSockets = io.sockets.adapter.rooms.get(`chat:${targetRoom}`)
      const roomSize = roomSockets ? roomSockets.size : 0
      const computedStatus = roomSize > 1 ? 'read' : 'delivered'

      const msgData = {
        _id: clientMsgId || String(Date.now()),
        id: clientMsgId || String(Date.now()),
        clientMsgId: clientMsgId || String(Date.now()),
        conversationId: targetRoom,
        text: messageText,
        senderId: senderId || 'u_user',
        sender: 'other', // Will be determined on client by comparing senderId
        senderName: senderName || 'User',
        recipientId: recipientId || '',
        recipientName: recipientName || '',
        opportunityTitle: opportunityTitle || null,
        opportunityId: opportunityId || null,
        bookingId: bookingId || null,
        status: computedStatus,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
      }

      // Persist in MongoDB if active
      if (mongoose.connection.readyState === 1) {
        try {
          const created = await Message.create({
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
          link: '/chat'
        }).catch(err => console.error('Error sending message notification:', err))
      }

      inMemoryMessages.push(msgData)

      // Broadcast message to everyone in the room (client will match by clientMsgId)
      io.to(`chat:${targetRoom}`).emit('chat:message', msgData)

      // If recipient is not in this chat room but online, notify their personal user room
      if (recipientId && roomSize <= 1) {
        io.to(`user:${recipientId}`).emit('chat:notification', {
          conversationId: targetRoom,
          senderName: msgData.senderName,
          text: msgData.text,
          opportunityTitle: msgData.opportunityTitle,
        })
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

