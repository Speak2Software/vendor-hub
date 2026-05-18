const mongoose = require('mongoose')

const DirectMessageSchema = new mongoose.Schema({
  _id:         { type: String, required: true },
  vendorId:    { type: String, required: true, index: true },
  communityId: { type: String, required: true, index: true },
  senderId:    { type: String, required: true },
  senderRole:  { type: String, enum: ['vendor', 'community_manager'], required: true },
  body:        { type: String, required: true },
  sentAt:      { type: String, default: () => new Date().toISOString() },
  readAt:      { type: String, default: null },
}, { _id: false })

DirectMessageSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

module.exports = mongoose.model('DirectMessage', DirectMessageSchema)
