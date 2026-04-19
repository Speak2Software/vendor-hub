const router = require('express').Router()
const { v4: uuidv4 } = require('uuid')
const Community = require('../models/Community')
const { authenticate, authorize } = require('../middleware/auth')

// GET /api/communities
router.get('/', authenticate, async (req, res) => {
  try {
    const communities = await Community.find().lean()
    res.json(communities.map(toPublic))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/communities/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const c = await Community.findById(req.params.id).lean()
    if (!c) return res.status(404).json({ error: 'Community not found' })
    res.json(toPublic(c))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/communities — admin only
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const community = await Community.create({ _id: uuidv4(), ...req.body })
    res.status(201).json(toPublic(community.toObject()))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/communities/:id — admin or the community's manager
router.put('/:id', authenticate, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
    if (!community) return res.status(404).json({ error: 'Community not found' })

    const isMgr = req.user.role === 'community_manager' && community.managerId === req.user.id
    const isAdmin = req.user.role === 'admin'
    if (!isMgr && !isAdmin) return res.status(403).json({ error: 'Forbidden' })

    Object.assign(community, req.body)
    await community.save()
    res.json(toPublic(community.toObject()))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/communities/:id — admin only
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await Community.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

function toPublic(c) {
  const obj = { ...c, id: c._id }
  delete obj._id
  delete obj.__v
  return obj
}

module.exports = router
