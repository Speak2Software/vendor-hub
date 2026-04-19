const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')

const noteSchema = new mongoose.Schema(
  {
    id:        { type: String, default: uuidv4 },
    text:      String,
    managerId: String,
    timestamp: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false },
)

const historySchema = new mongoose.Schema(
  {
    status:    String,
    timestamp: String,
    managerId: { type: String, default: '' },
    note:      { type: String, default: '' },
  },
  { _id: false },
)

const applicationSchema = new mongoose.Schema(
  {
    _id:                   { type: String, default: uuidv4 },
    vendorId:              { type: String, required: true },
    communityId:           { type: String, required: true },
    status:                { type: String, enum: ['pending','approved','denied','revoked'], default: 'pending' },
    submittedAt:           { type: String, default: () => new Date().toISOString() },

    // Business info
    businessName:          { type: String, default: '' },
    contactName:           { type: String, default: '' },
    contactEmail:          { type: String, default: '' },
    contactPhone:          { type: String, default: '' },
    businessAddress:       { type: String, default: '' },
    serviceCategory:       { type: String, default: '' },
    yearsInBusiness:       { type: String, default: '' },
    businessDescription:   { type: String, default: '' },
    servicesOffered:       { type: String, default: '' },

    // Compliance
    licenseInfo:           { type: String, default: '' },
    insuranceProvider:     { type: String, default: '' },
    insurancePolicyNumber: { type: String, default: '' },
    insuranceExpiration:   { type: String, default: '' },
    backgroundCheckConsent:{ type: Boolean, default: false },
    termsAgreed:           { type: Boolean, default: false },

    // References
    reference1Name:        { type: String, default: '' },
    reference1Company:     { type: String, default: '' },
    reference1Phone:       { type: String, default: '' },
    reference2Name:        { type: String, default: '' },
    reference2Company:     { type: String, default: '' },
    reference2Phone:       { type: String, default: '' },

    notes:         { type: [noteSchema],   default: [] },
    statusHistory: { type: [historySchema], default: [] },
  },
  {
    timestamps: false,
    _id: false,
  },
)

applicationSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

module.exports = mongoose.model('Application', applicationSchema)
