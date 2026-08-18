import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: [true, 'Conversation ID is required'],
    index: true,
  },
  bookingId: {
    type: String,
    index: true,
  },
  opportunityId: {
    type: String,
    index: true,
  },
  opportunityTitle: String,
  senderId: {
    type: String,
    index: true,
  },
  senderName: {
    type: String,
    default: 'User',
  },
  recipientId: {
    type: String,
    index: true,
  },
  recipientName: String,
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

messageSchema.index({ conversationId: 1, createdAt: 1 })
messageSchema.index({ senderId: 1, recipientId: 1 })

export default mongoose.model('Message', messageSchema)
