const router = require('express').Router()
const { v4: uuidv4 } = require('uuid')
const Message = require('../models/Message')
const { authenticate, authorize } = require('../middleware/auth')

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
