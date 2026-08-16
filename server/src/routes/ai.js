import { Router } from 'express'
import axios from 'axios'
import { optionalAuth } from '../middleware/auth.js'
import { createError } from '../middleware/errorHandler.js'

const router = Router()

// Demo Translation Dictionary (English ⇄ Tamil)
const TRANSLATION_DICTIONARY = {
  // English to Tamil
  'namaste! i saw your cooking class listing.': 'வணக்கம்! உங்கள் சமையல் வகுப்பு விளம்பரத்தைப் பார்த்தேன்.',
  'namaste ji! yes, i teach traditional south indian cooking.': 'வணக்கம் ஐயா! ஆம், நான் பாரம்பரிய தென்னிந்திய சமையல் கற்றுத் தருகிறேன்.',
  'how much do you charge per session?': 'ஒரு அமர்வுக்கு எவ்வளவு கட்டணம் செலுத்துகிறீர்கள்?',
  '₹500 per session of 2 hours. includes all ingredients.': '2 மணி நேர அமர்வுக்கு ₹500. அனைத்து பொருட்களும் சேர்க்கப்பட்டுள்ளன.',
  '₹600 per session of 2 hours. includes all ingredients.': '2 மணி நேர அமர்வுக்கு ₹600. அனைத்து பொருட்களும் சேர்க்கப்பட்டுள்ளன.',
  'great! see you tomorrow at 4pm 😊': 'மிக்க மகிழ்ச்சி! நாளை மாலை 4 மணிக்கு சந்திப்போம் 😊',
  'can you teach custom saree blouse stitching?': 'தனிப்பயன் புடவை பிளவுஸ் தைப்பதை கற்றுக்கொடுக்க முடியுமா?',
  'hello! i need bridal blouse embroidery.': 'வணக்கம்! எனக்கு மணப்பெண் பிளவுஸ் எம்பிராய்டரி தேவை.',
  'yes, i teach algebra and geometry on weekends.': 'ஆம், நான் வார இறுதிகளில் இயற்கணிதம் மற்றும் வடிவியலைக் கற்பிக்கிறேன்.',
  
  // Tamil to English
  'வணக்கம்! உங்கள் சமையல் வகுப்பு விளம்பரத்தைப் பார்த்தேன்.': 'Namaste! I saw your cooking class listing.',
  'மிக்க மகிழ்ச்சி! நாளை மாலை 4 மணிக்கு சந்திப்போம் 😊': 'Great! See you tomorrow at 4pm 😊',
  'ஒரு அமர்வுக்கு எவ்வளவு கட்டணம் செலுத்துகிறீர்கள்?': 'How much do you charge per session?',
}

/**
 * POST /api/ai/translate
 * Translates text between English & Tamil (or other languages).
 * Pluggable for Google Cloud Translation API.
 */
router.post('/translate', async (req, res, next) => {
  try {
    const { text, targetLang = 'ta', sourceLang = 'en' } = req.body
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text is required for translation.' })
    }

    const cleanText = text.trim()
    const lowerText = cleanText.toLowerCase()
    const apiKey = process.env.GOOGLE_TRANSLATE_KEY

    // Try Google Cloud Translation API if key is set
    if (apiKey) {
      try {
        const response = await axios.post(
          `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
          {
            q: cleanText,
            target: targetLang,
            source: sourceLang,
          }
        )
        const translatedText = response.data?.data?.translations?.[0]?.translatedText
        if (translatedText) {
          return res.json({
            success: true,
            source: 'google-translate',
            originalText: cleanText,
            translatedText,
            targetLang,
          })
        }
      } catch (gErr) {
        console.error('Google Translate API error (using fallback dictionary):', gErr.message)
      }
    }

    // Fallback Translation Engine (English ⇄ Tamil)
    let translatedText = TRANSLATION_DICTIONARY[lowerText]

    if (!translatedText) {
      // Dynamic mock translation formatter
      if (targetLang === 'ta' || targetLang === 'tamil') {
        translatedText = `[தமிழாக்கம்]: ${cleanText} (பாரம்பரிய தென்னிந்திய முறை)`
      } else {
        translatedText = `[English]: ${cleanText} (Translated)`
      }
    }

    return res.json({
      success: true,
      source: 'mock-dictionary',
      originalText: cleanText,
      translatedText,
      targetLang,
    })
  } catch (err) {
    next(err)
  }
})

// ── Rule-based Mock Engine for SilverAI Livelihood Assistant ──
const SILVER_AI_RESPONSES = {
  cooking: `🍳 **Cooking & Culinary Opportunities:**
• **Home Cooking Classes**: Teach 1-on-1 or small family sessions (Est. ₹500–₹1,200/session)
• **Catering & Tiffin Services**: Provide homemade meals for events or offices
• **Homemade Pickles & Ghee**: Sell through the SilverHands Marketplace!

💡 *Tip: Click [Find Cooking Opportunities] below to browse active listings near Chennai and Coimbatore!*`,

  tailoring: `🧵 **Tailoring & Embroidery Opportunities:**
• **Custom Blouse Stitching**: High demand for Aari & zardozi embroidery work (Est. ₹600–₹1,500/blouse)
• **Alterations & Fittings**: Doorstep pickup and quick 2-day turnaround
• **Handcrafted Fabric Items**: Sell cushion covers and potli bags on the Marketplace!

💡 *Tip: You can list your custom tailoring service on the Marketplace anytime!*`,

  earnings: `💰 **Estimated Earnings Overview:**
• 🍳 **Cooking Classes**: ₹300–₹1,500 per session
• 🧵 **Embroidery & Tailoring**: ₹400–₹1,200 per piece
• 📐 **Maths/Science Tutoring**: ₹300–₹600 per hour
• 🫙 **Homemade Food/Craft Products**: ₹200–₹500 per unit

⚠️ *Note: All earnings figures are estimated market benchmarks. Actual income depends on work completed and location. SilverHands does not guarantee fixed earnings.*`,

  safety: `🛡️ **SilverHands Safety & Ethical Rules:**
• 🔒 **Chat First**: Always communicate with clients using SilverHands Messages
• 👤 **Verify Badges**: Look for the ✓ Verified badge on employer profiles
• 📍 **Share Location**: Inform family members before visiting an in-person client venue
• 📞 **Safety Helpline**: For urgent help, call 1800-XXX-XXXX or tap the Report button`,

  default: `Namaste! 🙏 I am **SilverAI**, your friendly livelihood assistant on SilverHands.

I am here to support senior citizens and homemakers in India to earn meaningful income.

I can assist you with:
1. 💼 Discovering work matching your cooking, tailoring, or teaching skills
2. 🛒 Listing your homemade food or craft products
3. 💰 Understanding estimated earning ranges
4. 🛡️ Staying safe while interacting with clients

How can I help you today?`,
}

function getSilverAIResponse(promptText = '') {
  const lower = promptText.toLowerCase()
  if (lower.includes('cook') || lower.includes('recipe') || lower.includes('food') || lower.includes('kitchen')) {
    return SILVER_AI_RESPONSES.cooking
  }
  if (lower.includes('stitch') || lower.includes('tailor') || lower.includes('embroidery') || lower.includes('saree')) {
    return SILVER_AI_RESPONSES.tailoring
  }
  if (lower.includes('earn') || lower.includes('income') || lower.includes('money') || lower.includes('pay')) {
    return SILVER_AI_RESPONSES.earnings
  }
  if (lower.includes('safe') || lower.includes('security') || lower.includes('protect') || lower.includes('help')) {
    return SILVER_AI_RESPONSES.safety
  }
  return SILVER_AI_RESPONSES.default
}

/**
 * POST /api/ai/assistant
 * Gemini-backed chatbot for SilverAI friendly livelihood assistant
 */
router.post('/assistant', optionalAuth, async (req, res, next) => {
  try {
    const { message } = req.body
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message parameter is required.' })
    }

    const cleanMessage = message.trim()
    const apiKey = process.env.GEMINI_API_KEY

    // Try Google Gemini API if key exists
    if (apiKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

        const systemPrompt = `You are SilverAI, a warm, respectful, and encouraging livelihood assistant for SilverHands, an AI platform empowering Indian senior citizens and homemakers.
Your goals:
1. Help users discover opportunities, list products, estimate income, and stay safe.
2. Never invent fake income guarantees or fake customer reviews.
3. Always label earnings as "Estimated".
4. Keep responses concise, warm, and structured with clear emojis.`

        const result = await model.generateContent(`${systemPrompt}\n\nUser Question: ${cleanMessage}`)
        const text = result.response.text()

        if (text) {
          return res.json({
            success: true,
            source: 'gemini',
            response: text,
          })
        }
      } catch (geminiErr) {
        console.error('Gemini Assistant API Error (using mock fallback):', geminiErr.message)
      }
    }

    // Fallback Mock Engine
    const mockResponse = getSilverAIResponse(cleanMessage)
    return res.json({
      success: true,
      source: 'mock-assistant',
      response: mockResponse,
    })
  } catch (err) {
    next(err)
  }
})

// Mock AI Endpoints for Skill Discovery & Profile Generation
router.post('/discover-skills', optionalAuth, async (req, res, next) => {
  res.json({
    success: true,
    source: 'mock-ai',
    skills: [
      { icon: '🍳', name: 'Cooking' },
      { icon: '🧵', name: 'Tailoring & Embroidery' },
    ],
    experienceYears: '20+ years',
    suggestedServices: ['Traditional South & North Indian Meals', 'Custom Blouse Stitching & Alterations'],
    recommendation: 'Highly suitable for offering specialized home cooking classes and custom tailoring listings.',
  })
})

router.post('/generate-profile', optionalAuth, async (req, res, next) => {
  res.json({
    success: true,
    source: 'mock-ai',
    headline: 'Master Home Cook & Experienced Tailor',
    about: 'Namaste! With over 20 years of experience, I provide authentic home-cooked culinary experiences and personalized saree blouse stitching.',
    serviceDescriptions: [
      '1-on-1 Cooking Masterclasses (Traditional Recipes)',
      'Custom Designer Saree Blouse Stitching & Embroidery',
    ],
  })
})

export default router
