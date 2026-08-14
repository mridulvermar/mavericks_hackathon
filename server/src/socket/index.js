const connectedUsers = new Map() // userId → socketId

export const setupSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)

    // User identifies themselves
    socket.on('user:join', (userId) => {
      connectedUsers.set(userId, socket.id)
      socket.join(`user:${userId}`)
      console.log(`👤 User ${userId} joined`)
    })

    // Join a chat room
    socket.on('chat:join', (roomId) => {
      socket.join(`chat:${roomId}`)
    })

    // Send a message
    socket.on('chat:message', (data) => {
      const { roomId, message } = data
      // Broadcast to everyone in the room
      io.to(`chat:${roomId}`).emit('chat:message', {
        ...message,
        timestamp: new Date().toISOString(),
      })
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
          break
        }
      }
    })
  })
}
