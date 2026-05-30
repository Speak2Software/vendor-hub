import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getApplication,
  addApplicationNote,
  updateApplicationStatus,
  getCommunity,
  getCompanyProfile,
} from '../../utils/storage'

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <dt className="text-xs font-medium text-gray-500 sm:w-40 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 mt-0.5 sm:mt-0">{value}</dd>
    </div>
  )
}

const statusConfig = {
  pending:  { label: 'Pending Review', bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-200' },
  approved: { label: 'Approved',       bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-200' },
  denied:   { label: 'Not Approved',   bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-200' },
}

export default function ApplicationDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [app, setApp] = useState(null)
  const [community, setCommunity] = useState(null)
  const [companyProfile, setCompanyProfile] = useState(null)
  const [note, setNote] = useState('')
  const [actionNote, setActionNote] = useState('')
  const [showDenyModal, setShowDenyModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)

  async function reload() {
    const a = await getApplication(id)
    if (!a) { navigate('/manager'); return }
    setApp(a)
    const [comm, cp] = await Promise.all([
      getCommunity(a.communityId),
      getCompanyProfile(a.vendorId),
    ])
    setCommunity(comm)
    setCompanyProfile(cp)
  }

  useEffect(() => { reload() }, [id])

  async function handleAddNote(e) {
    e.preventDefault()
    if (!note.trim()) return
    const updated = await addApplicationNote(id, note.trim(), user.id)
    setApp(updated)
    setNote('')
  }

  async function handleApprove() {
    const updated = await updateApplicationStatus(id, 'approved', user.id, actionNote || 'Application approved.')
    setApp(updated)
    setShowApproveModal(false)
    setActionNote('')
  }

  async function handleDeny() {
    const updated = await updateApplicationStatus(id, 'denied', user.id, actionNote || 'Application denied.')
    setApp(updated)
    setShowDenyModal(false)
    setActionNote('')
  }

  if (!app) return null

  const cfg = statusConfig[app.status] || statusConfig.pending

  return (
    <div className="max-w-2xl mx-auto p-4 py-6">
      {/* Back */}
      <Link to="/manager" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{app.businessName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{app.serviceCategory}</p>
            {community && <p className="text-xs text-gray-400 mt-1">Applying to: {community.name}</p>}
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
        </div>

        {/* Action buttons */}
        {app.status === 'pending' && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowApproveModal(true)}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => setShowDenyModal(true)}
              className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200"
            >
              Deny
            </button>
          </div>
        )}
        {app.status !== 'pending' && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
            {app.status === 'approved' && (
              <button
                onClick={() => setShowDenyModal(true)}
                className="text-sm text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
              >
                Revoke approval
              </button>
            )}
            {app.status === 'denied' && (
              <button
                onClick={() => setShowApproveModal(true)}
                className="text-sm text-green-700 hover:text-green-900 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-50 transition-colors"
              >
                Approve anyway
              </button>
            )}
          </div>
        )}
      </div>

      {/* Business info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Business Information</h2>
        <dl className="space-y-2.5">
          <InfoRow label="Contact name" value={app.contactName} />
          <InfoRow label="Email" value={app.contactEmail} />
          <InfoRow label="Phone" value={app.contactPhone} />
          <InfoRow label="Address" value={app.businessAddress} />
          <InfoRow label="Years in business" value={app.yearsInBusiness} />
        </dl>
      </div>

      {/* Services */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Services</h2>
        <dl className="space-y-2.5">
          <InfoRow label="Category" value={app.serviceCategory} />
          <InfoRow label="Description" value={app.businessDescription} />
          <InfoRow label="Services offered" value={app.servicesOffered} />
        </dl>
      </div>

      {/* Compliance */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Compliance & Insurance</h2>
        <dl className="space-y-2.5">
          <InfoRow label="License / cert" value={app.licenseInfo} />
          <InfoRow label="Insurance provider" value={app.insuranceProvider} />
          <InfoRow label="Policy number" value={app.insurancePolicyNumber} />
          <InfoRow label="Policy expiration" value={app.insuranceExpiration} />
          <InfoRow label="Background check" value={app.backgroundCheckConsent ? 'Consented' : 'Not consented'} />
        </dl>
      </div>

      {/* References */}
      {(app.reference1Name || app.reference2Name) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">References</h2>
          <dl className="space-y-4">
            {app.reference1Name && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Reference 1</p>
                <div className="space-y-1.5">
                  <InfoRow label="Name" value={app.reference1Name} />
                  <InfoRow label="Company" value={app.reference1Company} />
                  <InfoRow label="Phone" value={app.reference1Phone} />
                </div>
              </div>
            )}
            {app.reference2Name && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Reference 2</p>
                <div className="space-y-1.5">
                  <InfoRow label="Name" value={app.reference2Name} />
                  <InfoRow label="Company" value={app.reference2Company} />
                  <InfoRow label="Phone" value={app.reference2Phone} />
                </div>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Portfolio & Testimonials — always shown once profile is loaded */}
      {companyProfile !== null && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Portfolio &amp; Testimonials</h2>
          {!companyProfile || !companyProfile.testimonials?.length ? (
            <p className="text-sm text-gray-400 italic">This vendor hasn't added any portfolio items yet.</p>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {companyProfile.testimonials.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all"
              >
                {item.type === 'video' && (() => {
                  const yt = item.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
                  return (
                    <>
                      <div className="relative h-28 bg-gray-900 overflow-hidden">
                        {yt ? (
                          <img src={`https://img.youtube.com/vi/${yt[1]}/mqdefault.jpg`} alt="" className="w-full h-full object-cover opacity-80" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🎬</div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow">
                            <svg className="w-4 h-4 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-2">
                        <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
                        {item.description && <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.description}</p>}
                        <p className="text-[11px] text-blue-500 mt-0.5">Watch video →</p>
                      </div>
                    </>
                  )
                })()}
                {item.type === 'image' && (
                  <>
                    <div className="h-28 overflow-hidden bg-gray-100">
                      <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
                      {item.description && <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.description}</p>}
                    </div>
                  </>
                )}
                {item.type === 'document' && (
                  <div className="flex items-start gap-3 p-3">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0 text-xl border border-red-100">📄</div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
                      {item.fileName && <p className="text-[11px] text-gray-400 truncate">{item.fileName}</p>}
                      {item.description && <p className="text-[11px] text-gray-400 truncate">{item.description}</p>}
                      <p className="text-[11px] text-blue-500 mt-0.5">Open document →</p>
                    </div>
                  </div>
                )}
              </a>
            ))}
          </div>
          )}
        </div>
      )}

      {/* Status history */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Status History</h2>
        <div className="space-y-3">
          {(app.statusHistory || []).slice().reverse().map((h, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                  h.status === 'approved' ? 'bg-green-500' :
                  h.status === 'denied' ? 'bg-red-400' : 'bg-amber-400'
                }`} />
                {i < (app.statusHistory?.length || 0) - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
              </div>
              <div className="pb-3">
                <p className="text-xs font-medium text-gray-700">{h.note}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(h.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Manager Notes</h2>
        {app.notes?.length > 0 ? (
          <div className="space-y-3 mb-4">
            {app.notes.slice().reverse().map((n) => (
              <div key={n.id} className="bg-gray-50 rounded-lg px-3 py-2.5">
                <p className="text-sm text-gray-800">{n.text}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(n.timestamp)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-4">No notes yet.</p>
        )}
        <form onSubmit={handleAddNote} className="flex gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note…"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!note.trim()}
            className="bg-[#1a73c8] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#135aa0] disabled:opacity-40 transition-colors"
          >
            Add
          </button>
        </form>
      </div>

      {/* Approve modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Approve vendor?</h3>
            <p className="text-sm text-gray-500 mb-4">
              <strong>{app.businessName}</strong> will be added to your approved vendor list.
            </p>
            <textarea
              rows={2}
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder="Optional note (e.g., reason for approval)…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowApproveModal(false)} className="flex-1 py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleApprove} className="flex-1 py-2 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700 font-medium">
                Confirm approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deny modal */}
      {showDenyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {app.status === 'approved' ? 'Revoke approval?' : 'Deny application?'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {app.status === 'approved'
                ? `${app.businessName} will be removed from your approved vendor list.`
                : `${app.businessName}'s application will be marked as denied.`}
            </p>
            <textarea
              rows={2}
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder="Reason for denial (recommended)…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowDenyModal(false)} className="flex-1 py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDeny} className="flex-1 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 font-medium">
                {app.status === 'approved' ? 'Revoke' : 'Deny'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
