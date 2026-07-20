import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useVendorData } from '../../hooks/useVendorData'

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending:  { label: 'Pending Review', bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-400' },
  approved: { label: 'Approved',       bg: 'bg-emerald-100',text: 'text-emerald-800',dot: 'bg-emerald-500' },
  denied:   { label: 'Not Approved',   bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-400' },
  revoked:  { label: 'Revoked',        bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-300' },
}

// ── Helpers ───────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── Onboarding Checklist ──────────────────────────────────────

function OnboardingChecklist({ steps }) {
  const doneCount = steps.filter((s) => s.done).length
  if (doneCount === steps.length) return null
  return (
    <section className="bg-white rounded-2xl border-2 border-[#b3d4ed] shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-[#1a73c8] to-[#0d3f73] px-6 py-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-sm">🚀 Get Started with Vendor Hub</h2>
          <p className="text-blue-100 text-xs mt-0.5">Complete these steps to start landing community contracts</p>
        </div>
        <span className="text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-full flex-shrink-0">
          {doneCount} of {steps.length} done
        </span>
      </div>
      {/* progress bar */}
      <div className="h-1.5 bg-gray-100">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>
      <div className="divide-y divide-gray-50">
        {steps.map((step, i) => (
          <div key={step.label} className={`px-6 py-4 flex items-center gap-4 ${step.done ? 'opacity-60' : ''}`}>
            {step.done ? (
              <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full border-2 border-[#b3d4ed] bg-[#f0f7fd] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[#1a73c8]">{i + 1}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${step.done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{step.label}</p>
              {!step.done && <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>}
            </div>
            {!step.done && (
              <Link
                to={step.to}
                className="flex-shrink-0 text-xs font-bold bg-[#1a73c8] text-white px-3.5 py-2 rounded-xl hover:bg-[#135aa0] transition-colors"
              >
                {step.cta} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Main Dashboard ───────────────────────────────────────────

export default function VendorPortalDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    loaded, apps, messages,
    companyProfile, profile,
    approvedApps, pendingApps, deniedApps, revokedApps,
    vendorInfo, activityFeed,
  } = useVendorData(user)

  const firstName = user.name?.split(' ')[0] || 'there'
  const goComms = (tab) => navigate(`/vendor/communications${tab ? `?tab=${tab}` : ''}`)

    return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Hero / Stats banner ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-teal-600">
        <div className="max-w-5xl mx-auto px-4 pt-7 pb-8">
          {/* Greeting row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7">
            <div>
              <p className="text-blue-200 text-sm font-medium tracking-wide">{getGreeting()},</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5 leading-tight">
                {firstName}
              </h1>
              <p className="text-blue-100 text-sm mt-1 font-medium">{vendorInfo.businessName}</p>
              {vendorInfo.serviceCategory && (
                <span className="inline-block mt-2 text-xs font-semibold bg-white/15 text-white px-3 py-1 rounded-full border border-white/20">
                  {vendorInfo.serviceCategory}
                </span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => goComms('email')}
                className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                Send Message
              </button>
              <button
                onClick={() => navigate('/vendor/apply')}
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/25 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                + New Application
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '🏘️', label: 'Active Communities', value: approvedApps.length, ring: 'ring-emerald-400/40', bg: 'bg-emerald-500/20' },
              { icon: '⏳', label: 'Pending Review',     value: pendingApps.length,  ring: 'ring-amber-400/40',   bg: 'bg-amber-500/20' },
              { icon: '📨', label: 'Messages Sent',      value: messages.length,     ring: 'ring-blue-300/40',    bg: 'bg-white/10' },
              { icon: '📋', label: 'Total Applications', value: apps.length,         ring: 'ring-white/20',       bg: 'bg-white/10' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} ring-1 ${s.ring} rounded-2xl px-4 py-4 backdrop-blur-sm`}>
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
      <div className="max-w-5xl mx-auto px-4 py-7 space-y-7">

        {/* ── Onboarding checklist (hidden once all steps done) ─────────────── */}
        {loaded && (
          <OnboardingChecklist
            steps={[
              {
                label: 'Set your business location',
                desc: 'Tell us where you operate so we can match you with nearby communities.',
                done: !!profile,
                to: '/vendor/location',
                cta: 'Set Location',
              },
              {
                label: 'Complete your company profile',
                desc: 'Fill it out once — it auto-fills every application you submit.',
                done: !!companyProfile,
                to: '/vendor/profile',
                cta: 'Complete Profile',
              },
              {
                label: 'Apply to a community',
                desc: 'Submit your first application to a senior living community near you.',
                done: apps.length > 0,
                to: '/vendor/apply',
                cta: 'Apply Now',
              },
            ]}
          />
        )}

        {/* ── My Active Communities ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">My Active Communities</h2>
            {approvedApps.length > 0 && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                {approvedApps.length} approved
              </span>
            )}
          </div>

          {approvedApps.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">No approved communities yet</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mb-5">
                Once a community manager approves your application, your partnership appears here and you can begin communicating.
              </p>
              <Link
                to="/vendor/apply"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1a73c8] to-[#0d3f73] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:from-[#135aa0] hover:to-[#0d3f73] shadow-sm"
              >
                Apply to a Community
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {approvedApps.map((app) => {
                const approvedAt = app.statusHistory?.find((h) => h.status === 'approved')?.timestamp
                return (
                  <div key={app.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                    <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {app.community?.logoUrl ? (
                            <img src={app.community.logoUrl} alt="" className="w-full h-full object-contain p-1" />
                          ) : (
                            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm leading-snug">{app.community?.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{app.community?.address}</p>
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">Active</span>
                      </div>

                      {/* Care levels */}
                      {app.community?.careLevels?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {app.community.careLevels.slice(0, 3).map((cl) => (
                            <span key={cl} className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{cl}</span>
                          ))}
                          {app.community.careLevels.length > 3 && (
                            <span className="text-[11px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">+{app.community.careLevels.length - 3}</span>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mb-3">
                        Partner since {formatDate(approvedAt || app.submittedAt)}
                      </p>

                      {/* Community contact info */}
                      {(app.community?.showUrl || app.community?.showEmail || app.community?.showPhone) && (
                        <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 mb-3 space-y-1.5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Contact</p>
                          {app.community.showPhone && app.community.contactPhone && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">📞</span>
                              <a href={`tel:${app.community.contactPhone}`} className="text-xs text-blue-600 hover:underline font-medium">
                                {app.community.contactPhone}
                              </a>
                            </div>
                          )}
                          {app.community.showEmail && app.community.contactEmail && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">✉️</span>
                              <a href={`mailto:${app.community.contactEmail}`} className="text-xs text-blue-600 hover:underline font-medium truncate">
                                {app.community.contactEmail}
                              </a>
                            </div>
                          )}
                          {app.community.showUrl && app.community.contactUrl && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">🌐</span>
                              <a
                                href={app.community.contactUrl.startsWith('http') ? app.community.contactUrl : `https://${app.community.contactUrl}`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline font-medium truncate"
                              >
                                {app.community.contactUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => goComms('email')}
                          className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                          </svg>
                          Send Email
                        </button>
                        <button
                          onClick={() => goComms('flyer')}
                          className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-teal-50 text-teal-600 hover:bg-teal-100 px-3 py-2 rounded-xl transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                          Send Flyer
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Two-column main ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* ── Left col (2/3) ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-7">

            {/* Application Tracker */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">Application Tracker</h2>
                <Link to="/vendor/status" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                  Manage all
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>

              {apps.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm text-gray-400">No applications yet.</p>
                  <Link to="/vendor/apply" className="text-sm text-blue-600 font-semibold hover:underline mt-2 block">
                    Submit your first application →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {apps.map((app) => (
                    <div key={app.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_CFG[app.status]?.dot || 'bg-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {app.community?.name || 'Unknown Community'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {app.businessName} · Submitted {formatDate(app.submittedAt)}
                        </p>
                        {app.notes?.length > 0 && (
                          <p className="text-xs text-blue-600 mt-1 truncate">
                            💬 {app.notes[app.notes.length - 1].text}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ── Right col (1/3) ────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Quick Actions */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/vendor/apply')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#1a73c8] to-[#0d3f73] text-white text-sm font-bold hover:from-[#135aa0] hover:to-[#0d3f73] shadow-sm transition-all text-left"
                >
                  <span className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 text-base">➕</span>
                  Apply to New Community
                </button>
                {[
                  { icon: '✉️', label: 'Send Email',         action: () => goComms('email') },
                  { icon: '🎨', label: 'Create a Flyer',     action: () => goComms('flyer') },
                  { icon: '📍', label: 'Update My Location',  action: () => navigate('/vendor/location') },
                  { icon: '📋', label: 'Manage Applications', action: () => navigate('/vendor/status') },
                ].map((a) => (
                  <button
                    key={a.label}
                    onClick={a.action}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-medium transition-colors text-left"
                  >
                    <span className="text-base flex-shrink-0">{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Status Summary */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Application Status</h2>
              <div className="space-y-2.5">
                {[
                  { label: 'Approved',      count: approvedApps.length, bar: 'bg-emerald-500', track: 'bg-emerald-100', text: 'text-emerald-700' },
                  { label: 'Pending',       count: pendingApps.length,  bar: 'bg-amber-400',   track: 'bg-amber-100',   text: 'text-amber-700' },
                  { label: 'Not Approved',  count: deniedApps.length,   bar: 'bg-red-400',     track: 'bg-red-100',     text: 'text-red-600' },
                  { label: 'Revoked',       count: revokedApps.length,  bar: 'bg-gray-300',    track: 'bg-gray-100',    text: 'text-gray-500' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${s.text} w-24 flex-shrink-0`}>{s.label}</span>
                    <div className={`flex-1 h-1.5 rounded-full ${s.track} overflow-hidden`}>
                      <div
                        className={`h-full rounded-full ${s.bar} transition-all`}
                        style={{ width: apps.length ? `${(s.count / apps.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${s.text} w-4 text-right flex-shrink-0`}>{s.count}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Activity */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Recent Activity</h2>
              {activityFeed.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No activity yet.</p>
              ) : (
                <div className="space-y-4">
                  {activityFeed.map((h, i) => {
                    const cfg = STATUS_CFG[h.status] || STATUS_CFG.pending
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <span className={`w-2.5 h-2.5 rounded-full mt-0.5 ${cfg.dot}`} />
                          {i < activityFeed.length - 1 && (
                            <div className="w-px flex-1 bg-gray-100 mt-1.5" />
                          )}
                        </div>
                        <div className="pb-3 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 leading-snug">{h.note}</p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{h.communityName}</p>
                          <p className="text-xs text-gray-300 mt-0.5">{formatDate(h.timestamp)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
    </div>
  )

}
