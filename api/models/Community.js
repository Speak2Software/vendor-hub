const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')

const locationSchema = new mongoose.Schema(
  { lat: Number, lng: Number },
  { _id: false },
)

const communitySchema = new mongoose.Schema(
  {
    _id:          { type: String, default: uuidv4 },
    name:         { type: String, required: true, trim: true },
    address:      { type: String, default: '' },
    description:  { type: String, default: '' },
    careLevels:   { type: [String], default: [] },
    size:         { type: String, default: '' },
    logoUrl:      { type: String, default: '' },
    location:     { type: locationSchema, default: () => ({ lat: 0, lng: 0 }) },
    managerId:    { type: String, default: '' },
    // Contact fields — show* flags control vendor visibility
    contactUrl:   { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    showUrl:      { type: Boolean, default: false },
    showEmail:    { type: Boolean, default: false },
    showPhone:    { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    _id: false,
  },
)

communitySchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

module.exports = mongoose.model('Community', communitySchema)
