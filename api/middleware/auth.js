const jwt = require('jsonwebtoken')
const User = require('../models/User')

/**
 * Verify JWT bearer token and attach req.user.
 * Returns 401 if missing / invalid, 403 if user no longer exists.
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }
  const token = header.slice(7)
  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  const user = await User.findById(payload.id).lean()
  if (!user) return res.status(403).json({ error: 'User not found' })

  // Remap _id → id for consistency with frontend expectations
  req.user = { ...user, id: user._id }
  next()
}

/**
 * Role guard — call AFTER authenticate.
 * Usage: authorize('admin') or authorize('admin', 'community_manager')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}

module.exports = { authenticate, authorize }
