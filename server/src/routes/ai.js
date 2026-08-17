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

// ── Intelligent Dynamic Keyword & Skill Discovery Engine ─────────────────────────────
function extractSkillsNLP(text = '') {
  const lower = text.toLowerCase()

  // 1. Extract years of experience
  let experienceYears = '15+ years'
  const yearMatch = lower.match(/(\d{1,2})\s*(?:\+|plus)?\s*(?:years?|yrs?|saal|varusham)/i)
  if (yearMatch && parseInt(yearMatch[1], 10) > 0) {
    experienceYears = `${yearMatch[1]}+ years`
  } else {
    const sinceMatch = lower.match(/since\s*(19\d{2}|20\d{2})/i)
    if (sinceMatch) {
      const yrs = 2026 - parseInt(sinceMatch[1], 10)
      if (yrs > 0) experienceYears = `${yrs}+ years`
    }
  }

  // 2. Skill dictionary definitions with matching keywords
  const SKILL_RULES = [
    {
      category: 'cooking',
      name: 'Traditional Home Cooking',
      icon: '🍳',
      keywords: ['cook', 'cooking', 'recipe', 'food', 'meal', 'meals', 'kitchen', 'rasam', 'sambar', 'curry', 'roti', 'sabzi', 'dal', 'biryani', 'south indian', 'north indian', 'rajasthani', 'gujarati', 'bengali', 'kerala', 'maharashtrian', 'tiffin', 'breakfast', 'lunch', 'dinner'],
      service: 'Authentic Traditional Home Cooking & Meal Preparation',
      product: 'Homestyle Ready Meals & Daily Tiffin Service',
    },
    {
      category: 'pickles',
      name: 'Pickle & Preserve Making',
      icon: '🫙',
      keywords: ['pickle', 'pickles', 'achar', 'avakkai', 'oorugai', 'chutney', 'podi', 'masala', 'ghee', 'papad', 'vadam', 'preserve'],
      service: 'Custom Heritage Recipe Pickle Preparation',
      product: 'Artisanal Homemade Mango, Lemon & Garlic Pickles',
    },
    {
      category: 'baking',
      name: 'Home Baking & Confectionery',
      icon: '🧁',
      keywords: ['bake', 'baking', 'cake', 'cupcake', 'cookies', 'pastry', 'bread', 'dessert', 'sweets', 'mithai', 'halwa', 'laddu', 'mysore pak'],
      service: 'Fresh Custom Birthday Cakes & Celebration Desserts',
      product: 'Handmade Traditional Sweets & Festive Snacks',
    },
    {
      category: 'tailoring',
      name: 'Custom Tailoring & Fitting',
      icon: '🧵',
      keywords: ['stitch', 'stitching', 'tailor', 'tailoring', 'blouse', 'saree', 'salwar', 'kurti', 'fall', 'pico', 'alteration', 'fitting', 'hem', 'dressmaking', 'sewing', 'garment'],
      service: 'Custom Saree Blouse Stitching & Fall/Pico Hemming',
      product: 'Tailored Blouse Pieces & Handcrafted Potli Bags',
    },
    {
      category: 'embroidery',
      name: 'Aari, Zardozi & Embroidery Work',
      icon: '✨',
      keywords: ['embroidery', 'embroider', 'aari', 'zardozi', 'beadwork', 'thread work', 'maggam', 'mirror work', 'sequin', 'hand work'],
      service: 'Bridal Designer Aari & Zardozi Embroidery Work',
      product: 'Embroidered Dupattas & Custom Decorative Wall Hangings',
    },
    {
      category: 'knitting',
      name: 'Knitting & Crochet Crafting',
      icon: '🧶',
      keywords: ['knit', 'knitting', 'crochet', 'wool', 'sweater', 'muffler', 'macrame', 'yarn', 'baby blanket'],
      service: 'Bespoke Hand-Knitted Sweaters & Baby Sets',
      product: 'Handmade Crochet Bags, Doilies & Woolen Wear',
    },
    {
      category: 'maths_tutoring',
      name: 'Maths & Science Tutoring',
      icon: '📐',
      keywords: ['math', 'maths', 'mathematics', 'algebra', 'geometry', 'arithmetic', 'calculus', 'physics', 'chemistry', 'science', 'teach', 'tutor', 'tuition', 'class 10', 'class 12', 'school', 'student'],
      service: '1-on-1 Concept Clarity & Board Exam Maths Tutoring',
      product: 'Curated Study Notes & Quick-Revision Formula Sheets',
    },
    {
      category: 'language_tutoring',
      name: 'Language & Literature Teaching',
      icon: '📚',
      keywords: ['english', 'hindi', 'tamil', 'sanskrit', 'telugu', 'kannada', 'french', 'grammar', 'speaking', 'slokas', 'chanting', 'shloka', 'scripture', 'bhagavad gita'],
      service: 'Conversational Language Tutoring & Stotra/Shloka Chanting',
      product: 'Personalized Audio Guides for Shloka Pronunciation',
    },
    {
      category: 'gardening',
      name: 'Terrace Gardening & Plant Care',
      icon: '🌿',
      keywords: ['garden', 'gardening', 'plant', 'plants', 'bonsai', 'organic', 'compost', 'vegetables', 'flower', 'nursery', 'terrace garden'],
      service: 'Home Terrace Garden Setup & Organic Plant Consultation',
      product: 'Homemade Organic Fertilizer & Propagated Seedling Pots',
    },
    {
      category: 'crafts',
      name: 'Handicrafts & Upcycling',
      icon: '🎨',
      keywords: ['craft', 'crafts', 'handicraft', 'pottery', 'clay', 'painting', 'sketch', 'art', 'origami', 'quilling', 'diy', 'rangoli', 'kolam'],
      service: 'Festive Decoration & Custom Handmade Artwork Creation',
      product: 'Hand-painted Diyas, Traditional Artworks & Festive Decor',
    },
    {
      category: 'childcare',
      name: 'Child Care & Storytelling',
      icon: '👶',
      keywords: ['child', 'children', 'kid', 'kids', 'baby', 'babysit', 'storytelling', 'moral stories', 'grandparent care', 'activity'],
      service: 'After-School Cultural Storytelling & Homework Companion',
      product: 'Handwritten Illustrated Moral Story Books',
    },
    {
      category: 'accounts',
      name: 'Small Business Bookkeeping',
      icon: '📊',
      keywords: ['account', 'accounting', 'accounts', 'bookkeeping', 'tally', 'gst', 'tax', 'excel', 'ledger', 'billing', 'finance'],
      service: 'Local Shop Bookkeeping & Monthly Billing Reconciliation',
      product: 'Customized Excel Templates for Small Business Records',
    },
  ]

  // 3. Match user text against rules with word boundaries
  const matchedSkills = []
  const suggestedServices = []
  const suggestedProducts = []

  for (const rule of SKILL_RULES) {
    const hits = rule.keywords.filter(kw => {
      // Escape special regex characters in keyword
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`\\b${escaped}\\b`, 'i')
      return regex.test(lower)
    })

    if (hits.length > 0) {
      matchedSkills.push({
        icon: rule.icon,
        name: rule.name,
      })
      suggestedServices.push(rule.service)
      suggestedProducts.push(rule.product)
    }
  }

  // Fallback if no specific keywords matched
  if (matchedSkills.length === 0) {
    matchedSkills.push(
      { icon: '🌟', name: 'Household Management & Culinary Experience' },
      { icon: '🤝', name: 'Community Mentorship & Support' }
    )
    suggestedServices.push('Personalized Home Services & Life Mentorship', 'Specialized Domestic Consultancy')
    suggestedProducts.push('Handcrafted Home Goods & Family Recipes')
  }

  // 4. Recommendation text
  const topNames = matchedSkills.slice(0, 3).map(s => s.name).join(' & ')
  const recommendation = `Based on your ${experienceYears} of real-world knowledge in ${topNames}, you have high earning potential for local services and marketplace products on SilverHands.`

  return {
    skills: matchedSkills.slice(0, 4),
    experienceYears,
    suggestedServices: suggestedServices.slice(0, 3),
    suggestedProducts: suggestedProducts.slice(0, 3),
    recommendation,
  }
}

function generateProfileNLP(description = '', skills = []) {
  const nlp = extractSkillsNLP(description)
  const skillNames = skills.length > 0 ? skills : nlp.skills.map(s => s.name)
  const primarySkill = skillNames[0] || 'Experienced Specialist'
  const secondarySkill = skillNames[1] || 'Community Mentor'

  const headline = `${primarySkill} & ${secondarySkill} (${nlp.experienceYears})`
  const about = `Namaste! 🙏 With over ${nlp.experienceYears} of authentic experience, I take pride in sharing my knowledge of ${skillNames.slice(0, 3).join(', ')}. I offer reliable, high-quality personalized services and handcrafted products tailored with care and dedication.`

  const serviceDescriptions = nlp.suggestedServices.slice(0, 2).map((s, idx) => 
    `${idx + 1}-on-1 ${s}`
  )

  return {
    headline,
    about,
    skills: skillNames,
    serviceDescriptions,
  }
}

// ── Gemini & Dynamic AI Endpoints ──────────────────────────────────────────

router.post('/discover-skills', optionalAuth, async (req, res, next) => {
  try {
    const description = (req.body.description || req.body.text || '').trim()
    if (!description) {
      return res.status(400).json({ success: false, message: 'Description is required for skill discovery.' })
    }

    const apiKey = process.env.GEMINI_API_KEY

    // Try Google Gemini API if key is available
    if (apiKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const prompt = `Analyze this description of an Indian senior citizen or homemaker's life experience and extract their skills, years of experience, suggested services, and products.
User Description: "${description}"

Return ONLY valid JSON matching this exact structure:
{
  "skills": [{"icon": "emoji", "name": "Skill Name"}],
  "experienceYears": "25+ years",
  "suggestedServices": ["Service 1", "Service 2"],
  "suggestedProducts": ["Product 1", "Product 2"],
  "recommendation": "Encouraging 1-2 sentence recommendation."
}`

        const result = await model.generateContent(prompt)
        const rawText = result.response.text()
        const cleanedJSON = rawText.replace(/```json\n?|```/g, '').trim()
        const parsed = JSON.parse(cleanedJSON)

        if (parsed.skills && Array.isArray(parsed.skills)) {
          return res.json({
            success: true,
            source: 'gemini',
            ...parsed,
          })
        }
      } catch (geminiErr) {
        console.warn('Gemini discovery fallback to dynamic NLP engine:', geminiErr.message)
      }
    }

    // Dynamic NLP Extraction Engine Fallback
    const result = extractSkillsNLP(description)
    return res.json({
      success: true,
      source: 'nlp-engine',
      ...result,
    })
  } catch (err) {
    next(err)
  }
})

router.post('/generate-profile', optionalAuth, async (req, res, next) => {
  try {
    const { description = '', skills = [] } = req.body
    const apiKey = process.env.GEMINI_API_KEY

    if (apiKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const prompt = `Generate a warm, dignified, and professional profile for an Indian senior citizen/homemaker on SilverHands platform.
Description: "${description}"
Skills: ${JSON.stringify(skills)}

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
          return res.json({
            success: true,
            source: 'gemini',
            ...parsed,
          })
        }
      } catch (geminiErr) {
        console.warn('Gemini profile fallback to dynamic NLP engine:', geminiErr.message)
      }
    }

    // Dynamic NLP Profile Generator Fallback
    const profile = generateProfileNLP(description, skills)
    return res.json({
      success: true,
      source: 'nlp-engine',
      ...profile,
    })
  } catch (err) {
    next(err)
  }
})

export default router
