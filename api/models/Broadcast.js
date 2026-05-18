const mongoose = require('mongoose')

const BroadcastSchema = new mongoose.Schema({
  _id:         { type: String, required: true },
  communityId: { type: String, required: true, index: true },
  vendorIds:   { type: [String], default: [] }, // empty = all vendors with applications
  subject:     { type: String, default: '' },
  body:        { type: String, required: true },
  sentAt:      { type: String, default: () => new Date().toISOString() },
}, { _id: false })

BroadcastSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

module.exports = mongoose.model('Broadcast', BroadcastSchema)
