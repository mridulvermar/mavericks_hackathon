import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, IndianRupee, ChevronRight, Search, Sparkles, AlertCircle, MessageSquare } from 'lucide-react'

import { API_BASE_URL } from '../api/axios'
import { t } from '../utils/translator.js'

const categories = ['All', 'Cooking', 'Tailoring', 'Handicrafts', 'Teaching', 'Care', 'Data Entry']

export default function Opportunities() {
  const navigate = useNavigate()
  const [opportunities, setOpportunities] = useState([])
  const user = JSON.parse(localStorage.getItem('sh_user') || '{}')
  const currentLang = user.preferredLanguage || 'English'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const prevOppsRef = React.useRef([])
  const [newOppNotification, setNewOppNotification] = useState(null)

  const fetchOpportunities = async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true)
      setError(null)
    }
    try {
      const token = localStorage.getItem('sh_token')
      const user = JSON.parse(localStorage.getItem('sh_user') || '{}')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      let url = `${API_BASE_URL}/opportunities?`
      if (user._id || user.id) url += `userId=${encodeURIComponent(user._id || user.id)}&`
      if (activeCategory !== 'All') url += `category=${encodeURIComponent(activeCategory)}&`
      if (search) url += `search=${encodeURIComponent(search)}`

      const res = await fetch(url, { headers })
      const data = await res.json()
      if (data.success) {
        const freshList = data.data || []
        
        // Check for new opportunities only if it's not the initial empty load
        if (prevOppsRef.current.length > 0) {
          const prevIds = new Set(prevOppsRef.current.map(o => String(o._id || o.id)))
          const newlyAdded = freshList.find(o => !prevIds.has(String(o._id || o.id)))
          if (newlyAdded) {
            setNewOppNotification({
              id: newlyAdded._id || newlyAdded.id,
              title: newlyAdded.title,
              category: newlyAdded.category,
              pay: newlyAdded.pay
            })
          }
        }
        
        prevOppsRef.current = freshList
        setOpportunities(freshList)
      } else {
        if (!isSilent) setError(data.message || 'Failed to load opportunities.')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      if (!isSilent) setError('Unable to connect to server. Showing available data.')
    } finally {
      if (!isSilent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpportunities()

    // Background poll every 5 seconds to automatically discover new postings
    const pollInterval = setInterval(() => {
      fetchOpportunities(true)
    }, 5000)

    return () => clearInterval(pollInterval)
  }, [activeCategory])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchOpportunities()
  }

  const filtered = opportunities.filter(o => {
    const matchesSearch = o.title.toLowerCase().includes(search.toLowerCase()) ||
                          (o.description && o.description.toLowerCase().includes(search.toLowerCase())) ||
                          (o.location && o.location.toLowerCase().includes(search.toLowerCase()))
    const matchesCat = activeCategory === 'All' || o.category === activeCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('Find Opportunities 💼', currentLang)}</h1>
          <p className="text-muted text-sm mt-0.5">{t('Matched for your wisdom, skills, and location', currentLang)}</p>
        </div>
      </div>

      {/* New Opportunity Banner Notification */}
      {newOppNotification && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 text-emerald-950 flex items-start justify-between gap-3 shadow-md animate-fadeIn" id="new-opp-banner">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">🔔</span>
            <div>
              <p className="font-extrabold text-xs text-emerald-800 uppercase tracking-wider">New Opportunity Available!</p>
              <p className="font-bold text-lg mt-0.5">{newOppNotification.title}</p>
              <p className="text-sm opacity-90 mt-1">
                Category: <strong>{newOppNotification.category}</strong> | Pay: <strong>{newOppNotification.pay}</strong>
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => {
                const id = newOppNotification.id
                setNewOppNotification(null)
                navigate(`/opportunities/${id}`)
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
            >
              View Job
            </button>
            <button
              onClick={() => setNewOppNotification(null)}
              className="text-xs text-gray-500 hover:text-gray-700 font-semibold underline text-center cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          className="input pl-12 text-lg"
          placeholder={`${t('Search opportunities', currentLang)}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search opportunities"
          id="search-opportunities"
        />
      </form>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2.5 rounded-xl border-2 font-medium whitespace-nowrap min-h-touch transition-all shrink-0
              ${activeCategory === cat ? 'border-primary bg-primary text-white' : 'border-border text-foreground hover:border-primary-300'}`}
            id={`filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {t(cat, currentLang)}
          </button>
        ))}
      </div>

      {/* Results count & status */}
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{filtered.length} {t('opportunities found', currentLang)}</span>
        {loading && <span className="text-primary animate-pulse">Loading latest matches...</span>}
      </div>

      {/* Opportunity Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse h-40 bg-gray-100/70" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card py-12">
          <span className="text-5xl mb-2">🔍</span>
          <h3 className="font-bold text-xl text-foreground">No opportunities found</h3>
          <p className="text-muted max-w-sm">We couldn't find any work matching your filters right now. Try clearing your search.</p>
          <button
            onClick={() => { setSearch(''); setActiveCategory('All') }}
            className="btn-primary mt-2"
            id="btn-clear-search"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(opp => {
            const oppId = opp._id || opp.id
            const matchScore = typeof opp.matchPercent === 'number' ? opp.matchPercent : 50
            const isHighMatch = matchScore >= 75
            const isModerateMatch = matchScore >= 45 && matchScore < 75

            return (
              <div
                key={oppId}
                className={`card w-full text-left hover:shadow-float transition-all duration-150 border-2 space-y-3
                  ${isHighMatch ? 'border-emerald-300 hover:border-emerald-500' : 'border-border hover:border-gray-300'}`}
                id={`opportunity-${oppId}`}
              >
                {/* Top header row with Match Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="badge-gray text-xs">{opp.category}</span>
                      {opp.urgent && <span className="badge-amber text-xs">🔥 Urgent</span>}
                      {opp.type && <span className="badge bg-blue-50 text-blue-700 text-xs">{opp.type}</span>}
                    </div>
                    <h3 className="font-bold text-xl text-foreground leading-snug">{opp.title}</h3>
                  </div>

                  {/* AI Match percentage pill - color coded by relevance */}
                  <div className="flex flex-col items-end shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 font-bold text-sm px-3 py-1.5 rounded-full shadow-xs
                        ${
                          isHighMatch
                            ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white'
                            : isModerateMatch
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-gray-100 text-gray-600 border border-gray-200 text-xs'
                        }`}
                    >
                      <Sparkles size={14} /> {matchScore}% Match
                    </span>
                  </div>
                </div>

                {/* AI Match Reason Banner */}
                {opp.matchReason && (
                  <div
                    className={`rounded-xl p-3 text-sm flex items-start gap-2 border
                      ${
                        isHighMatch
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                          : isModerateMatch
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                  >
                    <Sparkles size={16} className={`mt-0.5 shrink-0 ${isHighMatch ? 'text-emerald-600' : 'text-gray-500'}`} />
                    <p className="font-medium leading-tight">{opp.matchReason}</p>
                  </div>
                )}

                {/* Key Details Row */}
                <div className="grid grid-cols-2 gap-2 text-sm pt-1">
                  <div className="flex items-center gap-2">
                    <IndianRupee size={18} className="text-primary shrink-0" />
                    <span className="font-bold text-primary text-base">{opp.pay}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <MapPin size={18} className="shrink-0 text-gray-500" />
                    <span className="truncate">{opp.distanceText || opp.location}</span>
                  </div>
                </div>

                {/* Card footer CTA */}
                <div className="pt-2 flex items-center justify-between border-t border-border/60">
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Clock size={14} /> Posted {opp.posted || 'Recently'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const currentUser = JSON.parse(localStorage.getItem('sh_user') || '{}')
                        const currentUserId = currentUser._id || currentUser.id || 'u_user'
                        const employerName = opp.clientName || 'Job Provider'
                        navigate('/chat', {
                          state: {
                            conversationId: `opp_${oppId}_${currentUserId}`,
                            name: employerName,
                            role: 'Job Provider',
                            opportunityTitle: opp.title,
                            opportunityId: oppId,
                            recipientId: opp.postedById || opp.postedBy || '',
                            avatar: '💼',
                            initialDraft: `Namaste ${employerName}, I saw your listing "${opp.title}" and would like to know more details.`,
                          },
                        })
                      }}
                      className="btn-secondary py-1.5 px-3 text-xs font-bold flex items-center gap-1 text-primary border-primary/30 hover:bg-primary-50"
                      id={`chat-opp-${oppId}`}
                    >
                      <MessageSquare size={14} /> {t('Inquire', currentLang)}
                    </button>
                    <button
                      onClick={() => navigate(`/opportunities/${oppId}`)}
                      className="btn-primary py-1.5 px-3 text-xs font-semibold flex items-center gap-1"
                      id={`view-opp-${oppId}`}
                    >
                      {t('View', currentLang)} <ChevronRight size={14} />
                    </button>
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
