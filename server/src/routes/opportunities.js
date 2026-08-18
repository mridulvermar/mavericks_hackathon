import { Router } from 'express'
import mongoose from 'mongoose'
import Opportunity from '../models/Opportunity.js'
import User from '../models/User.js'
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js'
import Booking from '../models/Booking.js'
import { mockBookings } from './bookings.js'
import { scoreOpportunity } from '../utils/matching.js'
import { demoOpportunities } from '../seed.js'

const router = Router()

// Default neutral fallback profile if unauthenticated
const DEFAULT_NEUTRAL_PROFILE = {
  name: 'User',
  city: 'Chennai',
  skills: [],
  languages: ['Tamil', 'English'],
}

// ── GET /api/opportunities (List & Search with Contextual AI Match Scores) ─────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search, userId } = req.query
    let rawOpps = []

    // Fetch real user profile if logged in or specified by query
    let userProfile = DEFAULT_NEUTRAL_PROFILE
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

// In-memory array for customer posted opportunities in fallback mode
export let mockCustomerPostings = []

// ── GET /api/opportunities/my-postings ────────────────────────────────
router.get('/my-postings', authenticate, async (req, res) => {
  try {
    let postings = []
    const userId = req.user.id

    if (mongoose.connection.readyState === 1) {
      postings = await Opportunity.find({
        $or: [
          { postedBy: userId },
          { postedById: userId },
        ],
      }).sort({ createdAt: -1 }).lean()
    }

    if (!postings || postings.length === 0) {
      postings = mockCustomerPostings.filter(p => p.postedById === userId || p.postedBy === userId)
    }

    // Attach applicant count to each posting
    let allBookings = []
    if (mongoose.connection.readyState === 1) {
      allBookings = await Booking.find().lean()
    } else {
      allBookings = [...mockBookings]
    }

    const enhanced = postings.map(p => {
      const pId = String(p._id || p.id)
      const apps = allBookings.filter(b => String(b.itemId) === pId || b.title === p.title)
      return {
        ...p,
        applicantCount: apps.length,
        applications: apps,
      }
    })

    res.json({ success: true, data: enhanced, total: enhanced.length })
  } catch (error) {
    console.error('Error fetching customer postings:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch your postings.' })
  }
})

// ── GET /api/opportunities/:id/applications (Applications for a posting, owner only) ──
router.get('/:id/applications', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Verify the requesting user owns this posting
    let posting = null
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      posting = await Opportunity.findById(id).lean()
    }
    if (!posting) {
      posting = (await import('../seed.js')).demoOpportunities.find((o, idx) => String(idx + 1) === id)
    }
    if (!posting) {
      return res.status(404).json({ success: false, message: 'Posting not found.' })
    }
    const ownerId = String(posting.postedBy || posting.postedById || '')
    if (ownerId && ownerId !== userId) {
      return res.status(403).json({ success: false, message: 'You can only view applications for your own postings.' })
    }

    // Fetch all bookings/applications linked to this posting
    let applications = []
    if (mongoose.connection.readyState === 1) {
      applications = await Booking.find({
        $or: [
          { itemId: id },
          { itemId: posting._id ? String(posting._id) : id },
          { title: posting.title },
        ],
      }).sort({ createdAt: -1 }).lean()
    } else {
      applications = mockBookings.filter(b =>
        b.itemId === id || b.title === posting.title
      )
    }

    res.json({
      success: true,
      postingTitle: posting.title,
      data: applications.map(app => ({
        _id: app._id || app.id,
        id: app._id || app.id,
        providerName: app.providerName || 'Unknown Applicant',
        providerSkills: app.skills || app.providerSkills || [],
        bio: app.bio || app.notes || '',
        status: app.status || 'pending',
        date: app.date || new Date(app.createdAt).toLocaleDateString('en-IN'),
        pay: app.pay || posting.pay,
        icon: app.icon || '👤',
      })),
      total: applications.length,
    })
  } catch (error) {
    console.error('Error fetching posting applications:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch applications.' })
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

    let userProfile = DEFAULT_NEUTRAL_PROFILE
    if (req.user) {
      userProfile = req.user
    } else if (req.query.userId && mongoose.connection.readyState === 1) {
      const found = await User.findById(req.query.userId).lean()
      if (found) userProfile = found
    }

    const scored = scoreOpportunity(opp, userProfile)
    res.json({ success: true, data: scored })
  } catch (error) {
    console.error('Error fetching opportunity detail:', error)
    res.status(500).json({ success: false, message: 'Error retrieving opportunity.' })
  }
})

// ── POST /api/opportunities (Create Job / Product Request by Job Provider) ──
router.post('/', authenticate, authorize('job_provider', 'admin'), async (req, res) => {
  try {
    const { title, category, description, pay, location, city, type, kind, requirements, skills } = req.body
    if (!title || !category || !pay || !location) {
      return res.status(400).json({ success: false, message: 'Title, category, pay, and location are required.' })
    }

    const postingData = {
      title,
      category,
      description: description || 'No detailed description provided.',
      pay,
      location,
      city: city || 'Chennai',
      type: type || 'Part-time',
      kind: kind === 'product_request' ? 'product_request' : 'job',
      requirements: Array.isArray(requirements) ? requirements : (requirements ? [requirements] : []),
      skills: Array.isArray(skills) ? skills : (skills ? [skills] : []),
      clientName: req.user.name || 'Local Employer',
      clientVerified: true,
      urgent: false,
      status: 'open',
      posted: 'Just now',
      postedBy: mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : undefined,
      postedById: req.user.id,
    }

    let createdOpp = null
    if (mongoose.connection.readyState === 1) {
      createdOpp = await Opportunity.create(postingData)
    } else {
      const newId = `opp_${Date.now()}`
      createdOpp = { _id: newId, id: newId, ...postingData, createdAt: new Date().toISOString() }
      mockCustomerPostings.unshift(createdOpp)
    }

    res.status(201).json({
      success: true,
      message: 'Job posting published successfully! Providers will be notified.',
      data: createdOpp,
    })
  } catch (error) {
    console.error('Error creating opportunity:', error)
    res.status(500).json({ success: false, message: 'Failed to create opportunity posting.' })
  }
})

// ── PATCH /api/opportunities/:id/status (Close / Reopen Posting) ────
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body
    const { id } = req.params

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const updated = await Opportunity.findByIdAndUpdate(id, { status }, { new: true })
      if (updated) return res.json({ success: true, message: `Posting status updated to ${status}`, data: updated })
    }

    const found = mockCustomerPostings.find(p => p._id === id || p.id === id)
    if (found) {
      found.status = status
      return res.json({ success: true, message: `Posting status updated to ${status}`, data: found })
    }

    res.status(404).json({ success: false, message: 'Posting not found.' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update posting status.' })
  }
})

// ── PUT /api/opportunities/:id (Update) ─────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
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
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(req.params.id)) {
      await Opportunity.findByIdAndDelete(req.params.id)
    }
    res.json({ success: true, message: 'Opportunity deleted successfully.' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete opportunity.' })
  }
})

export default router
