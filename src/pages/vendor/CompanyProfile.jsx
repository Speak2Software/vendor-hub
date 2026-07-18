import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCompanyProfile, saveCompanyProfile, getApplicationsForVendor } from '../../utils/storage'
import { uploadImage } from '../../utils/uploadImage'
import { uploadFile }  from '../../utils/uploadFile'
import { formatPhone } from '../../utils/formatPhone'
import { useToast } from '../../components/Toast'

// ── Constants ─────────────────────────────────────────────────────────────────

const SERVICE_CATEGORIES = [
  'Medical / Healthcare', 'Transportation', 'Food & Nutrition Services',
  'Housekeeping & Laundry', 'Maintenance & Facilities', 'Personal Care & Grooming',
  'Physical / Occupational Therapy', 'Mental Health & Counseling',
  'Entertainment & Activities', 'Technology & Telehealth', 'Financial Services',
  'Legal Services', 'Insurance', 'Staffing & Workforce', 'Pharmacy & Medical Supplies', 'Other',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const EMPTY = {
  businessName: '', contactName: '', contactEmail: '', contactPhone: '',
  businessAddress: '', serviceCategory: '', yearsInBusiness: '',
  businessDescription: '',
  licenseInfo: '', insuranceProvider: '', insurancePolicyNumber: '', insuranceExpiration: '',
  reference1Name: '', reference1Company: '', reference1Phone: '',
  logoUrl: '',
  backgroundCheckConsent: false, termsAgreed: false,
}

// ── Testimonial helpers ───────────────────────────────────────────────────────

function ytThumb(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null
}
function isYT(url)    { return /youtube\.com|youtu\.be/.test(url) }
function isVimeo(url) { return /vimeo\.com/.test(url) }

function fmtBytes(b) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
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

function SectionCard({ icon, title, subtitle, accent = 'from-[#1a73c8] to-[#0d3f73]', children }) {
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
  const toast = useToast()
  const navigate  = useNavigate()
  const [form, setForm]         = useState(EMPTY)
  const [saved, setSaved]       = useState(false)
  const [errors, setErrors]     = useState({})
  const [logoFile, setLogoFile]       = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [uploading, setUploading]     = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  // ── Testimonials state ────────────────────────────────────────────────────
  const [testimonials, setTestimonials]   = useState([])
  const [addingType, setAddingType]       = useState(null) // 'video' | 'image' | 'document' | null
  const [addTitle, setAddTitle]           = useState('')
  const [addUrl, setAddUrl]               = useState('')
  const [addDesc, setAddDesc]             = useState('')
  const [addFile, setAddFile]             = useState(null)
  const [addUploading, setAddUploading]   = useState(false)
  const [addError, setAddError]           = useState('')
  const testimonialFileRef = useRef(null)

  useEffect(() => {
    async function load() {
      const existing = await getCompanyProfile(user.id)
      if (existing) {
        setForm({ ...EMPTY, ...existing })
        setTestimonials(existing.testimonials || [])
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

  function handleLogoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5 MB.')
      return
    }
    setUploadError(null)
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function removeLogo() {
    setLogoFile(null)
    setLogoPreview(null)
    setForm((f) => ({ ...f, logoUrl: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeTestimonial(id) {
    setTestimonials((prev) => prev.filter((t) => t.id !== id))
  }

  async function handleAddTestimonial() {
    if (addingType === 'video') {
      if (!addUrl.trim()) { setAddError('Please enter a video URL.'); return }
    } else {
      if (!addFile) { setAddError('Please select a file.'); return }
    }

    let url = addUrl.trim()
    let fileName = ''

    if (addingType !== 'video') {
      setAddUploading(true)
      setAddError('')
      try {
        const result = await uploadFile(addFile)
        url      = result.url
        fileName = result.fileName
      } catch (err) {
        setAddError(err.message || 'Upload failed.')
        setAddUploading(false)
        return
      }
      setAddUploading(false)
    }

    setTestimonials((prev) => [
      ...prev,
      {
        id:          `t_${Date.now()}`,
        type:        addingType,
        title:       addTitle.trim() || (addingType === 'video' ? 'Video' : fileName || 'File'),
        url,
        description: addDesc.trim(),
        fileName,
        addedAt:     new Date().toISOString(),
      },
    ])
    setAddingType(null)
    setAddTitle('')
    setAddUrl('')
    setAddDesc('')
    setAddFile(null)
    setAddError('')
    if (testimonialFileRef.current) testimonialFileRef.current.value = ''
  }

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
    let finalLogoUrl = form.logoUrl
    if (logoFile) {
      setUploading(true)
      setUploadError(null)
      try {
        finalLogoUrl = await uploadImage(logoFile)
        setLogoFile(null)
        setLogoPreview(null)
      } catch (err) {
        setUploadError('Logo upload failed. Please try again.')
        toast.error('Logo upload failed — profile not saved.')
        setUploading(false)
        return
      }
      setUploading(false)
    }
    try {
      await saveCompanyProfile({ ...form, logoUrl: finalLogoUrl, testimonials, userId: user.id })
      setForm((f) => ({ ...f, logoUrl: finalLogoUrl }))
      toast.success('Company profile saved')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      toast.error(err.message || 'Failed to save profile.')
    }
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
              disabled={uploading}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-60 ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-[#1a73c8] to-[#0d3f73] text-white hover:from-[#135aa0] hover:to-[#0d3f73]'
              }`}
            >
              {uploading ? 'Uploading logo…' : saved ? '✓ Saved!' : 'Save Profile'}
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
          <div className="bg-gradient-to-r from-[#1a73c8] to-[#0d3f73] rounded-2xl px-5 py-4 text-white">
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

        {/* ── 0. Company Logo ──────────────────────────────────────────────── */}
        <SectionCard icon="🖼️" title="Company Logo" subtitle="Displayed on your profile and vendor listings" accent="from-indigo-600 to-blue-600">
          <div className="flex items-center gap-5">
            {/* Preview box */}
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {(logoPreview || form.logoUrl) ? (
                <img
                  src={logoPreview || form.logoUrl}
                  alt="Company logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-3xl">🏢</span>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2 flex-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors text-left"
              >
                {(logoPreview || form.logoUrl) ? '🔄 Change Logo' : '📁 Upload Logo'}
              </button>
              {(logoPreview || form.logoUrl) && (
                <button
                  type="button"
                  onClick={removeLogo}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors text-left"
                >
                  🗑️ Remove Logo
                </button>
              )}
              <p className="text-xs text-gray-400 leading-relaxed">PNG, JPG, or SVG · Max 5 MB</p>
              {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoSelect}
          />
        </SectionCard>

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

        {/* ── 5. Portfolio & Testimonials ──────────────────────────────────── */}
        <SectionCard icon="🎬" title="Portfolio & Testimonials" subtitle="Videos, images, and documents that support your application" accent="from-amber-500 to-orange-500">

          {/* Existing items grid */}
          {testimonials.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              {testimonials.map((item) => (
                <div key={item.id} className="relative bg-gray-50 border border-gray-200 rounded-xl overflow-hidden group">
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeTestimonial(item.id)}
                    className="absolute top-1.5 right-1.5 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors shadow-sm"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                  </button>

                  {/* Video */}
                  {item.type === 'video' && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                      <div className="relative h-28 bg-gray-900 overflow-hidden">
                        {ytThumb(item.url) ? (
                          <img src={ytThumb(item.url)} alt="" className="w-full h-full object-cover opacity-80" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🎬</div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow">
                            <svg className="w-4 h-4 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        </div>
                        {isYT(item.url) && <span className="absolute bottom-1 left-2 text-[10px] text-white/80 font-medium">YouTube</span>}
                        {isVimeo(item.url) && <span className="absolute bottom-1 left-2 text-[10px] text-white/80 font-medium">Vimeo</span>}
                      </div>
                      <div className="px-3 py-2">
                        <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
                        {item.description && <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.description}</p>}
                      </div>
                    </a>
                  )}

                  {/* Image */}
                  {item.type === 'image' && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                      <div className="h-28 overflow-hidden bg-gray-100">
                        <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="px-3 py-2">
                        <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
                        {item.description && <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.description}</p>}
                      </div>
                    </a>
                  )}

                  {/* Document */}
                  {item.type === 'document' && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3">
                      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0 text-xl border border-red-100">📄</div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
                        {item.fileName && <p className="text-[11px] text-gray-400 truncate">{item.fileName}</p>}
                        {item.description && <p className="text-[11px] text-gray-400 truncate">{item.description}</p>}
                        <p className="text-[11px] text-blue-500 mt-0.5">View →</p>
                      </div>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          {addingType === null ? (
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Add supporting material:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { type: 'video',    label: '📹 Video Link',    hint: 'YouTube or Vimeo URL' },
                  { type: 'image',    label: '🖼️ Image',         hint: 'Upload a photo' },
                  { type: 'document', label: '📄 Document',      hint: 'PDF or Word doc' },
                ].map(({ type, label, hint }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => { setAddingType(type); setAddError('') }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                    title={hint}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                  {addingType === 'video' ? '📹 Add Video Link' : addingType === 'image' ? '🖼️ Add Image' : '📄 Add Document'}
                </p>
                <button type="button" onClick={() => { setAddingType(null); setAddError('') }} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder={addingType === 'video' ? 'e.g. Client Testimonial' : addingType === 'image' ? 'e.g. Our Facility' : 'e.g. Certificate of Insurance'}
                  className={`${inp} text-sm`}
                />
              </div>

              {/* Video URL */}
              {addingType === 'video' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Video URL <span className="text-red-400">*</span></label>
                  <input
                    type="url"
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={inp}
                  />
                </div>
              )}

              {/* File picker */}
              {(addingType === 'image' || addingType === 'document') && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                    {addingType === 'image' ? 'Image File' : 'Document'} <span className="text-red-400">*</span>
                  </label>
                  <input
                    ref={testimonialFileRef}
                    type="file"
                    accept={addingType === 'image' ? 'image/*' : 'application/pdf,.pdf,.doc,.docx,.txt'}
                    onChange={(e) => { setAddFile(e.target.files?.[0] || null); setAddError('') }}
                    className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                  />
                  {addFile && <p className="text-[11px] text-gray-400 mt-1">{addFile.name}</p>}
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={addDesc}
                  onChange={(e) => setAddDesc(e.target.value)}
                  placeholder="Brief description…"
                  className={inp}
                />
              </div>

              {addError && <p className="text-xs text-red-500">{addError}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setAddingType(null); setAddError('') }}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddTestimonial}
                  disabled={addUploading}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
                >
                  {addUploading ? 'Uploading…' : 'Add Item'}
                </button>
              </div>
            </div>
          )}

          {testimonials.length === 0 && addingType === null && (
            <p className="text-xs text-gray-400 italic mt-1">No items yet. Add a video, image, or document to showcase your work.</p>
          )}

          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-2 text-xs text-amber-700 mt-1">
            <span className="flex-shrink-0">💡</span>
            Items are saved when you click Save Profile. Community managers will see these when reviewing your application.
          </div>
        </SectionCard>

        {/* ── 6. Agreements ────────────────────────────────────────────────── */}
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
                  I certify that all information provided is accurate and complete. I agree to Speak2Vendors' vendor terms and conditions.
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
            disabled={uploading}
            className={`w-full py-4 rounded-2xl text-sm font-bold transition-all shadow-md disabled:opacity-60 ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-[#1a73c8] to-[#0d3f73] text-white hover:from-[#135aa0] hover:to-[#0d3f73]'
            }`}
          >
            {uploading ? '⏳ Uploading logo…' : saved ? '✓ Profile Saved!' : 'Save Company Profile'}
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
