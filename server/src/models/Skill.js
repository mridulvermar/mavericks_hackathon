import mongoose from 'mongoose'

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  description: String,
  suggestedEarnings: String,
}, { timestamps: true })

export default mongoose.model('Skill', skillSchema)
