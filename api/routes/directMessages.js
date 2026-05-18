const router        = require('express').Router()
const { v4: uuidv4 } = require('uuid')
const DirectMessage  = require('../models/DirectMessage')
const User           = require('../models/User')
const Community      = require('../models/Community')
const { authenticate } = require('../middleware/auth')
const { notifyDirectMessage } = require('../utils/mailer')

// ── GET /api/direct-messages/threads ─────────────────────────────────────────
// Returns one entry per (vendorId, communityId) pair for the current user,
// with lastMessage and unreadCount.
router.get('/threads', authenticate, async (req, res) => {
  try {
    const { id: userId, role, communityId } = req.user

    const filter = role === 'vendor'
      ? { vendorId: userId }
      : { communityId }

    if (!filter.vendorId && !filter.communityId) return res.json([])

    const messages = await DirectMessage.find(filter).sort({ sentAt: -1 }).lean()

    const threads = {}
    for (const msg of messages) {
      const key = role === 'vendor' ? msg.communityId : msg.vendorId
      if (!threads[key]) {
        threads[key] = {
          vendorId:    msg.vendorId,
          communityId: msg.communityId,
          lastMessage: { ...msg, id: msg._id },
          unreadCount: 0,
        }
      }
      if (!msg.readAt && msg.senderId !== userId) {
        threads[key].unreadCount++
      }
    }

    const sorted = Object.values(threads).sort(
      (a, b) => new Date(b.lastMessage.sentAt) - new Date(a.lastMessage.sentAt),
    )
    res.json(sorted)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/direct-messages?vendorId=&communityId= ───────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { vendorId, communityId } = req.query
    if (!vendorId || !communityId) {
      return res.status(400).json({ error: 'vendorId and communityId are required' })
    }
    const messages = await DirectMessage.find({ vendorId, communityId })
      .sort({ sentAt: 1 })
      .lean()
    res.json(messages.map(toPublic))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── POST /api/direct-messages ─────────────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const { vendorId, communityId, body } = req.body
    if (!vendorId || !communityId || !body?.trim()) {
      return res.status(400).json({ error: 'vendorId, communityId and body are required' })
    }
    const msg = await DirectMessage.create({
      _id:        uuidv4(),
      vendorId,
      communityId,
      senderId:   req.user.id,
      senderRole: req.user.role,
      body:       body.trim(),
      sentAt:     new Date().toISOString(),
    })
    res.status(201).json(toPublic(msg.toObject()))

    // Fire-and-forget email notification to the other party
    try {
      if (req.user.role === 'vendor') {
        // Vendor sent → notify the community manager(s) for this community
        const managers = await User.find({ communityId, role: 'community_manager' }).lean()
        const senderName = req.user.name || 'A vendor'
        for (const mgr of managers) {
          notifyDirectMessage({ toEmail: mgr.email, toName: mgr.name, senderName, messageBody: body.trim() })
        }
      } else {
        // Manager sent → notify the vendor
        const vendor = await User.findById(vendorId).lean()
        if (vendor) {
          const community = await Community.findById(communityId).lean()
          const senderName = community?.name || req.user.name || 'A community'
          notifyDirectMessage({ toEmail: vendor.email, toName: vendor.name, senderName, messageBody: body.trim() })
        }
      }
    } catch (mailErr) {
      console.error('[directMessages] notification error', mailErr?.message)
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── PUT /api/direct-messages/read ─────────────────────────────────────────────
// Marks all messages in a thread sent by the other party as read.
router.put('/read', authenticate, async (req, res) => {
  try {
    const { vendorId, communityId } = req.body
    const now = new Date().toISOString()
    await DirectMessage.updateMany(
      { vendorId, communityId, senderId: { $ne: req.user.id }, readAt: null },
      { $set: { readAt: now } },
    )
    res.json({ ok: true })
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
