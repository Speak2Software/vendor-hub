import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useVendorData } from '../../hooks/useVendorData'
import { getCommunities, haversineDistance } from '../../utils/storage'
import { normalizeLocations } from '../../utils/vendorLocations'
import PageLoader from '../../components/PageLoader'

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
          <h2 className="text-white font-bold text-sm">🚀 Get started with Vendor Hub</h2>
          <p className="text-blue-100 text-xs mt-0.5">Finish these steps to start landing community contracts</p>
        </div>
        <span className="text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-full flex-shrink-0">
          {doneCount} of {steps.length} done
        </span>
      </div>
      <div className="h-1.5 bg-gray-100">
        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
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
              <Link to={step.to} className="flex-shrink-0 text-xs font-bold bg-[#1a73c8] text-white px-3.5 py-2 rounded-xl hover:bg-[#135aa0] transition-colors">
                {step.cta} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Community card (nearby, not yet applied) ──────────────────────────────────

function NearbyCommunityCard({ community }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col hover:border-blue-300 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {community.logoUrl ? (
            <img src={community.logoUrl} alt="" className="w-full h-full object-contain p-1" />
          ) : (
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-snug">{community.name}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{community.address}</p>
          {community.distanceMiles != null && (
            <p className="text-xs text-blue-600 font-semibold mt-1">📍 {community.distanceMiles} mi away</p>
          )}
        </div>
      </div>

      {community.careLevels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {community.careLevels.slice(0, 3).map((cl) => (
            <span key={cl} className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{cl}</span>
          ))}
          {community.careLevels.length > 3 && (
            <span className="text-[11px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">+{community.careLevels.length - 3}</span>
          )}
        </div>
      )}

      <Link
        to={`/vendor/apply?community=${community.id}`}
        className="mt-4 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#1a73c8] to-[#0d3f73] text-white px-4 py-2 rounded-xl text-sm font-bold hover:from-[#135aa0] hover:to-[#0d3f73] transition-all"
      >
        Apply to this community →
      </Link>
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────

export default function VendorPortalDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    loaded, apps,
    companyProfile, profile,
    approvedApps, pendingApps, deniedApps,
    vendorInfo, activityFeed,
  } = useVendorData(user)

  const [communities, setCommunities] = useState([])
  useEffect(() => {
    getCommunities().then(setCommunities).catch(() => setCommunities([]))
  }, [])

  const firstName = user.name?.split(' ')[0] || 'there'

  // ── Communities near the vendor's location(s), excluding ones already applied to
  const vendorLocs = useMemo(() => normalizeLocations(profile), [profile])
  const nearbyCommunities = useMemo(() => {
    if (!vendorLocs.length) return []
    const appliedIds = new Set(apps.map((a) => a.communityId))
    return communities
      .filter((c) => c.location && !appliedIds.has(c.id))
      .map((c) => {
        const dist = Math.min(...vendorLocs.map((l) => haversineDistance(l.lat, l.lng, c.location.lat, c.location.lng)))
        return { ...c, distanceMiles: Math.round(dist * 10) / 10 }
      })
      .sort((a, b) => a.distanceMiles - b.distanceMiles)
      .slice(0, 4)
  }, [communities, vendorLocs, apps])

  const stats = [
    { label: 'Active communities', value: approvedApps.length, dot: 'bg-emerald-400' },
    { label: 'Pending',            value: pendingApps.length,  dot: 'bg-amber-400' },
    { label: 'Not approved',       value: deniedApps.length,   dot: 'bg-rose-400' },
    { label: 'Total applications', value: apps.length,         dot: 'bg-sky-300' },
  ]

  if (!loaded) return <PageLoader label="Loading your dashboard…" />

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Hero + stats ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-[#0d3f73] via-[#135aa0] to-[#1a73c8]">
        <div className="max-w-5xl mx-auto px-4 pt-7 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
            <div>
              <p className="text-blue-200 text-sm font-medium tracking-wide">{getGreeting()},</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5 leading-tight">{firstName}</h1>
              <p className="text-blue-100 text-sm mt-1 font-medium">{vendorInfo.businessName}</p>
              {vendorInfo.serviceCategory && (
                <span className="inline-block mt-2 text-xs font-semibold bg-white/15 text-white px-3 py-1 rounded-full border border-white/20">
                  {vendorInfo.serviceCategory}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/vendor/apply')}
              className="flex items-center justify-center gap-2 bg-white text-[#0d3f73] hover:bg-blue-50 px-5 py-3 rounded-xl text-sm font-bold shadow-sm transition-all flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Apply to a community
            </button>
          </div>

          {/* Compact stat box */}
          <div className="bg-white/10 ring-1 ring-white/20 rounded-2xl px-4 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3.5">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${s.dot} flex-shrink-0`} />
                <div className="leading-none min-w-0">
                  <div className="text-xl font-extrabold text-white tabular-nums">{s.value}</div>
                  <div className="text-[11px] text-blue-100 mt-1 truncate">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page body (single clean column) ──────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-7 space-y-7">

        {/* Onboarding checklist (hidden once all steps done) */}
        {loaded && (
          <OnboardingChecklist
            steps={[
              { label: 'Set your business location', desc: 'Tell us where you operate so we can match you with nearby communities.', done: !!profile, to: '/vendor/location', cta: 'Set Location' },
              { label: 'Complete your company profile', desc: 'Fill it out once — it auto-fills every application you submit.', done: !!companyProfile, to: '/vendor/profile', cta: 'Complete Profile' },
              { label: 'Apply to a community', desc: 'Submit your first application to a senior living community near you.', done: apps.length > 0, to: '/vendor/apply', cta: 'Apply Now' },
            ]}
          />
        )}

        {/* ── Communities near you ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">Communities near you</h2>
            <Link to="/vendor/apply" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
              See all
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>

          {!profile ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3 text-2xl">📍</div>
              <p className="text-sm font-bold text-gray-800">Set your location to see nearby communities</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Add where your business operates and we'll show the senior living communities closest to you.</p>
              <Link to="/vendor/location" className="inline-flex items-center gap-2 mt-4 bg-gradient-to-r from-[#1a73c8] to-[#0d3f73] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:from-[#135aa0] hover:to-[#0d3f73] transition-all">
                Set my location →
              </Link>
            </div>
          ) : nearbyCommunities.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
              <p className="text-sm font-semibold text-gray-600">You've reached every community near you</p>
              <p className="text-xs text-gray-400 mt-1">You've already applied to the communities closest to your location. Nice work!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {nearbyCommunities.map((c) => <NearbyCommunityCard key={c.id} community={c} />)}
            </div>
          )}
        </section>

        {/* ── My Active Communities ──────────────────────────────────────────── */}
        {approvedApps.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800">My active communities</h2>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                {approvedApps.length} approved
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {approvedApps.map((app) => {
                const approvedAt = app.statusHistory?.find((h) => h.status === 'approved')?.timestamp
                return (
                  <div key={app.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
                    <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
                    <div className="p-5">
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

                      <p className="text-xs text-gray-400 mb-3">Partner since {formatDate(approvedAt || app.submittedAt)}</p>

                      {(app.community?.showUrl || app.community?.showEmail || app.community?.showPhone) && (
                        <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 mb-3 space-y-1.5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Contact</p>
                          {app.community.showPhone && app.community.contactPhone && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">📞</span>
                              <a href={`tel:${app.community.contactPhone}`} className="text-xs text-blue-600 hover:underline font-medium">{app.community.contactPhone}</a>
                            </div>
                          )}
                          {app.community.showEmail && app.community.contactEmail && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">✉️</span>
                              <a href={`mailto:${app.community.contactEmail}`} className="text-xs text-blue-600 hover:underline font-medium truncate">{app.community.contactEmail}</a>
                            </div>
                          )}
                          {app.community.showUrl && app.community.contactUrl && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">🌐</span>
                              <a href={app.community.contactUrl.startsWith('http') ? app.community.contactUrl : `https://${app.community.contactUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-medium truncate">{app.community.contactUrl}</a>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => navigate('/vendor/communications?tab=email')} className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors">
                          <span>✉️</span> Send email
                        </button>
                        <button onClick={() => navigate('/vendor/communications?tab=flyer')} className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-teal-50 text-teal-600 hover:bg-teal-100 px-3 py-2 rounded-xl transition-colors">
                          <span>🎨</span> Send flyer
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Application Tracker ─────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">My applications</h2>
            {apps.length > 0 && (
              <Link to="/vendor/status" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                Manage all
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            )}
          </div>

          {apps.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-500">You haven't applied anywhere yet.</p>
              <Link to="/vendor/apply" className="text-sm text-blue-600 font-semibold hover:underline mt-2 inline-block">
                Submit your first application →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {apps.map((app) => (
                <div key={app.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_CFG[app.status]?.dot || 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{app.community?.name || 'Unknown Community'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Submitted {formatDate(app.submittedAt)}</p>
                    {app.notes?.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1 truncate">💬 {app.notes[app.notes.length - 1].text}</p>
                    )}
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Recent Activity ────────────────────────────────────────────────── */}
        {activityFeed.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Recent activity</h2>
            <div className="space-y-4">
              {activityFeed.map((h, i) => {
                const cfg = STATUS_CFG[h.status] || STATUS_CFG.pending
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <span className={`w-2.5 h-2.5 rounded-full mt-0.5 ${cfg.dot}`} />
                      {i < activityFeed.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1.5" />}
                    </div>
                    <div className="pb-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 leading-snug">{h.note}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{h.communityName} · {formatDate(h.timestamp)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
