import { Router } from 'express'
import mongoose from 'mongoose'
import Opportunity from '../models/Opportunity.js'
import User from '../models/User.js'
import { optionalAuth } from '../middleware/auth.js'
import { scoreOpportunity } from '../utils/matching.js'
import { demoOpportunities } from '../seed.js'

const router = Router()

// Default fallback demo user profile for scoring
const DEFAULT_DEMO_USER = {
  name: 'Lakshmi Ammal',
  city: 'Chennai',
  skills: ['Cooking', 'Catering', 'Tailoring'],
  languages: ['Tamil', 'English'],
}

// ── GET /api/opportunities (List & Search with AI Match Scores) ─────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search, userId } = req.query
    let rawOpps = []

    // Fetch user profile if logged in or specified by query
    let userProfile = DEFAULT_DEMO_USER
    if (req.user) {
      userProfile = req.user
    } else if (userId && mongoose.connection.readyState === 1) {
      const foundUser = await User.findById(userId)
      if (foundUser) userProfile = foundUser
    }

    if (mongoose.connection.readyState === 1) {
      let query = {}
      if (category && category !== 'All') {
        query.category = category
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
        ]
      }
      rawOpps = await Opportunity.find(query).lean()
    }

    // Fallback to demoOpportunities if DB is empty or disconnected
    if (!rawOpps || rawOpps.length === 0) {
      rawOpps = demoOpportunities.map((opp, idx) => ({
        ...opp,
        _id: String(idx + 1),
        id: String(idx + 1),
      }))

      if (category && category !== 'All') {
        rawOpps = rawOpps.filter(o => o.category.toLowerCase() === category.toLowerCase())
      }
      if (search) {
        rawOpps = rawOpps.filter(o =>
          o.title.toLowerCase().includes(search.toLowerCase()) ||
          o.description.toLowerCase().includes(search.toLowerCase())
        )
      }
    }

    // Score each opportunity against user profile
    const scoredOpps = rawOpps.map(opp => scoreOpportunity(opp, userProfile))
    
    // Sort highest match percent first
    scoredOpps.sort((a, b) => b.matchPercent - a.matchPercent)

    res.json({
      success: true,
      data: scoredOpps,
      total: scoredOpps.length,
    })
  } catch (error) {
    console.error('Error fetching opportunities:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch opportunities.' })
  }
})

// ── GET /api/opportunities/:id ───────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params
    let opp = null

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      opp = await Opportunity.findById(id).lean()
    }

    if (!opp) {
      const demoOpp = demoOpportunities.find((o, idx) => String(idx + 1) === id || o._id === id)
      if (demoOpp) {
        opp = { ...demoOpp, _id: id, id }
      }
    }

    if (!opp) {
      return res.status(404).json({ success: false, message: 'Opportunity not found.' })
    }

    const scored = scoreOpportunity(opp, req.user || DEFAULT_DEMO_USER)
    res.json({ success: true, data: scored })
  } catch (error) {
    console.error('Error fetching opportunity detail:', error)
    res.status(500).json({ success: false, message: 'Error retrieving opportunity.' })
  }
})

// ── POST /api/opportunities (Create) ────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { title, category, description, pay, location, city, type, requirements, skills } = req.body
    if (!title || !category || !pay || !location) {
      return res.status(400).json({ success: false, message: 'Title, category, pay, and location are required.' })
    }

    if (mongoose.connection.readyState === 1) {
      const newOpp = await Opportunity.create({
        title, category, description, pay, location, city: city || 'Chennai', type, requirements, skills,
        clientName: req.body.clientName || 'Local Employer',
      })
      return res.status(201).json({ success: true, data: newOpp })
    }

    // Demo fallback response
    const mockOpp = {
      _id: String(Date.now()),
      title, category, description, pay, location, city: city || 'Chennai', type: type || 'Part-time',
      requirements: requirements || [], skills: skills || [],
      clientName: req.body.clientName || 'Local Employer',
      clientVerified: true, urgent: false, posted: 'Just now',
    }
    res.status(201).json({ success: true, data: mockOpp })
  } catch (error) {
    console.error('Error creating opportunity:', error)
    res.status(500).json({ success: false, message: 'Failed to create opportunity.' })
  }
})

// ── PUT /api/opportunities/:id (Update) ─────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(req.params.id)) {
      const updated = await Opportunity.findByIdAndUpdate(req.params.id, req.body, { new: true })
      if (!updated) return res.status(404).json({ success: false, message: 'Opportunity not found.' })
      return res.json({ success: true, data: updated })
    }
    res.json({ success: true, data: { _id: req.params.id, ...req.body } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update opportunity.' })
  }
})

// ── DELETE /api/opportunities/:id ───────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(req.params.id)) {
      await Opportunity.findByIdAndDelete(req.params.id)
    }
    res.json({ success: true, message: 'Opportunity deleted successfully.' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete opportunity.' })
  }
})

// ── POST /api/opportunities/:id/apply ───────────────────────────────
router.post('/:id/apply', (req, res) => {
  res.json({ success: true, message: 'Application submitted! The employer will contact you soon.' })
})

export default router
