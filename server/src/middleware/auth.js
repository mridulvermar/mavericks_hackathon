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
    if (err.name === 'TokenExpiredError') {
      return next(createError('Session expired. Please sign in again.', 401))
    }
    return next(createError('Invalid authentication token.', 401))
  }
}

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError('Authentication required.', 401))
    }
    if (!roles.includes(req.user.role)) {
      return next(createError(`Access denied for role: ${req.user.role}`, 403))
    }
    next()
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
    // Ignore invalid tokens on optional routes
  }
  next()
}
