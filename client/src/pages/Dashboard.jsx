import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Briefcase, ShoppingBag, Bot, Star, Bell, ChevronRight, Sparkles, MapPin, IndianRupee, PlusCircle, Search, UserCheck } from 'lucide-react'

import { api, API_BASE_URL } from '../api/axios'

export default function Dashboard() {
  const navigate = useNavigate()
  const [recommended, setRecommended] = useState([])
  const [featuredServices, setFeaturedServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  const [recentActivity, setRecentActivity] = useState([])
  const [statsData, setStatsData] = useState(null)

  const user = JSON.parse(localStorage.getItem('sh_user') || '{}')
  const isJobProvider = user.role === 'job_provider' || user.role === 'customer'
  const userName = user.name || (isJobProvider ? 'Anand Kumar' : 'Sunita Ji')

  useEffect(() => {
    const fetchData = async () => {
      setFetchError(false)
      setLoading(true)
      const token = localStorage.getItem('sh_token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      try {
        if (isJobProvider) {
          // Customer home: featured products + postings count
          const [productsRes, postingsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/products`),
            fetch(`${API_BASE_URL}/opportunities/my-postings`, { headers }),
          ])
          const productsData = await productsRes.json()
          const postingsData = await postingsRes.json()
          if (productsData.success) setFeaturedServices(productsData.data.slice(0, 3))
          if (postingsData.success) {
            const postings = postingsData.data || []
            setStatsData({
              myPostings: postings.length,
              activeRequests: postings.filter(p => p.status === 'open').length,
            })
          }
        } else {
          // Provider home: matched opportunities + bookings
          const [oppsRes, bookingsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/opportunities`),
            fetch(`${API_BASE_URL}/bookings`, { headers }),
          ])
          const oppsData = await oppsRes.json()
          const bookingsData = await bookingsRes.json()
          if (oppsData.success) setRecommended(oppsData.data.slice(0, 3))
          if (bookingsData.success) {
            const bks = bookingsData.data || []
            setStatsData({
              activeBookings: bks.filter(b => b.status === 'confirmed' || b.status === 'pending').length,
              applicationsSent: bks.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length,
            })
            setRecentActivity(bks.slice(0, 3))
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard recommendations:', err)
        setFetchError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isJobProvider])

  // Job Provider Actions vs Provider Actions
  const customerQuickActions = [
    { label: 'Post a Job', icon: PlusCircle, to: '/post-job', color: 'bg-primary text-white' },
    { label: 'Post What I Need', icon: ShoppingBag, to: '/post-job?type=product_request', color: 'bg-accent text-foreground' },
    { label: 'Find Services', icon: Search, to: '/marketplace', color: 'bg-blue-600 text-white' },
    { label: 'Ask AI Help', icon: Bot, to: '/assistant', color: 'bg-purple-600 text-white' },
  ]

  const providerQuickActions = [
    { label: 'Find Work', icon: Briefcase, to: '/opportunities', color: 'bg-primary text-white' },
    { label: 'Sell Products', icon: ShoppingBag, to: '/marketplace', color: 'bg-accent text-foreground' },
    { label: 'AI Help', icon: Bot, to: '/assistant', color: 'bg-blue-600 text-white' },
    { label: 'My Skills', icon: Star, to: '/skills', color: 'bg-purple-600 text-white' },
  ]

  const customerStats = [
    { label: 'My Postings', value: String(statsData?.myPostings ?? '—'), icon: '📋', color: 'bg-primary-50 text-primary' },
    { label: 'Active Requests', value: String(statsData?.activeRequests ?? '—'), icon: '🔄', color: 'bg-accent-50 text-accent-700' },
    { label: 'Booked Services', value: '—', icon: '📅', color: 'bg-blue-50 text-blue-700' },
    { label: 'Saved Providers', value: '—', icon: '⭐', color: 'bg-purple-50 text-purple-700' },
  ]

  const providerStats = [
    { label: 'Est. Earnings This Month', value: '—', note: 'From Earnings page', icon: '💰', color: 'bg-primary-50 text-primary' },
    { label: 'Applications Sent', value: String(statsData?.applicationsSent ?? '—'), icon: '📤', color: 'bg-accent-50 text-accent-700' },
    { label: 'Active Bookings', value: String(statsData?.activeBookings ?? '—'), icon: '📅', color: 'bg-blue-50 text-blue-700' },
    { label: 'Profile Views', value: '—', icon: '👁️', color: 'bg-purple-50 text-purple-700' },
  ]

  const actionsToRender = isJobProvider ? customerQuickActions : providerQuickActions
  const statsToRender = isJobProvider ? customerStats : providerStats

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isJobProvider ? `Welcome Back, ${userName} 👋` : `Good Morning, ${userName} 🙏`}
          </h1>
          <p className="text-muted text-base mt-1">
            {isJobProvider ? 'What would you like to request or find today?' : "Here's what's happening today"}
          </p>
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
        {statsToRender.map(s => (
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
          {actionsToRender.map(a => (
            <button
              key={a.label}
              onClick={() => navigate(a.to)}
              className={`${a.color} rounded-2xl p-5 flex flex-col items-start gap-3 min-h-touch shadow-card hover:shadow-float transition-all duration-150 text-left`}
              id={`quick-${a.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <a.icon size={28} />
              <span className="font-semibold text-lg">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Assistant Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-2xl p-5 text-white flex items-start gap-4 shadow-card">
        <Bot size={32} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-lg">{isJobProvider ? 'CareerAI Assistant Tip' : 'CareerAI Livelihood Tip'}</p>
          <p className="text-sm opacity-90 mt-1 leading-relaxed">
            {isJobProvider
              ? 'Need homemade tiffins, saree blouse stitching, or maths tutoring? Post a job or requirement and senior specialists near you will apply!'
              : 'Your cooking & teaching skills are in high demand! 3 new opportunities were posted near you this week.'}
          </p>
          <button
            onClick={() => navigate(isJobProvider ? '/post-job' : '/opportunities')}
            className="mt-3 bg-white/20 hover:bg-white/30 text-white font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-1 transition-colors"
            id="btn-ai-banner-action"
          >
            {isJobProvider ? 'Post a Requirement Now' : 'View Opportunities'} <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Recommended / Featured Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title mb-0 flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            {isJobProvider ? 'Featured Senior Specialists Near You' : 'Recommended Opportunities for You'}
          </h2>
          <button
            onClick={() => navigate(isJobProvider ? '/marketplace' : '/opportunities')}
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
            <p className="font-bold text-foreground">Could not load list</p>
            <button
              onClick={() => setLoading(true)}
              className="btn-primary px-6 py-2 text-sm font-bold mx-auto"
            >
              🔄 Try Again
            </button>
          </div>
        ) : isJobProvider ? (
          /* Job Provider View: Featured Services & Products offered by providers */
          <div className="space-y-3">
            {featuredServices.map(item => {
              const itemId = item._id || item.id
              return (
                <button
                  key={itemId}
                  onClick={() => navigate(`/marketplace/${itemId}`)}
                  className="card w-full text-left hover:shadow-float transition-all border-2 hover:border-primary-300 space-y-2 p-4 flex items-center gap-4"
                  id={`cust-item-${itemId}`}
                >
                  <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-3xl shrink-0">
                    {item.icon || '🛍️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="badge-green text-xs flex items-center gap-1">
                        <UserCheck size={12} /> Verified Provider
                      </span>
                      <span className="badge-gray text-xs">{item.category}</span>
                    </div>
                    <h3 className="font-bold text-foreground text-base leading-snug truncate mt-0.5">{item.title}</h3>
                    <p className="text-xs text-muted">Offered by {item.providerName || 'Lakshmi Ammal'}</p>
                    <p className="font-extrabold text-primary text-sm mt-1">{item.price}</p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          /* Provider View: Job Matches */
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
          {recentActivity.length > 0 ? (
            recentActivity.map((item, i) => (
              <div key={item._id || item.id || i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <span className="text-2xl">{item.icon || '📅'}</span>
                <div className="flex-1">
                  <p className="text-base font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted">{item.date || 'Recently'}</p>
                </div>
                <ChevronRight size={20} className="text-muted" />
              </div>
            ))
          ) : (
            [
              { icon: isJobProvider ? '📋' : '✅', text: isJobProvider ? 'Welcome to Career 2.0!' : 'Start applying to opportunities', time: 'Get started' },
              { icon: '💬', text: 'Chat with your connections', time: 'Messages' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-base font-medium text-foreground">{item.text}</p>
                  <p className="text-sm text-muted">{item.time}</p>
                </div>
                <ChevronRight size={20} className="text-muted" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
