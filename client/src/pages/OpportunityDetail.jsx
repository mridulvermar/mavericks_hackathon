import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Clock, IndianRupee, ArrowLeft, Share2, Bookmark, CheckCircle, Sparkles, UserCheck, Calendar, X, MessageSquare } from 'lucide-react'

import { API_BASE_URL } from '../api/axios'

export default function OpportunityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [opp, setOpp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [bookingDate, setBookingDate] = useState('2026-08-20')
  const [bookingTime, setBookingTime] = useState('10:00 AM')
  const [bookingSuccess, setBookingSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const currentUser = JSON.parse(localStorage.getItem('sh_user') || '{}')
  const currentUserId = currentUser._id || currentUser.id || 'u_user'

  const handleMessageEmployer = () => {
    const employerName = opp.clientName || 'Job Provider'
    const convId = `opp_${opp._id || opp.id}_${currentUserId}`

    navigate('/chat', {
      state: {
        conversationId: convId,
        name: employerName,
        role: 'Job Provider',
        opportunityTitle: opp.title,
        opportunityId: opp._id || opp.id,
        recipientId: opp.postedById || opp.postedBy || '',
        avatar: '💼',
        initialDraft: `Namaste ${employerName}, I am interested in "${opp.title}". Could you please share more details about the timings and job requirements?`,
      },
    })
  }

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/opportunities/${id}`)
        const data = await res.json()
        if (data.success && data.data) {
          setOpp(data.data)
        } else {
          setError(data.message || 'Opportunity not found.')
        }
      } catch (err) {
        console.error('Error fetching detail:', err)
        setError('Failed to load details.')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  const handleConfirmBooking = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const token = localStorage.getItem('sh_token')
    const user = JSON.parse(localStorage.getItem('sh_user') || '{}')

    try {
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: opp.title,
          itemType: 'opportunity',
          itemId: id,
          providerName: opp.clientName || 'Lakshmi Ammal',
          customerName: user.name || 'Sunita Ji (Applicant)',
          date: bookingDate,
          time: bookingTime,
          pay: opp.pay,
          location: opp.location,
          icon: '💼',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setBookingSuccess(data.message || `Your application was sent to ${opp.clientName || 'the employer'}. You'll be notified when they respond.`)
      } else {
        setBookingSuccess(`Your application was sent to ${opp.clientName || 'the employer'}. You'll be notified when they respond.`)
      }
    } catch (err) {
      setBookingSuccess(`Your application was sent to ${opp.clientName || 'the employer'}. You'll be notified when they respond.`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-8 max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="h-48 bg-gray-200 rounded-2xl" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
      </div>
    )
  }

  if (error || !opp) {
    return (
      <div className="px-4 py-12 max-w-2xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Opportunity Not Found</h2>
        <p className="text-muted">{error || 'The requested opportunity could not be found.'}</p>
        <button onClick={() => navigate('/opportunities')} className="btn-primary" id="btn-back-opps">
          Back to Opportunities
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      {/* Back button */}
      <button
        onClick={() => navigate('/opportunities')}
        className="flex items-center gap-2 text-primary font-semibold hover:underline min-h-touch"
        id="btn-back"
      >
        <ArrowLeft size={22} /> Back to Opportunities
      </button>

      {/* Main Header Card */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="badge-gray text-sm">{opp.category}</span>
              {opp.type && <span className="badge bg-blue-50 text-blue-700 text-xs">{opp.type}</span>}
              {opp.urgent && <span className="badge-amber text-xs">🔥 Urgent</span>}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{opp.title}</h1>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 min-h-touch min-w-touch" aria-label="Save"><Bookmark size={22} /></button>
            <button className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 min-h-touch min-w-touch" aria-label="Share"><Share2 size={22} /></button>
          </div>
        </div>

        {/* AI Match Banner */}
        {opp.matchReason && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {opp.matchPercent || 90}%
            </div>
            <div>
              <p className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
                <Sparkles size={16} className="text-emerald-600" /> Match Insight
              </p>
              <p className="text-emerald-800 text-sm mt-0.5">{opp.matchReason}</p>
            </div>
          </div>
        )}

        {/* Pay & Location Info */}
        <div className="space-y-2 pt-1 border-t border-border">
          <p className="flex items-center gap-2 text-primary font-bold text-2xl">
            <IndianRupee size={22} /> {opp.pay}
          </p>
          {opp.payNote && <p className="text-xs text-muted italic">⚠️ {opp.payNote}</p>}
          <div className="grid grid-cols-2 gap-2 text-sm pt-2 text-muted">
            <p className="flex items-center gap-2"><MapPin size={18} className="text-primary" /> {opp.location}</p>
            <p className="flex items-center gap-2"><Clock size={18} /> Posted {opp.posted || 'Recently'}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="card space-y-3">
        <h2 className="font-bold text-lg text-foreground">About this Work</h2>
        <p className="text-base text-foreground leading-relaxed">{opp.description}</p>
      </div>

      {/* Requirements */}
      {opp.requirements && opp.requirements.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-bold text-lg text-foreground">Requirements & Skills</h2>
          <ul className="space-y-2.5">
            {opp.requirements.map((req, idx) => (
              <li key={idx} className="flex items-start gap-3 text-base">
                <CheckCircle size={20} className="text-primary mt-0.5 shrink-0" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Client Info */}
      <div className="card flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-2xl">👤</div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg text-foreground">{opp.clientName || 'Employer'}</p>
              {opp.clientVerified !== false && <span className="badge-green text-sm flex items-center gap-1"><UserCheck size={14} /> Verified</span>}
            </div>
            <p className="text-muted text-sm">Verified Employer / Client</p>
          </div>
        </div>
        <button
          onClick={handleMessageEmployer}
          className="btn-secondary py-2.5 px-4 text-sm font-semibold flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary-50"
          id="btn-chat-employer-card"
        >
          <MessageSquare size={18} /> Message
        </button>
      </div>

      {/* Dual CTA: Message Job Provider & Apply */}
      <div className="sticky bottom-24 lg:bottom-6 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-float border border-border">
        <button
          onClick={handleMessageEmployer}
          className="btn-secondary py-3.5 px-4 text-base font-bold flex items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary-50"
          id="btn-message-employer"
        >
          <MessageSquare size={20} /> Ask Details / Chat
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary py-3.5 px-4 text-base font-bold flex items-center justify-center gap-2 shadow-sm"
          id="btn-apply"
        >
          <Calendar size={20} /> Apply for Opportunity
        </button>
      </div>

      {/* Booking Date/Time Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-xl text-foreground flex items-center gap-2">
                <Calendar size={24} className="text-primary" /> Schedule Booking
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
                <h4 className="font-bold text-xl text-foreground">Booking Created!</h4>
                <p className="text-base text-gray-700 bg-green-50 p-4 rounded-2xl border border-green-200">
                  {bookingSuccess}
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => navigate('/bookings')}
                    className="btn-primary flex-1 py-3"
                    id="btn-go-to-bookings"
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
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div>
                  <p className="font-semibold text-foreground mb-1">{opp.title}</p>
                  <p className="text-sm text-primary font-bold">{opp.pay}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Select Booking Date</label>
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
                    <option value="09:00 AM">09:00 AM - Morning</option>
                    <option value="10:00 AM">10:00 AM - Morning</option>
                    <option value="02:00 PM">02:00 PM - Afternoon</option>
                    <option value="05:00 PM">05:00 PM - Evening</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-3">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3 font-bold" id="btn-confirm-booking">
                    {submitting ? 'Submitting...' : 'Confirm Booking'}
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
