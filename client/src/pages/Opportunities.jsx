import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, IndianRupee, ChevronRight, Search, Filter } from 'lucide-react'

const mockOpportunities = [
  { id: '1', title: 'Home Cooking Classes', category: 'Teaching', pay: '₹500/session', location: 'Jaipur', type: 'Part-time', skills: ['Cooking', 'Teaching'], posted: '2 hours ago', urgent: true },
  { id: '2', title: 'Embroidery Work from Home', category: 'Craft', pay: '₹800/piece', location: 'Remote', type: 'Flexible', skills: ['Embroidery', 'Stitching'], posted: '5 hours ago', urgent: false },
  { id: '3', title: 'Elderly Care Companion', category: 'Care', pay: '₹400/day', location: 'Jaipur', type: 'Full-time', skills: ['Patient care', 'Empathy'], posted: 'Yesterday', urgent: false },
  { id: '4', title: 'Hindi Typing Work', category: 'Data Entry', pay: '₹3,000/month', location: 'Remote', type: 'Part-time', skills: ['Hindi', 'Typing'], posted: '2 days ago', urgent: false },
  { id: '5', title: 'Recipe Content Writer', category: 'Writing', pay: '₹300/article', location: 'Remote', type: 'Freelance', skills: ['Writing', 'Cooking'], posted: '3 days ago', urgent: false },
]

const categories = ['All', 'Teaching', 'Craft', 'Care', 'Data Entry', 'Writing']

export default function Opportunities() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = mockOpportunities.filter(o => {
    const matchesSearch = o.title.toLowerCase().includes(search.toLowerCase())
    const matchesCat = activeCategory === 'All' || o.category === activeCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Find Opportunities 💼</h1>

      {/* Search */}
      <div className="relative">
        <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          className="input pl-12 text-lg"
          placeholder="Search opportunities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search opportunities"
          id="search-opportunities"
        />
      </div>

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

      {/* Results count */}
      <p className="text-muted text-sm">{filtered.length} opportunities found</p>

      {/* Opportunity Cards */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="text-5xl">🔍</span>
          <h3 className="font-bold text-xl text-foreground">No results found</h3>
          <p className="text-muted">Try different search terms or categories</p>
          <button onClick={() => { setSearch(''); setActiveCategory('All') }} className="btn-primary" id="btn-clear-search">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(opp => (
            <button
              key={opp.id}
              onClick={() => navigate(`/opportunities/${opp.id}`)}
              className="card w-full text-left hover:shadow-float transition-all duration-150 hover:border-primary-200"
              id={`opportunity-${opp.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg text-foreground">{opp.title}</h3>
                    {opp.urgent && <span className="badge-amber text-xs">🔥 Urgent</span>}
                  </div>
                  <span className="badge-gray text-sm mt-1">{opp.category}</span>
                  <div className="mt-3 space-y-1.5">
                    <p className="flex items-center gap-2 text-base">
                      <IndianRupee size={16} className="text-primary" />
                      <span className="font-semibold text-primary">{opp.pay}</span>
                    </p>
                    <p className="flex items-center gap-2 text-muted text-sm">
                      <MapPin size={16} /> {opp.location}
                    </p>
                    <p className="flex items-center gap-2 text-muted text-sm">
                      <Clock size={16} /> {opp.type} · Posted {opp.posted}
                    </p>
                  </div>
                </div>
                <ChevronRight size={22} className="text-muted mt-1 shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
