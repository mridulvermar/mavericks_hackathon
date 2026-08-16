import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, Star, Plus, ChevronRight, CheckCircle, Wrench, Package } from 'lucide-react'

import { API_BASE_URL } from '../api/axios'

const categories = ['All', 'Food', 'Craft', 'Tailoring', 'Cooking', 'Teaching', 'Decor']

export default function Marketplace() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('service') // 'service' or 'product'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const fetchMarketplaceItems = async () => {
    setLoading(true)
    try {
      let url = `${API_BASE_URL}/products?type=${activeTab}&`
      if (activeCategory !== 'All') url += `category=${encodeURIComponent(activeCategory)}&`
      if (search) url += `search=${encodeURIComponent(search)}`

      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setItems(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch marketplace items:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketplaceItems()
  }, [activeTab, activeCategory])

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                        (item.seller && item.seller.toLowerCase().includes(search.toLowerCase()))
    const matchCat = activeCategory === 'All' || item.category === activeCategory
    return matchSearch && matchCat
  })

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🛒 Marketplace</h1>
          <p className="text-muted text-sm mt-0.5">Explore authentic homemade products & micro-services</p>
        </div>
        <button
          onClick={() => alert('List your product/service — choose category & price in Step 5!')}
          className="btn-primary py-2 px-4 text-sm font-semibold flex items-center gap-1.5"
          id="btn-add-product"
        >
          <Plus size={18} /> Sell
        </button>
      </div>

      {/* Services vs Products Main Tabs */}
      <div className="grid grid-cols-2 p-1.5 bg-gray-200/70 rounded-2xl gap-1">
        <button
          onClick={() => { setActiveTab('service'); setActiveCategory('All') }}
          className={`py-3 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all min-h-touch ${
            activeTab === 'service' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-foreground'
          }`}
          id="tab-services"
        >
          <Wrench size={20} /> Services
        </button>
        <button
          onClick={() => { setActiveTab('product'); setActiveCategory('All') }}
          className={`py-3 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all min-h-touch ${
            activeTab === 'product' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-foreground'
          }`}
          id="tab-products"
        >
          <Package size={20} /> Products
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          className="input pl-12 text-lg"
          placeholder={`Search ${activeTab === 'service' ? 'services (e.g. Catering, Tailoring)' : 'products (e.g. Ghee, Pickle)'}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search marketplace"
          id="search-marketplace"
        />
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl border-2 font-medium whitespace-nowrap min-h-touch transition-all text-sm
              ${activeCategory === cat ? 'border-primary bg-primary text-white' : 'border-border text-foreground hover:border-primary-300'}`}
            id={`cat-${cat.toLowerCase()}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items Count */}
      <div className="flex items-center justify-between text-sm text-muted">
        <span>Showing {filtered.length} {activeTab === 'service' ? 'Services' : 'Products'}</span>
        {loading && <span className="text-primary animate-pulse">Updating list...</span>}
      </div>

      {/* Grid of Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 4].map(i => <div key={i} className="card h-48 animate-pulse bg-gray-100/70" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card py-12">
          <span className="text-5xl mb-2">🛍️</span>
          <h3 className="font-bold text-xl text-foreground">No {activeTab}s found</h3>
          <p className="text-muted">Try searching with a different term or category.</p>
          <button onClick={() => { setSearch(''); setActiveCategory('All') }} className="btn-primary mt-2" id="btn-clear-market-search">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(p => {
            const pId = p._id || p.id
            return (
              <div
                key={pId}
                className="card text-left hover:shadow-float transition-all duration-150 border-2 hover:border-primary-300 flex flex-col justify-between space-y-3"
                id={`product-${pId}`}
              >
                <div className="space-y-2">
                  {/* Visual Box */}
                  <div className="w-full h-32 bg-gradient-to-br from-primary-50 to-primary-100/60 rounded-xl flex items-center justify-center text-6xl shadow-inner relative">
                    {p.emoji || '📦'}
                    {p.badge && (
                      <span className="absolute top-2 left-2 badge-amber text-xs font-bold shadow-xs">
                        {p.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-1 pt-1">
                    <span className="badge-gray text-xs">{p.category}</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      <Star size={12} className="fill-amber-500 text-amber-500" /> {p.rating || 4.8} ({p.reviews || 12})
                    </span>
                  </div>

                  <h3 className="font-bold text-foreground text-lg leading-snug">{p.name}</h3>

                  {/* Provider Info */}
                  <div className="flex items-center gap-1.5 text-sm text-muted">
                    <span>by <strong className="text-foreground">{p.seller}</strong></span>
                    {p.sellerVerified !== false && (
                      <span className="text-green-600 flex items-center gap-0.5 text-xs font-bold" title="Verified Seller">
                        <CheckCircle size={14} /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted truncate">📍 {p.location || 'Chennai'}</p>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="font-extrabold text-primary text-xl">{p.price}</span>
                  <button
                    onClick={() => navigate(`/marketplace/${pId}`)}
                    className="btn-primary py-2 px-3 text-xs font-bold flex items-center gap-1"
                    id={`view-details-${pId}`}
                  >
                    View Details <ChevronRight size={14} />
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
