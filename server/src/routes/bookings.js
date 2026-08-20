import { Router } from 'express'
import mongoose from 'mongoose'
import Booking from '../models/Booking.js'
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js'
import { sendNotification } from './notifications.js'

const router = Router()

// Default in-memory demo bookings store for offline fallback
export let mockBookings = [
  {
    _id: 'b1',
    id: 'b1',
    title: 'Home Cooking Class for Small Family',
    itemType: 'opportunity',
    customerName: 'Priya Mehta',
    providerName: 'Lakshmi Ammal',
    date: 'Today, 4:00 PM',
    time: '4:00 PM',
    status: 'pending',
    pay: '₹600',
    amount: 600,
    location: 'T. Nagar, Chennai',
    icon: '🍳',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'b2',
    id: 'b2',
    title: 'Custom Saree Blouse Stitching',
    itemType: 'service',
    customerName: 'Kavitha Swaminathan',
    providerName: 'Meenakshi Sundaram',
    date: 'Tomorrow, 10:00 AM',
    time: '10:00 AM',
    status: 'confirmed',
    pay: '₹1,200',
    amount: 1200,
    location: 'RS Puram, Coimbatore',
    icon: '🧵',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'b3',
    id: 'b3',
    title: '1-on-1 High School Maths Tutoring',
    itemType: 'service',
    customerName: 'Suresh Narayanan',
    providerName: 'Ravi Kumar',
    date: 'Aug 10, 2026',
    time: '5:00 PM',
    status: 'completed',
    pay: '₹400',
    amount: 400,
    location: 'Adyar, Chennai',
    icon: '📚',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'b4',
    id: 'b4',
    title: 'Homemade Mango Avakkai Pickle (500g)',
    itemType: 'product',
    customerName: 'Anita Singh',
    providerName: 'Lakshmi Ammal',
    date: 'Aug 8, 2026',
    time: '2:00 PM',
    status: 'completed',
    pay: '₹250',
    amount: 250,
    location: 'Chennai',
    icon: '🫙',
    createdAt: new Date().toISOString(),
  },
]

// Helper function to parse numeric amount from pay string
function parseAmount(payStr = '') {
  const match = payStr.match(/\d+[\d,]*/)
  if (match) {
    return parseInt(match[0].replace(/,/g, ''), 10)
  }
  return 500
}

// ── GET /api/bookings (List with status & role filters) ──────────────
router.get('/', async (req, res) => {
  try {
    const { status, role } = req.query
    let bookings = []

    if (mongoose.connection.readyState === 1) {
      let query = {}
      if (status && status !== 'All') {
        query.status = status.toLowerCase()
      }
      bookings = await Booking.find(query).sort({ createdAt: -1 }).lean()
    }

    if (!bookings || bookings.length === 0) {
      bookings = [...mockBookings]
      if (status && status !== 'All') {
        bookings = bookings.filter(b => b.status.toLowerCase() === status.toLowerCase())
      }
    }

    res.json({ success: true, data: bookings, total: bookings.length })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' })
  }
})

// ── GET /api/bookings/:id ────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    let booking = null

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      booking = await Booking.findById(id).lean()
    }
    if (!booking) {
      booking = mockBookings.find(b => b._id === id || b.id === id)
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' })
    }

    res.json({ success: true, data: booking })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving booking.' })
  }
})

// ── POST /api/bookings (Create new booking / application) ────────────
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { title, itemType, itemId, date, time, pay, location, providerName, customerName, icon } = req.body

    if (!title || !date) {
      return res.status(400).json({ success: false, message: 'Title and date are required.' })
    }

    const numAmount = parseAmount(pay || '₹500')
    const applicantName = req.user?.name || customerName || 'User (Applicant)'
    const applicantId = req.user?.id || 'u_customer'

    const bookingData = {
      title,
      itemType: itemType || 'opportunity',
      itemId: itemId || String(Date.now()),
      customerName: applicantName,
      customerId: applicantId,
      customer: req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : undefined,
      providerName: providerName || 'Lakshmi Ammal',
      date,
      time: time || '10:00 AM',
      status: 'pending',
      pay: pay || '₹500',
      amount: numAmount,
      location: location || 'Chennai',
      icon: icon || (itemType === 'product' ? '📦' : '💼'),
    }

    let createdBooking = null
    if (mongoose.connection.readyState === 1) {
      createdBooking = await Booking.create(bookingData)
    } else {
      const newId = `b_${Date.now()}`
      createdBooking = { _id: newId, id: newId, ...bookingData, createdAt: new Date().toISOString() }
      mockBookings.unshift(createdBooking)
    }

    // Trigger notification to applicant
    sendNotification({
      userId: applicantId,
      title: 'Application Sent',
      message: `Your application for "${title}" was sent to ${providerName || 'employer'}. You'll be notified when they respond.`,
      type: 'booking',
    })

    res.status(201).json({
      success: true,
      message: `Your application was sent to ${providerName || 'the employer'}. You'll be notified when they respond.`,
      data: createdBooking,
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    res.status(500).json({ success: false, message: 'Failed to create booking.' })
  }
})

// Handler helper for updating booking status
async function handleStatusUpdate(req, res, targetStatus, successMsg) {
  try {
    const { id } = req.params
    let updatedBooking = null

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      updatedBooking = await Booking.findByIdAndUpdate(id, { status: targetStatus }, { new: true })
    }

    if (!updatedBooking) {
      const idx = mockBookings.findIndex(b => b._id === id || b.id === id)
      if (idx !== -1) {
        mockBookings[idx].status = targetStatus
        updatedBooking = mockBookings[idx]
      }
    }

    if (!updatedBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' })
    }

    // Create notification for the customer / applicant on status change
    if (targetStatus === 'confirmed') {
      sendNotification({
        userId: updatedBooking.customerId || updatedBooking.customer || 'u_customer',
        title: 'Application Approved! 🎉',
        message: `Your application for "${updatedBooking.title}" was approved!`,
        type: 'booking',
      })
    } else if (targetStatus === 'completed') {
      sendNotification({
        userId: updatedBooking.customerId || updatedBooking.customer || 'u_customer',
        title: 'Job Completed ✅',
        message: `Work for "${updatedBooking.title}" was marked completed. Thank you!`,
        type: 'booking',
      })
    }

    return res.json({ success: true, message: successMsg, data: updatedBooking })
  } catch (error) {
    res.status(500).json({ success: false, message: `Failed to update booking to ${targetStatus}.` })
  }
}

// Protected status endpoints: accept & reject status updates for applications/bookings
router.route('/:id/accept')
  .patch(authenticate, authorize('job_provider', 'customer', 'provider', 'admin'), (req, res) => handleStatusUpdate(req, res, 'confirmed', 'Application approved!'))
  .post(authenticate, authorize('job_provider', 'customer', 'provider', 'admin'), (req, res) => handleStatusUpdate(req, res, 'confirmed', 'Application approved!'))

router.route('/:id/reject')
  .patch(authenticate, authorize('job_provider', 'customer', 'provider', 'admin'), (req, res) => handleStatusUpdate(req, res, 'cancelled', 'Application declined.'))
  .post(authenticate, authorize('job_provider', 'customer', 'provider', 'admin'), (req, res) => handleStatusUpdate(req, res, 'cancelled', 'Application declined.'))

router.route('/:id/complete')
  .patch(authenticate, authorize('job_provider', 'customer', 'provider', 'admin'), (req, res) => handleStatusUpdate(req, res, 'completed', 'Booking marked as completed!'))
  .post(authenticate, authorize('job_provider', 'customer', 'provider', 'admin'), (req, res) => handleStatusUpdate(req, res, 'completed', 'Booking marked as completed!'))

router.route('/:id/cancel')
  .patch(authenticate, (req, res) => handleStatusUpdate(req, res, 'cancelled', 'Booking cancelled.'))
  .post(authenticate, (req, res) => handleStatusUpdate(req, res, 'cancelled', 'Booking cancelled.'))

export default router
