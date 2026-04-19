const mongoose = require('mongoose')

const companyProfileSchema = new mongoose.Schema(
  {
    _id:                   { type: String, required: true }, // userId is the _id
    businessName:          { type: String, default: '' },
    contactName:           { type: String, default: '' },
    contactEmail:          { type: String, default: '' },
    contactPhone:          { type: String, default: '' },
    businessAddress:       { type: String, default: '' },
    serviceCategory:       { type: String, default: '' },
    yearsInBusiness:       { type: String, default: '' },
    businessDescription:   { type: String, default: '' },
    servicesOffered:       { type: String, default: '' },
    licenseInfo:           { type: String, default: '' },
    insuranceProvider:     { type: String, default: '' },
    insurancePolicyNumber: { type: String, default: '' },
    insuranceExpiration:   { type: String, default: '' },
    reference1Name:        { type: String, default: '' },
    reference1Company:     { type: String, default: '' },
    reference1Phone:       { type: String, default: '' },
    reference2Name:        { type: String, default: '' },
    reference2Company:     { type: String, default: '' },
    reference2Phone:       { type: String, default: '' },
    backgroundCheckConsent:{ type: Boolean, default: false },
    termsAgreed:           { type: Boolean, default: false },
    updatedAt:             { type: String, default: () => new Date().toISOString() },
  },
  { _id: false, timestamps: false },
)

companyProfileSchema.set('toJSON', {
  transform(doc, ret) {
    ret.userId = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

module.exports = mongoose.model('CompanyProfile', companyProfileSchema)
