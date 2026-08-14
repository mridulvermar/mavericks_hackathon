import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, ArrowLeft, Share2, Heart, ShoppingCart, MessageSquare } from 'lucide-react'

const mockProducts = {
  '1': {
    name: 'Handmade Rajasthani Pickle',
    seller: 'Sunita Sharma',
    sellerVerified: true,
    price: '₹250',
    rating: 4.8,
    reviews: 32,
    category: 'Food',
    emoji: '🫙',
    description: 'Traditional Rajasthani mixed pickle made with fresh vegetables, mustard oil, and authentic spices. No preservatives added. Made in a clean home kitchen.',
    highlights: ['No preservatives', 'Traditional recipe', 'Ships in 2-3 days', 'Handmade with love'],
    inStock: true,
  },
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const product = mockProducts[id] || {
    name: 'Handmade Product',
    seller: 'Local Artisan',
    sellerVerified: false,
    price: '₹299',
    rating: 4.5,
    reviews: 10,
    category: 'Craft',
    emoji: '🎨',
    description: 'A beautiful handmade product crafted with care and skill.',
    highlights: ['Handmade', 'Quality assured'],
    inStock: true,
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary font-semibold hover:underline min-h-touch" id="btn-back-product">
        <ArrowLeft size={22} /> Back to Marketplace
      </button>

      {/* Product Image */}
      <div className="w-full h-56 bg-primary-50 rounded-2xl flex items-center justify-center text-8xl">
        {product.emoji}
      </div>

      {/* Details */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="badge-gray text-sm">{product.category}</span>
            <h1 className="text-2xl font-bold text-foreground mt-1">{product.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Star size={18} className="text-accent fill-accent" />
              <span className="font-semibold">{product.rating}</span>
              <span className="text-muted text-sm">({product.reviews} reviews)</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button className="p-3 bg-gray-50 rounded-xl min-h-touch min-w-touch" aria-label="Save"><Heart size={22} /></button>
            <button className="p-3 bg-gray-50 rounded-xl min-h-touch min-w-touch" aria-label="Share"><Share2 size={22} /></button>
          </div>
        </div>
        <p className="text-3xl font-bold text-primary">{product.price}</p>
        <p className="text-base text-foreground leading-relaxed">{product.description}</p>
        <ul className="space-y-2">
          {product.highlights.map(h => (
            <li key={h} className="flex items-center gap-2 text-base">
              <span className="text-primary">✓</span> {h}
            </li>
          ))}
        </ul>
      </div>

      {/* Seller */}
      <div className="card flex items-center gap-4">
        <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-2xl">👩</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg text-foreground">{product.seller}</p>
            {product.sellerVerified && <span className="badge-green text-sm">✓ Verified</span>}
          </div>
          <p className="text-muted text-sm">Seller</p>
        </div>
        <button
          onClick={() => navigate('/chat')}
          className="btn-secondary py-2 px-3 text-sm"
          id="btn-message-seller"
        >
          <MessageSquare size={18} /> Chat
        </button>
      </div>

      {/* Buy CTA */}
      <button
        onClick={() => alert('Order placed! (Demo mode — payment integration in Step 5)')}
        className="btn-primary w-full text-lg py-4 shadow-float"
        id="btn-buy-now"
      >
        <ShoppingCart size={22} /> Buy Now — {product.price}
      </button>
    </div>
  )
}
