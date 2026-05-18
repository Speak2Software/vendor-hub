/**
 * VendorHub API
 * - Local dev: `node index.js` (port 4000)
 * - Lambda:    exported as `handler` via serverless-http
 */

// Load .env in local dev only — Lambda uses actual env vars
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config() } catch { /* dotenv is a devDependency */ }
}

const express     = require('express')
const cors        = require('cors')
const connectDB   = require('./db')

const authRoutes            = require('./routes/auth')
const userRoutes            = require('./routes/users')
const communityRoutes       = require('./routes/communities')
const applicationRoutes     = require('./routes/applications')
const vendorProfileRoutes   = require('./routes/vendorProfiles')
const companyProfileRoutes  = require('./routes/companyProfiles')
const reviewRoutes          = require('./routes/reviews')
const messageRoutes         = require('./routes/messages')
const directMessageRoutes   = require('./routes/directMessages')
const broadcastRoutes       = require('./routes/broadcasts')

const app = express()

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}))
app.use(express.json())

// ── Connect DB before every request (cached after first call) ──────────────────
app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (err) {
    console.error('DB connection failed', err)
    res.status(503).json({ error: 'Database unavailable' })
  }
})

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',             authRoutes)
app.use('/api/users',            userRoutes)
app.use('/api/communities',      communityRoutes)
app.use('/api/applications',     applicationRoutes)
app.use('/api/vendor-profiles',  vendorProfileRoutes)
app.use('/api/company-profiles', companyProfileRoutes)
app.use('/api/reviews',          reviewRoutes)
app.use('/api/messages',         messageRoutes)
app.use('/api/direct-messages',  directMessageRoutes)
app.use('/api/broadcasts',       broadcastRoutes)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true }))

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Not found' }))

// ── Local dev server ──────────────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 4000
  app.listen(PORT, () => console.log(`VendorHub API listening on http://localhost:${PORT}`))
}

// ── Lambda handler ─────────────────────────────────────────────────────────────
const serverless = require('serverless-http')
module.exports.handler = serverless(app)
