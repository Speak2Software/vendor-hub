const router = require('express').Router()
const { v4: uuidv4 } = require('uuid')
const User = require('../models/User')
const { authenticate, authorize } = require('../middleware/auth')

// GET /api/users/me — restore session from token
router.get('/me', authenticate, (req, res) => {
  res.json(req.user)
})

// POST /api/users — admin creates any user type (manager, vendor, etc.)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role = 'vendor', communityId = '' } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' })
    }
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return res.status(409).json({ error: 'Email already in use' })
    const user = await User.create({ _id: uuidv4(), name, email, password, role, communityId })
    res.status(201).json(user.toJSON())
  } catch (err) {
    console.error('create user error', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/users — admin only
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().lean()
    res.json(users.map((u) => ({ ...u, id: u._id, password: undefined })))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/users/:id — update own record (or admin updating any)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    const { password, role, ...safe } = req.body // never allow direct role escalation
    const user = await User.findByIdAndUpdate(id, safe, { new: true })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user.toJSON())
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
