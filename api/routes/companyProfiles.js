const router = require('express').Router()
const CompanyProfile = require('../models/CompanyProfile')
const Application = require('../models/Application')
const User = require('../models/User')
const { authenticate } = require('../middleware/auth')
const { businessFieldsFromProfile } = require('../utils/applicationFromProfile')

// GET /api/company-profiles/:userId
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const profile = await CompanyProfile.findById(req.params.userId).lean()
    if (!profile) return res.json(null)
    res.json(toPublic(profile))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/company-profiles/:userId — upsert
router.put('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params
    if (req.user.role === 'vendor' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    const profile = await CompanyProfile.findByIdAndUpdate(
      userId,
      { ...req.body, _id: userId, updatedAt: new Date().toISOString() },
      { upsert: true, new: true },
    ).lean()
    res.json(toPublic(profile))

    // Keep still-pending applications in sync with the profile. This fills in
    // thin applications auto-created via a community QR code once the vendor
    // completes their profile. (Fire-and-forget; never blocks the response.)
    try {
      const pending = await Application.find({ vendorId: userId, status: 'pending' })
      if (pending.length) {
        const user = await User.findById(userId).lean()
        const fields = businessFieldsFromProfile(profile, user)
        for (const app of pending) {
          Object.assign(app, fields)
          // Only seed servicesOffered when the vendor hasn't written their own.
          if (!app.servicesOffered && profile.servicesOffered) app.servicesOffered = profile.servicesOffered
          await app.save()
        }
      }
    } catch (syncErr) {
      console.error('[companyProfiles] pending-app sync error:', syncErr?.message)
    }
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
