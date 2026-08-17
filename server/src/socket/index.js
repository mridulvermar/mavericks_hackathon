import mongoose from 'mongoose'
import Message from '../models/Message.js'

const connectedUsers = new Map() // userId → socketId

export const setupSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)

    // User identifies themselves and joins personal room
    socket.on('user:join', (userId) => {
      connectedUsers.set(userId, socket.id)
      socket.join(`user:${userId}`)
      io.emit('user:online', { userId, online: true })
      console.log(`👤 User ${userId} joined & online`)
    })

    // Join a specific conversation or booking chat room
    socket.on('chat:join', (roomId) => {
      socket.join(`chat:${roomId}`)
      console.log(`💬 Socket ${socket.id} joined room chat:${roomId}`)
    })

    // Send real-time chat message
    socket.on('chat:message', async (data) => {
      const { clientMsgId, roomId, conversationId, message, senderId, senderName, text } = data
      const targetRoom = roomId || conversationId || 'c1'

      // Check if recipient is active in the same chat room
      const roomSockets = io.sockets.adapter.rooms.get(`chat:${targetRoom}`)
      const roomSize = roomSockets ? roomSockets.size : 0
      const computedStatus = roomSize > 1 ? 'read' : 'delivered'

      const msgData = {
        _id: clientMsgId || String(Date.now()),
        id: clientMsgId || String(Date.now()),
        clientMsgId: clientMsgId || String(Date.now()),
        conversationId: targetRoom,
        text: text || message?.text || '',
        senderId: senderId,
        sender: 'other', // Will be determined on client by comparing senderId
        senderName: senderName || 'User',
        status: computedStatus,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
      }

      // Persist in MongoDB if active
      if (mongoose.connection.readyState === 1) {
        try {
          const created = await Message.create({
            conversationId: targetRoom,
            senderId,
            senderName: msgData.senderName,
            text: msgData.text,
            status: msgData.status,
            timestamp: msgData.timestamp,
          })
          if (created) {
            msgData._id = String(created._id)
          }
        } catch (err) {
          console.error('Error saving socket message to DB:', err)
        }
      }

      // Broadcast message to everyone in the room (client will match by clientMsgId)
      io.to(`chat:${targetRoom}`).emit('chat:message', msgData)
    })

    // Typing indicator
    socket.on('chat:typing', ({ roomId, userId, isTyping }) => {
      socket.to(`chat:${roomId}`).emit('chat:typing', { userId, isTyping })
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
