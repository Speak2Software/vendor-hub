import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getCommunities, getVendorProfile, getCompanyProfile,
  getApplicationsForVendor, getApplication, saveApplication, haversineDistance,
} from '../../utils/storage'
import { v4 as uuidv4 } from 'uuid'

// ── Constants ─────────────────────────────────────────────────────────────────

const RADIUS_TIERS = [1, 1.5, 2.5, 999]

const STEPS = [
  { label: 'Choose Community', icon: '🏘️' },
  { label: 'Your Pitch',       icon: '✍️'  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const inp = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-300'

// ── Main Component ────────────────────────────────────────────────────────────

export default function Apply() {
  const { user }        = useAuth()
  const navigate        = useNavigate()
  const [searchParams]  = useSearchParams()
  const editId          = searchParams.get('edit')

  const [step, setStep]           = useState(0)
  const [communityIds, setIds]    = useState([])
  const [servicesOffered, setPitch] = useState('')
  const [personalNote, setNote]   = useState('')
  const [radiusTier, setTier]     = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submittedCount, setCount]= useState(0)
  const [error, setError]         = useState('')

  const [profile, setProfile]           = useState(null)
  const [companyProfile, setCompany]    = useState(null)
  const [allCommunities, setAll]        = useState([])
  const [editApp, setEditApp]           = useState(null)

  useEffect(() => {
    const vp = getVendorProfile(user.id)
    const cp = getCompanyProfile(user.id)
    setProfile(vp)
    setCompany(cp)
    setAll(getCommunities())

    if (editId) {
      const existing = getApplication(editId)
      if (existing && existing.vendorId === user.id) {
        setEditApp(existing)
        setIds([existing.communityId])
        setPitch(existing.servicesOffered || '')
        setNote('')
      }
    }
  }, [user.id, editId])

  // ── Visible communities (radius-filtered) ──────────────────────────────────

  const visible = (() => {
    if (!profile) return allCommunities
    const mult = RADIUS_TIERS[radiusTier]
    const cap  = mult >= 999 ? Infinity : profile.serviceRadiusMiles * mult
    return allCommunities.filter((c) => {
      if (!c.location) return true
      return haversineDistance(profile.location.lat, profile.location.lng, c.location.lat, c.location.lng) <= cap
    })
  })()

  const canExpand = radiusTier < RADIUS_TIERS.length - 1

  function toggleId(id) {
    if (editApp) return               // edit mode: community is fixed
    setIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  // ── Validation & navigation ────────────────────────────────────────────────

  function validateStep0() {
    if (communityIds.length === 0) { setError('Please select at least one community.'); return false }
    return true
  }
  function validateStep1() {
    if (!servicesOffered.trim()) { setError('Please describe the services you\'ll offer.'); return false }
    return true
  }

  function goNext() {
    setError('')
    if (step === 0 && !validateStep0()) return
    if (step === 1 && !validateStep1()) return
    if (step === 0) setStep(1)
    else handleSubmit()
  }

  function goPrev() {
    setError('')
    setStep(0)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function buildPayload(commId, existingApp = null) {
    const cp  = companyProfile || {}
    const now = new Date().toISOString()
    const base = {
      // Business info — from company profile
      businessName:         cp.businessName         || user.name,
      contactName:          cp.contactName          || user.name,
      contactEmail:         cp.contactEmail         || user.email,
      contactPhone:         cp.contactPhone         || '',
      businessAddress:      cp.businessAddress      || '',
      serviceCategory:      cp.serviceCategory      || '',
      yearsInBusiness:      cp.yearsInBusiness      || '',
      businessDescription:  cp.businessDescription  || '',
      licenseInfo:          cp.licenseInfo          || '',
      insuranceProvider:    cp.insuranceProvider    || '',
      insurancePolicyNumber:cp.insurancePolicyNumber|| '',
      insuranceExpiration:  cp.insuranceExpiration  || '',
      reference1Name:       cp.reference1Name       || '',
      reference1Company:    cp.reference1Company    || '',
      reference1Phone:      cp.reference1Phone      || '',
      backgroundCheckConsent: cp.backgroundCheckConsent || false,
      termsAgreed:          cp.termsAgreed          || false,
      // Per-application fields
      servicesOffered: servicesOffered.trim(),
      personalNote:    personalNote.trim(),
      communityId:     commId,
      status:          'pending',
    }

    if (existingApp) {
      return {
        ...existingApp,
        ...base,
        statusHistory: [
          ...(existingApp.statusHistory || []),
          { status: 'pending', timestamp: now, note: 'Application edited and resubmitted by vendor.' },
        ],
      }
    }
    return {
      ...base,
      id: uuidv4(), vendorId: user.id,
      submittedAt: now, notes: [],
      statusHistory: [{ status: 'pending', timestamp: now, note: 'Application submitted.' }],
    }
  }

  function handleSubmit() {
    if (!validateStep1()) return

    if (editApp) {
      saveApplication(buildPayload(editApp.communityId, editApp))
      setCount(1)
      setSubmitted(true)
      return
    }

    const existing = getApplicationsForVendor(user.id)
    let count = 0
    communityIds.forEach((commId) => {
      const dup = existing.find(
        (a) => a.communityId === commId && a.status !== 'denied' && a.status !== 'revoked',
      )
      if (!dup) { saveApplication(buildPayload(commId)); count++ }
    })
    if (count === 0) {
      setError('You already have active applications for all selected communities.')
      return
    }
    setCount(count)
    setSubmitted(true)
  }

  // ── No company profile guard ───────────────────────────────────────────────

  if (!companyProfile && !editApp) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <h2 className="text-lg font-extrabold text-gray-900 mb-2">Complete Your Profile First</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Your Company Profile holds your business details so you never have to re-enter them. Set it up once and apply to any community in seconds.
          </p>
          <Link
            to="/vendor/profile"
            className="block w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 rounded-xl text-sm font-bold hover:from-blue-700 hover:to-teal-700 shadow-sm"
          >
            Set Up Company Profile →
          </Link>
          <button
            onClick={() => navigate('/vendor')}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Submitted screen ───────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
            {editApp ? 'Application Updated!' : submittedCount === 1 ? 'Application Submitted!' : `${submittedCount} Applications Submitted!`}
          </h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed max-w-xs mx-auto">
            {editApp
              ? 'Your updated application has been resubmitted for community review.'
              : `Your application${submittedCount > 1 ? 's are' : ' is'} under review. Community managers will reach out when they're ready.`}
          </p>
          <button
            onClick={() => navigate('/vendor')}
            className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 rounded-xl text-sm font-bold hover:from-blue-700 hover:to-teal-700 shadow-md mb-3"
          >
            Back to Dashboard →
          </button>
          <button
            onClick={() => navigate('/vendor/status')}
            className="w-full border-2 border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50"
          >
            View All Applications
          </button>
        </div>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────

  const progress = ((step + 1) / STEPS.length) * 100
  const cp = companyProfile || {}

  return (
    <div className="bg-gray-50 min-h-screen py-6 px-4">
      <div className="max-w-lg mx-auto">

        {/* Step indicators */}
        <div className="flex items-center mb-5">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  i < step   ? 'bg-teal-500 border-teal-500 text-white' :
                  i === step  ? 'bg-blue-600 border-blue-600 text-white' :
                                'bg-white border-gray-200 text-gray-400'
                }`}>
                  {i < step
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                    : i + 1}
                </div>
                <span className={`text-[10px] font-semibold mt-1 text-center leading-tight ${
                  i === step ? 'text-blue-600' : i < step ? 'text-teal-600' : 'text-gray-400'
                }`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 mb-5 mx-1 transition-colors ${i < step ? 'bg-teal-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Gradient header */}
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-6 py-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{STEPS[step].icon}</span>
              <div>
                <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest">
                  {editApp ? 'Editing Application · ' : ''}Step {step + 1} of {STEPS.length}
                </p>
                <h2 className="text-white text-lg font-extrabold">{STEPS[step].label}</h2>
              </div>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="px-6 py-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* ── Step 0: Choose Community ─────────────────────────────── */}
            {step === 0 && (
              <div className="space-y-4">

                {/* Profile summary — shows what will be submitted */}
                {cp.businessName && (
                  <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Submitting as</p>
                      <Link to="/vendor/profile" className="text-xs text-blue-500 hover:underline font-medium">Edit profile →</Link>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{cp.businessName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{cp.serviceCategory} · {cp.yearsInBusiness} yrs · {cp.contactEmail}</p>
                    {cp.licenseInfo && <p className="text-xs text-gray-400 mt-0.5">📄 {cp.licenseInfo}</p>}
                  </div>
                )}

                {/* Community selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {editApp ? 'Community' : 'Select Communities'}
                    </p>
                    {!editApp && communityIds.length > 0 && (
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {communityIds.length} selected
                      </span>
                    )}
                  </div>
                  {profile && (
                    <p className="text-xs text-gray-400 mb-3">
                      {RADIUS_TIERS[radiusTier] >= 999
                        ? 'Showing all communities'
                        : `Within ${Math.round(profile.serviceRadiusMiles * RADIUS_TIERS[radiusTier])} mi of your location`}
                    </p>
                  )}

                  {visible.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center text-sm text-amber-700">
                      No communities in your service area.{' '}
                      <button onClick={() => setTier(RADIUS_TIERS.length - 1)} className="underline font-semibold">
                        Show all
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {visible.map((c) => {
                        const selected = communityIds.includes(c.id)
                        const dist = profile && c.location
                          ? Math.round(haversineDistance(profile.location.lat, profile.location.lng, c.location.lat, c.location.lng))
                          : null
                        const isFixed = editApp && communityIds.includes(c.id)

                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleId(c.id)}
                            disabled={!!editApp && !communityIds.includes(c.id)}
                            className={`w-full text-left rounded-xl border-2 p-3.5 transition-all ${
                              selected
                                ? 'border-blue-500 bg-blue-50'
                                : editApp
                                ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                                : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                                selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                              }`}>
                                {selected && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-bold text-gray-900">{c.name}</p>
                                  {dist !== null && (
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                      ~{dist} mi
                                    </span>
                                  )}
                                  {isFixed && (
                                    <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
                                      Editing
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{c.address}</p>
                                {c.careLevels?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {c.careLevels.slice(0, 2).map((cl) => (
                                      <span key={cl} className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full border border-teal-100">
                                        {cl}
                                      </span>
                                    ))}
                                    {c.careLevels.length > 2 && (
                                      <span className="text-[10px] text-gray-400">+{c.careLevels.length - 2} more</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Expand radius */}
                  {canExpand && profile && !editApp && (
                    <button
                      type="button"
                      onClick={() => setTier((t) => t + 1)}
                      className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold text-blue-600 border-2 border-blue-100 hover:bg-blue-50 transition-colors"
                    >
                      See more communities ↓
                      <span className="text-xs font-normal text-gray-400 ml-1.5">
                        (expand to {Math.round(profile.serviceRadiusMiles * RADIUS_TIERS[radiusTier + 1])} mi)
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 1: Your Pitch ───────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                {/* Selected communities recap */}
                <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Applying to</p>
                  {communityIds.map((id) => {
                    const c = allCommunities.find((x) => x.id === id)
                    return c ? (
                      <p key={id} className="text-sm font-semibold text-gray-800">🏘️ {c.name}</p>
                    ) : null
                  })}
                </div>

                {/* Services pitch */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Services You'll Provide <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={servicesOffered}
                    onChange={(e) => setPitch(e.target.value)}
                    placeholder={`Describe the specific services you'll offer ${communityIds.length === 1 ? 'this community' : 'these communities'}. Be specific — this is what managers read first.\n\ne.g. "We'll provide weekly housekeeping for resident rooms, daily laundry service, and deep cleaning every quarter…"`}
                    className={`${inp} resize-none leading-relaxed`}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{servicesOffered.length} characters</p>
                </div>

                {/* Personal note */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Personal Note to the Manager
                    <span className="font-normal normal-case text-gray-400 ml-1">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={personalNote}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add anything personal — why you're excited about this community, a special offer, or availability details…"
                    className={`${inp} resize-none leading-relaxed`}
                  />
                </div>

                {/* Profile info being submitted */}
                {cp.businessName && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex gap-2.5">
                    <span className="text-blue-400 flex-shrink-0 mt-0.5">ℹ️</span>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Your Company Profile info (business details, insurance, reference) will be included automatically.{' '}
                      <Link to="/vendor/profile" className="underline font-semibold">Review profile →</Link>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button
                  onClick={goPrev}
                  className="flex-1 py-3 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={goNext}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700 transition-all shadow-md"
              >
                {step === STEPS.length - 1
                  ? editApp
                    ? 'Update & Resubmit →'
                    : `Submit Application${communityIds.length > 1 ? `s (${communityIds.length})` : ''} →`
                  : 'Continue →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
