import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getApplicationsForVendor, getCommunity, revokeApplication } from '../../utils/storage'

const statusConfig = {
  pending:  { label: 'Pending Review', bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-400' },
  approved: { label: 'Approved',       bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500' },
  denied:   { label: 'Not Approved',   bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-400' },
  revoked:  { label: 'Revoked',        bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400' },
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function VendorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [apps, setApps] = useState([])
  const [confirmRevokeId, setConfirmRevokeId] = useState(null)

  async function load() {
    const raw = await getApplicationsForVendor(user.id)
    const enriched = await Promise.all(
      raw.map(async (a) => ({ ...a, community: await getCommunity(a.communityId) })),
    )
    setApps(enriched.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)))
  }

  useEffect(() => { load() }, [user.id])

  async function handleRevoke(id) {
    await revokeApplication(id)
    setConfirmRevokeId(null)
    await load()
  }

  return (
    <div className="max-w-2xl mx-auto p-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Applications</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage your vendor applications</p>
        </div>
        <Link
          to="/vendor/apply"
          className="text-sm bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 shadow-sm transition-all"
        >
          + New application
        </Link>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No applications yet</h3>
          <p className="text-sm text-gray-500 mb-4">Apply to a senior living community to get started.</p>
          <Link to="/vendor/apply" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700">
            Start application
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const cfg = statusConfig[app.status] || statusConfig.pending
            const isPending = app.status === 'pending'
            const isRevoked = app.status === 'revoked'

            return (
              <div key={app.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{app.businessName}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {app.community ? app.community.name : 'Unknown community'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Submitted {formatDate(app.submittedAt)}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} whitespace-nowrap`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>

                {app.statusHistory && app.statusHistory.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-semibold mb-1.5">Recent activity</p>
                    {app.statusHistory.slice(-2).reverse().map((h, i) => (
                      <div key={i} className="flex gap-2 text-xs text-gray-500 mb-1">
                        <span className="text-gray-400 whitespace-nowrap">{formatDate(h.timestamp)}</span>
                        <span>{h.note}</span>
                      </div>
                    ))}
                  </div>
                )}

                {app.notes && app.notes.length > 0 && (
                  <div className="mt-2 bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold">Manager note:</span>{' '}
                      {app.notes[app.notes.length - 1].text}
                    </p>
                  </div>
                )}

                {/* ── Vendor actions ─────────────────────────────────────── */}
                {(isPending || isRevoked) && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                    {isPending && (
                      <>
                        {confirmRevokeId === app.id ? (
                          <div className="flex items-center gap-2 w-full">
                            <p className="text-xs text-gray-600 flex-1">Revoke this application?</p>
                            <button
                              onClick={() => handleRevoke(app.id)}
                              className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Yes, revoke
                            </button>
                            <button
                              onClick={() => setConfirmRevokeId(null)}
                              className="text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRevokeId(app.id)}
                            className="text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Revoke application
                          </button>
                        )}
                      </>
                    )}

                    {isRevoked && (
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">This application was revoked. You can edit and resubmit it.</p>
                        </div>
                        <button
                          onClick={() => navigate(`/vendor/apply?edit=${app.id}`)}
                          className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 px-3 py-1.5 rounded-lg transition-all shadow-sm whitespace-nowrap"
                        >
                          Edit &amp; Resubmit →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
