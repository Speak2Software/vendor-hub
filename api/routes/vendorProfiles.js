const router = require('express').Router()
const VendorProfile = require('../models/VendorProfile')
const User = require('../models/User')
const CompanyProfile = require('../models/CompanyProfile')
const { authenticate, authorize } = require('../middleware/auth')

// GET /api/vendor-profiles — every vendor, joined with their location + company info.
// Drives both the Vendor Map (which ignores vendors with no location) and the
// Find Vendors directory (which lists them all, searchable).
router.get('/', authenticate, authorize('community_manager', 'admin'), async (req, res) => {
  try {
    // Driven off vendor Users so vendors who never set a location are still findable.
    const users = await User.find({ role: 'vendor' }).lean()
    const ids   = users.map((u) => u._id)

    const [profiles, companyProfiles] = await Promise.all([
      VendorProfile.find({ _id: { $in: ids } }).lean(),
      CompanyProfile.find({ _id: { $in: ids } }).lean(),
    ])
    const profileMap = Object.fromEntries(profiles.map((p) => [p._id, p]))
    const companyMap = Object.fromEntries(companyProfiles.map((c) => [c._id, c]))

    const result = users.map((u) => {
      const p  = profileMap[u._id]
      const cp = companyMap[u._id]
      return {
        userId:             u._id,
        name:               u.name,
        email:              u.email,
        location:           p?.location || null,
        locations:          p?.locations || [],
        serviceRadiusMiles: p?.serviceRadiusMiles ?? null,
        logoUrl:            cp?.logoUrl || '',
        businessName:       cp?.businessName || '',
        serviceCategory:    cp?.serviceCategory || '',
        // Extra fields the directory searches over
        servicesOffered:     cp?.servicesOffered || '',
        businessDescription: cp?.businessDescription || '',
        yearsInBusiness:     cp?.yearsInBusiness || '',
        contactPhone:        cp?.contactPhone || '',
        contactEmail:        cp?.contactEmail || '',
      }
    })

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
