import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { createError } from '../middleware/errorHandler.js'

const router = Router()

// ── Rule-based Mock Engine for Discover Skills ──
const mockDiscoverSkills = (description = '') => {
  const text = description.toLowerCase()
  const skills = []
  const suggestedServices = []
  const suggestedProducts = []

  // Extract years of experience if mentioned in text
  const yearMatch = text.match(/(\d+)\s*(?:\+)?\s*(?:years?|yrs?)/)
  const experienceYears = yearMatch ? parseInt(yearMatch[1], 10) : 15

  if (text.includes('cook') || text.includes('kitchen') || text.includes('recipe') || text.includes('pickle') || text.includes('masala') || text.includes('food') || text.includes('bake')) {
    skills.push({ icon: '🍳', name: 'Traditional Indian Cooking' })
    skills.push({ icon: '🌶️', name: 'Handcrafted Spices & Pickles' })
    suggestedServices.push('1-on-1 Online Cooking Lessons', 'Traditional Recipe Consultation')
    suggestedProducts.push('Homemade Garam Masala', 'Organic Mango Pickle')
  }

  if (text.includes('stitch') || text.includes('sew') || text.includes('embroidery') || text.includes('saree') || text.includes('tailor') || text.includes('knit') || text.includes('cloth')) {
    skills.push({ icon: '🧵', name: 'Stitching & Tailoring' })
    skills.push({ icon: '🎨', name: 'Saree Embroidery & Alterations' })
    suggestedServices.push('Saree Blouse Alterations', 'Custom Embroidery Workshop')
    suggestedProducts.push('Hand-embroidered Cushion Covers', 'Custom Tote Bags')
  }

  if (text.includes('teach') || text.includes('tutor') || text.includes('student') || text.includes('book') || text.includes('math') || text.includes('science') || text.includes('read')) {
    skills.push({ icon: '📚', name: 'Primary & High School Tutoring' })
    skills.push({ icon: '🗣️', name: 'Language & Mentorship' })
    suggestedServices.push('After-school Math & Hindi Tutoring', 'Storytelling & Reading Classes')
  }

  if (text.includes('garden') || text.includes('plant') || text.includes('flower') || text.includes('nursery') || text.includes('herb')) {
    skills.push({ icon: '🌿', name: 'Organic Gardening & Plant Care' })
    suggestedServices.push('Balcony Garden Setup Consultation', 'Plant Care Advice')
    suggestedProducts.push('Organic Plant Fertilizer', 'Potted Herbal Plants')
  }

  if (text.includes('care') || text.includes('elder') || text.includes('senior') || text.includes('patient') || text.includes('child')) {
    skills.push({ icon: '💆', name: 'Senior Companion & Caregiving' })
    skills.push({ icon: '👶', name: 'Childcare & Storytelling' })
    suggestedServices.push('Elderly Daytime Companion', 'Child Storytelling & Supervision')
  }

  if (text.includes('art') || text.includes('paint') || text.includes('craft') || text.includes('drawing')) {
    skills.push({ icon: '🎨', name: 'Traditional Indian Art & Handicrafts' })
    suggestedServices.push('Art & Craft Classes for Kids', 'Custom Festival Decor Creation')
    suggestedProducts.push('Hand-painted Clay Diyas', 'Rangoli Stencils & Decor')
  }

  // Fallback default skills if no keywords matched
  if (skills.length === 0) {
    skills.push({ icon: '🍳', name: 'Home Cooking & Recipes' })
    skills.push({ icon: '🧵', name: 'Tailoring & Crafting' })
    suggestedServices.push('Home Cooking Lessons', 'Custom Crafting')
    suggestedProducts.push('Homemade Snacks', 'Handcrafted Goods')
  }

  const skillNames = skills.map(s => s.name).join(' and ')
  const recommendation = `Based on your ${experienceYears}+ years of experience, you have strong expertise in ${skillNames}. We recommend starting by offering online sessions or listing your handcrafted creations on SilverHands!`

  return {
    skills,
    experienceYears,
    suggestedServices,
    suggestedProducts,
    recommendation,
  }
}

// ── Rule-based Mock Engine for Profile Generation ──
const mockGenerateProfile = (description = '', skills = []) => {
  const primarySkill = skills.length > 0 ? skills[0] : 'Home Crafts & Culinary Arts'
  const headline = `Experienced ${primarySkill} Specialist & Wisdom Mentor`
  const about = `Namaste! I am a passionate specialist in ${primarySkill} with decades of home experience. I take pride in sharing my knowledge, teaching authentic skills, and delivering high-quality traditional work to clients.`
  
  const skillList = skills.length > 0 ? skills : ['Home Cooking', 'Tailoring', 'Mentorship']
  const serviceDescriptions = [
    `Personalized 1-on-1 sessions for ${primarySkill}`,
    'Custom order consultation and traditional home preparation',
  ]

  return {
    headline,
    about,
    skills: skillList,
    serviceDescriptions,
  }
}

// Helper to safely parse JSON from Gemini text response
const parseGeminiJSON = (rawText) => {
  try {
    let clean = rawText.trim()
    // Remove markdown codeblock syntax if present
    if (clean.startsWith('```json')) clean = clean.slice(7)
    else if (clean.startsWith('```')) clean = clean.slice(3)
    if (clean.endsWith('```')) clean = clean.slice(0, -3)
    clean = clean.trim()

    return JSON.parse(clean)
  } catch (e) {
    console.error('Failed to parse Gemini JSON output:', e.message, rawText)
    return null
  }
}

// POST /api/ai/discover-skills
router.post('/discover-skills', authenticate, async (req, res, next) => {
  try {
    const { description } = req.body
    if (!description || !description.trim()) {
      return next(createError('Please provide a description of your experience or skills.', 400))
    }

    const apiKey = process.env.GEMINI_API_KEY

    // Try Gemini API if key is present
    if (apiKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        })

        const systemPrompt = `You are an AI career advisor for SilverHands, a platform empowering Indian senior citizens and homemakers.
Analyze the user's text about their life experience and return STRICT JSON with this exact schema:
{
  "skills": [{"icon": "emoji", "name": "Skill Title"}],
  "experienceYears": number,
  "suggestedServices": ["Service 1", "Service 2"],
  "suggestedProducts": ["Product 1", "Product 2"],
  "recommendation": "Encouraging 2-sentence summary advice"
}
Rules:
1. Extract or estimate experience years (default 15 if unspecified).
2. Choose appropriate Indian context emojis for icons.
3. Keep titles concise and senior-friendly.`

        const result = await model.generateContent(`${systemPrompt}\n\nUser Input: ${description}`)
        const text = result.response.text()
        const jsonResult = parseGeminiJSON(text)

        if (jsonResult && jsonResult.skills) {
          return res.json({
            success: true,
            source: 'gemini',
            ...jsonResult,
          })
        }
      } catch (geminiErr) {
        console.error('Gemini Discover Skills Error (falling back to mock):', geminiErr.message)
      }
    }

    // Fallback Mock Engine
    const mockData = mockDiscoverSkills(description)
    return res.json({
      success: true,
      source: 'mock',
      ...mockData,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/ai/generate-profile
router.post('/generate-profile', authenticate, async (req, res, next) => {
  try {
    const { description, skills = [] } = req.body
    const apiKey = process.env.GEMINI_API_KEY

    if (apiKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        })

        const systemPrompt = `You are a profile writing assistant for SilverHands (Indian elders & homemakers livelihood platform).
Generate a professional, respectful, warm profile based on user input. Return STRICT JSON with this exact schema:
{
  "headline": "Catchy professional headline",
  "about": "Warm 3-4 sentence bio starting with Namaste",
  "skills": ["Skill 1", "Skill 2"],
  "serviceDescriptions": ["Service offer 1", "Service offer 2"]
}`

        const result = await model.generateContent(`${systemPrompt}\n\nUser Input: ${description}\nSkills: ${JSON.stringify(skills)}`)
        const text = result.response.text()
        const jsonResult = parseGeminiJSON(text)

        if (jsonResult && jsonResult.headline) {
          return res.json({
            success: true,
            source: 'gemini',
            ...jsonResult,
          })
        }
      } catch (geminiErr) {
        console.error('Gemini Generate Profile Error (falling back to mock):', geminiErr.message)
      }
    }

    // Fallback Mock Engine
    const mockData = mockGenerateProfile(description, skills)
    return res.json({
      success: true,
      source: 'mock',
      ...mockData,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/ai/chat (Existing assistant route preserved)
const SAFETY_RESPONSE = `Your safety is our top priority!

🔒 **Before meeting a client:**
• Always chat first through SilverHands
• Verify the client is marked ✓ Verified
• Tell a family member where you are going

📞 **If something feels wrong:**
• Report the person using the Report button
• Call Safety Helpline: 1800-XXX-XXXX`

const EARNINGS_RESPONSE = `Based on market data, here are **estimated** earning ranges:

🍳 Cooking classes: ₹300–₹1,500/session
🧵 Embroidery: ₹200–₹800/session
📝 Writing: ₹150–₹500/article

⚠️ These are **estimates only** — actual income will vary.`

router.post('/chat', authenticate, async (req, res, next) => {
  try {
    const { message } = req.body
    if (!message) return res.status(400).json({ success: false, message: 'Message is required.' })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      const lower = message.toLowerCase()
      let response = `Thank you for your question! 🙏 I can help you with finding work, estimating earnings, and safety tips.`
      if (lower.includes('earn') || lower.includes('income')) response = EARNINGS_RESPONSE
      if (lower.includes('safe') || lower.includes('security')) response = SAFETY_RESPONSE
      return res.json({ success: true, response, source: 'mock' })
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const result = await model.generateContent(`System: You are an assistant for SilverHands.\nUser: ${message}`)
      return res.json({ success: true, response: result.response.text(), source: 'gemini' })
    } catch (err) {
      return res.json({ success: true, response: EARNINGS_RESPONSE, source: 'mock-fallback' })
    }
  } catch (err) {
    next(err)
  }
})

export default router
