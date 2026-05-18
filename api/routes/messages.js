const router = require('express').Router()
const { v4: uuidv4 } = require('uuid')
const Message = require('../models/Message')
const User = require('../models/User')
const CompanyProfile = require('../models/CompanyProfile')
const { authenticate, authorize } = require('../middleware/auth')
const { notifyVendorEmail } = require('../utils/mailer')

// GET /api/messages?vendorId=
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {}
    if (req.user.role === 'vendor') {
      filter.vendorId = req.user.id
    } else if (req.query.vendorId) {
      filter.vendorId = req.query.vendorId
    }
    const messages = await Message.find(filter).sort({ sentAt: -1 }).lean()
    res.json(messages.map(toPublic))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/messages — vendor sends a message / flyer
router.post('/', authenticate, authorize('vendor'), async (req, res) => {
  try {
    const message = await Message.create({
      _id: uuidv4(),
      vendorId: req.user.id,
      ...req.body,
      sentAt: new Date().toISOString(),
    })
    res.status(201).json(toPublic(message.toObject()))

    // Fire-and-forget: email each community's managers
    try {
      const { communityIds, subject, body, type } = req.body
      if (type === 'email' && Array.isArray(communityIds) && communityIds.length > 0 && body?.trim()) {
        // Get vendor's business name from company profile, fall back to user name
        const cp = await CompanyProfile.findById(req.user.id).lean()
        const vendorName = cp?.businessName || req.user.name || 'A vendor'

        // Find all community managers for the selected communities
        const [managers, communities] = await Promise.all([
          User.find({ communityId: { $in: communityIds }, role: 'community_manager' }).lean(),
          require('../models/Community').find({ _id: { $in: communityIds } }).lean(),
        ])

        // Build a map of communityId → contactEmail
        const communityEmailMap = Object.fromEntries(
          communities.map((c) => [c._id, c.contactEmail])
        )

        for (const mgr of managers) {
          const toEmail = communityEmailMap[mgr.communityId] || mgr.email
          await notifyVendorEmail({
            toEmail,
            toName:     mgr.name,
            vendorName,
            subject:    subject?.trim() || '',
            body:       body.trim(),
          })
        }
      }
    } catch (mailErr) {
      console.error('[messages] notification error', mailErr?.message)
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

function toPublic(m) {
  const obj = { ...m, id: m._id }
  delete obj._id
  delete obj.__v
  return obj
}

module.exports = router
