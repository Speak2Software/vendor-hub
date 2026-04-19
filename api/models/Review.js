const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')

const reviewSchema = new mongoose.Schema(
  {
    _id:         { type: String, default: uuidv4 },
    appId:       { type: String, required: true, unique: true }, // one review per application
    vendorId:    { type: String, required: true },
    communityId: { type: String, required: true },
    managerId:   { type: String, default: '' },
    rating:      { type: Number, min: 1, max: 5 },
    review:      { type: String, default: '' },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    _id: false,
  },
)

reviewSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

module.exports = mongoose.model('Review', reviewSchema)
