import { useState, useMemo } from 'react'
import { inviteVendor } from '../../utils/storage'
import { useToast } from '../../components/Toast'
import { FlyerPreview, useDebounced } from '../../components/flyer/FlyerKit'
import { buildInviteEmailHTML, defaultInviteSubject } from '../../components/flyer/inviteEmail'

export default function InviteVendorModal({ vendor, community, onClose }) {
  const toast = useToast()
  const [subject, setSubject] = useState(defaultInviteSubject(community))
  const [step, setStep]       = useState('compose') // 'compose' | 'confirm'
  const [sending, setSending] = useState(false)

  const toEmail = vendor.contactEmail || vendor.email || ''
  const vendorName = vendor.displayName || vendor.businessName || vendor.name || 'this vendor'

  const html = useMemo(() => buildInviteEmailHTML({ community }), [community])
  const previewHtml = useDebounced(html, 120)

  async function handleSend() {
    if (!subject.trim() || !toEmail) return
    setSending(true)
    try {
      await inviteVendor({ vendorId: vendor.userId, subject: subject.trim(), html })
      toast.success(`Invite emailed to ${vendorName}`)
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to send invite.')
      setStep('compose')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900">Invite {vendorName}</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {toEmail ? <>Emails <span className="font-medium text-gray-700">{toEmail}</span></> : 'No email on file for this vendor'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {!toEmail ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              This vendor doesn't have an email address on file, so they can't be invited yet.
            </div>
          ) : step === 'compose' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1a73c8]"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Flyer preview — this is the email body</p>
                <div className="rounded-2xl border border-gray-200 bg-gray-100 p-2 overflow-hidden">
                  <FlyerPreview html={previewHtml} />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#eef6fd] flex items-center justify-center mx-auto mb-4 text-2xl">✉️</div>
              <p className="text-sm text-gray-800 font-semibold leading-relaxed max-w-sm mx-auto">
                Are you sure you want to email this message to the vendor <span className="text-[#1a73c8]">{vendorName}</span>?
              </p>
              <p className="text-xs text-gray-500 mt-2">{toEmail}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {toEmail && (
          <div className="flex gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/60">
            {step === 'compose' ? (
              <>
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!subject.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#1a73c8] hover:bg-[#135aa0] disabled:opacity-40 transition-colors"
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setStep('compose')} disabled={sending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50">
                  Back
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {sending ? 'Sending…' : 'Yes, send invite'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
