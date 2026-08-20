import rateLimit from 'express-rate-limit'

/**
 * Free Tier Gemini AI Rate Limiter
 * Gemini Free Tier allows 15 RPM (Requests Per Minute).
 * We limit to 10 RPM per IP to prevent hitting Google's 429 quota exhaustion.
 */
export const geminiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Free-tier AI quota protection active. Please wait a few seconds before trying again.',
    code: 'FREE_TIER_RATE_LIMIT',
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message)
  },
})

/**
 * Free Tier Google Cloud Translation & Services Rate Limiter
 * Limits to 20 requests per minute to preserve monthly character quotas.
 */
export const cloudServicesRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Max 20 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Google Cloud free-tier rate limit reached. Please wait a moment.',
    code: 'CLOUD_RATE_LIMIT',
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message)
  },
})

/**
 * Auth Rate Limiter
 * Protects login and registration from brute-force spam.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased to 100 requests to prevent demo locking
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    code: 'AUTH_RATE_LIMIT',
  },
})

/**
 * General API Limiter
 */
export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Increased to 2000 to accommodate client polling of notifications and chats
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again.',
  },
})
