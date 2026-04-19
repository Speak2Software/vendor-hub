const router = require('express').Router()
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const User = require('../models/User')

function signToken(user) {
  return jwt.sign(
    { id: user._id || user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  )
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await user.comparePassword(password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = signToken(user)
    res.json({ token, user: user.toJSON() })
  } catch (err) {
    console.error('login error', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'vendor' } = req.body
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, and password are required' })

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return res.status(409).json({ error: 'Email already in use' })

    const user = await User.create({ _id: uuidv4(), name, email, password, role })
    const token = signToken(user)
    res.status(201).json({ token, user: user.toJSON() })
  } catch (err) {
    console.error('register error', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
