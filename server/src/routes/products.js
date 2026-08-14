import { Router } from 'express'
import mongoose from 'mongoose'
import Product from '../models/Product.js'
import { demoProducts } from '../seed.js'

const router = Router()

// ── GET /api/products (List & Search with Services/Products filter) ──
router.get('/', async (req, res) => {
  try {
    const { type, category, search } = req.query
    let rawProducts = []

    if (mongoose.connection.readyState === 1) {
      let query = {}
      if (type && ['product', 'service'].includes(type)) {
        query.itemType = type
      }
      if (category && category !== 'All') {
        query.category = category
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { seller: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
        ]
      }
      rawProducts = await Product.find(query).lean()
    }

    // Fallback to demoProducts if DB is empty or disconnected
    if (!rawProducts || rawProducts.length === 0) {
      rawProducts = demoProducts.map((p, idx) => ({
        ...p,
        _id: String(idx + 1),
        id: String(idx + 1),
      }))

      if (type && ['product', 'service'].includes(type)) {
        rawProducts = rawProducts.filter(p => p.itemType === type)
      }
      if (category && category !== 'All') {
        rawProducts = rawProducts.filter(p => p.category.toLowerCase() === category.toLowerCase())
      }
      if (search) {
        rawProducts = rawProducts.filter(p =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase()) ||
          p.seller.toLowerCase().includes(search.toLowerCase())
        )
      }
    }

    res.json({
      success: true,
      data: rawProducts,
      total: rawProducts.length,
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch marketplace items.' })
  }
})

// ── GET /api/products/:id ────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    let item = null

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      item = await Product.findById(id).lean()
    }

    if (!item) {
      const demoItem = demoProducts.find((p, idx) => String(idx + 1) === id || p._id === id)
      if (demoItem) {
        item = { ...demoItem, _id: id, id }
      }
    }

    if (!item) {
      return res.status(404).json({ success: false, message: 'Marketplace item not found.' })
    }

    res.json({ success: true, data: item })
  } catch (error) {
    console.error('Error fetching product detail:', error)
    res.status(500).json({ success: false, message: 'Error retrieving product detail.' })
  }
})

// ── POST /api/products (Create) ──────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, itemType, category, seller, price, location, description, emoji, highlights } = req.body
    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: 'Name, price, and category are required.' })
    }

    if (mongoose.connection.readyState === 1) {
      const newItem = await Product.create({
        name, itemType: itemType || 'product', category, seller: seller || 'Local Artisan',
        sellerVerified: true, price, location: location || 'Chennai', description,
        emoji: emoji || '📦', highlights: highlights || [],
      })
      return res.status(201).json({ success: true, data: newItem })
    }

    const mockItem = {
      _id: String(Date.now()),
      name, itemType: itemType || 'product', category, seller: seller || 'Local Artisan',
      sellerVerified: true, price, location: location || 'Chennai', description,
      rating: 4.8, reviews: 1, emoji: emoji || '📦', highlights: highlights || [],
    }
    res.status(201).json({ success: true, data: mockItem })
  } catch (error) {
    console.error('Error creating product:', error)
    res.status(500).json({ success: false, message: 'Failed to create marketplace item.' })
  }
})

// ── PUT /api/products/:id (Update) ──────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(req.params.id)) {
      const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
      if (!updated) return res.status(404).json({ success: false, message: 'Item not found.' })
      return res.json({ success: true, data: updated })
    }
    res.json({ success: true, data: { _id: req.params.id, ...req.body } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update item.' })
  }
})

// ── DELETE /api/products/:id (Delete) ───────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(req.params.id)) {
      await Product.findByIdAndDelete(req.params.id)
    }
    res.json({ success: true, message: 'Item deleted successfully.' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete item.' })
  }
})

export default router
