const mongoose = require('mongoose')

// Singleton documents of editable marketing copy, keyed by a stable string id
// (e.g. 'signup'). Structure is intentionally freeform (Mixed) so the admin
// Content editor and the public page can evolve fields without a migration.
const siteContentSchema = new mongoose.Schema(
  {
    _id:     { type: String, required: true },
    header:  { type: mongoose.Schema.Types.Mixed, default: {} },
    left:    { type: mongoose.Schema.Types.Mixed, default: {} },
    form:    { type: mongoose.Schema.Types.Mixed, default: {} },
    trust:   { type: mongoose.Schema.Types.Mixed, default: {} },
    cta:     { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false, minimize: false },
)

siteContentSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

module.exports = mongoose.model('SiteContent', siteContentSchema)
