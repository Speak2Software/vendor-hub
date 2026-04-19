const router = require('express').Router()
const { v4: uuidv4 } = require('uuid')
const Review = require('../models/Review')
const { authenticate, authorize } = require('../middleware/auth')

// GET /api/reviews?appId=&communityId=
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {}
    if (req.query.appId)       filter.appId       = req.query.appId
    if (req.query.communityId) filter.communityId = req.query.communityId
    if (req.query.vendorId)    filter.vendorId    = req.query.vendorId
    const reviews = await Review.find(filter).lean()
    res.json(reviews.map(toPublic))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/reviews/:appId — upsert (manager creates or updates a review)
router.put('/:appId', authenticate, authorize('community_manager', 'admin'), async (req, res) => {
  try {
    const { appId } = req.params
    const { vendorId, communityId, rating, review } = req.body
    const now = new Date().toISOString()

    const existing = await Review.findOne({ appId })
    if (existing) {
      existing.rating    = rating
      existing.review    = review
      existing.managerId = req.user.id
      existing.updatedAt = now
      await existing.save()
      return res.json(toPublic(existing.toObject()))
    }

    const created = await Review.create({
      _id: uuidv4(), appId, vendorId, communityId,
      managerId: req.user.id, rating, review,
    })
    res.status(201).json(toPublic(created.toObject()))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

function toPublic(r) {
  const obj = { ...r, id: r._id }
  delete obj._id
  delete obj.__v
  return obj
}

module.exports = router
