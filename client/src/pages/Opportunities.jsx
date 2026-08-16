import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, IndianRupee, ChevronRight, Search, Sparkles, AlertCircle } from 'lucide-react'

import { API_BASE_URL } from '../api/axios'

const categories = ['All', 'Cooking', 'Tailoring', 'Handicrafts', 'Teaching', 'Care', 'Data Entry']

export default function Opportunities() {
  const navigate = useNavigate()
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const fetchOpportunities = async () => {
    setLoading(true)
    setError(null)
    try {
      let url = `${API_BASE_URL}/opportunities?`
      if (activeCategory !== 'All') url += `category=${encodeURIComponent(activeCategory)}&`
      if (search) url += `search=${encodeURIComponent(search)}`

      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setOpportunities(data.data || [])
      } else {
        setError(data.message || 'Failed to load opportunities.')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Unable to connect to server. Showing available data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpportunities()
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
          <h1 className="text-2xl font-bold text-foreground">Find Opportunities 💼</h1>
          <p className="text-muted text-sm mt-0.5">Matched for your wisdom, skills, and location</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          className="input pl-12 text-lg"
          placeholder="Search opportunities (e.g. Cooking, Chennai)..."
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
            className={`px-4 py-2.5 rounded-xl border-2 font-medium whitespace-nowrap min-h-touch transition-all
              ${activeCategory === cat ? 'border-primary bg-primary text-white' : 'border-border text-foreground hover:border-primary-300'}`}
            id={`filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count & status */}
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{filtered.length} opportunities found</span>
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
            const matchScore = opp.matchPercent || 92
            return (
              <div
                key={oppId}
                className="card w-full text-left hover:shadow-float transition-all duration-150 border-2 hover:border-primary-300 space-y-3"
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

                  {/* AI Match percentage pill */}
                  <div className="flex flex-col items-end shrink-0">
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-sm px-3 py-1.5 rounded-full shadow-sm">
                      <Sparkles size={14} /> {matchScore}% Match
                    </span>
                  </div>
                </div>

                {/* AI Match Reason Banner */}
                {opp.matchReason && (
                  <div className="bg-primary-50/80 border border-primary-100 rounded-xl p-3 text-sm text-primary-900 flex items-start gap-2">
                    <Sparkles size={16} className="text-primary mt-0.5 shrink-0" />
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
                  <button
                    onClick={() => navigate(`/opportunities/${oppId}`)}
                    className="btn-primary py-2 px-4 text-sm font-semibold flex items-center gap-1"
                    id={`view-opp-${oppId}`}
                  >
                    View Opportunity <ChevronRight size={16} />
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
