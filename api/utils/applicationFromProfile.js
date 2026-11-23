// Business fields on an Application are a snapshot of the vendor's CompanyProfile
// (falling back to their user name/email). Centralized here so both the referral
// auto-apply and the "enrich pending applications on profile save" use identical
// mapping. Per-application fields (servicesOffered, personalNote) are NOT included.

function businessFieldsFromProfile(cp, user) {
  cp = cp || {}
  user = user || {}
  return {
    businessName:           cp.businessName          || user.name  || '',
    contactName:            cp.contactName           || user.name  || '',
    contactEmail:           cp.contactEmail          || user.email || '',
    contactPhone:           cp.contactPhone          || '',
    businessAddress:        cp.businessAddress        || '',
    serviceCategory:        cp.serviceCategory        || '',
    yearsInBusiness:        cp.yearsInBusiness        || '',
    businessDescription:    cp.businessDescription    || '',
    licenseInfo:            cp.licenseInfo            || '',
    insuranceProvider:      cp.insuranceProvider      || '',
    insurancePolicyNumber:  cp.insurancePolicyNumber  || '',
    insuranceExpiration:    cp.insuranceExpiration    || '',
    reference1Name:         cp.reference1Name         || '',
    reference1Company:      cp.reference1Company      || '',
    reference1Phone:        cp.reference1Phone        || '',
    backgroundCheckConsent: cp.backgroundCheckConsent || false,
    termsAgreed:            cp.termsAgreed            || false,
  }
}

module.exports = { businessFieldsFromProfile }
