const router = require('express').Router()
const VendorProfile = require('../models/VendorProfile')
const User = require('../models/User')
const CompanyProfile = require('../models/CompanyProfile')
const { authenticate, authorize } = require('../middleware/auth')

// GET /api/vendor-profiles — all profiles with location, joined with user name/email + logoUrl
// Used by the Vendor Map for community managers
router.get('/', authenticate, authorize('community_manager', 'admin'), async (req, res) => {
  try {
    const profiles = await VendorProfile.find({
      'location.lat': { $ne: 0 },
      'location.lng': { $ne: 0 },
    }).lean()

    const ids = profiles.map((p) => p._id)
    const [users, companyProfiles] = await Promise.all([
      User.find({ role: 'vendor', _id: { $in: ids } }).lean(),
      CompanyProfile.find({ _id: { $in: ids } }).lean(),
    ])
    const userMap    = Object.fromEntries(users.map((u) => [u._id, u]))
    const companyMap = Object.fromEntries(companyProfiles.map((c) => [c._id, c]))

    const result = profiles
      .map((p) => {
        const u = userMap[p._id]
        if (!u) return null
        const cp = companyMap[p._id]
        return {
          userId:            p._id,
          name:              u.name,
          email:             u.email,
          location:          p.location,
          locations:         p.locations || [],
          serviceRadiusMiles: p.serviceRadiusMiles,
          logoUrl:           cp?.logoUrl || '',
          businessName:      cp?.businessName || '',
          serviceCategory:   cp?.serviceCategory || '',
        }
      })
      .filter(Boolean)

    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/vendor-profiles/:userId
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const profile = await VendorProfile.findById(req.params.userId).lean()
    if (!profile) return res.json(null)
    res.json(toPublic(profile))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/vendor-profiles/:userId — upsert
router.put('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params
    // Vendors can only update their own profile
    if (req.user.role === 'vendor' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    const update = { ...req.body, _id: userId, updatedAt: new Date().toISOString() }
    // Keep the legacy primary fields in sync with locations[0] so older readers
    // (map filter, distance math) keep working.
    if (Array.isArray(update.locations) && update.locations.length) {
      const primary = update.locations[0]
      update.location = { lat: primary.lat, lng: primary.lng }
      update.serviceRadiusMiles = primary.serviceRadiusMiles
    }
    const profile = await VendorProfile.findByIdAndUpdate(
      userId,
      update,
      { upsert: true, new: true },
    ).lean()
    res.json(toPublic(profile))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

function toPublic(p) {
  const obj = { ...p, userId: p._id }
  delete obj._id
  delete obj.__v
  return obj
}

module.exports = router
