import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getCommunity,
  getApplicationsForCommunity,
  getReviewsForCommunity,
  saveReview,
  addApplicationNote,
  updateApplicationStatus,
} from '../../utils/storage'

// ── Constants ─────────────────────────────────────────────────────────────────
const ALL_CATEGORIES = [
  'Medical / Healthcare',
  'Transportation',
  'Food & Nutrition Services',
  'Housekeeping & Laundry',
  'Maintenance & Facilities',
  'Personal Care & Grooming',
  'Physical / Occupational Therapy',
  'Mental Health & Counseling',
  'Entertainment & Activities',
  'Technology & Telehealth',
  'Financial Services',
  'Legal Services',
  'Insurance',
  'Staffing & Workforce',
  'Pharmacy & Medical Supplies',
  'Other',
]

const SERVICE_ICONS = {
  'Medical / Healthcare': '🏥',
  'Transportation': '🚐',
  'Food & Nutrition Services': '🍽️',
  'Housekeeping & Laundry': '🧹',
  'Maintenance & Facilities': '🔧',
  'Personal Care & Grooming': '💆',
  'Physical / Occupational Therapy': '🤸',
  'Mental Health & Counseling': '🧠',
  'Entertainment & Activities': '🎭',
  'Technology & Telehealth': '💻',
  'Financial Services': '💼',
  'Legal Services': '⚖️',
  'Insurance': '📋',
  'Staffing & Workforce': '👥',
  'Pharmacy & Medical Supplies': '💊',
  'Other': '📦',
}

const STATUS_CFG = {
  approved: { label: 'Approved',   bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500',  border: 'border-green-200' },
  pending:  { label: 'Pending',    bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400',  border: 'border-amber-200' },
  denied:   { label: 'Denied',     bg: 'bg-red-100',   text: 'text-red-700',   dot: 'bg-red-400',    border: 'border-red-200'   },
}

const TABS = ['All', 'Approved', 'Pending', 'Denied']

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
function daysAgo(iso) {
  return Math.floor((Date.now() - new Date(iso)) / 864e5)
}

// ── Star rating widget ────────────────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value || 0
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => !readonly && setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform focus:outline-none`}
        >
          <svg
            className={`${sz} transition-colors ${
              star <= active
                ? 'text-amber-400 drop-shadow-sm'
                : 'text-gray-200'
            }`}
            viewBox="0 0 24 24"
            fill={star <= active ? 'currentColor' : 'currentColor'}
          >
            <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

const STAR_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very good', 5: 'Excellent' }

// ── Vendor review section ─────────────────────────────────────────────────────
function VendorReview({ app, communityId, existingReview, onSaved }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [review, setReview] = useState(existingReview?.review || '')
  const [editing, setEditing] = useState(!existingReview)
  const [saved, setSaved] = useState(false)

  // Sync if existingReview changes (e.g., after parent reload)
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating)
      setReview(existingReview.review)
      setEditing(false)
    }
  }, [existingReview?.updatedAt])

  function handleSave(e) {
    e.preventDefault()
    if (!rating) return
    saveReview({
      appId: app.id,
      vendorId: app.vendorId,
      communityId,
      managerId: user.id,
      rating,
      review: review.trim(),
    })
    setSaved(true)
    setEditing(false)
    setTimeout(() => { setSaved(false); onSaved?.() }, 1200)
  }

  return (
    <div className="pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Rating & Review
        </p>
        {existingReview && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {/* Read-only display */}
      {existingReview && !editing && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <StarRating value={existingReview.rating} readonly size="sm" />
            <span className="text-xs font-semibold text-amber-700">
              {STAR_LABELS[existingReview.rating]}
            </span>
          </div>
          {existingReview.review && (
            <p className="text-xs text-gray-700 leading-relaxed italic">"{existingReview.review}"</p>
          )}
          <p className="text-[11px] text-gray-400">
            Last updated {fmtDateTime(existingReview.updatedAt)}
          </p>
        </div>
      )}

      {/* Edit / create form */}
      {editing && (
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <div className="flex items-center gap-3">
              <StarRating value={rating} onChange={setRating} size="md" />
              {rating > 0 && (
                <span className="text-xs font-medium text-amber-600 animate-in fade-in">
                  {STAR_LABELS[rating]}
                </span>
              )}
            </div>
            {!rating && (
              <p className="text-[11px] text-gray-400 mt-1">Click a star to rate this vendor</p>
            )}
          </div>
          <div>
            <textarea
              value={review}
              onChange={e => setReview(e.target.value)}
              rows={3}
              placeholder="Share your experience with this vendor — quality of service, reliability, communication…"
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>
          <div className="flex gap-2">
            {existingReview && (
              <button
                type="button"
                onClick={() => { setEditing(false); setRating(existingReview.rating); setReview(existingReview.review) }}
                className="flex-1 text-xs py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!rating}
              className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${
                saved
                  ? 'bg-green-600 text-white'
                  : rating
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saved ? '✓ Saved' : existingReview ? 'Update review' : 'Save review'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── Summary cards ─────────────────────────────────────────────────────────────
function StatCard({ value, label, sub, color, icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs font-medium text-gray-600 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Inline note + action controls ─────────────────────────────────────────────
function InlineActions({ app, onRefresh }) {
  const { user } = useAuth()
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [showApprove, setShowApprove] = useState(false)
  const [showDeny, setShowDeny] = useState(false)
  const [actionNote, setActionNote] = useState('')

  function handleNote(e) {
    e.preventDefault()
    if (!note.trim()) return
    addApplicationNote(app.id, note.trim(), user.id)
    setNote('')
    onRefresh()
  }

  function handleApprove() {
    updateApplicationStatus(app.id, 'approved', user.id, actionNote || 'Application approved.')
    setShowApprove(false)
    setActionNote('')
    onRefresh()
  }

  function handleDeny() {
    updateApplicationStatus(app.id, 'denied', user.id, actionNote || 'Application denied.')
    setShowDeny(false)
    setActionNote('')
    onRefresh()
  }

  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      {/* Status actions */}
      {app.status === 'pending' && !showApprove && !showDeny && (
        <div className="flex gap-2">
          <button onClick={() => setShowApprove(true)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors">
            Approve
          </button>
          <button onClick={() => setShowDeny(true)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
            Deny
          </button>
        </div>
      )}
      {app.status === 'approved' && !showDeny && (
        <button onClick={() => setShowDeny(true)}
          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-colors">
          Revoke approval
        </button>
      )}
      {app.status === 'denied' && !showApprove && (
        <button onClick={() => setShowApprove(true)}
          className="text-xs text-green-700 hover:text-green-900 hover:bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 transition-colors">
          Approve anyway
        </button>
      )}

      {/* Approve confirm */}
      {showApprove && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-green-800">Confirm approval</p>
          <textarea rows={2} value={actionNote} onChange={e => setActionNote(e.target.value)}
            placeholder="Optional note…"
            className="w-full text-xs border border-green-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400 bg-white" />
          <div className="flex gap-2">
            <button onClick={() => setShowApprove(false)} className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={handleApprove} className="flex-1 text-xs py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium">Confirm</button>
          </div>
        </div>
      )}

      {/* Deny confirm */}
      {showDeny && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-red-800">
            {app.status === 'approved' ? 'Confirm revoke' : 'Confirm denial'}
          </p>
          <textarea rows={2} value={actionNote} onChange={e => setActionNote(e.target.value)}
            placeholder="Reason (recommended)…"
            className="w-full text-xs border border-red-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-400 bg-white" />
          <div className="flex gap-2">
            <button onClick={() => setShowDeny(false)} className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={handleDeny} className="flex-1 text-xs py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium">
              {app.status === 'approved' ? 'Revoke' : 'Deny'}
            </button>
          </div>
        </div>
      )}

      {/* Note input */}
      <form onSubmit={handleNote} className="flex gap-2">
        <input type="text" value={note} onChange={e => setNote(e.target.value)}
          placeholder="Add a note…"
          className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <button type="submit" disabled={!note.trim()}
          className="text-xs px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors">
          Add
        </button>
      </form>

      {/* Notes list */}
      {app.notes?.length > 0 && (
        <div className="space-y-1.5">
          {[...app.notes].reverse().map(n => (
            <div key={n.id} className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-700">{n.text}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{fmtDateTime(n.timestamp)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Vendor card ───────────────────────────────────────────────────────────────
function VendorCard({ app, review, communityId, expanded, onToggle, onRefresh }) {
  const cfg = STATUS_CFG[app.status] || STATUS_CFG.pending
  const icon = SERVICE_ICONS[app.serviceCategory] || '📦'
  const lastHistory = app.statusHistory?.[app.statusHistory.length - 1]

  return (
    <div className={`bg-white rounded-xl border shadow-sm transition-all ${expanded ? 'border-blue-200 shadow-md' : 'border-gray-200'}`}>
      {/* ── Card header — always visible ────────────────────────────────────── */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-start gap-3 group"
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 text-xl">
          {icon}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{app.businessName}</p>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{app.serviceCategory} · {app.contactName}</p>
          {review?.rating > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <StarRating value={review.rating} readonly size="sm" />
              <span className="text-[11px] text-amber-600 font-medium">{STAR_LABELS[review.rating]}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            <span className="text-xs text-gray-400">{app.contactPhone}</span>
            {lastHistory && (
              <span className="text-xs text-gray-400">
                {app.status === 'approved' ? 'Approved' : app.status === 'denied' ? 'Denied' : 'Submitted'} {fmtDate(lastHistory.timestamp)}
              </span>
            )}
            {app.yearsInBusiness && (
              <span className="text-xs text-gray-400">{app.yearsInBusiness} yrs in business</span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${expanded ? 'rotate-180 text-blue-500' : 'group-hover:text-gray-600'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* ── Expanded details ─────────────────────────────────────────────────── */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Contact */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contact</p>
              <div className="space-y-1">
                <DetailRow icon="👤" value={app.contactName} />
                <DetailRow icon="✉️" value={app.contactEmail} />
                <DetailRow icon="📞" value={app.contactPhone} />
                <DetailRow icon="📍" value={app.businessAddress} />
              </div>
            </div>

            {/* Services */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Services</p>
              <p className="text-xs text-gray-600 leading-relaxed">{app.servicesOffered || app.businessDescription || '—'}</p>
            </div>
          </div>

          {/* Compliance */}
          {(app.licenseInfo || app.insuranceProvider) && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Compliance & Insurance</p>
              <div className="flex flex-wrap gap-2">
                {app.licenseInfo && (
                  <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-lg">
                    🪪 {app.licenseInfo}
                  </span>
                )}
                {app.insuranceProvider && (
                  <span className="text-xs bg-gray-50 text-gray-600 border border-gray-100 px-2 py-1 rounded-lg">
                    🛡 {app.insuranceProvider} · {app.insurancePolicyNumber}
                    {app.insuranceExpiration ? ` · exp ${app.insuranceExpiration}` : ''}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* References */}
          {(app.reference1Name || app.reference2Name) && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">References</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {app.reference1Name && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs font-medium text-gray-700">{app.reference1Name}</p>
                    <p className="text-xs text-gray-500">{app.reference1Company}</p>
                    <p className="text-xs text-gray-400">{app.reference1Phone}</p>
                  </div>
                )}
                {app.reference2Name && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs font-medium text-gray-700">{app.reference2Name}</p>
                    <p className="text-xs text-gray-500">{app.reference2Company}</p>
                    <p className="text-xs text-gray-400">{app.reference2Phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status history */}
          {app.statusHistory?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Status History</p>
              <div className="space-y-1.5">
                {[...app.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      h.status === 'approved' ? 'bg-green-500' : h.status === 'denied' ? 'bg-red-400' : 'bg-amber-400'
                    }`} />
                    <div>
                      <p className="text-xs text-gray-700">{h.note}</p>
                      <p className="text-[11px] text-gray-400">{fmtDateTime(h.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inline actions */}
          <InlineActions app={app} onRefresh={onRefresh} />

          {/* Rating & review */}
          <VendorReview
            app={app}
            communityId={communityId}
            existingReview={review || null}
            onSaved={onRefresh}
          />

          {/* Link to full detail */}
          <Link to={`/manager/application/${app.id}`}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1 block">
            Open full application →
          </Link>
        </div>
      )}
    </div>
  )
}

function DetailRow({ icon, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-sm flex-shrink-0">{icon}</span>
      <span className="text-xs text-gray-700 leading-snug">{value}</span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyVendors() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [reviews, setReviews] = useState([])
  const [community, setCommunity] = useState(null)
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('')

  function load() {
    if (!user?.communityId) return
    setCommunity(getCommunity(user.communityId))
    setApplications(getApplicationsForCommunity(user.communityId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)))
    setReviews(getReviewsForCommunity(user.communityId))
  }

  useEffect(() => { load() }, [user?.communityId])

  // Lookup map: appId → review
  const reviewByApp = useMemo(() =>
    Object.fromEntries(reviews.map(r => [r.appId, r])),
    [reviews]
  )

  // ── Derived stats ───────────────────────────────────────────────────────────
  const approved = useMemo(() => applications.filter(a => a.status === 'approved'), [applications])
  const pending  = useMemo(() => applications.filter(a => a.status === 'pending'),  [applications])
  const denied   = useMemo(() => applications.filter(a => a.status === 'denied'),   [applications])

  const recentActivity = useMemo(() =>
    [...applications]
      .flatMap(a => (a.statusHistory || []).map(h => ({ ...h, businessName: a.businessName, appId: a.id })))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5),
    [applications]
  )

  const approvedCategories = useMemo(() =>
    [...new Set(approved.map(a => a.serviceCategory).filter(Boolean))],
    [approved]
  )

  const missingCategories = useMemo(() =>
    ALL_CATEGORIES.filter(c => !approvedCategories.includes(c)).slice(0, 6),
    [approvedCategories]
  )

  const newThisMonth = useMemo(() =>
    applications.filter(a => daysAgo(a.submittedAt) <= 30).length,
    [applications]
  )

  // ── Filtered list ───────────────────────────────────────────────────────────
  const availableCategories = useMemo(() =>
    [...new Set(applications.map(a => a.serviceCategory).filter(Boolean))].sort(),
    [applications]
  )

  const filtered = useMemo(() => {
    let list = applications
    if (activeTab !== 'All') list = list.filter(a => a.status === activeTab.toLowerCase())
    if (categoryFilter) list = list.filter(a => a.serviceCategory === categoryFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.businessName?.toLowerCase().includes(q) ||
        a.contactName?.toLowerCase().includes(q) ||
        a.serviceCategory?.toLowerCase().includes(q)
      )
    }
    return list
  }, [applications, activeTab, categoryFilter, search])

  if (!user?.communityId) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <p className="text-sm text-gray-500">No community assigned. Contact your administrator.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Hero banner ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 pt-7 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-7">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">My Community</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">My Vendors</h1>
              {community && <p className="text-blue-200 text-sm mt-0.5">{community.name}</p>}
            </div>
            <div className="flex gap-2">
              {pending.length > 0 && (
                <span className="flex items-center gap-1.5 bg-amber-400/20 border border-amber-300/40 text-amber-100 text-sm font-bold px-3 py-2 rounded-xl">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  {pending.length} pending
                </span>
              )}
            </div>
          </div>

          {/* ── Summary tiles ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '✅', label: 'Approved',       value: approved.length,  bg: 'bg-emerald-500/20', ring: 'ring-emerald-400/40', sub: `${approvedCategories.length} categor${approvedCategories.length === 1 ? 'y' : 'ies'} covered` },
              { icon: '⏳', label: 'Pending Review', value: pending.length,   bg: 'bg-amber-500/20',   ring: 'ring-amber-400/40',   sub: pending.length > 0 ? 'Needs attention' : 'All clear' },
              { icon: '📬', label: 'New this month', value: newThisMonth,     bg: 'bg-white/10',       ring: 'ring-white/20',        sub: 'Applications received' },
              { icon: '🚫', label: 'Not approved',   value: denied.length,    bg: 'bg-white/10',       ring: 'ring-white/20',        sub: 'Total denied' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} ring-1 ${s.ring} rounded-2xl px-4 py-4 backdrop-blur-sm`}>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-white">{s.value}</span>
                  <span className="text-lg">{s.icon}</span>
                </div>
                <p className="text-xs text-blue-100 mt-0.5 leading-snug">{s.label}</p>
                {s.sub && <p className="text-[11px] text-blue-200/70 mt-0.5 leading-snug">{s.sub}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

      {/* ── Recent activity ──────────────────────────────────────────────────── */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {recentActivity.map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  h.status === 'approved' ? 'bg-green-500' : h.status === 'denied' ? 'bg-red-400' : 'bg-amber-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-snug">
                    <span className="font-medium">{h.businessName}</span> — {h.note}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{fmtDateTime(h.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Coverage snapshot ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Service Coverage</h2>
          <span className="text-xs text-gray-400">{approvedCategories.length} of {ALL_CATEGORIES.length} categories</span>
        </div>
        {approvedCategories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {approvedCategories.map(c => (
              <span key={c} className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-lg">
                {SERVICE_ICONS[c] || '📦'} {c}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 mb-3">No approved vendors yet.</p>
        )}
        {missingCategories.length > 0 && (
          <>
            <p className="text-xs text-gray-500 font-medium mb-1.5">Not yet covered:</p>
            <div className="flex flex-wrap gap-1.5">
              {missingCategories.map(c => (
                <span key={c} className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-400 border border-dashed border-gray-200 px-2 py-1 rounded-lg">
                  {SERVICE_ICONS[c] || '📦'} {c}
                </span>
              ))}
              {missingCategories.length < ALL_CATEGORIES.filter(c => !approvedCategories.includes(c)).length && (
                <span className="text-xs text-gray-400 self-center">
                  +{ALL_CATEGORIES.filter(c => !approvedCategories.includes(c)).length - missingCategories.length} more
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Vendor list ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">All Vendors</h2>

        {/* Tabs + search + category filter */}
        <div className="space-y-2 mb-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {TABS.map(tab => {
              const count = tab === 'All' ? applications.length
                : applications.filter(a => a.status === tab.toLowerCase()).length
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setExpandedId(null) }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab ? 'bg-gray-100 text-gray-600' : 'text-gray-400'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search + category */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search vendors…"
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-600 bg-white"
            >
              <option value="">All types</option>
              {availableCategories.map(c => (
                <option key={c} value={c}>{SERVICE_ICONS[c]} {c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-10 text-center">
            <p className="text-sm text-gray-400">No vendors match your filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(app => (
              <VendorCard
                key={app.id}
                app={app}
                review={reviewByApp[app.id] || null}
                communityId={user.communityId}
                expanded={expandedId === app.id}
                onToggle={() => setExpandedId(expandedId === app.id ? null : app.id)}
                onRefresh={load}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
