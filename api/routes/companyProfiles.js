const router = require('express').Router()
const { v4: uuidv4 } = require('uuid')
const CompanyProfile = require('../models/CompanyProfile')
const Application = require('../models/Application')
const User = require('../models/User')
const VendorProfile = require('../models/VendorProfile')
const { authenticate } = require('../middleware/auth')
const { businessFieldsFromProfile } = require('../utils/applicationFromProfile')
const { geocodeAddress } = require('../utils/geocode')

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
    // Capture the previous business address so we can tell if it changed.
    const prev = await CompanyProfile.findById(userId).lean()
    const profile = await CompanyProfile.findByIdAndUpdate(
      userId,
      { ...req.body, _id: userId, updatedAt: new Date().toISOString() },
      { upsert: true, new: true },
    ).lean()
    res.json(toPublic(profile))

    // Keep the vendor's map location in sync with their business address: when
    // the address changes, re-geocode it and move their primary map pin so the
    // Vendor Map and "Communities near you" reflect the new address.
    // (Fire-and-forget; a failed geocode simply leaves the existing pin.)
    try {
      const newAddr = (req.body.businessAddress || '').trim()
      const oldAddr = (prev?.businessAddress || '').trim()
      if (newAddr && newAddr !== oldAddr) {
        const coords = await geocodeAddress(newAddr)
        if (coords) {
          const vp = await VendorProfile.findById(userId)
          if (vp) {
            const locs = (vp.locations || []).map((l) => (l.toObject ? l.toObject() : l))
            if (locs.length) locs[0] = { ...locs[0], lat: coords.lat, lng: coords.lng }
            else locs.push({ id: uuidv4(), label: 'Main location', lat: coords.lat, lng: coords.lng, serviceRadiusMiles: vp.serviceRadiusMiles || 25 })
            vp.locations = locs
            vp.location = coords
            vp.updatedAt = new Date().toISOString()
            await vp.save()
          } else {
            await VendorProfile.create({
              _id: userId,
              locations: [{ id: uuidv4(), label: 'Main location', lat: coords.lat, lng: coords.lng, serviceRadiusMiles: 25 }],
              location: coords,
              serviceRadiusMiles: 25,
              updatedAt: new Date().toISOString(),
            })
          }
          console.error('[companyProfiles] re-pinned vendor location from address:', newAddr, coords)
        }
      }
    } catch (geoErr) {
      console.error('[companyProfiles] address-geocode sync error:', geoErr?.message)
    }

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
