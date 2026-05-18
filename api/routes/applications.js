const router = require('express').Router()
const { v4: uuidv4 } = require('uuid')
const Application = require('../models/Application')
const VendorProfile = require('../models/VendorProfile')
const { authenticate, authorize } = require('../middleware/auth')
const { geocodeAddress } = require('../utils/geocode')

// GET /api/applications?vendorId=&communityId=
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {}
    if (req.query.vendorId)    filter.vendorId    = req.query.vendorId
    if (req.query.communityId) filter.communityId = req.query.communityId

    // Enforce ownership
    if (req.user.role === 'vendor') {
      filter.vendorId = req.user.id
    }
    // community_manager can only see their community's apps
    // (communityId filter is expected to be passed by the frontend)

    const apps = await Application.find(filter).sort({ submittedAt: -1 }).lean()
    res.json(apps.map(toPublic))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/applications/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id).lean()
    if (!app) return res.status(404).json({ error: 'Not found' })
    // Vendors can only read their own
    if (req.user.role === 'vendor' && app.vendorId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    res.json(toPublic(app))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/applications — vendors only
router.post('/', authenticate, authorize('vendor'), async (req, res) => {
  try {
    const id = uuidv4()
    const now = new Date().toISOString()
    const app = await Application.create({
      _id: id,
      vendorId: req.user.id,
      submittedAt: now,
      statusHistory: [{ status: 'pending', timestamp: now, note: 'Application submitted.' }],
      ...req.body,
    })
    res.status(201).json(toPublic(app.toObject()))

    // Fire-and-forget: geocode businessAddress → seed VendorProfile location
    // so the vendor appears on the map without manually setting their location
    if (req.body.businessAddress) {
      try {
        const existing = await VendorProfile.findById(req.user.id).lean()
        const hasLocation = existing?.location?.lat && existing.location.lat !== 0
        if (!hasLocation) {
          const coords = await geocodeAddress(req.body.businessAddress)
          if (coords) {
            await VendorProfile.findByIdAndUpdate(
              req.user.id,
              { _id: req.user.id, location: coords, updatedAt: new Date().toISOString() },
              { upsert: true },
            )
            console.error('[applications] geocoded vendor location:', coords)
          }
        }
      } catch (geoErr) {
        console.error('[applications] geocode error:', geoErr?.message)
      }
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/applications/:id — vendor updates own draft, or admin
router.put('/:id', authenticate, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
    if (!app) return res.status(404).json({ error: 'Not found' })
    const canEdit =
      (req.user.role === 'vendor'  && app.vendorId === req.user.id) ||
      req.user.role === 'admin'
    if (!canEdit) return res.status(403).json({ error: 'Forbidden' })

    Object.assign(app, req.body)
    await app.save()
    res.json(toPublic(app.toObject()))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/applications/:id/notes — manager adds note
router.post('/:id/notes', authenticate, authorize('community_manager', 'admin'), async (req, res) => {
  try {
    const { text } = req.body
    if (!text) return res.status(400).json({ error: 'Note text required' })
    const app = await Application.findById(req.params.id)
    if (!app) return res.status(404).json({ error: 'Not found' })

    app.notes.push({ id: uuidv4(), text, managerId: req.user.id, timestamp: new Date().toISOString() })
    await app.save()
    res.json(toPublic(app.toObject()))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/applications/:id/status — manager changes status
router.post('/:id/status', authenticate, authorize('community_manager', 'admin'), async (req, res) => {
  try {
    const { status, note } = req.body
    if (!status) return res.status(400).json({ error: 'status required' })
    const app = await Application.findById(req.params.id)
    if (!app) return res.status(404).json({ error: 'Not found' })

    app.status = status
    app.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      managerId: req.user.id,
      note: note || `Status changed to ${status}.`,
    })
    await app.save()
    res.json(toPublic(app.toObject()))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/applications/:id/revoke — vendor revokes own
router.post('/:id/revoke', authenticate, authorize('vendor'), async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
    if (!app) return res.status(404).json({ error: 'Not found' })
    if (app.vendorId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

    app.status = 'revoked'
    app.statusHistory.push({
      status: 'revoked',
      timestamp: new Date().toISOString(),
      note: 'Application revoked by vendor.',
    })
    await app.save()
    res.json(toPublic(app.toObject()))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

function toPublic(a) {
  const obj = { ...a, id: a._id }
  delete obj._id
  delete obj.__v
  return obj
}

module.exports = router
