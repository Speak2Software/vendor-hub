const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')

const messageSchema = new mongoose.Schema(
  {
    _id:         { type: String, default: uuidv4 },
    vendorId:    { type: String, required: true },
    communityIds:{ type: [String], default: [] },
    type:        { type: String, default: 'flyer' }, // 'flyer' | 'general'
    flyerData:   { type: mongoose.Schema.Types.Mixed, default: null },
    sentAt:      { type: String, default: () => new Date().toISOString() },
  },
  { _id: false, timestamps: false },
)

messageSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

module.exports = mongoose.model('Message', messageSchema)
