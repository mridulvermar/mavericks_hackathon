import { Router } from 'express'
import mongoose from 'mongoose'
import Report from '../models/Report.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// Default in-memory mock store if DB disconnected
export let mockReports = [
  {
    _id: 'rep_1',
    id: 'rep_1',
    reporterName: 'Service Provider',
    reportedUserName: 'Unverified Employer',
    reason: 'Suspicious Payment Request',
    message: 'Client asked for off-platform payment transfer before job start.',
    status: 'open',
    createdAt: new Date().toISOString(),
  },
]

// POST /api/reports — Submit a safety report (Authenticated users)
router.post('/', authenticate, async (req, res) => {
  try {
    const { reportedUserId, reportedUserName, reason, message, relatedBookingId, relatedConversationId } = req.body
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason is required for submitting a report.' })
    }

    const reportData = {
      reporterId: req.user.id,
      reporterName: req.user.name || 'Anonymous User',
      reportedUserId,
      reportedUserName: reportedUserName || 'Unspecified User',
      reason,
      message: message || '',
      relatedBookingId,
      relatedConversationId,
      status: 'open',
    }

    let created = null
    if (mongoose.connection.readyState === 1) {
      created = await Report.create(reportData)
    } else {
      created = { _id: `rep_${Date.now()}`, id: `rep_${Date.now()}`, ...reportData, createdAt: new Date().toISOString() }
      mockReports.unshift(created)
    }

    res.status(201).json({
      success: true,
      message: "Your report has been sent to our safety team. We'll review it shortly.",
      data: created,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit report.' })
  }
})

// GET /api/reports — List all reports (Admin & authenticated safety users)
router.get('/', authenticate, async (req, res) => {
  try {
    let reports = []
    if (mongoose.connection.readyState === 1) {
      reports = await Report.find().sort({ createdAt: -1 }).lean()
    } else {
      reports = [...mockReports]
    }
    res.json({ success: true, data: reports, total: reports.length })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports.' })
  }
})

// PATCH /api/reports/:id/resolve — Mark report as resolved
router.patch('/:id/resolve', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    let updated = null

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      updated = await Report.findByIdAndUpdate(id, { status: 'resolved' }, { new: true })
    }
    if (!updated) {
      const idx = mockReports.findIndex(r => r._id === id || r.id === id)
      if (idx !== -1) {
        mockReports[idx].status = 'resolved'
        updated = mockReports[idx]
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Report not found.' })
    }

    res.json({ success: true, message: 'Report marked as resolved!', data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to resolve report.' })
  }
})

export default router
