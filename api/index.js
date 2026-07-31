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
const siteContentRoutes     = require('./routes/siteContent')

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
app.use('/api/site-content',     siteContentRoutes)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true }))

// ── Geocode existing data (run once to seed lat/lng for existing records) ─────
app.post('/api/admin/geocode-existing', async (req, res) => {
  try {
    await connectDB()
    const { geocodeAddress } = require('./utils/geocode')
    const Community    = require('./models/Community')
    const Application  = require('./models/Application')
    const VendorProfile = require('./models/VendorProfile')

    const results = { communities: 0, vendors: 0, errors: [] }

    // 1. Communities with address but no/zero location
    const communities = await Community.find({
      address: { $exists: true, $ne: '' },
      $or: [{ 'location.lat': 0 }, { 'location.lat': { $exists: false } }],
    }).lean()

    for (const c of communities) {
      const coords = await geocodeAddress(c.address)
      if (coords) {
        await Community.findByIdAndUpdate(c._id, { location: coords })
        results.communities++
        console.error('[geocode-existing] community:', c.address, '->', coords)
      } else {
        results.errors.push(`Community not found: ${c.address}`)
      }
      await new Promise((r) => setTimeout(r, 1100)) // Nominatim rate limit
    }

    // 2. Vendors whose VendorProfile has no location — use their latest application's businessAddress
    const apps = await Application.find({ businessAddress: { $exists: true, $ne: '' } })
      .sort({ submittedAt: -1 }).lean()

    const seenVendors = new Set()
    for (const app of apps) {
      if (seenVendors.has(app.vendorId)) continue
      seenVendors.add(app.vendorId)

      const profile = await VendorProfile.findById(app.vendorId).lean()
      if (profile?.location?.lat && profile.location.lat !== 0) continue

      const coords = await geocodeAddress(app.businessAddress)
      if (coords) {
        await VendorProfile.findByIdAndUpdate(
          app.vendorId,
          { _id: app.vendorId, location: coords, updatedAt: new Date().toISOString() },
          { upsert: true },
        )
        results.vendors++
        console.error('[geocode-existing] vendor:', app.businessAddress, '->', coords)
      } else {
        results.errors.push(`Vendor not found: ${app.businessAddress}`)
      }
      await new Promise((r) => setTimeout(r, 1100))
    }

    res.json({ ok: true, ...results })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Mail test (remove after confirming email works) ───────────────────────────
app.get('/api/mail-test', async (req, res) => {
  const { to } = req.query
  if (!to) return res.status(400).json({ error: 'Pass ?to=youremail@example.com' })
  try {
    const { Resend } = require('resend')
    const r = new Resend(process.env.RESEND_API_KEY)
    const FROM = process.env.MAIL_FROM || 'Vendor Hub <noreply@speak2vendors.com>'
    if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY not set' })
    const result = await r.emails.send({
      from:    FROM,
      to,
      subject: 'Vendor Hub mail test',
      html:    '<p>If you see this, Resend is working! 🎉</p>',
    })
    res.json({ ok: true, result })
  } catch (err) {
    res.status(500).json({ error: err.message, detail: err?.response?.data })
  }
})

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
