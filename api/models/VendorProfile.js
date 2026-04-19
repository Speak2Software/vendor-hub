const mongoose = require('mongoose')

const locationSchema = new mongoose.Schema(
  { lat: { type: Number, default: 0 }, lng: { type: Number, default: 0 } },
  { _id: false },
)

const vendorProfileSchema = new mongoose.Schema(
  {
    _id:                { type: String, required: true }, // userId is the _id
    location:           { type: locationSchema, default: () => ({ lat: 0, lng: 0 }) },
    serviceRadiusMiles: { type: Number, default: 25 },
    updatedAt:          { type: String, default: () => new Date().toISOString() },
  },
  { _id: false, timestamps: false },
)

vendorProfileSchema.set('toJSON', {
  transform(doc, ret) {
    ret.userId = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

module.exports = mongoose.model('VendorProfile', vendorProfileSchema)
