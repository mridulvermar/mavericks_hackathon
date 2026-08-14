import { Router } from 'express'
import mongoose from 'mongoose'
import Booking from '../models/Booking.js'

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

// ── POST /api/bookings (Create new booking) ──────────────────────────
router.post('/', async (req, res) => {
  try {
    const { title, itemType, itemId, date, time, pay, location, providerName, customerName, icon } = req.body

    if (!title || !date) {
      return res.status(400).json({ success: false, message: 'Title and date are required.' })
    }

    const numAmount = parseAmount(pay || '₹500')
    const bookingData = {
      title,
      itemType: itemType || 'opportunity',
      itemId: itemId || String(Date.now()),
      customerName: customerName || 'Sunita Ji (Customer)',
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

    res.status(201).json({
      success: true,
      message: 'Booking request sent successfully! Provider will confirm soon.',
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
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const updated = await Booking.findByIdAndUpdate(id, { status: targetStatus }, { new: true })
      if (updated) return res.json({ success: true, message: successMsg, data: updated })
    }

    const idx = mockBookings.findIndex(b => b._id === id || b.id === id)
    if (idx !== -1) {
      mockBookings[idx].status = targetStatus
      return res.json({ success: true, message: successMsg, data: mockBookings[idx] })
    }

    res.status(404).json({ success: false, message: 'Booking not found.' })
  } catch (error) {
    res.status(500).json({ success: false, message: `Failed to update booking to ${targetStatus}.` })
  }
}

// Support both PATCH and POST for status endpoints for max browser/CORS compatibility
router.route('/:id/accept')
  .patch((req, res) => handleStatusUpdate(req, res, 'confirmed', 'Booking accepted!'))
  .post((req, res) => handleStatusUpdate(req, res, 'confirmed', 'Booking accepted!'))

router.route('/:id/reject')
  .patch((req, res) => handleStatusUpdate(req, res, 'cancelled', 'Booking rejected.'))
  .post((req, res) => handleStatusUpdate(req, res, 'cancelled', 'Booking rejected.'))

router.route('/:id/complete')
  .patch((req, res) => handleStatusUpdate(req, res, 'completed', 'Booking marked as completed!'))
  .post((req, res) => handleStatusUpdate(req, res, 'completed', 'Booking marked as completed!'))

router.route('/:id/cancel')
  .patch((req, res) => handleStatusUpdate(req, res, 'cancelled', 'Booking cancelled.'))
  .post((req, res) => handleStatusUpdate(req, res, 'cancelled', 'Booking cancelled.'))

export default router
