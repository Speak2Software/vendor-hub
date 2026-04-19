const router = require('express').Router()
const VendorProfile = require('../models/VendorProfile')
const { authenticate } = require('../middleware/auth')

// GET /api/vendor-profiles/:userId
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const profile = await VendorProfile.findById(req.params.userId).lean()
    if (!profile) return res.json(null)
    res.json(toPublic(profile))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/vendor-profiles/:userId — upsert
router.put('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params
    // Vendors can only update their own profile
    if (req.user.role === 'vendor' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    const profile = await VendorProfile.findByIdAndUpdate(
      userId,
      { ...req.body, _id: userId, updatedAt: new Date().toISOString() },
      { upsert: true, new: true },
    ).lean()
    res.json(toPublic(profile))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

function toPublic(p) {
  const obj = { ...p, userId: p._id }
  delete obj._id
  delete obj.__v
  return obj
}

module.exports = router
