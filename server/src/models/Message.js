import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: [true, 'Conversation ID is required'],
    index: true,
  },
  bookingId: String,
  senderId: String,
  senderName: {
    type: String,
    default: 'User',
  },
  recipientId: String,
  text: {
    type: String,
    required: [true, 'Message text is required'],
  },
  translatedText: String,
  sender: {
    type: String,
    enum: ['me', 'other'],
    default: 'other',
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  },
  timestamp: {
    type: String,
    default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
}, { timestamps: true })

export default mongoose.model('Message', messageSchema)
