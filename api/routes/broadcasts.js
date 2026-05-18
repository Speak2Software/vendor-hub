const router          = require('express').Router()
const { v4: uuidv4 }  = require('uuid')
const Broadcast        = require('../models/Broadcast')
const User             = require('../models/User')
const Community        = require('../models/Community')
const { authenticate, authorize } = require('../middleware/auth')
const { notifyBroadcast } = require('../utils/mailer')

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

    // Fire-and-forget email notifications to vendor recipients
    try {
      const community = await Community.findById(communityId).lean()
      const communityName = community?.name || 'Your community'

      // Determine which vendors to notify
      const recipientIds = Array.isArray(vendorIds) && vendorIds.length > 0 ? vendorIds : null
      const query = recipientIds ? { _id: { $in: recipientIds }, role: 'vendor' } : { role: 'vendor' }
      const vendors = await User.find(query).lean()

      for (const vendor of vendors) {
        notifyBroadcast({
          toEmail:       vendor.email,
          toName:        vendor.name,
          communityName,
          subject:       subject?.trim() || '',
          body:          body.trim(),
        })
      }
    } catch (mailErr) {
      console.error('[broadcasts] notification error', mailErr?.message)
    }
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
