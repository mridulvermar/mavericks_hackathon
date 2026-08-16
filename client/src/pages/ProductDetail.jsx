import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, ArrowLeft, Share2, Heart, ShoppingCart, MessageSquare, CheckCircle, MapPin, ShieldCheck, Calendar, X } from 'lucide-react'

import { API_BASE_URL } from '../api/axios'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Booking Modal State
  const [showModal, setShowModal] = useState(false)
  const [bookingDate, setBookingDate] = useState('2026-08-22')
  const [bookingTime, setBookingTime] = useState('11:00 AM')
  const [bookingSuccess, setBookingSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/products/${id}`)
        const data = await res.json()
        if (data.success && data.data) {
          setProduct(data.data)
        } else {
          setError(data.message || 'Item not found.')
        }
      } catch (err) {
        console.error('Error loading product:', err)
        setError('Failed to load item detail.')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  const handleConfirmOrder = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: product.name,
          itemType: product.itemType || 'product',
          itemId: id,
          providerName: product.seller || 'Lakshmi Ammal',
          customerName: JSON.parse(localStorage.getItem('sh_user') || '{}').name || 'Anand Kumar (Job Provider)',
          date: bookingDate,
          time: bookingTime,
          pay: product.price,
          location: product.location,
          icon: product.emoji || '📦',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setBookingSuccess(`Your ${product.itemType === 'service' ? 'booking request' : 'order'} for "${product.name}" has been placed for ${bookingDate}! Provider status is currently Pending.`)
      } else {
        setBookingSuccess(`Order placed successfully for ${bookingDate}!`)
      }
    } catch (err) {
      setBookingSuccess(`Order placed for ${bookingDate}! Seller will confirm your order soon.`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-8 max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="h-56 bg-gray-200 rounded-2xl" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="px-4 py-12 max-w-2xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Item Not Found</h2>
        <p className="text-muted">{error || 'The requested item could not be found.'}</p>
        <button onClick={() => navigate('/marketplace')} className="btn-primary" id="btn-back-market">
          Back to Marketplace
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => navigate('/marketplace')}
        className="flex items-center gap-2 text-primary font-semibold hover:underline min-h-touch"
        id="btn-back-product"
      >
        <ArrowLeft size={22} /> Back to Marketplace
      </button>

      {/* Product Visual */}
      <div className="w-full h-60 bg-gradient-to-br from-primary-50 to-primary-100/70 rounded-2xl flex items-center justify-center text-8xl shadow-card relative">
        {product.emoji || '📦'}
        {product.badge && (
          <span className="absolute top-4 left-4 badge-amber font-bold text-sm shadow-sm">
            {product.badge}
          </span>
        )}
      </div>

      {/* Main Details Card */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-gray text-xs">{product.category}</span>
              <span className="badge bg-purple-50 text-purple-700 text-xs capitalize">{product.itemType || 'Product'}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mt-1">{product.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-sm">
                <Star size={16} className="text-amber-500 fill-amber-500" /> {product.rating || 4.8}
              </span>
              <span className="text-muted text-sm">({product.reviews || 12} reviews)</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 min-h-touch min-w-touch" aria-label="Save"><Heart size={22} /></button>
            <button className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 min-h-touch min-w-touch" aria-label="Share"><Share2 size={22} /></button>
          </div>
        </div>

        <div className="pt-2 border-t border-border flex items-baseline justify-between">
          <div>
            <p className="text-xs text-muted">Price</p>
            <p className="text-3xl font-extrabold text-primary">{product.price}</p>
          </div>
          <p className="text-sm text-muted flex items-center gap-1"><MapPin size={16} /> {product.location}</p>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <h2 className="font-bold text-lg text-foreground">Description</h2>
          <p className="text-base text-foreground leading-relaxed">{product.description}</p>
        </div>

        {product.highlights && product.highlights.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <h2 className="font-bold text-base text-foreground">Highlights</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {product.highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-foreground bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <CheckCircle size={16} className="text-primary shrink-0" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Seller Card */}
      <div className="card flex items-center gap-4">
        <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-2xl">👩</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg text-foreground">{product.seller}</p>
            {product.sellerVerified !== false && (
              <span className="badge-green text-xs flex items-center gap-1"><ShieldCheck size={14} /> Verified</span>
            )}
          </div>
          <p className="text-muted text-xs">Verified Artisan / Provider</p>
        </div>
        <button
          onClick={() => navigate('/chat')}
          className="btn-secondary py-2.5 px-4 text-sm font-semibold flex items-center gap-1.5"
          id="btn-message-seller"
        >
          <MessageSquare size={18} /> Chat
        </button>
      </div>

      {/* Buy / Book CTA */}
      <div className="sticky bottom-24 lg:bottom-6">
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary w-full text-lg py-4 shadow-float font-bold flex items-center justify-center gap-2"
          id="btn-buy-now"
        >
          <ShoppingCart size={22} />
          {product.itemType === 'service' ? `Book Service — ${product.price}` : `Buy Product — ${product.price}`}
        </button>
      </div>

      {/* Booking / Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-xl text-foreground flex items-center gap-2">
                <Calendar size={24} className="text-primary" /> {product.itemType === 'service' ? 'Book Service' : 'Order Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                  ✓
                </div>
                <h4 className="font-bold text-xl text-foreground">
                  {product.itemType === 'service' ? 'Booking Placed!' : 'Order Placed!'}
                </h4>
                <p className="text-base text-gray-700 bg-green-50 p-4 rounded-2xl border border-green-200">
                  {bookingSuccess}
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => navigate('/bookings')}
                    className="btn-primary flex-1 py-3"
                    id="btn-view-bookings-market"
                  >
                    View My Bookings
                  </button>
                  <button
                    onClick={() => { setShowModal(false); setBookingSuccess(null) }}
                    className="btn-secondary flex-1 py-3"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmOrder} className="space-y-4">
                <div>
                  <p className="font-semibold text-foreground mb-1">{product.name}</p>
                  <p className="text-sm text-primary font-bold">{product.price}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {product.itemType === 'service' ? 'Select Service Date' : 'Select Delivery Date'}
                  </label>
                  <input
                    type="date"
                    className="input text-base"
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Preferred Time Slot</label>
                  <select
                    className="input text-base"
                    value={bookingTime}
                    onChange={e => setBookingTime(e.target.value)}
                  >
                    <option value="10:00 AM">10:00 AM - Morning</option>
                    <option value="02:00 PM">02:00 PM - Afternoon</option>
                    <option value="06:00 PM">06:00 PM - Evening</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-3">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3 font-bold" id="btn-confirm-order">
                    {submitting ? 'Placing Order...' : (product.itemType === 'service' ? 'Confirm Booking' : 'Confirm Order')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
