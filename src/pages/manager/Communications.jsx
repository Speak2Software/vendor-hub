import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { sendBroadcast } from '../../utils/storage'
import MessagingCenter from '../../components/MessagingCenter'
import RecruitmentFlyerCreator from '../../components/flyer/RecruitmentFlyer'
import { useManagerData } from '../../hooks/useManagerData'

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}


const COMMS_TABS = ['messages', 'broadcast', 'flyer']

export default function ManagerCommunications() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const {
    reload, approved, broadcasts, community,
    enrichedThreads, availableParties, totalUnread,
  } = useManagerData(user)

  const requested = searchParams.get('tab')
  const [tab, setTab] = useState(COMMS_TABS.includes(requested) ? requested : 'messages')
  useEffect(() => {
    const t = searchParams.get('tab')
    if (COMMS_TABS.includes(t)) setTab(t)
  }, [searchParams])

  const [broadcastSubject, setBroadcastSubject]       = useState('')
  const [broadcastBody, setBroadcastBody]             = useState('')
  const [broadcastRecipients, setBroadcastRecipients] = useState([])
  const [broadcastSending, setBroadcastSending]       = useState(false)
  const [broadcastSent, setBroadcastSent]             = useState(false)
  const [broadcastError, setBroadcastError]           = useState('')

  function toggleBroadcastRecipient(vendorId) {
    setBroadcastRecipients((prev) =>
      prev.includes(vendorId) ? prev.filter((x) => x !== vendorId) : [...prev, vendorId]
    )
  }

  async function handleSendBroadcast(e) {
    e.preventDefault()
    if (!broadcastBody.trim()) { setBroadcastError('Message body is required.'); return }
    setBroadcastError('')
    setBroadcastSending(true)
    try {
      await sendBroadcast({
        vendorIds: broadcastRecipients.length > 0 ? broadcastRecipients : approved.map((a) => a.vendorId),
        subject:   broadcastSubject.trim(),
        body:      broadcastBody.trim(),
      })
      setBroadcastSent(true)
      setBroadcastSubject('')
      setBroadcastBody('')
      setBroadcastRecipients([])
      await reload()
      setTimeout(() => setBroadcastSent(false), 3000)
    } finally {
      setBroadcastSending(false)
    }
  }

  const tabs = [
    { id: 'messages',  icon: '\ud83d\udcac', label: totalUnread > 0 ? `My Messages (${totalUnread})` : 'My Messages' },
    { id: 'broadcast', icon: '\ud83d\udce2', label: 'Vendor Broadcast' },
    { id: 'flyer',     icon: '\ud83d\udccb', label: 'Recruitment Flyer' },
  ]

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
      <div className="bg-gradient-to-r from-[#1a73c8] to-[#0d3f73]">
        <div className="max-w-4xl mx-auto px-4 pt-7 pb-7 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Communications</h1>
            <p className="text-blue-100 text-sm mt-0.5">Message vendors directly or broadcast to your network</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-7">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100 bg-gray-50/50 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60'
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === 'messages' && (
              <MessagingCenter
                threads={enrichedThreads}
                availableParties={availableParties}
                onRefresh={reload}
                autoOpenVendorId={searchParams.get('vendorId')}
              />
            )}

            {tab === 'broadcast' && (
              <div className="space-y-6">
                <form onSubmit={handleSendBroadcast} className="space-y-5">
                  {/* Recipient selector */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Send To — Approved Vendors
                    </p>
                    {approved.length === 0 ? (
                      <p className="text-xs text-gray-400 italic bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                        No approved vendors yet. Approve vendor applications to send broadcasts.
                      </p>
                    ) : (
                      <>
                        <div className="space-y-2 mb-2">
                          {approved.map((app) => (
                            <label
                              key={app.id}
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                                broadcastRecipients.includes(app.vendorId) || broadcastRecipients.length === 0
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'bg-white border-gray-200 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={broadcastRecipients.includes(app.vendorId)}
                                onChange={() => toggleBroadcastRecipient(app.vendorId)}
                                className="w-4 h-4 text-blue-600 rounded accent-blue-600"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{app.businessName}</p>
                                <p className="text-xs text-gray-400 truncate">{app.serviceCategory}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {broadcastRecipients.length === 0
                            ? `All ${approved.length} vendor${approved.length !== 1 ? 's' : ''} will receive this message (select specific vendors to narrow)`
                            : `${broadcastRecipients.length} vendor${broadcastRecipients.length !== 1 ? 's' : ''} selected`}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                      Subject <span className="text-gray-300 font-normal normal-case">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={broadcastSubject}
                      onChange={(e) => setBroadcastSubject(e.target.value)}
                      placeholder="e.g. Important update for our vendor network"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Message</label>
                    <textarea
                      value={broadcastBody}
                      onChange={(e) => setBroadcastBody(e.target.value)}
                      placeholder="Write your message to vendors here..."
                      rows={6}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed"
                    />
                  </div>

                  {broadcastError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
                      {broadcastError}
                    </div>
                  )}

                  {broadcastSent ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-emerald-800">Broadcast sent successfully!</p>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={broadcastSending || approved.length === 0}
                      className="w-full bg-gradient-to-r from-[#1a73c8] to-[#0d3f73] text-white py-3 rounded-xl text-sm font-bold hover:from-[#135aa0] hover:to-[#0d3f73] disabled:opacity-40 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                      </svg>
                      {broadcastSending ? 'Sending…' : 'Send Broadcast'}
                    </button>
                  )}
                </form>

                {/* Sent broadcast history */}
                {broadcasts.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sent Broadcasts</p>
                    <div className="space-y-2">
                      {broadcasts.slice(0, 5).map((bc) => (
                        <div key={bc.id} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {bc.subject && (
                                <p className="text-sm font-semibold text-gray-800 truncate">{bc.subject}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{bc.body.slice(0, 90)}{bc.body.length > 90 ? '…' : ''}</p>
                            </div>
                            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
                              {bc.vendorIds?.length > 0 ? `${bc.vendorIds.length} vendor${bc.vendorIds.length !== 1 ? 's' : ''}` : 'All vendors'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1.5">{formatDate(bc.sentAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Keyed on the community id so the form seeds itself once the
                community finishes loading (its defaults come from that data). */}
            {tab === 'flyer' && (
              <RecruitmentFlyerCreator key={community?.id || 'loading'} community={community} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
