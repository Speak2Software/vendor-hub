const router = require('express').Router()
const User = require('../models/User')
const CompanyProfile = require('../models/CompanyProfile')
const Community = require('../models/Community')
const { authenticate, authorize } = require('../middleware/auth')
const { sendVendorInvite } = require('../utils/mailer')

// POST /api/vendor-invites — a community manager invites a vendor by email.
// The recipient is resolved server-side from vendorId (never trusted from the
// client); the manager supplies only the subject and the flyer HTML body.
router.post('/', authenticate, authorize('community_manager'), async (req, res) => {
  try {
    const { vendorId, subject, html } = req.body
    if (!vendorId || !subject?.trim() || !html?.trim()) {
      return res.status(400).json({ error: 'vendorId, subject and html are required' })
    }

    const [vendor, cp, community] = await Promise.all([
      User.findById(vendorId).lean(),
      CompanyProfile.findById(vendorId).lean(),
      req.user.communityId ? Community.findById(req.user.communityId).lean() : null,
    ])

    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ error: 'Vendor not found' })
    }
    const toEmail = cp?.contactEmail || vendor.email
    if (!toEmail) {
      return res.status(422).json({ error: 'This vendor has no email on file.' })
    }

    const replyTo = community?.contactEmail || undefined
    const result = await sendVendorInvite({
      toEmail,
      subject: subject.trim(),
      html,
      replyTo,
    })

    if (!result?.ok) {
      return res.status(502).json({ error: result?.reason || 'Email could not be sent.' })
    }
    res.json({ ok: true, sentTo: toEmail })
  } catch (err) {
    console.error('[vendorInvites]', err?.message)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
