import jwt from 'jsonwebtoken'
import { createError } from './errorHandler.js'

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError('Please sign in to continue.', 401))
    }
    const token = authHeader.slice(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'silverhands_dev_secret')
    req.user = decoded
    next()
  } catch (err) {
    next(err)
  }
}

export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'silverhands_dev_secret')
    }
  } catch {
    // Ignore auth errors on optional routes
  }
  next()
}
