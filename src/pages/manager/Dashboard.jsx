import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useManagerData } from '../../hooks/useManagerData'
import { printFlyer, FLYER_THEMES } from '../../components/flyer/FlyerKit'
import { buildRecruitmentFlyerHTML, defaultRecruitmentData } from '../../components/flyer/RecruitmentFlyer'
import { buildVendorListHTML } from '../../utils/printVendorList'

export default function ManagerDashboard() {
  const { user } = useAuth()
  const {
    community, applications, approved, pending, denied, totalUnread,
  } = useManagerData(user)

  const [vendorScope, setVendorScope] = useState('approved') // 'approved' | 'all'

  const firstName = user?.name?.split(' ')[0] || 'Manager'

  function handlePrintFlyer() {
    printFlyer(buildRecruitmentFlyerHTML('classic', FLYER_THEMES[0], defaultRecruitmentData(community), { autoPrint: true }))
  }

  function handlePrintVendors() {
    const list = vendorScope === 'approved' ? approved : applications
    printFlyer(buildVendorListHTML(community, list, vendorScope))
  }

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

  const stats = [
    { value: approved.length, label: 'Approved',     dot: 'bg-emerald-400' },
    { value: pending.length,  label: 'Pending',      dot: 'bg-amber-400' },
    { value: denied.length,   label: 'Not approved', dot: 'bg-rose-400' },
    { value: totalUnread,     label: 'Unread',       dot: 'bg-sky-300' },
  ]

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Hero: community details + compact stat box ───────────────────────── */}
      <div className="bg-gradient-to-b from-[#0d3f73] via-[#135aa0] to-[#1a73c8]">
        <div className="max-w-4xl mx-auto px-4 pt-7 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            {/* Community info */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center flex-shrink-0">
                {community?.logoUrl ? (
                  <img src={community.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72" />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-0.5">
                  {firstName}'s Dashboard
                </p>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight truncate">
                  {community?.name || 'My Community'}
                </h1>
                {community?.address && (
                  <p className="text-blue-200 text-xs mt-0.5 truncate">{community.address}</p>
                )}
                {community?.careLevels?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {community.careLevels.map((cl) => (
                      <span key={cl} className="text-[11px] font-medium bg-white/15 text-white px-2 py-0.5 rounded-full border border-white/20">
                        {cl}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Compact stat box */}
            <div className="bg-white/10 ring-1 ring-white/20 rounded-2xl px-4 py-3.5 grid grid-cols-2 gap-x-6 gap-y-3.5 flex-shrink-0 self-start sm:self-center">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.dot} flex-shrink-0`} />
                  <div className="leading-none">
                    <div className="text-xl font-extrabold text-white tabular-nums">{s.value}</div>
                    <div className="text-[11px] text-blue-100 mt-1 whitespace-nowrap">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Primary actions ──────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Print My Flyer (card prints; corner pill edits) */}
          <div
            role="button"
            tabIndex={0}
            onClick={handlePrintFlyer}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePrintFlyer() } }}
            className="group cursor-pointer rounded-3xl p-6 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all bg-gradient-to-br from-[#1a73c8] to-[#0d3f73] flex flex-col"
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                </svg>
              </div>
              {/* Secondary action: edit the flyer (doesn't trigger the print click) */}
              <Link
                to="/manager/communications?tab=flyer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/30 rounded-full pl-2.5 pr-3 py-1.5 text-xs font-bold transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                </svg>
                Edit
              </Link>
            </div>
            <p className="mt-5 text-xl font-extrabold leading-tight">Print My Flyer</p>
            <p className="text-sm text-white/80 leading-snug mt-1">Recruitment flyer to display or hand out · tap Edit to customize</p>
          </div>

          {/* Print Vendor List */}
          <div
            role="button"
            tabIndex={0}
            onClick={handlePrintVendors}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePrintVendors() } }}
            className="group cursor-pointer rounded-3xl p-6 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all bg-gradient-to-br from-emerald-500 to-emerald-700 flex flex-col"
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </div>
              <svg className="w-6 h-6 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
            <p className="mt-5 text-xl font-extrabold leading-tight">Print Vendor List</p>
            <p className="text-sm text-white/80 leading-snug mt-1">Printable contact list for your records</p>
            <div
              className="mt-auto pt-4 inline-flex self-start rounded-lg bg-white/15 p-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              {[['approved', 'Approved'], ['all', 'All']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={(e) => { e.stopPropagation(); setVendorScope(val) }}
                  className={`px-3.5 py-1 rounded-md text-xs font-bold transition-colors ${
                    vendorScope === val ? 'bg-white text-emerald-700' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
