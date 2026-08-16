import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Briefcase, ShoppingBag, Bot, Star, Bell, ChevronRight, Sparkles, MapPin, IndianRupee } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const stats = [
  { label: 'Est. Earnings This Month', value: '₹3,200', note: 'Estimated', icon: '💰', color: 'bg-primary-50 text-primary' },
  { label: 'Applications Sent', value: '5', icon: '📤', color: 'bg-accent-50 text-accent-700' },
  { label: 'Active Bookings', value: '2', icon: '📅', color: 'bg-blue-50 text-blue-700' },
  { label: 'Profile Views', value: '28', icon: '👁️', color: 'bg-purple-50 text-purple-700' },
]

const quickActions = [
  { label: 'Find Work', icon: Briefcase, to: '/opportunities', color: 'bg-primary text-white' },
  { label: 'Sell Products', icon: ShoppingBag, to: '/marketplace', color: 'bg-accent text-foreground' },
  { label: 'AI Help', icon: Bot, to: '/assistant', color: 'bg-blue-600 text-white' },
  { label: 'My Skills', icon: Star, to: '/skills', color: 'bg-purple-600 text-white' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [recommended, setRecommended] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    const fetchRecommended = async () => {
      setFetchError(false)
      try {
        const res = await fetch(`${API_BASE_URL}/opportunities`)
        const data = await res.json()
        if (data.success && data.data) {
          setRecommended(data.data.slice(0, 3))
        }
      } catch (err) {
        console.error('Error fetching dashboard recommendations:', err)
        setFetchError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchRecommended()
  }, [])

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Good Morning, Sunita Ji 🙏</h1>
          <p className="text-muted text-base mt-1">Here's what's happening today</p>
        </div>
        <button
          onClick={() => navigate('/chat')}
          className="relative p-3 bg-white rounded-xl shadow-card border border-border min-h-touch min-w-touch"
          aria-label="Notifications"
        >
          <Bell size={24} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-accent rounded-full" />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`card flex flex-col gap-1 ${s.color}`}>
            <span className="text-2xl">{s.icon}</span>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm font-medium leading-tight">{s.label}</p>
            {s.note && <p className="text-xs opacity-70">{s.note}</p>}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="section-title">What would you like to do?</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(a => (
            <button
              key={a.label}
              onClick={() => navigate(a.to)}
              className={`${a.color} rounded-2xl p-5 flex flex-col items-start gap-3 min-h-touch shadow-card hover:shadow-float transition-all duration-150`}
              id={`quick-${a.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <a.icon size={28} />
              <span className="font-semibold text-lg">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Insight banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-2xl p-5 text-white flex items-start gap-4 shadow-card">
        <Bot size={32} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-lg">AI Livelihood Tip</p>
          <p className="text-sm opacity-90 mt-1">
            Your cooking & teaching skills are in high demand! 3 new opportunities were posted near you this week.
          </p>
          <button
            onClick={() => navigate('/opportunities')}
            className="mt-3 bg-white/20 hover:bg-white/30 text-white font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-1 transition-colors"
            id="btn-view-opportunities"
          >
            View Opportunities <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Recommended For You Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title mb-0 flex items-center gap-2">
            <Sparkles size={20} className="text-primary" /> Recommended For You
          </h2>
          <button
            onClick={() => navigate('/opportunities')}
            className="text-primary font-bold text-sm hover:underline flex items-center gap-0.5"
          >
            See All <ChevronRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="card h-32 animate-pulse bg-gray-100/80" />)}
          </div>
        ) : fetchError ? (
          <div className="card p-6 text-center space-y-3">
            <span className="text-4xl">⚠️</span>
            <p className="font-bold text-foreground">Could not load recommendations</p>
            <p className="text-muted text-sm">Check your connection and try again.</p>
            <button
              onClick={() => { setLoading(true); setFetchError(false) }}
              className="btn-primary px-6 py-2 text-sm font-bold flex items-center gap-2 mx-auto"
              id="btn-retry-recommendations"
            >
              🔄 Try Again
            </button>
          </div>
        ) : recommended.length === 0 ? (
          <div className="card p-6 text-center space-y-3">
            <span className="text-4xl">🔍</span>
            <p className="font-bold text-foreground">No recommendations yet</p>
            <p className="text-muted text-sm">Opportunities matching your skills will appear here once your profile is complete.</p>
            <button
              onClick={() => navigate('/opportunities')}
              className="btn-primary px-6 py-2 text-sm font-bold flex items-center gap-2 mx-auto"
              id="btn-browse-opps"
            >
              Browse All Opportunities
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recommended.map(opp => {
              const oppId = opp._id || opp.id
              return (
                <button
                  key={oppId}
                  onClick={() => navigate(`/opportunities/${oppId}`)}
                  className="card w-full text-left hover:shadow-float transition-all border-2 hover:border-primary-300 space-y-2 p-4"
                  id={`rec-opp-${oppId}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="badge-gray text-xs mb-1 inline-block">{opp.category}</span>
                      <h3 className="font-bold text-foreground text-base leading-snug">{opp.title}</h3>
                    </div>
                    <span className="badge-green text-xs font-bold shrink-0">
                      ✨ {opp.matchPercent || 92}% Match
                    </span>
                  </div>

                  {opp.matchReason && (
                    <p className="text-xs text-primary-900 bg-primary-50 p-2 rounded-lg font-medium">
                      💡 {opp.matchReason}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted pt-1">
                    <span className="font-bold text-primary text-sm flex items-center gap-0.5">
                      <IndianRupee size={14} /> {opp.pay}
                    </span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {opp.distanceText || opp.location}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="section-title">Recent Activity</h2>
        <div className="card divide-y divide-border">
          {[
            { icon: '✅', text: 'Applied to "Home Cooking Classes"', time: '2 hours ago' },
            { icon: '💬', text: 'New message from Rahul Sharma', time: '5 hours ago' },
            { icon: '⭐', text: 'You got a 5-star review!', time: 'Yesterday' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <p className="text-base font-medium text-foreground">{item.text}</p>
                <p className="text-sm text-muted">{item.time}</p>
              </div>
              <ChevronRight size={20} className="text-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
