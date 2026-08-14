import React, { useState } from 'react'
import { Calendar, CheckCircle, Clock, XCircle, ChevronRight, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const mockBookings = [
  { id: '1', title: 'Home Cooking Class', client: 'Priya Mehta', date: 'Today, 4:00 PM', status: 'upcoming', pay: '₹500', icon: '🍳' },
  { id: '2', title: 'Embroidery Session', client: 'Anita Singh', date: 'Tomorrow, 10:00 AM', status: 'upcoming', pay: '₹800', icon: '🧵' },
  { id: '3', title: 'Hindi Tutoring', client: 'Rahul Kumar', date: 'Aug 10, 2026', status: 'completed', pay: '₹400', icon: '📚' },
  { id: '4', title: 'Cooking Demo', client: 'Seema Gupta', date: 'Aug 8, 2026', status: 'cancelled', pay: '₹600', icon: '🍛' },
]

const statusConfig = {
  upcoming:  { label: 'Upcoming',  color: 'badge-green', icon: Clock },
  completed: { label: 'Completed', color: 'badge-gray',  icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'badge-red',   icon: XCircle },
}

const tabs = ['All', 'Upcoming', 'Completed', 'Cancelled']

export default function Bookings() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('All')

  const filtered = mockBookings.filter(b =>
    activeTab === 'All' || b.status === activeTab.toLowerCase()
  )

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Calendar size={28} className="text-primary" /> My Bookings
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-xl border-2 font-medium whitespace-nowrap min-h-touch transition-all
              ${activeTab === tab ? 'border-primary bg-primary text-white' : 'border-border text-foreground hover:border-primary-300'}`}
            id={`tab-${tab.toLowerCase()}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="text-5xl">📅</span>
          <h3 className="font-bold text-xl text-foreground">No bookings yet</h3>
          <p className="text-muted">Apply for opportunities to get your first booking</p>
          <button onClick={() => navigate('/opportunities')} className="btn-primary" id="btn-find-work">
            Find Work
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(b => {
            const cfg = statusConfig[b.status]
            const StatusIcon = cfg.icon
            return (
              <div key={b.id} className="card hover:shadow-float transition-all duration-150 cursor-pointer" id={`booking-${b.id}`}>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center text-3xl shrink-0">
                    {b.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-lg text-foreground">{b.title}</h3>
                      <span className={cfg.color + ' text-sm flex items-center gap-1'}>
                        <StatusIcon size={14} /> {cfg.label}
                      </span>
                    </div>
                    <p className="text-muted text-sm mt-1">with {b.client}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-muted text-sm flex items-center gap-1"><Clock size={14} /> {b.date}</p>
                      <p className="font-bold text-primary">{b.pay}</p>
                    </div>
                    {b.status === 'upcoming' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => navigate(`/chat/booking-${b.id}`)}
                          className="btn-secondary py-2 px-3 text-sm flex-1"
                          id={`btn-chat-${b.id}`}
                        >
                          💬 Message
                        </button>
                        <button
                          onClick={() => {}}
                          className="btn-primary py-2 px-3 text-sm flex-1"
                          id={`btn-complete-${b.id}`}
                        >
                          ✅ Mark Done
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
