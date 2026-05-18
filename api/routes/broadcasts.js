const router          = require('express').Router()
const { v4: uuidv4 }  = require('uuid')
const Broadcast        = require('../models/Broadcast')
const { authenticate, authorize } = require('../middleware/auth')

// ── GET /api/broadcasts?communityId= ─────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {}
    if (req.query.communityId) filter.communityId = req.query.communityId
    const broadcasts = await Broadcast.find(filter).sort({ sentAt: -1 }).lean()
    res.json(broadcasts.map(toPublic))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── POST /api/broadcasts ──────────────────────────────────────────────────────
router.post('/', authenticate, authorize('community_manager', 'admin'), async (req, res) => {
  try {
    const { vendorIds, subject, body } = req.body
    if (!body?.trim()) return res.status(400).json({ error: 'body is required' })

    const communityId = req.user.communityId
    if (!communityId) return res.status(400).json({ error: 'No community assigned to your account' })

    const broadcast = await Broadcast.create({
      _id:        uuidv4(),
      communityId,
      vendorIds:  Array.isArray(vendorIds) ? vendorIds : [],
      subject:    subject?.trim() || '',
      body:       body.trim(),
      sentAt:     new Date().toISOString(),
    })
    res.status(201).json(toPublic(broadcast.toObject()))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

function toPublic(b) {
  const obj = { ...b, id: b._id }
  delete obj._id
  delete obj.__v
  return obj
}

module.exports = router
