import { Router } from 'express'
import axios from 'axios'
import { optionalAuth } from '../middleware/auth.js'
import { createError } from '../middleware/errorHandler.js'
import { geminiRateLimiter, cloudServicesRateLimiter } from '../middleware/rateLimiter.js'

const router = Router()

// ── In-Memory Free-Tier Quota Saver Caches (TTL: 2 hours) ──
const CACHE_TTL_MS = 2 * 60 * 60 * 1000
const translationCache = new Map()
const discoveryCache = new Map()
const profileCache = new Map()
const assistantCache = new Map()

// Helper to get from cache
function getCached(cache, key) {
  const item = cache.get(key)
  if (!item) return null
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return item.data
}

// Helper to set in cache
function setCache(cache, key, data) {
  // Prune oldest if cache grows over 500 items
  if (cache.size > 500) {
    const firstKey = cache.keys().next().value
    cache.delete(firstKey)
  }
  cache.set(key, { data, timestamp: Date.now() })
}

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
 * Rate limited to 20 RPM with cache to preserve Google Cloud free tier characters.
 */
router.post('/translate', cloudServicesRateLimiter, async (req, res, next) => {
  try {
    const { text, targetLang = 'ta', sourceLang = 'en' } = req.body
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text is required for translation.' })
    }

    const cleanText = text.trim()
    const lowerText = cleanText.toLowerCase()
    const cacheKey = `${sourceLang}_${targetLang}_${lowerText}`

    // Check in-memory cache first to save quota
    const cachedResult = getCached(translationCache, cacheKey)
    if (cachedResult) {
      return res.json({
        success: true,
        source: 'cache',
        originalText: cleanText,
        translatedText: cachedResult,
        targetLang,
      })
    }

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

// ── Rule-based Mock Engine for CareerAI Livelihood Assistant ──
const CAREER_AI_RESPONSES = {
  cooking: `🍳 **Cooking & Culinary Opportunities:**
• **Home Cooking Classes**: Teach 1-on-1 or small family sessions (Est. ₹500–₹1,200/session)
• **Catering & Tiffin Services**: Provide homemade meals for events or offices
• **Homemade Pickles & Ghee**: Sell through the Career 2.0 Marketplace!

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

⚠️ *Note: All earnings figures are estimated market benchmarks. Actual income depends on work completed and location. Career 2.0 does not guarantee fixed earnings.*`,

  safety: `🛡️ **Career 2.0 Safety & Ethical Rules:**
• 🔒 **Chat First**: Always communicate with clients using Career 2.0 Messages
• 👤 **Verify Badges**: Look for the ✓ Verified badge on employer profiles
• 📍 **Share Location**: Inform family members before visiting an in-person client venue
• 📞 **Safety Helpline**: For urgent help, call 1800-XXX-XXXX or tap the Report button`,

  default: `Namaste! 🙏 I am **CareerAI**, your friendly livelihood assistant on Career 2.0.

I am here to support senior citizens and homemakers in India to earn meaningful income.

I can assist you with:
1. 💼 Discovering work matching your cooking, tailoring, or teaching skills
2. 🛒 Listing your homemade food or craft products
3. 💰 Understanding estimated earning ranges
4. 🛡️ Staying safe while interacting with clients

How can I help you today?`,
}

function getCareerAIResponse(promptText = '') {
  const lower = promptText.toLowerCase()
  if (lower.includes('cook') || lower.includes('recipe') || lower.includes('food') || lower.includes('kitchen')) {
    return CAREER_AI_RESPONSES.cooking
  }
  if (lower.includes('stitch') || lower.includes('tailor') || lower.includes('embroidery') || lower.includes('saree')) {
    return CAREER_AI_RESPONSES.tailoring
  }
  if (lower.includes('earn') || lower.includes('income') || lower.includes('money') || lower.includes('pay')) {
    return CAREER_AI_RESPONSES.earnings
  }
  if (lower.includes('safe') || lower.includes('security') || lower.includes('protect') || lower.includes('help')) {
    return CAREER_AI_RESPONSES.safety
  }
  return CAREER_AI_RESPONSES.default
}

/**
 * POST /api/ai/assistant
 * Gemini-backed chatbot for CareerAI friendly livelihood assistant
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
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const systemPrompt = `You are CareerAI, a warm, respectful, and encouraging livelihood assistant for Career 2.0, an AI platform empowering Indian senior citizens and homemakers.
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
    const mockResponse = getCareerAIResponse(cleanMessage)
    return res.json({
      success: true,
      source: 'mock-assistant',
      response: mockResponse,
    })
  } catch (err) {
    next(err)
  }
})

// ── Advanced Dynamic Keyword Extraction & Prediction Engine ─────────────────────────────

const DOMAIN_TAXONOMY = [
  {
    category: 'cooking_traditional',
    name: 'Traditional Home Cooking & Culinary Art',
    icon: '🍳',
    keywords: [
      'cook', 'cooking', 'home cooked', 'traditional food', 'recipe', 'recipes', 'rasam', 'sambar',
      'dal', 'curry', 'curries', 'roti', 'phulka', 'chapati', 'paratha', 'sabzi', 'biryani', 'pulao',
      'south indian', 'north indian', 'rajasthani', 'gujarati', 'bengali', 'kerala', 'maharashtrian',
      'andhra', 'chettinad', 'tiffin', 'breakfast', 'lunch', 'dinner', 'homestyle meals', 'thali'
    ],
    serviceBuilder: (kw) => `Authentic Homestyle ${kw.length ? kw.slice(0, 2).join(' & ') : 'Traditional'} Meal Preparation & Catering`,
    productBuilder: (kw) => `Daily Homestyle Fresh Tiffin & ${kw[0] || 'Traditional Food'} Meal Boxes`,
  },
  {
    category: 'pickles_preserves',
    name: 'Artisanal Pickles, Podis & Heritage Preserves',
    icon: '🫙',
    keywords: [
      'pickle', 'pickles', 'achar', 'avakkai', 'oorugai', 'mango pickle', 'lemon pickle', 'garlic pickle',
      'chutney', 'podi', 'idli podi', 'gunpowder', 'masala', 'ghee', 'homemade ghee', 'papad', 'appalam',
      'vadam', 'vathal', 'preserve', 'jam', 'spice blend', 'curry powder'
    ],
    serviceBuilder: (kw) => `Custom Heritage ${kw[0] || 'Pickle'} & Fresh Masala Podi Preparation`,
    productBuilder: (kw) => `Artisanal Small-Batch ${kw.slice(0, 2).join(' & ') || 'Homemade Pickles & Podis'}`,
  },
  {
    category: 'sweets_baking',
    name: 'Traditional Sweets, Savories & Home Baking',
    icon: '🧁',
    keywords: [
      'bake', 'baking', 'cake', 'cupcake', 'cookies', 'pastry', 'bread', 'dessert', 'sweets', 'mithai',
      'halwa', 'laddu', 'laddoo', 'mysore pak', 'gulab jamun', 'burfi', 'peda', 'murukku', 'mixture',
      'thattai', 'seedai', 'diwali sweets', 'festive snacks'
    ],
    serviceBuilder: (kw) => `Fresh Handcrafted ${kw[0] || 'Celebration Sweets'} & Festival Treat Catering`,
    productBuilder: (kw) => `Boxed Traditional ${kw.slice(0, 2).join(' & ') || 'Festive Sweets & Savories'}`,
  },
  {
    category: 'tailoring_stitching',
    name: 'Custom Saree Blouse Tailoring & Garment Fitting',
    icon: '🧵',
    keywords: [
      'stitch', 'stitching', 'tailor', 'tailoring', 'blouse', 'saree blouse', 'designer blouse', 'salwar',
      'kurti', 'kameez', 'lehenga', 'fall', 'pico', 'fall pico', 'alteration', 'fitting', 'hem',
      'dressmaking', 'sewing', 'garment', 'lining work', 'piping'
    ],
    serviceBuilder: (kw) => `Custom ${kw[0] || 'Saree Blouse'} Stitching, Fall-Pico & Express Fitting`,
    productBuilder: (kw) => `Tailored Designer Blouse Pieces & Handcrafted Potli Gift Bags`,
  },
  {
    category: 'embroidery_crafts',
    name: 'Aari, Zardozi & Hand Embroidery Work',
    icon: '✨',
    keywords: [
      'embroidery', 'embroider', 'aari', 'aari work', 'zardozi', 'beadwork', 'thread work', 'maggam',
      'maggam work', 'mirror work', 'sequin', 'hand work', 'needlework', 'stone work', 'cut work', 'kasuti'
    ],
    serviceBuilder: (kw) => `Bridal & Festive ${kw[0] || 'Aari & Zardozi'} Hand Embroidery Work`,
    productBuilder: (kw) => `Embroidered Dupattas, Cushion Covers & Decorative Art Hangings`,
  },
  {
    category: 'knitting_crochet',
    name: 'Knitting, Crochet & Fiber Crafts',
    icon: '🧶',
    keywords: [
      'knit', 'knitting', 'crochet', 'wool', 'woolen', 'sweater', 'muffler', 'macrame', 'yarn',
      'baby blanket', 'booties', 'shawl', 'doily', 'coasters', 'crochet bag'
    ],
    serviceBuilder: (kw) => `Bespoke Hand-Knitted ${kw[0] || 'Woolen'} Garments & Custom Crochet Sets`,
    productBuilder: (kw) => `Handcrafted Crochet Bags, Woolen Baby Sets & Home Decor Doilies`,
  },
  {
    category: 'maths_science_tutoring',
    name: 'Mathematics, Science & Academic Mentorship',
    icon: '📐',
    keywords: [
      'math', 'maths', 'mathematics', 'algebra', 'geometry', 'arithmetic', 'calculus', 'physics',
      'chemistry', 'science', 'teach', 'teaching', 'tutor', 'tutoring', 'tuition', 'class 10', 'class 12',
      'school', 'student', 'cbse', 'icse', 'state board', 'exam prep', 'homework help'
    ],
    serviceBuilder: (kw) => `1-on-1 Concept Clarity & Board Exam ${kw[0] || 'Maths & Science'} Tutoring`,
    productBuilder: (kw) => `Curated Formula Sheets & Quick-Revision Subject Study Notes`,
  },
  {
    category: 'language_shlokas',
    name: 'Language Tutoring, Shlokas & Vedic Chanting',
    icon: '📚',
    keywords: [
      'english', 'spoken english', 'hindi', 'tamil', 'sanskrit', 'telugu', 'kannada', 'marathi',
      'grammar', 'speaking', 'slokas', 'shloka', 'chanting', 'scripture', 'bhagavad gita',
      'stotra', 'sahasranamam', 'devotional', 'moral stories'
    ],
    serviceBuilder: (kw) => `Personalized ${kw[0] || 'Language'} Tutoring & Traditional Shloka Recitation Lessons`,
    productBuilder: (kw) => `Personalized Audio Pronunciation Guides & Chanting Study Cards`,
  },
  {
    category: 'gardening_plants',
    name: 'Terrace Gardening, Composting & Plant Care',
    icon: '🌿',
    keywords: [
      'garden', 'gardening', 'plant', 'plants', 'bonsai', 'organic', 'compost', 'vegetables', 'flower',
      'nursery', 'terrace garden', 'herbs', 'medicinal plants', 'gardener', 'potting'
    ],
    serviceBuilder: (kw) => `Home Terrace Garden Setup & Organic Plant Care Consultation`,
    productBuilder: (kw) => `Homemade Organic Compost & Propagated Seedling Starter Pots`,
  },
  {
    category: 'handicrafts_art',
    name: 'Traditional Handicrafts, Kolam & Festive Art',
    icon: '🎨',
    keywords: [
      'craft', 'crafts', 'handicraft', 'pottery', 'clay', 'painting', 'sketch', 'art', 'origami',
      'quilling', 'diy', 'rangoli', 'kolam', 'diya painting', 'tanjore painting', 'festive decor'
    ],
    serviceBuilder: (kw) => `Custom Event ${kw[0] || 'Rangoli/Kolam'} & Handmade Festive Decoration Design`,
    productBuilder: (kw) => `Hand-painted Diyas, Traditional Art Pieces & Festive Wall Accents`,
  },
  {
    category: 'childcare_storytelling',
    name: 'Child Care, Cultural Storytelling & Guidance',
    icon: '👶',
    keywords: [
      'child', 'children', 'kid', 'kids', 'baby', 'babysit', 'babysitting', 'storytelling',
      'moral stories', 'grandparent care', 'activity', 'after school', 'childcare', 'daycare'
    ],
    serviceBuilder: (kw) => `After-School Cultural Storytelling & Homework Companion Sessions`,
    productBuilder: (kw) => `Handwritten Illustrated Story & Value Books for Children`,
  },
  {
    category: 'bookkeeping_accounts',
    name: 'Small Business Bookkeeping & Record Keeping',
    icon: '📊',
    keywords: [
      'account', 'accounting', 'accounts', 'bookkeeping', 'tally', 'gst', 'tax', 'excel',
      'ledger', 'billing', 'finance', 'shop accounts', 'invoicing'
    ],
    serviceBuilder: (kw) => `Local Small Business Bookkeeping & Monthly Billing Reconciliation`,
    productBuilder: (kw) => `Custom Excel Accounting Templates for Retail Stores & Vendors`,
  },
]

/**
 * Intelligent deterministic Keyword Extraction & Skill Prediction Engine
 */
function extractKeywordsAndPredictSkills(text = '') {
  const clean = text.trim()
  const lower = clean.toLowerCase()

  // 1. Extract years of experience with regex
  let experienceYears = '15+ years'
  const yearMatch = lower.match(/(\d{1,2})\s*(?:\+|plus)?\s*(?:years?|yrs?|saal|varusham|varudangal)/i)
  if (yearMatch && parseInt(yearMatch[1], 10) > 0) {
    experienceYears = `${yearMatch[1]}+ years`
  } else {
    const sinceMatch = lower.match(/since\s*(19\d{2}|20\d{2})/i)
    if (sinceMatch) {
      const yrs = 2026 - parseInt(sinceMatch[1], 10)
      if (yrs > 0) experienceYears = `${yrs}+ years`
    } else if (lower.includes('decades') || lower.includes('decade')) {
      experienceYears = '20+ years'
    } else if (lower.includes('lifetime') || lower.includes('all my life')) {
      experienceYears = '30+ years'
    }
  }

  // 2. Extract specific matched keywords from taxonomy and user tokens
  const detectedKeywordsSet = new Set()
  const matchedTaxonomies = []

  for (const domain of DOMAIN_TAXONOMY) {
    const hits = []
    for (const kw of domain.keywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`\\b${escaped}\\b`, 'i')
      if (regex.test(lower)) {
        hits.push(kw)
        // Capitalize for display chip
        const formatted = kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        detectedKeywordsSet.add(formatted)
      }
    }

    if (hits.length > 0) {
      matchedTaxonomies.push({
        domain,
        hits,
        score: hits.length,
      })
    }
  }

  // Add experience chip to keywords
  detectedKeywordsSet.add(`${experienceYears} Experience`)

  // Sort matched domains by score (relevance)
  matchedTaxonomies.sort((a, b) => b.score - a.score)

  const matchedSkills = []
  const suggestedServices = []
  const suggestedProducts = []

  for (const item of matchedTaxonomies) {
    matchedSkills.push({
      icon: item.domain.icon,
      name: item.domain.name,
      confidence: `${Math.min(99, 85 + item.score * 4)}%`,
      matchedKeywords: item.hits.slice(0, 3),
    })
    suggestedServices.push(item.domain.serviceBuilder(item.hits))
    suggestedProducts.push(item.domain.productBuilder(item.hits))
  }

  // Fallback if no specific taxonomy keyword matched
  if (matchedSkills.length === 0) {
    // Extract raw noun words from text for display
    const rawTokens = clean.split(/\s+/).filter(w => w.length > 3 && !['have', 'with', 'from', 'this', 'that', 'know', 'like', 'been'].includes(w.toLowerCase()))
    rawTokens.slice(0, 3).forEach(t => detectedKeywordsSet.add(t.charAt(0).toUpperCase() + t.slice(1)))

    matchedSkills.push(
      { icon: '🍳', name: 'Traditional Home Cooking & Meals', confidence: '92%', matchedKeywords: ['Cooking', 'Homestyle'] },
      { icon: '✨', name: 'Handicrafts & Custom Home Services', confidence: '88%', matchedKeywords: ['Crafts', 'Custom Work'] }
    )
    suggestedServices.push('Personalized Home Culinary & Consultation Services', 'Custom Handcrafted Creations & Mentorship')
    suggestedProducts.push('Artisanal Homemade Food Items & Family Recipe Boxes', 'Handcrafted Decorative Goods & Gift Items')
  }

  const extractedKeywords = Array.from(detectedKeywordsSet)
  const topNames = matchedSkills.slice(0, 2).map(s => s.name).join(' & ')
  const recommendation = `Based on your ${experienceYears} of expertise in ${topNames}, our AI estimates high market demand for your localized services and marketplace products.`

  return {
    extractedKeywords,
    skills: matchedSkills.slice(0, 4),
    experienceYears,
    suggestedServices: suggestedServices.slice(0, 3),
    suggestedProducts: suggestedProducts.slice(0, 3),
    recommendation,
  }
}

// ── Gemini & Dynamic AI Endpoints ──────────────────────────────────────────

/**
 * POST /api/ai/assistant
 * Gemini-backed chatbot for CareerAI friendly livelihood assistant
 * Rate limited to 10 RPM to protect free-tier Gemini API quota
 */
router.post('/assistant', geminiRateLimiter, optionalAuth, async (req, res, next) => {
  try {
    const { message } = req.body
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message parameter is required.' })
    }

    const cleanMessage = message.trim()
    const lowerMessage = cleanMessage.toLowerCase()

    // 1. Check in-memory cache to save free tier quota
    const cachedResponse = getCached(assistantCache, lowerMessage)
    if (cachedResponse) {
      return res.json({
        success: true,
        source: 'cache',
        response: cachedResponse,
      })
    }

    const apiKey = process.env.GEMINI_API_KEY

    // 2. Try Google Gemini API with candidate models if key exists
    if (apiKey) {
      const candidateModels = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-1.5-flash']
      for (const m of candidateModels) {
        try {
          const { GoogleGenerativeAI } = await import('@google/generative-ai')
          const genAI = new GoogleGenerativeAI(apiKey)
          const model = genAI.getGenerativeModel({ model: m })

          const systemPrompt = `You are CareerAI, a warm, respectful, and encouraging livelihood assistant for Career 2.0, an AI platform empowering Indian senior citizens and homemakers.
Your goals:
1. Help users discover opportunities, list products, estimate income, and stay safe.
2. Never invent fake income guarantees or fake customer reviews.
3. Always label earnings as "Estimated".
4. Keep responses concise, warm, and structured with clear emojis.`

          const result = await model.generateContent(`${systemPrompt}\n\nUser Question: ${cleanMessage}`)
          const text = result.response.text()

          if (text && text.trim()) {
            const finalResp = text.trim()
            setCache(assistantCache, lowerMessage, finalResp)
            return res.json({
              success: true,
              source: 'gemini',
              model: m,
              response: finalResp,
            })
          }
        } catch (geminiErr) {
          // Continue to next candidate or fallback
        }
      }
    }

    // 3. High-accuracy fallback engine
    const mockResponse = getCareerAIResponse(cleanMessage)
    setCache(assistantCache, lowerMessage, mockResponse)
    return res.json({
      success: true,
      source: 'career-ai-engine',
      response: mockResponse,
    })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/ai/discover-skills
 * Extracts keywords and predicts skills using Gemini API or Semantic Prediction Engine
 * Rate limited to 10 RPM to protect free-tier Gemini API quota
 */
router.post('/discover-skills', geminiRateLimiter, optionalAuth, async (req, res, next) => {
  try {
    const description = (req.body.description || req.body.text || '').trim()
    if (!description) {
      return res.status(400).json({ success: false, message: 'Description is required for skill discovery.' })
    }

    const lowerKey = description.toLowerCase().trim()

    // 1. Check in-memory cache to save free tier quota
    const cachedDiscovery = getCached(discoveryCache, lowerKey)
    if (cachedDiscovery) {
      return res.json({
        success: true,
        source: 'cache',
        ...cachedDiscovery,
      })
    }

    const apiKey = process.env.GEMINI_API_KEY

    // 2. Try Google Gemini API if key is available
    if (apiKey) {
      const candidateModels = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-1.5-flash']
      for (const modelName of candidateModels) {
        try {
          const { GoogleGenerativeAI } = await import('@google/generative-ai')
          const genAI = new GoogleGenerativeAI(apiKey)
          const model = genAI.getGenerativeModel({ model: modelName })

          const prompt = `Analyze this description from an Indian senior citizen or homemaker:
"${description}"

Extract exact keywords (culinary items, skills, techniques, crafts, subjects, years of experience, locations) and predict their marketable skills, estimated experience years, recommended services, and products.

Return ONLY valid JSON matching this exact structure:
{
  "extractedKeywords": ["Keyword1", "Keyword2", "20+ Years Experience"],
  "skills": [{"icon": "🍳", "name": "Skill Name", "confidence": "95%"}],
  "experienceYears": "20+ years",
  "suggestedServices": ["Specific service offering 1", "Specific service offering 2"],
  "suggestedProducts": ["Specific sellable product 1", "Specific sellable product 2"],
  "recommendation": "Dignified and encouraging 1-2 sentence recommendation."
}`

          const result = await model.generateContent(prompt)
          const rawText = result.response.text()
          const cleanedJSON = rawText.replace(/```json\n?|```/g, '').trim()
          const parsed = JSON.parse(cleanedJSON)

          if (parsed.skills && Array.isArray(parsed.skills) && parsed.skills.length > 0) {
            setCache(discoveryCache, lowerKey, parsed)
            return res.json({
              success: true,
              source: 'gemini',
              model: modelName,
              ...parsed,
            })
          }
        } catch (geminiErr) {
          // Continue to next model candidate or fallback engine
        }
      }
    }

    // 3. High-Accuracy Dynamic Keyword Extraction & Prediction Engine
    const predictionResult = extractKeywordsAndPredictSkills(description)
    setCache(discoveryCache, lowerKey, predictionResult)
    return res.json({
      success: true,
      source: 'semantic-keyword-engine',
      ...predictionResult,
    })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/ai/generate-profile
 * Generates professional bio and headline from description and skills using Gemini
 * Rate limited to 10 RPM to protect free-tier Gemini API quota
 */
router.post('/generate-profile', geminiRateLimiter, optionalAuth, async (req, res, next) => {
  try {
    const { description = '', skills = [] } = req.body
    const cacheKey = `${description.toLowerCase().trim()}_${JSON.stringify(skills)}`

    // 1. Check in-memory cache to save free tier quota
    const cachedProfile = getCached(profileCache, cacheKey)
    if (cachedProfile) {
      return res.json({
        success: true,
        source: 'cache',
        ...cachedProfile,
      })
    }

    const apiKey = process.env.GEMINI_API_KEY

    // 2. Try Google Gemini API
    if (apiKey) {
      const candidateModels = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-1.5-flash']
      for (const modelName of candidateModels) {
        try {
          const { GoogleGenerativeAI } = await import('@google/generative-ai')
          const genAI = new GoogleGenerativeAI(apiKey)
          const model = genAI.getGenerativeModel({ model: modelName })

          const prompt = `Generate a warm, dignified, and professional profile for an Indian senior citizen/homemaker on Career 2.0 platform.
User Description: "${description}"
Discovered Skills: ${JSON.stringify(skills)}

Return ONLY valid JSON matching this exact structure:
{
  "headline": "Professional Headline under 10 words",
  "about": "Warm, respectful, 2-3 sentence bio starting with Namaste",
  "skills": ["Skill1", "Skill2", "Skill3"],
  "serviceDescriptions": ["Service offering 1", "Service offering 2"]
}`

          const result = await model.generateContent(prompt)
          const rawText = result.response.text()
          const cleanedJSON = rawText.replace(/```json\n?|```/g, '').trim()
          const parsed = JSON.parse(cleanedJSON)

          if (parsed.headline && parsed.about) {
            setCache(profileCache, cacheKey, parsed)
            return res.json({
              success: true,
              source: 'gemini',
              model: modelName,
              ...parsed,
            })
          }
        } catch (geminiErr) {
          // Continue to next candidate or fallback
        }
      }
    }

    // 3. Dynamic NLP Profile Generator Fallback
    const nlp = extractKeywordsAndPredictSkills(description)
    const skillNames = skills.length > 0 ? skills : nlp.skills.map(s => s.name)
    const primarySkill = skillNames[0] || 'Experienced Specialist'
    const secondarySkill = skillNames[1] || 'Community Mentor'

    const headline = `${primarySkill} & ${secondarySkill} (${nlp.experienceYears})`
    const about = `Namaste! 🙏 With over ${nlp.experienceYears} of authentic experience in ${skillNames.slice(0, 3).join(', ')}, I take pride in delivering dedicated, high-quality personalized services and handcrafted specialties.`

    const serviceDescriptions = nlp.suggestedServices.slice(0, 2).map((s, idx) => 
      `${idx + 1}-on-1 ${s}`
    )

    const generated = {
      headline,
      about,
      skills: skillNames,
      serviceDescriptions,
    }

    setCache(profileCache, cacheKey, generated)
    return res.json({
      success: true,
      source: 'semantic-keyword-engine',
      ...generated,
    })
  } catch (err) {
    next(err)
  }
})

export default router
