/**
 * Centralized error handling middleware.
 * - Never leaks stack traces or internal error messages to the client.
 * - Always returns a consistent { success: false, message } shape.
 * - Logs full error server-side for debugging.
 */
export const errorHandler = (err, req, res, next) => {
  // Log full error on server (never sent to client)
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack)
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message)
    return res.status(400).json({
      success: false,
      message: messages.join('. '),
    })
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(409).json({
      success: false,
      message: `This ${field} is already registered. Please use a different one.`,
    })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid session. Please sign in again.' })
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' })
  }

  // HTTP errors with known status codes
  const status = err.statusCode || err.status || 500
  const message = status < 500
    ? err.message || 'Something went wrong'
    : 'Something went wrong on our end. Please try again in a moment.'

  return res.status(status).json({ success: false, message })
}

/**
 * Utility to create operational errors with a specific HTTP status
 */
export const createError = (message, statusCode = 400) => {
  const err = new Error(message)
  err.statusCode = statusCode
  return err
}
