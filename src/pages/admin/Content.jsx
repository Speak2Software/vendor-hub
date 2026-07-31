import { useState, useEffect } from 'react'
import { getSiteContent, saveSiteContent } from '../../utils/storage'
import { mergeSignupContent } from '../../utils/signupContent'
import { useToast } from '../../components/Toast'

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a73c8] focus:border-transparent'

function Field({ label, hint, value, onChange, textarea, rows = 2, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className={`${inp} resize-none leading-relaxed`} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inp} />
      )}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

export default function AdminContent() {
  const toast = useToast()
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    async function load() {
      const stored = await getSiteContent('signup').catch(() => null)
      setContent(mergeSignupContent(stored))
      setLoading(false)
    }
    load()
  }, [])

  function setHeader(field, value) {
    setContent((c) => ({ ...c, header: { ...c.header, [field]: value } }))
  }
  function setLeft(field, value) {
    setContent((c) => ({ ...c, left: { ...c.left, [field]: value } }))
  }
  function setBenefit(i, field, value) {
    setContent((c) => {
      const benefits = c.left.benefits.map((b, idx) => (idx === i ? { ...b, [field]: value } : b))
      return { ...c, left: { ...c.left, benefits } }
    })
  }
  function addBenefit() {
    setContent((c) => ({ ...c, left: { ...c.left, benefits: [...c.left.benefits, { emoji: '⭐', title: '', desc: '' }] } }))
  }
  function removeBenefit(i) {
    setContent((c) => ({ ...c, left: { ...c.left, benefits: c.left.benefits.filter((_, idx) => idx !== i) } }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveSiteContent('signup', { header: content.header, left: content.left })
      toast.success('Signup content saved')
    } catch (err) {
      toast.error(err.message || 'Failed to save content')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setContent(mergeSignupContent(null))
    toast.info('Reset to defaults — click Save to apply')
  }

  if (loading || !content) {
    return <div className="max-w-3xl mx-auto p-4 py-10 text-sm text-gray-400">Loading content…</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-4 py-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Content</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Edit the signup page's hero header and left column. Changes appear immediately at{' '}
            <a href="/signup" target="_blank" rel="noreferrer" className="text-[#1a73c8] hover:underline">/signup</a>.
          </p>
        </div>
        <button onClick={handleReset} className="text-xs text-gray-500 hover:text-gray-800 font-semibold px-3 py-2 rounded-lg hover:bg-gray-100 flex-shrink-0">
          Reset to defaults
        </button>
      </div>

      <div className="space-y-5">
        {/* ── Header section ─────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#0d3f73] to-[#1a73c8] px-5 py-3">
            <h2 className="text-white font-bold text-sm">Hero Header</h2>
            <p className="text-blue-100 text-xs">The banner at the top of the signup page</p>
          </div>
          <div className="p-5 space-y-4">
            <Field label="Badge pill" value={content.header.badge} onChange={(v) => setHeader('badge', v)} placeholder="Free to join — always" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Title — start" value={content.header.titleLine1} onChange={(v) => setHeader('titleLine1', v)} placeholder="Tap Into a" />
              <Field label="Title — highlight" hint="Shown in the gold gradient" value={content.header.titleHighlight} onChange={(v) => setHeader('titleHighlight', v)} placeholder="$4.3 Trillion" />
              <Field label="Title — end" value={content.header.titleLine2} onChange={(v) => setHeader('titleLine2', v)} placeholder="Market" />
            </div>
            <Field label="Subtitle" textarea rows={3} value={content.header.subtitle} onChange={(v) => setHeader('subtitle', v)} />
          </div>
        </section>

        {/* ── Left column section ────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#0d3f73] to-[#1a73c8] px-5 py-3">
            <h2 className="text-white font-bold text-sm">Left Column</h2>
            <p className="text-blue-100 text-xs">Benefits and testimonial beside the signup form</p>
          </div>
          <div className="p-5 space-y-4">
            <Field label="Eyebrow" value={content.left.eyebrow} onChange={(v) => setLeft('eyebrow', v)} placeholder="Why vendors choose us" />
            <Field label="Heading" value={content.left.heading} onChange={(v) => setLeft('heading', v)} />
            <Field label="Description" textarea rows={3} value={content.left.description} onChange={(v) => setLeft('description', v)} />

            {/* Benefits list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-600">Benefits</label>
                <button onClick={addBenefit} className="text-xs text-[#1a73c8] font-semibold hover:underline">+ Add benefit</button>
              </div>
              <div className="space-y-2">
                {content.left.benefits.map((b, i) => (
                  <div key={i} className="flex gap-2 items-start bg-gray-50 border border-gray-100 rounded-xl p-2.5">
                    <input
                      type="text"
                      value={b.emoji}
                      onChange={(e) => setBenefit(i, 'emoji', e.target.value)}
                      className="w-12 text-center border border-gray-200 rounded-lg px-1 py-2 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1a73c8]"
                      aria-label="Emoji"
                    />
                    <div className="flex-1 space-y-2 min-w-0">
                      <input type="text" value={b.title} onChange={(e) => setBenefit(i, 'title', e.target.value)} placeholder="Benefit title" className={inp} />
                      <textarea value={b.desc} onChange={(e) => setBenefit(i, 'desc', e.target.value)} rows={2} placeholder="Benefit description" className={`${inp} resize-none`} />
                    </div>
                    <button
                      onClick={() => removeBenefit(i)}
                      title="Remove benefit"
                      className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {content.left.benefits.length === 0 && (
                  <p className="text-xs text-gray-400 italic px-1">No benefits — add one above.</p>
                )}
              </div>
            </div>

            {/* Testimonial */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-600 mb-2">Testimonial</p>
              <div className="space-y-3">
                <Field label="Quote" textarea rows={3} value={content.left.testimonialQuote} onChange={(v) => setLeft('testimonialQuote', v)} />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Initials" hint="Shown in the avatar" value={content.left.testimonialInitials} onChange={(v) => setLeft('testimonialInitials', v)} placeholder="JR" />
                  <Field label="Name" value={content.left.testimonialName} onChange={(v) => setLeft('testimonialName', v)} placeholder="James R." />
                  <Field label="Title / company" value={content.left.testimonialTitle} onChange={(v) => setLeft('testimonialTitle', v)} placeholder="Owner, BrightCare" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Save bar ───────────────────────────────────────────────────── */}
        <div className="sticky bottom-0 bg-gray-50/80 backdrop-blur-sm py-3 -mx-4 px-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-[#1a73c8] to-[#0d3f73] text-white py-3 rounded-xl text-sm font-bold hover:from-[#135aa0] hover:to-[#0d3f73] disabled:opacity-60 transition-all shadow-sm"
          >
            {saving ? 'Saving…' : 'Save Content'}
          </button>
        </div>
      </div>
    </div>
  )
}
