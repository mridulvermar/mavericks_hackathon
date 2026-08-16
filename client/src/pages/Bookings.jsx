import React, { useState, useEffect } from 'react'
import { Calendar, CheckCircle, Clock, XCircle, ChevronRight, AlertCircle, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const statusConfig = {
  pending:    { label: 'Pending Approval', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  confirmed:  { label: 'Confirmed',        color: 'bg-blue-100 text-blue-800 border-blue-300',   icon: CheckCircle },
  in_progress:{ label: 'In Progress',      color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Clock },
  completed:  { label: 'Completed',        color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle },
  cancelled:  { label: 'Cancelled',        color: 'bg-rose-100 text-rose-800 border-rose-300',   icon: XCircle },
}

const tabs = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled']

export default function Bookings() {
  const navigate = useNavigate()
  const [role, setRole] = useState('provider') // 'provider' | 'customer'
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('All')
  const [actionMessage, setActionMessage] = useState(null)
  const [confirmCancel, setConfirmCancel] = useState(null) // booking id to confirm cancel

  const fetchBookings = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`)
      const data = await res.json()
      if (data.success) {
        setBookings(data.data || [])
      } else {
        setError('Could not load bookings. Please try again.')
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
      setError('Could not connect to server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleStatusChange = async (id, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.success) {
        setActionMessage(data.message || `Booking updated successfully!`)
        fetchBookings()
        setTimeout(() => setActionMessage(null), 3500)
      } else {
        setActionMessage(`Action failed: ${data.message || 'Please try again.'}`)
        setTimeout(() => setActionMessage(null), 4000)
      }
    } catch (err) {
      console.error(`Failed to ${action} booking:`, err)
      setActionMessage('Network error. Please try again.')
      setTimeout(() => setActionMessage(null), 4000)
    }
  }

  const handleCancelConfirmed = (id) => {
    setConfirmCancel(null)
    handleStatusChange(id, 'cancel')
  }

  const filtered = bookings.filter(b => {
    if (activeTab === 'All') return true
    return (b.status || 'pending').toLowerCase() === activeTab.toLowerCase()
  })

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">

      {/* Cancel Confirmation Dialog */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle size={28} />
              <h3 className="font-extrabold text-xl">Cancel Booking?</h3>
            </div>
            <p className="text-base text-foreground leading-relaxed">
              Are you sure you want to cancel this booking? This action cannot be undone and the provider will be notified.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmCancel(null)}
                className="btn-secondary flex-1 py-3 font-bold"
                id="btn-cancel-keep"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancelConfirmed(confirmCancel)}
                className="btn-primary flex-1 py-3 font-bold bg-red-600 hover:bg-red-700 border-red-600"
                id="btn-cancel-confirm"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar size={28} className="text-primary" /> My Bookings
        </h1>

        {/* Provider vs Customer View Toggle */}
        <div className="flex bg-gray-200 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setRole('provider')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              role === 'provider' ? 'bg-white text-primary shadow-xs' : 'text-gray-600'
            }`}
            id="role-provider"
          >
            Provider View
          </button>
          <button
            onClick={() => setRole('customer')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              role === 'customer' ? 'bg-white text-primary shadow-xs' : 'text-gray-600'
            }`}
            id="role-customer"
          >
            Customer View
          </button>
        </div>
      </div>

      {/* Action toast */}
      {actionMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md animate-fadeIn flex items-center gap-2">
          <CheckCircle size={18} /> {actionMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl border-2 font-medium whitespace-nowrap min-h-touch transition-all text-sm
              ${activeTab === tab ? 'border-primary bg-primary text-white' : 'border-border text-foreground hover:border-primary-300'}`}
            id={`tab-${tab.toLowerCase()}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="card h-36 animate-pulse bg-gray-100/70" />)}
        </div>
      ) : error ? (
        /* Error State */
        <div className="card py-12 text-center space-y-4">
          <AlertCircle size={40} className="text-red-400 mx-auto" />
          <p className="font-bold text-lg text-foreground">Could not load bookings</p>
          <p className="text-muted text-sm">{error}</p>
          <button
            onClick={fetchBookings}
            className="btn-primary flex items-center gap-2 mx-auto px-6"
            id="btn-retry-bookings"
          >
            <RefreshCw size={18} /> Try Again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="empty-state card py-14">
          <span className="text-5xl mb-2">📅</span>
          <h3 className="font-bold text-xl text-foreground">No bookings yet</h3>
          <p className="text-muted max-w-sm">
            {role === 'provider'
              ? 'Explore new opportunities to get your first booking request.'
              : 'Browse the marketplace or opportunities to book a service or order products.'}
          </p>
          <button
            onClick={() => navigate('/opportunities')}
            className="btn-primary mt-2 flex items-center gap-2"
            id="btn-explore-opps"
          >
            Explore Opportunities <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        /* Bookings List */
        <div className="space-y-4">
          {filtered.map(b => {
            const bId = b._id || b.id
            const statusKey = (b.status || 'pending').toLowerCase()
            const cfg = statusConfig[statusKey] || statusConfig.pending
            const StatusIcon = cfg.icon

            return (
              <div
                key={bId}
                className="card space-y-3 border-2 border-border hover:border-primary-300 transition-all p-5"
                id={`booking-${bId}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-3xl shrink-0">
                      {b.icon || '💼'}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground leading-snug">{b.title}</h3>
                      <p className="text-sm text-muted">
                        {role === 'provider' ? `Customer: ${b.customerName}` : `Provider: ${b.providerName}`}
                      </p>
                    </div>
                  </div>

                  {/* Big Status Badge */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-bold text-xs shrink-0 ${cfg.color}`}>
                    <StatusIcon size={14} /> {cfg.label}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-border/60">
                  <p className="flex items-center gap-1.5 text-muted">
                    <Clock size={16} className="text-gray-500" /> {b.date} ({b.time || '10:00 AM'})
                  </p>
                  <p className="font-extrabold text-primary text-base text-right">{b.pay}</p>
                </div>

                {/* Role-based Action Buttons */}
                <div className="pt-2 border-t border-border flex gap-2 flex-wrap justify-end">
                  {/* Provider Actions */}
                  {role === 'provider' && statusKey === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(bId, 'reject')}
                        className="btn-secondary text-red-600 border-red-200 py-2 px-4 text-xs font-bold flex-1"
                        id={`btn-reject-${bId}`}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleStatusChange(bId, 'accept')}
                        className="btn-primary py-2 px-4 text-xs font-bold flex-1"
                        id={`btn-accept-${bId}`}
                      >
                        Accept Request
                      </button>
                    </>
                  )}

                  {statusKey === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(bId, 'complete')}
                      className="btn-primary py-2.5 px-5 text-sm font-bold w-full bg-emerald-600 hover:bg-emerald-700"
                      id={`btn-complete-${bId}`}
                    >
                      ✅ Mark Completed
                    </button>
                  )}

                  {/* Customer Cancel — opens confirmation dialog */}
                  {statusKey !== 'completed' && statusKey !== 'cancelled' && role === 'customer' && (
                    <button
                      onClick={() => setConfirmCancel(bId)}
                      className="btn-secondary text-red-600 border-red-200 py-2 px-4 text-xs font-bold"
                      id={`btn-cancel-${bId}`}
                      aria-label={`Cancel booking: ${b.title}`}
                    >
                      Cancel Booking
                    </button>
                  )}

                  <button
                    onClick={() => navigate('/chat')}
                    className="btn-ghost py-2 px-3 text-xs"
                  >
                    💬 Message
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
