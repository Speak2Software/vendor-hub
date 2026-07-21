const mongoose = require('mongoose')

const locationSchema = new mongoose.Schema(
  { lat: { type: Number, default: 0 }, lng: { type: Number, default: 0 } },
  { _id: false },
)

// A vendor can serve from multiple business locations, each with its own
// service radius. `location` + `serviceRadiusMiles` below mirror locations[0]
// for backward compatibility with older readers.
const serviceLocationSchema = new mongoose.Schema(
  {
    id:                 { type: String, required: true },
    label:              { type: String, default: 'Location' },
    lat:                { type: Number, default: 0 },
    lng:                { type: Number, default: 0 },
    serviceRadiusMiles: { type: Number, default: 25 },
  },
  { _id: false },
)

const vendorProfileSchema = new mongoose.Schema(
  {
    _id:                { type: String, required: true }, // userId is the _id
    locations:          { type: [serviceLocationSchema], default: [] },
    // Legacy mirror of the primary location (locations[0]) — kept in sync on save.
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
