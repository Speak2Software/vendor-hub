import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCompanyProfile, saveCompanyProfile, getApplicationsForVendor } from '../../utils/storage'

// ── Constants ─────────────────────────────────────────────────────────────────

const SERVICE_CATEGORIES = [
  'Medical / Healthcare', 'Transportation', 'Food & Nutrition Services',
  'Housekeeping & Laundry', 'Maintenance & Facilities', 'Personal Care & Grooming',
  'Physical / Occupational Therapy', 'Mental Health & Counseling',
  'Entertainment & Activities', 'Technology & Telehealth', 'Financial Services',
  'Legal Services', 'Insurance', 'Staffing & Workforce', 'Pharmacy & Medical Supplies', 'Other',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPhone(val) {
  const d = val.replace(/\D/g, '').slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

const EMPTY = {
  businessName: '', contactName: '', contactEmail: '', contactPhone: '',
  businessAddress: '', serviceCategory: '', yearsInBusiness: '',
  businessDescription: '',
  licenseInfo: '', insuranceProvider: '', insurancePolicyNumber: '', insuranceExpiration: '',
  reference1Name: '', reference1Company: '', reference1Phone: '',
  backgroundCheckConsent: false, termsAgreed: false,
}

const REQUIRED_FIELDS = [
  'businessName', 'contactName', 'contactEmail', 'contactPhone',
  'businessAddress', 'serviceCategory', 'yearsInBusiness', 'businessDescription',
  'backgroundCheckConsent', 'termsAgreed',
]

function computeCompleteness(form) {
  const filled = REQUIRED_FIELDS.filter((f) => {
    const v = form[f]
    return typeof v === 'boolean' ? v : Boolean(v?.trim?.())
  })
  return Math.round((filled.length / REQUIRED_FIELDS.length) * 100)
}

// ── Sub-components ────────────────────────────────────────────────────────────

const inp = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-300'

function SectionCard({ icon, title, subtitle, accent = 'from-blue-600 to-teal-600', children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`bg-gradient-to-r ${accent} px-5 py-4 flex items-center gap-3`}>
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-white font-bold text-sm">{title}</p>
          {subtitle && <p className="text-white/70 text-xs mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CompanyProfile() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]   = useState(EMPTY)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    async function load() {
      const existing = await getCompanyProfile(user.id)
      if (existing) {
        setForm({ ...EMPTY, ...existing })
      } else {
        // Pre-fill from most recent application if no profile yet
        const apps = await getApplicationsForVendor(user.id)
        const app = apps.find((a) => a.businessName)
        if (app) {
          setForm({
            ...EMPTY,
            businessName:        app.businessName        || '',
            contactName:         app.contactName         || user.name || '',
            contactEmail:        app.contactEmail        || user.email || '',
            contactPhone:        app.contactPhone        || '',
            businessAddress:     app.businessAddress     || '',
            serviceCategory:     app.serviceCategory     || '',
            yearsInBusiness:     app.yearsInBusiness     || '',
            businessDescription: app.businessDescription || '',
            licenseInfo:         app.licenseInfo         || '',
            insuranceProvider:   app.insuranceProvider   || '',
            insurancePolicyNumber: app.insurancePolicyNumber || '',
            insuranceExpiration: app.insuranceExpiration || '',
            reference1Name:      app.reference1Name      || '',
            reference1Company:   app.reference1Company   || '',
            reference1Phone:     app.reference1Phone     || '',
            backgroundCheckConsent: app.backgroundCheckConsent || false,
            termsAgreed:         app.termsAgreed         || false,
          })
        } else {
          setForm((f) => ({ ...f, contactName: user.name || '', contactEmail: user.email || '' }))
        }
      }
    }
    load()
  }, [user.id])

  function upd(field) {
    return (e) => {
      const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [field]: val }))
      if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n })
    }
  }

  function validate() {
    const errs = {}
    if (!form.businessName?.trim())      errs.businessName      = 'Required'
    if (!form.contactName?.trim())       errs.contactName       = 'Required'
    if (!form.contactEmail?.trim())      errs.contactEmail      = 'Required'
    if (!form.contactPhone?.trim())      errs.contactPhone      = 'Required'
    if (!form.businessAddress?.trim())   errs.businessAddress   = 'Required'
    if (!form.serviceCategory)           errs.serviceCategory   = 'Required'
    if (!form.yearsInBusiness?.trim())   errs.yearsInBusiness   = 'Required'
    if (!form.businessDescription?.trim()) errs.businessDescription = 'Required'
    if (!form.backgroundCheckConsent)    errs.backgroundCheckConsent = 'Required'
    if (!form.termsAgreed)               errs.termsAgreed       = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate()) {
      document.querySelector('[data-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    await saveCompanyProfile({ ...form, userId: user.id })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const pct = computeCompleteness(form)
  const isComplete = pct === 100

  const errBorder = (f) => errors[f] ? 'border-red-300 ring-1 ring-red-300' : ''

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/vendor')}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900">Company Profile</h1>
              <p className="text-xs text-gray-400 mt-0.5">Saved once — reused across all applications</p>
            </div>
          </div>

          {/* Completeness pill */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`text-xs font-bold ${isComplete ? 'text-emerald-600' : 'text-blue-600'}`}>{pct}%</span>
            </div>
            <button
              onClick={handleSave}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700'
              }`}
            >
              {saved ? '✓ Saved!' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Mobile completeness bar */}
        <div className="sm:hidden px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${isComplete ? 'text-emerald-600' : 'text-blue-600'}`}>{pct}% complete</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Intro banner */}
        {!isComplete && (
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl px-5 py-4 text-white">
            <p className="font-bold text-sm">📋 Complete your profile once — apply in seconds</p>
            <p className="text-blue-100 text-xs mt-1 leading-relaxed">
              This information is submitted with every application. You'll never need to re-enter it. Required fields are marked with *.
            </p>
          </div>
        )}
        {isComplete && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm text-emerald-800">Profile complete!</p>
              <p className="text-xs text-emerald-600 mt-0.5">New applications only need a community selection and your custom pitch.</p>
            </div>
          </div>
        )}

        {/* ── 1. Business Information ──────────────────────────────────────── */}
        <SectionCard icon="🏢" title="Business Information" subtitle="Your company contact details">
          <div className="grid grid-cols-1 gap-4">
            <Field label="Business Name" required>
              <input
                type="text"
                value={form.businessName}
                onChange={upd('businessName')}
                placeholder="Acme Senior Services LLC"
                className={`${inp} ${errBorder('businessName')}`}
                data-error={errors.businessName || undefined}
              />
              {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Primary Contact Name" required>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={upd('contactName')}
                  placeholder="Jane Smith"
                  className={`${inp} ${errBorder('contactName')}`}
                />
                {errors.contactName && <p className="text-xs text-red-500 mt-1">{errors.contactName}</p>}
              </Field>
              <Field label="Contact Phone" required>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => setForm((f) => ({ ...f, contactPhone: formatPhone(e.target.value) }))}
                  placeholder="(555) 000-0000"
                  className={`${inp} ${errBorder('contactPhone')}`}
                />
                {errors.contactPhone && <p className="text-xs text-red-500 mt-1">{errors.contactPhone}</p>}
              </Field>
            </div>

            <Field label="Contact Email" required>
              <input
                type="email"
                value={form.contactEmail}
                onChange={upd('contactEmail')}
                placeholder="jane@acme.com"
                className={`${inp} ${errBorder('contactEmail')}`}
              />
              {errors.contactEmail && <p className="text-xs text-red-500 mt-1">{errors.contactEmail}</p>}
            </Field>

            <Field label="Business Address" required>
              <input
                type="text"
                value={form.businessAddress}
                onChange={upd('businessAddress')}
                placeholder="123 Main St, City, State ZIP"
                className={`${inp} ${errBorder('businessAddress')}`}
              />
              {errors.businessAddress && <p className="text-xs text-red-500 mt-1">{errors.businessAddress}</p>}
            </Field>
          </div>
        </SectionCard>

        {/* ── 2. Services ──────────────────────────────────────────────────── */}
        <SectionCard icon="⚙️" title="Services" subtitle="What you offer senior living communities" accent="from-teal-600 to-emerald-600">
          <Field label="Service Category" required>
            <select
              value={form.serviceCategory}
              onChange={upd('serviceCategory')}
              className={`${inp} ${errBorder('serviceCategory')}`}
            >
              <option value="">Select a category…</option>
              {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.serviceCategory && <p className="text-xs text-red-500 mt-1">{errors.serviceCategory}</p>}
          </Field>

          <Field label="Years in Business" required>
            <input
              type="number"
              min="0"
              max="100"
              value={form.yearsInBusiness}
              onChange={upd('yearsInBusiness')}
              placeholder="e.g. 5"
              className={`${inp} ${errBorder('yearsInBusiness')}`}
            />
            {errors.yearsInBusiness && <p className="text-xs text-red-500 mt-1">{errors.yearsInBusiness}</p>}
          </Field>

          <Field label="Company Description" required hint="Overview of your company, mission, and what sets you apart.">
            <textarea
              rows={4}
              value={form.businessDescription}
              onChange={upd('businessDescription')}
              placeholder="We are a family-owned company specializing in…"
              className={`${inp} resize-none ${errBorder('businessDescription')}`}
            />
            {errors.businessDescription && <p className="text-xs text-red-500 mt-1">{errors.businessDescription}</p>}
          </Field>
        </SectionCard>

        {/* ── 3. Compliance & Insurance ────────────────────────────────────── */}
        <SectionCard icon="🛡️" title="Compliance & Insurance" subtitle="License and insurance information" accent="from-slate-600 to-slate-700">
          <Field label="License / Certification Number" hint="State license, certification, or accreditation number if applicable.">
            <input
              type="text"
              value={form.licenseInfo}
              onChange={upd('licenseInfo')}
              placeholder="e.g. AZ-HHA-12345"
              className={inp}
            />
          </Field>

          <Field label="Insurance Provider">
            <input
              type="text"
              value={form.insuranceProvider}
              onChange={upd('insuranceProvider')}
              placeholder="e.g. Nationwide, State Farm"
              className={inp}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Policy Number">
              <input
                type="text"
                value={form.insurancePolicyNumber}
                onChange={upd('insurancePolicyNumber')}
                placeholder="POL-000000"
                className={inp}
              />
            </Field>
            <Field label="Expiration Date">
              <input
                type="date"
                value={form.insuranceExpiration}
                onChange={upd('insuranceExpiration')}
                className={inp}
              />
            </Field>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex gap-2.5 text-xs text-blue-700">
            <span className="flex-shrink-0">ℹ️</span>
            Proof of insurance and licensing may be requested by community managers during the approval process.
          </div>
        </SectionCard>

        {/* ── 4. Professional Reference ────────────────────────────────────── */}
        <SectionCard icon="👤" title="Professional Reference" subtitle="Someone who can vouch for your work" accent="from-violet-600 to-purple-600">
          <p className="text-sm text-gray-500 leading-relaxed">
            Provide one professional reference who can speak to your experience serving senior living communities or similar organizations.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name">
              <input
                type="text"
                value={form.reference1Name}
                onChange={upd('reference1Name')}
                placeholder="Dr. Jane Smith"
                className={inp}
              />
            </Field>
            <Field label="Company">
              <input
                type="text"
                value={form.reference1Company}
                onChange={upd('reference1Company')}
                placeholder="Acme Medical Center"
                className={inp}
              />
            </Field>
          </div>
          <Field label="Phone Number">
            <input
              type="tel"
              value={form.reference1Phone}
              onChange={(e) => setForm((f) => ({ ...f, reference1Phone: formatPhone(e.target.value) }))}
              placeholder="(555) 000-0000"
              className={inp}
            />
          </Field>
        </SectionCard>

        {/* ── 5. Agreements ────────────────────────────────────────────────── */}
        <SectionCard icon="✅" title="Agreements" subtitle="Required for all vendor applications" accent="from-emerald-600 to-teal-600">
          <div className="space-y-4">
            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              form.backgroundCheckConsent ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="checkbox"
                checked={form.backgroundCheckConsent}
                onChange={upd('backgroundCheckConsent')}
                className="mt-0.5 w-4 h-4 rounded accent-emerald-600 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Background Check Consent <span className="text-red-400">*</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  I consent to a background check on my business and its principals as part of the vendor approval process.
                </p>
                {errors.backgroundCheckConsent && (
                  <p className="text-xs text-red-500 mt-1">{errors.backgroundCheckConsent}</p>
                )}
              </div>
            </label>

            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              form.termsAgreed ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="checkbox"
                checked={form.termsAgreed}
                onChange={upd('termsAgreed')}
                className="mt-0.5 w-4 h-4 rounded accent-emerald-600 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Terms &amp; Conditions <span className="text-red-400">*</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  I certify that all information provided is accurate and complete. I agree to VendorHub's vendor terms and conditions.
                </p>
                {errors.termsAgreed && (
                  <p className="text-xs text-red-500 mt-1">{errors.termsAgreed}</p>
                )}
              </div>
            </label>
          </div>
        </SectionCard>

        {/* Save button */}
        <div className="pb-6">
          <button
            onClick={handleSave}
            className={`w-full py-4 rounded-2xl text-sm font-bold transition-all shadow-md ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700'
            }`}
          >
            {saved ? '✓ Profile Saved!' : 'Save Company Profile'}
          </button>
          {!isComplete && (
            <p className="text-center text-xs text-gray-400 mt-3">
              {10 - Math.round(pct / 10)} required field{10 - Math.round(pct / 10) !== 1 ? 's' : ''} still needed
            </p>
          )}
          {isComplete && (
            <button
              onClick={() => navigate('/vendor/apply')}
              className="w-full mt-3 py-3 rounded-2xl text-sm font-semibold text-blue-600 border-2 border-blue-200 hover:bg-blue-50 transition-colors"
            >
              Apply to a Community →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
