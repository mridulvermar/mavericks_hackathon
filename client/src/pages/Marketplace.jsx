import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, Star, Plus, ChevronRight } from 'lucide-react'

const mockProducts = [
  { id: '1', name: 'Handmade Rajasthani Pickle', seller: 'Sunita Sharma', price: '₹250', rating: 4.8, reviews: 32, category: 'Food', emoji: '🫙', badge: 'Best Seller' },
  { id: '2', name: 'Hand-embroidered Cushion Cover', seller: 'Meera Devi', price: '₹450', rating: 4.6, reviews: 18, category: 'Craft', emoji: '🪡', badge: null },
  { id: '3', name: 'Homemade Ghee (500ml)', seller: 'Kamla Bai', price: '₹380', rating: 4.9, reviews: 55, category: 'Food', emoji: '🥛', badge: 'Top Rated' },
  { id: '4', name: 'Knitted Woolen Socks', seller: 'Radha Kumari', price: '₹180', rating: 4.5, reviews: 12, category: 'Clothing', emoji: '🧶', badge: null },
  { id: '5', name: 'Organic Turmeric Powder', seller: 'Shanti Devi', price: '₹150', rating: 4.7, reviews: 28, category: 'Food', emoji: '🌿', badge: null },
  { id: '6', name: 'Hand-painted Clay Diyas', seller: 'Geeta Ben', price: '₹320', rating: 4.8, reviews: 41, category: 'Decor', emoji: '🪔', badge: null },
]

const categories = ['All', 'Food', 'Craft', 'Clothing', 'Decor']

export default function Marketplace() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = mockProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    return matchSearch && matchCat
  })

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">🛒 Marketplace</h1>
        <button
          onClick={() => alert('List your product — coming in Step 3!')}
          className="btn-primary py-2 px-4 text-sm"
          id="btn-add-product"
        >
          <Plus size={18} /> Sell
        </button>
      </div>

      <div className="relative">
        <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          className="input pl-12 text-lg"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search products"
          id="search-marketplace"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2.5 rounded-xl border-2 font-medium whitespace-nowrap min-h-touch transition-all
              ${activeCategory === cat ? 'border-primary bg-primary text-white' : 'border-border text-foreground hover:border-primary-300'}`}
            id={`cat-${cat.toLowerCase()}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="text-5xl">🛍️</span>
          <h3 className="font-bold text-xl text-foreground">No products found</h3>
          <p className="text-muted">Try different search terms</p>
          <button onClick={() => { setSearch(''); setActiveCategory('All') }} className="btn-primary" id="btn-clear-market-search">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => navigate(`/marketplace/${p.id}`)}
              className="card text-left hover:shadow-float transition-all duration-150 hover:border-primary-200 flex flex-col gap-2"
              id={`product-${p.id}`}
            >
              <div className="w-full h-24 bg-primary-50 rounded-xl flex items-center justify-center text-5xl">
                {p.emoji}
              </div>
              {p.badge && <span className="badge-amber text-xs self-start">{p.badge}</span>}
              <h3 className="font-semibold text-foreground text-sm leading-tight">{p.name}</h3>
              <p className="text-muted text-xs">by {p.seller}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="font-bold text-primary text-base">{p.price}</span>
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Star size={13} className="text-accent fill-accent" /> {p.rating}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
