import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const SAFETY_RESPONSE = `Your safety is our top priority!

🔒 **Before meeting a client:**
• Always chat first through SilverHands
• Verify the client is marked ✓ Verified
• Tell a family member where you are going

📞 **If something feels wrong:**
• Report the person using the Report button
• Call Safety Helpline: 1800-XXX-XXXX

You are always in control. 🙏`

const EARNINGS_RESPONSE = `Based on market data, here are **estimated** earning ranges:

🍳 Cooking classes: ₹300–₹1,500/session
🧵 Embroidery: ₹200–₹800/session
📝 Writing: ₹150–₹500/article

⚠️ These are **estimates only** — actual income will vary. SilverHands does not guarantee any specific income.`

// Mock AI response when Gemini API key is unavailable
const getMockResponse = (message) => {
  const lower = message.toLowerCase()
  if (lower.includes('earn') || lower.includes('income') || lower.includes('money')) return EARNINGS_RESPONSE
  if (lower.includes('safe') || lower.includes('security') || lower.includes('danger')) return SAFETY_RESPONSE
  return `Thank you for your question! 🙏

I can help you with:
• Finding the right work for your skills
• Understanding how much you might earn (estimates only)
• Safety tips
• Profile writing help

*Note: Full AI responses require a Gemini API key in server/.env*`
}

// POST /api/ai/chat
router.post('/chat', authenticate, async (req, res, next) => {
  try {
    const { message } = req.body
    if (!message) return res.status(400).json({ success: false, message: 'Message is required.' })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      // Fallback mock
      const response = getMockResponse(message)
      return res.json({ success: true, response, source: 'mock' })
    }

    // Real Gemini call
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      const systemPrompt = `You are a helpful AI assistant for SilverHands, an Indian platform that helps senior citizens and homemakers find work. 
Rules:
1. Always be respectful and use simple language appropriate for seniors
2. Never guarantee specific income amounts — always say "estimated" 
3. Never make fake claims about job availability
4. Provide safety-first advice for meeting clients
5. Support multiple Indian languages if asked
6. Keep responses concise and clear`

      const result = await model.generateContent(`${systemPrompt}\n\nUser: ${message}`)
      const response = result.response.text()
      return res.json({ success: true, response, source: 'gemini' })
    } catch (geminiErr) {
      console.error('Gemini API error (falling back to mock):', geminiErr.message)
      return res.json({ success: true, response: getMockResponse(message), source: 'mock-fallback' })
    }
  } catch (err) {
    next(err)
  }
})

// POST /api/ai/skills — Skill discovery analysis
router.post('/skills', authenticate, async (req, res) => {
  const { description } = req.body
  res.json({
    success: true,
    source: 'mock',
    skills: [
      { skill: 'Online Cooking Classes', match: 95, estimatedEarnings: '₹500–₹1,500/session' },
      { skill: 'Recipe Writing', match: 88, estimatedEarnings: '₹200–₹600/article' },
      { skill: 'Food Photography', match: 75, estimatedEarnings: '₹400–₹1,200/project' },
    ],
    disclaimer: 'All earnings are estimates based on market data. Actual income may vary.',
  })
})

export default router
