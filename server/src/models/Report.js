import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema({
  reporterId: { type: String, required: true },
  reporterName: { type: String, default: 'Anonymous User' },
  reportedUserId: { type: String },
  reportedUserName: { type: String },
  reason: { type: String, required: true },
  message: { type: String },
  relatedBookingId: { type: String },
  relatedConversationId: { type: String },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
}, { timestamps: true })

export default mongoose.model('Report', reportSchema)
