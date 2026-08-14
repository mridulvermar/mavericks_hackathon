import { Router } from 'express'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

const mockOpportunities = [
  { _id: '1', title: 'Home Cooking Classes', category: 'Teaching', pay: '₹500/session', location: 'Jaipur', type: 'Part-time', posted: new Date().toISOString(), urgent: true },
  { _id: '2', title: 'Embroidery Work from Home', category: 'Craft', pay: '₹800/piece', location: 'Remote', type: 'Flexible', posted: new Date().toISOString(), urgent: false },
  { _id: '3', title: 'Elderly Care Companion', category: 'Care', pay: '₹400/day', location: 'Jaipur', type: 'Full-time', posted: new Date().toISOString(), urgent: false },
]

router.get('/', optionalAuth, (req, res) => {
  res.json({ success: true, data: mockOpportunities, total: mockOpportunities.length })
})

router.get('/:id', optionalAuth, (req, res) => {
  const opp = mockOpportunities.find(o => o._id === req.params.id)
  if (!opp) return res.status(404).json({ success: false, message: 'Opportunity not found.' })
  res.json({ success: true, data: opp })
})

router.post('/:id/apply', (req, res) => {
  res.json({ success: true, message: 'Application submitted! The employer will contact you soon.' })
})

export default router
