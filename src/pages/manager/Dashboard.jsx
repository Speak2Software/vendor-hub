import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCommunity, getApplicationsForCommunity, getReviewsForCommunity } from '../../utils/storage'
import StarRating from '../../components/StarRating'

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

const SERVICE_CATEGORY_ICONS = {
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

export default function ManagerDashboard() {
  const { user } = useAuth()
  const [community, setCommunity] = useState(null)
  const [applications, setApplications] = useState([])
  const [reviews, setReviews] = useState([])

  async function reload() {
    if (!user?.communityId) return
    const [comm, apps, revs] = await Promise.all([
      getCommunity(user.communityId),
      getApplicationsForCommunity(user.communityId),
      getReviewsForCommunity(user.communityId),
    ])
    setCommunity(comm)
    setApplications(apps.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)))
    setReviews(revs)
  }

  useEffect(() => { reload() }, [user?.communityId])

  const approved = applications.filter((a) => a.status === 'approved')
  const pending  = applications.filter((a) => a.status === 'pending')
  const denied   = applications.filter((a) => a.status === 'denied')
  const reviewByApp = Object.fromEntries(reviews.map((r) => [r.appId, r]))

  const firstName = user?.name?.split(' ')[0] || 'Manager'

  if (!user?.communityId) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
        <div className="text-center">
          <p className="text-gray-500 text-sm">You are not assigned to a community yet.</p>
          <p className="text-gray-400 text-xs mt-1">Please contact your administrator.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Hero banner ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 pt-7 pb-8">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7">
            <div className="flex items-center gap-4">
              {/* Community icon */}
              <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center flex-shrink-0">
                {community?.logoUrl ? (
                  <img src={community.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-0.5">
                  {firstName}'s Dashboard
                </p>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                  {community?.name || 'My Community'}
                </h1>
                {community?.address && (
                  <p className="text-blue-200 text-xs mt-0.5">{community.address}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link
                to="/manager/community"
                className="flex items-center gap-1.5 bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                </svg>
                Edit Profile
              </Link>
              <Link
                to="/manager/vendors"
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/25 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                My Vendors
              </Link>
            </div>
          </div>

          {/* Care levels */}
          {community?.careLevels?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {community.careLevels.map((cl) => (
                <span key={cl} className="text-xs font-medium bg-white/15 text-white px-2.5 py-1 rounded-full border border-white/20">
                  {cl}
                </span>
              ))}
            </div>
          )}

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '✅', label: 'Approved Vendors', value: approved.length, bg: 'bg-emerald-500/20', ring: 'ring-emerald-400/40' },
              { icon: '⏳', label: 'Pending Review',   value: pending.length,  bg: 'bg-amber-500/20',   ring: 'ring-amber-400/40', badge: pending.length > 0 },
              { icon: '🚫', label: 'Not Approved',     value: denied.length,   bg: 'bg-white/10',       ring: 'ring-white/20' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} ring-1 ${s.ring} rounded-2xl px-4 py-4 backdrop-blur-sm relative`}>
                {s.badge && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full text-[10px] font-black text-white flex items-center justify-center">
                    !
                  </span>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-white">{s.value}</span>
                  <span className="text-lg">{s.icon}</span>
                </div>
                <p className="text-xs text-blue-100 mt-1 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page body ────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-7 space-y-7">

        {/* ── Pending applications ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              Pending Applications
              {pending.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-500 text-white text-xs font-black rounded-full">
                  {pending.length}
                </span>
              )}
            </h2>
            {pending.length > 0 && (
              <Link to="/manager/vendors" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                View all
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            )}
          </div>

          {pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-10 text-center">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-sm font-semibold text-gray-600">All caught up!</p>
              <p className="text-xs text-gray-400 mt-1">No pending applications to review.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map((app) => (
                <Link
                  key={app.id}
                  to={`/manager/application/${app.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:border-amber-300 hover:shadow-md transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0 text-xl">
                    {SERVICE_CATEGORY_ICONS[app.serviceCategory] || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{app.businessName}</p>
                    <p className="text-xs text-gray-500 truncate">{app.serviceCategory} · {app.contactName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Submitted {formatDate(app.submittedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">Review →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Approved vendors grid ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">Approved Vendors</h2>
            {approved.length > 0 && (
              <Link to="/manager/vendors" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                Manage all
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            )}
          </div>

          {approved.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-10 text-center">
              <p className="text-2xl mb-2">🤝</p>
              <p className="text-sm font-semibold text-gray-600">No approved vendors yet</p>
              <p className="text-xs text-gray-400 mt-1">Approve vendor applications to build your partner network.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {approved.map((app) => {
                const lastApproved = app.statusHistory?.findLast?.((h) => h.status === 'approved')
                return (
                  <Link
                    key={app.id}
                    to={`/manager/application/${app.id}`}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group overflow-hidden"
                  >
                    <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                    <div className="p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 text-lg">
                        {SERVICE_CATEGORY_ICONS[app.serviceCategory] || '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 truncate">{app.businessName}</p>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 flex-shrink-0">
                            ✓ Approved
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{app.serviceCategory}</p>
                        <p className="text-xs text-gray-400">{app.contactPhone}</p>
                        {reviewByApp[app.id]?.rating > 0 && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <StarRating rating={reviewByApp[app.id].rating} />
                            <span className="text-[11px] text-amber-600 font-medium">{reviewByApp[app.id].rating}/5</span>
                          </div>
                        )}
                        {lastApproved && (
                          <p className="text-xs text-gray-400 mt-1">Since {formatDate(lastApproved.timestamp)}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Denied ────────────────────────────────────────────────────────── */}
        {denied.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-gray-800 mb-4">Denied Applications</h2>
            <div className="space-y-2">
              {denied.map((app) => (
                <Link
                  key={app.id}
                  to={`/manager/application/${app.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:border-red-200 hover:shadow-md transition-all opacity-70 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0 text-lg">
                    {SERVICE_CATEGORY_ICONS[app.serviceCategory] || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{app.businessName}</p>
                    <p className="text-xs text-gray-500 truncate">{app.serviceCategory}</p>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded-full flex-shrink-0">Denied</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
