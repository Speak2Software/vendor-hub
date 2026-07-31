const router = require('express').Router()
const SiteContent = require('../models/SiteContent')
const { authenticate, authorize } = require('../middleware/auth')

// GET /api/site-content/:key — PUBLIC (the signup page renders this to logged-out
// visitors). Returns the stored doc or null; the frontend fills gaps with defaults.
router.get('/:key', async (req, res) => {
  try {
    const doc = await SiteContent.findById(req.params.key).lean()
    res.json(doc ? toPublic(doc) : null)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/site-content/:key — admin only. Upserts the full content doc.
router.put('/:key', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { key } = req.params
    const doc = await SiteContent.findByIdAndUpdate(
      key,
      {
        _id: key,
        header: req.body.header || {},
        left: req.body.left || {},
        form: req.body.form || {},
        trust: req.body.trust || {},
        cta: req.body.cta || {},
        updatedAt: new Date().toISOString(),
      },
      { upsert: true, new: true },
    ).lean()
    res.json(toPublic(doc))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

function toPublic(d) {
  const obj = { ...d, id: d._id }
  delete obj._id
  delete obj.__v
  return obj
}

module.exports = router
