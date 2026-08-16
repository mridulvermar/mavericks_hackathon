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
      const { roomId, conversationId, message, senderId, senderName, text } = data
      const targetRoom = roomId || conversationId || 'c1'

      const msgData = {
        _id: String(Date.now()),
        id: String(Date.now()),
        conversationId: targetRoom,
        text: text || message?.text || '',
        sender: senderId === 'me' ? 'me' : 'other',
        senderName: senderName || 'Priya Mehta',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
      }

      // Persist in MongoDB if active
      if (mongoose.connection.readyState === 1) {
        try {
          await Message.create({
            conversationId: targetRoom,
            senderId,
            senderName: msgData.senderName,
            text: msgData.text,
            timestamp: msgData.timestamp,
          })
        } catch (err) {
          console.error('Error saving socket message to DB:', err)
        }
      }

      // Broadcast message to everyone in the room
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
