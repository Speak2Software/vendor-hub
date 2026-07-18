import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../../context/AuthContext'
import {
  getApplicationsForVendor, getCommunity,
  getVendorProfile, getCompanyProfile, getMessagesForVendor, saveMessage,
  getDirectMessageThreads,
} from '../../utils/storage'
import MessagingCenter from '../../components/MessagingCenter'

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending:  { label: 'Pending Review', bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-400' },
  approved: { label: 'Approved',       bg: 'bg-emerald-100',text: 'text-emerald-800',dot: 'bg-emerald-500' },
  denied:   { label: 'Not Approved',   bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-400' },
  revoked:  { label: 'Revoked',        bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-300' },
}

const EMAIL_TEMPLATES = [
  {
    id: 'intro',
    label: '👋 Introduction',
    subject: 'Introducing [Business] — Your Senior Care Partner',
    body: `Dear Community Manager,

I hope this message finds you well. I'm reaching out to formally introduce [Business] and our dedication to serving senior living communities.

We specialize in [Service Category] and have been proudly supporting communities like yours for [X] years. Our team understands the unique needs of residents and staff, and we are committed to delivering compassionate, reliable, and professional service every time.

We'd love the opportunity to learn more about your community and discuss how we can be a trusted partner. Please don't hesitate to reach out — we're here whenever you're ready.

Warm regards,
[Contact Name]
[Business]
[Phone]`,
  },
  {
    id: 'special',
    label: '🌟 Special Offer',
    subject: 'Exclusive Offer for Your Community — Limited Time',
    body: `Dear [Community] Team,

We're excited to share something special with you!

🌟 EXCLUSIVE OFFER: [Describe your offer — e.g., "Complimentary first service visit" or "15% off for the next 30 days"]

This offer is available exclusively for communities in our Vendor Hub network and is valid through [Date].

At [Business], we take pride in delivering exceptional [Service Category] to the seniors in your care. This is a great opportunity to experience our services with zero risk.

To claim this offer or schedule a consultation, simply reply to this message or call us at [Phone].

We look forward to connecting!

Best regards,
[Contact Name]
[Business]`,
  },
  {
    id: 'update',
    label: '📢 Service Update',
    subject: 'Exciting News from [Business]',
    body: `Dear [Community] Team,

We have some exciting updates to share!

[Business] has recently expanded our capabilities to better serve your community and residents:

✅ [New service or improvement]
✅ [New service or improvement]
✅ [New service or improvement]

These enhancements reflect our ongoing commitment to raising the bar for senior living support services.

We'd love to schedule a brief call or visit to walk you through these improvements. Please reach out at your convenience.

With appreciation,
[Contact Name]
[Business]
[Phone]`,
  },
  {
    id: 'seasonal',
    label: '🎉 Seasonal Greeting',
    subject: 'Season\'s Greetings from [Business]',
    body: `Dear [Community] Family,

As the season unfolds, we want to pause and express how grateful we are to partner with your wonderful community.

Serving your residents and supporting your dedicated staff has been one of our greatest privileges. We look forward to continuing this meaningful relationship in the months and years ahead.

Wishing your entire team — and all the residents — a joyful, peaceful, and healthy season.

With warmest regards,
[Contact Name] and the [Business] Team`,
  },
]

const FLYER_TEMPLATES = [
  { id: 'professional', label: 'Professional', gradientFrom: '#2563eb', gradientTo: '#0d9488' },
  { id: 'emerald',      label: 'Fresh Green',  gradientFrom: '#059669', gradientTo: '#0d9488' },
  { id: 'bold',         label: 'Bold Dark',    gradientFrom: '#1e293b', gradientTo: '#334155' },
  { id: 'warm',         label: 'Warm Amber',   gradientFrom: '#d97706', gradientTo: '#ea580c' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Flyer Preview ─────────────────────────────────────────────────────────────

function FlyerPreview({ templateId, data }) {
  const t = FLYER_TEMPLATES.find((x) => x.id === templateId) || FLYER_TEMPLATES[0]
  const gradient = `linear-gradient(135deg, ${t.gradientFrom}, ${t.gradientTo})`

  return (
    <div className="rounded-2xl shadow-lg overflow-hidden border border-gray-200 bg-white text-left" style={{ maxWidth: 520 }}>
      {/* Header */}
      <div style={{ background: gradient, padding: '28px 24px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.78)', marginBottom: 8 }}>
          {data.serviceCategory || 'Professional Services'}
        </p>
        <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: 0 }}>
          {data.businessName || 'Your Business Name'}
        </p>
        {data.tagline && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', marginTop: 7 }}>
            {data.tagline}
          </p>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '24px' }}>
        {data.headline && (
          <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 12 }}>{data.headline}</p>
        )}
        {data.body && (
          <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 18 }}>{data.body}</p>
        )}

        {(data.phone || data.email || data.website) && (
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14, marginBottom: data.cta ? 18 : 0 }}>
            {data.phone   && <p style={{ fontSize: 13, color: '#374151', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>📞 {data.phone}</p>}
            {data.email   && <p style={{ fontSize: 13, color: '#374151', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>✉️ {data.email}</p>}
            {data.website && <p style={{ fontSize: 13, color: '#374151', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>🌐 {data.website}</p>}
          </div>
        )}

        {data.cta && (
          <div style={{ background: gradient, color: '#fff', textAlign: 'center', padding: '13px', borderRadius: 10, fontWeight: 700, fontSize: 13 }}>
            {data.cta}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: '#f9fafb', padding: '12px 24px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Proudly serving senior living communities</p>
      </div>
    </div>
  )
}

// ── Email Composer ────────────────────────────────────────────────────────────

function EmailComposer({ approvedApps, vendorInfo, onSent }) {
  const [recipients, setRecipients]   = useState([])
  const [subject, setSubject]         = useState('')
  const [body, setBody]               = useState('')
  const [activeTemplate, setTemplate] = useState(null)
  const [error, setError]             = useState('')
  const [sent, setSent]               = useState(false)

  function fill(str) {
    return str
      .replace(/\[Business\]/g,        vendorInfo.businessName || 'Our Business')
      .replace(/\[Contact Name\]/g,    vendorInfo.contactName  || 'Our Team')
      .replace(/\[Service Category\]/g,vendorInfo.serviceCategory || 'our services')
      .replace(/\[Phone\]/g,           vendorInfo.phone || '')
      .replace(/\[X\]/g,              vendorInfo.yearsInBusiness || '')
  }

  function applyTemplate(tmpl) {
    setTemplate(tmpl.id)
    setSubject(fill(tmpl.subject))
    setBody(fill(tmpl.body))
  }

  function toggle(id) {
    setRecipients((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function handleSend() {
    if (!recipients.length)  { setError('Select at least one community.'); return }
    if (!subject.trim())     { setError('Subject is required.'); return }
    if (!body.trim())        { setError('Message body is required.'); return }
    setError('')
    await saveMessage({
      id: uuidv4(),
      vendorId: vendorInfo.vendorId,
      type: 'email',
      communityIds: recipients,
      subject: subject.trim(),
      body: body.trim(),
      sentAt: new Date().toISOString(),
    })
    setSent(true)
    setRecipients([])
    setSubject('')
    setBody('')
    setTemplate(null)
    setTimeout(() => { setSent(false); onSent?.() }, 3000)
  }

  return (
    <div className="space-y-5">
      {/* Template picker */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Start with a Template</p>
        <div className="grid grid-cols-2 gap-2">
          {EMAIL_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTemplate(t)}
              className={`text-left px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                activeTemplate === t.id
                  ? 'bg-[#1a73c8] text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipients */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">To — Approved Communities</p>
        {approvedApps.length === 0 ? (
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 italic">No approved communities yet. Once a community approves you, they'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {approvedApps.map((app) => (
              <label
                key={app.id}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                  recipients.includes(app.communityId)
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={recipients.includes(app.communityId)}
                  onChange={() => toggle(app.communityId)}
                  className="w-4 h-4 text-blue-600 rounded accent-blue-600"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{app.community?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{app.community?.address}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Subject */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject line..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Body */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message here, or choose a template above to get started..."
          rows={9}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{body.length} characters</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {sent ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-emerald-800">Message sent to {recipients.length} communit{recipients.length === 1 ? 'y' : 'ies'}!</p>
        </div>
      ) : (
        <button
          onClick={handleSend}
          className="w-full bg-gradient-to-r from-[#1a73c8] to-[#0d3f73] text-white py-3 rounded-xl text-sm font-bold hover:from-[#135aa0] hover:to-[#0d3f73] transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
          Send Message
        </button>
      )}
    </div>
  )
}

// ── Flyer Creator ─────────────────────────────────────────────────────────────

function FlyerCreator({ vendorInfo, approvedApps, onSent }) {
  const [templateId, setTemplateId] = useState('professional')
  const [sendTo, setSendTo]         = useState([])
  const [flyerSent, setFlyerSent]   = useState(false)
  const [data, setData]             = useState({
    businessName:    vendorInfo.businessName  || '',
    serviceCategory: vendorInfo.serviceCategory || '',
    tagline:  '',
    headline: '',
    body:     '',
    cta:      'Contact Us Today',
    phone:    vendorInfo.phone || '',
    email:    vendorInfo.email || '',
    website:  '',
  })

  function update(field, value) { setData((p) => ({ ...p, [field]: value })) }

  function toggleSend(id) {
    setSendTo((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function handlePrint() {
    const t    = FLYER_TEMPLATES.find((x) => x.id === templateId) || FLYER_TEMPLATES[0]
    const grad = `linear-gradient(135deg, ${t.gradientFrom}, ${t.gradientTo})`
    const win  = window.open('', '_blank', 'width=680,height=960')

    // Escape any HTML special characters in user-supplied text
    const esc = (s = '') => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${esc(data.businessName) || 'Flyer'}</title>
  <style>
    /* ── Force browsers to print background colours & gradients ── */
    * {
      -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
      box-sizing: border-box;
      margin: 0; padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: #f3f4f6;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      min-height: 100vh;
      padding: 40px 32px;
    }

    /* ── Flyer card ── */
    .flyer {
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.18);
    }

    /* ── Header — gradient band ── */
    .header {
      background: ${grad};
      padding: 28px 24px;
      color: #ffffff;
    }
    .header .cat {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(255,255,255,0.78);
      margin-bottom: 8px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 800;
      line-height: 1.2;
      color: #ffffff;
    }
    .header .tag {
      font-size: 13px;
      color: rgba(255,255,255,0.88);
      margin-top: 7px;
    }

    /* ── Body ── */
    .body { padding: 24px; }
    .headline {
      font-size: 17px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 12px;
    }
    .desc {
      font-size: 13px;
      color: #4b5563;
      line-height: 1.7;
      white-space: pre-line;
      margin-bottom: 18px;
    }

    /* ── Contact rows ── */
    .contacts {
      border-top: 1px solid #f3f4f6;
      padding-top: 14px;
      margin-bottom: 18px;
    }
    .contact-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #374151;
      margin-bottom: 6px;
    }
    .contact-row .icon { flex-shrink: 0; width: 18px; text-align: center; }

    /* ── CTA button ── */
    .cta {
      background: ${grad};
      color: #ffffff;
      text-align: center;
      padding: 13px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 13px;
    }

    /* ── Footer ── */
    .footer {
      background: #f9fafb;
      padding: 12px 24px;
      border-top: 1px solid #f3f4f6;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }

    /* ── Print overrides ── */
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
        display: block;
      }
      .flyer {
        box-shadow: none !important;
        border-radius: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div class="flyer">
    <div class="header">
      <div class="cat">${esc(data.serviceCategory) || 'Professional Services'}</div>
      <h1>${esc(data.businessName) || 'Business Name'}</h1>
      ${data.tagline ? `<div class="tag">${esc(data.tagline)}</div>` : ''}
    </div>

    <div class="body">
      ${data.headline ? `<div class="headline">${esc(data.headline)}</div>` : ''}
      ${data.body     ? `<div class="desc">${esc(data.body)}</div>`         : ''}

      ${(data.phone || data.email || data.website) ? `
      <div class="contacts">
        ${data.phone   ? `<div class="contact-row"><span class="icon">📞</span>${esc(data.phone)}</div>`   : ''}
        ${data.email   ? `<div class="contact-row"><span class="icon">✉️</span>${esc(data.email)}</div>`   : ''}
        ${data.website ? `<div class="contact-row"><span class="icon">🌐</span>${esc(data.website)}</div>` : ''}
      </div>` : ''}

      ${data.cta ? `<div class="cta">${esc(data.cta)}</div>` : ''}
    </div>

    <div class="footer">Proudly serving senior living communities</div>
  </div>

  <script>
    // Wait for styles + fonts to settle before triggering print
    window.addEventListener('load', function () {
      setTimeout(function () { window.print() }, 250)
    })
  </script>
</body>
</html>`)
    win.document.close()
  }

  async function handleSendFlyer() {
    if (!sendTo.length) return
    await saveMessage({
      id: uuidv4(),
      vendorId: vendorInfo.vendorId,
      type: 'flyer',
      communityIds: sendTo,
      subject: data.headline || `Flyer from ${data.businessName}`,
      body: data.body,
      flyerTemplate: templateId,
      flyerData: data,
      sentAt: new Date().toISOString(),
    })
    setFlyerSent(true)
    setSendTo([])
    setTimeout(() => { setFlyerSent(false); onSent?.() }, 3000)
  }

  const fields = [
    { key: 'businessName',    label: 'Business Name',          placeholder: 'Your business name' },
    { key: 'serviceCategory', label: 'Service Type',           placeholder: 'e.g. Transportation, Housekeeping' },
    { key: 'tagline',         label: 'Tagline',                placeholder: 'A short memorable phrase (optional)' },
    { key: 'headline',        label: 'Headline',               placeholder: 'e.g. "Now Serving Your Community!"' },
  ]

  return (
    <div className="space-y-5">
      {/* Template selector */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Choose a Style</p>
        <div className="grid grid-cols-4 gap-2">
          {FLYER_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplateId(t.id)}
              title={t.label}
              className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                templateId === t.id
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              <span
                className="w-6 h-6 rounded-full flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${t.gradientFrom}, ${t.gradientTo})` }}
              />
              <span className="text-[10px] text-center leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Two-column: form + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <div className="space-y-3">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
              <input
                type="text"
                value={data[key]}
                onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Description / Offer</label>
            <textarea
              value={data.body}
              onChange={(e) => update('body', e.target.value)}
              placeholder="Describe your services or a special offer for this community..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Call to Action</label>
            <input
              type="text"
              value={data.cta}
              onChange={(e) => update('cta', e.target.value)}
              placeholder="e.g. Call Us Today"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'phone',   label: 'Phone',   placeholder: '(555) 000-0000', type: 'tel' },
              { key: 'email',   label: 'Email',   placeholder: 'you@business.com', type: 'email' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                <input
                  type={type}
                  value={data[key]}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Website (optional)</label>
            <input
              type="text"
              value={data.website}
              onChange={(e) => update('website', e.target.value)}
              placeholder="www.yourbusiness.com"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Live preview */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Live Preview</p>
          <FlyerPreview templateId={templateId} data={data} />
        </div>
      </div>

      {/* Send to communities */}
      {approvedApps.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Send Flyer To</p>
          <div className="space-y-2">
            {approvedApps.map((app) => (
              <label
                key={app.id}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                  sendTo.includes(app.communityId)
                    ? 'bg-teal-50 border-teal-300'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={sendTo.includes(app.communityId)}
                  onChange={() => toggleSend(app.communityId)}
                  className="w-4 h-4 rounded accent-teal-600"
                />
                <p className="text-xs font-semibold text-gray-800">{app.community?.name}</p>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
          </svg>
          Print / Save PDF
        </button>
        {approvedApps.length > 0 && (
          flyerSent ? (
            <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-emerald-700 text-sm font-semibold">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Flyer Sent!
            </div>
          ) : (
            <button
              onClick={handleSendFlyer}
              disabled={!sendTo.length}
              className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold hover:from-teal-700 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
              Send Flyer
            </button>
          )
        )}
      </div>
    </div>
  )
}

// ── Onboarding Checklist ──────────────────────────────────────────────────────

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

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function VendorPortalDashboard() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const commsRef  = useRef(null)
  const [searchParams] = useSearchParams()

  const [apps, setApps]                   = useState([])
  const [messages, setMessages]           = useState([])
  const [threads, setThreads]             = useState([])
  const [commsTab, setCommsTab]           = useState('email')
  const [companyProfile, setCompanyProfile] = useState(null)
  const [profile, setProfile]             = useState(null)
  const [loaded, setLoaded]               = useState(false)

  async function load() {
    const raw = await getApplicationsForVendor(user.id)
    const enriched = await Promise.all(
      raw.map((a) => getCommunity(a.communityId).then((c) => ({ ...a, community: c })))
    )
    setApps(enriched.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)))
    const [msgs, rawThreads, cp, vp] = await Promise.all([
      getMessagesForVendor(user.id),
      getDirectMessageThreads(),
      getCompanyProfile(user.id),
      getVendorProfile(user.id),
    ])
    setMessages(msgs)
    setThreads(rawThreads)
    setCompanyProfile(cp)
    setProfile(vp)
    setLoaded(true)
  }

  useEffect(() => {
    async function init() { await load() }
    init()
  }, [user.id])

  // Deep-link from email: ?tab=messages&communityId=xxx
  useEffect(() => {
    if (searchParams.get('tab') === 'messages') {
      setCommsTab('messages')
      setTimeout(() => commsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    }
  }, [searchParams])

  const approvedApps = apps.filter((a) => a.status === 'approved')
  const pendingApps  = apps.filter((a) => a.status === 'pending')
  const deniedApps   = apps.filter((a) => a.status === 'denied')
  const revokedApps  = apps.filter((a) => a.status === 'revoked')

  // Pull vendor info from company profile first, fall back to application data
  const primaryApp = apps.find((a) => a.businessName)
  const src = companyProfile || primaryApp || {}
  const vendorInfo = {
    vendorId:        user.id,
    businessName:    src.businessName    || user.name,
    contactName:     src.contactName     || user.name,
    email:           src.contactEmail    || user.email,
    phone:           src.contactPhone    || '',
    serviceCategory: src.serviceCategory || '',
    yearsInBusiness: src.yearsInBusiness || '',
  }

  // Enrich DM threads with community names derived from applications
  const communityNameMap = Object.fromEntries(
    apps.filter((a) => a.community).map((a) => [a.communityId, a.community.name])
  )
  const enrichedThreads = threads.map((t) => ({
    ...t,
    otherPartyName: communityNameMap[t.communityId] || 'Community',
  }))
  const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0)

  // Parties vendor can message: all communities they've applied to
  const availableParties = apps.map((a) => ({
    vendorId:    user.id,
    communityId: a.communityId,
    name:        a.community?.name || 'Community',
  })).filter((p, i, arr) => arr.findIndex((x) => x.communityId === p.communityId) === i)

  // Unified activity timeline across all apps
  const activityFeed = apps
    .flatMap((a) =>
      (a.statusHistory || []).map((h) => ({
        ...h,
        communityName: a.community?.name || 'Unknown Community',
        businessName:  a.businessName,
      }))
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 8)

  function openComms(tab) {
    setCommsTab(tab)
    setTimeout(() => commsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const firstName = user.name?.split(' ')[0] || 'there'

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
                onClick={() => openComms('email')}
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
                          onClick={() => openComms('email')}
                          className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                          </svg>
                          Send Email
                        </button>
                        <button
                          onClick={() => openComms('flyer')}
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

            {/* Communications Center */}
            <section ref={commsRef} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden scroll-mt-20">
              {/* Section header */}
              <div className="bg-gradient-to-r from-[#1a73c8] to-[#0d3f73] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-sm">Communications Center</h2>
                    <p className="text-blue-100 text-xs mt-0.5">Email your communities, build flyers, and track sent messages</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 bg-gray-50/50">
                {[
                  { id: 'email',    icon: '✉️', label: 'Email Composer' },
                  { id: 'flyer',    icon: '🎨', label: 'Flyer Creator' },
                  { id: 'sent',     icon: '📨', label: `Sent (${messages.length})` },
                  { id: 'messages', icon: '💬', label: totalUnread > 0 ? `My Messages (${totalUnread})` : 'My Messages' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCommsTab(tab.id)}
                    className={`px-5 py-3.5 text-xs font-semibold transition-all border-b-2 flex items-center gap-1.5 ${
                      commsTab === tab.id
                        ? 'border-blue-600 text-blue-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {commsTab === 'email' && (
                  <EmailComposer
                    approvedApps={approvedApps}
                    vendorInfo={vendorInfo}
                    onSent={load}
                  />
                )}
                {commsTab === 'flyer' && (
                  <FlyerCreator
                    vendorInfo={vendorInfo}
                    approvedApps={approvedApps}
                    onSent={load}
                  />
                )}
                {commsTab === 'messages' && (
                  <MessagingCenter
                    threads={enrichedThreads}
                    availableParties={availableParties}
                    onRefresh={load}
                    autoOpenCommunityId={searchParams.get('communityId')}
                  />
                )}
                {commsTab === 'sent' && (
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-3xl mb-3">📭</p>
                        <p className="text-sm font-medium text-gray-500">No messages sent yet</p>
                        <p className="text-xs text-gray-400 mt-1">Your sent emails and flyers will appear here.</p>
                      </div>
                    ) : (
                      messages
                        .slice()
                        .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
                        .map((msg) => (
                          <div key={msg.id} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{msg.subject}</p>
                                {msg.body && (
                                  <p className="text-xs text-gray-400 mt-0.5 truncate">{msg.body.slice(0, 80)}…</p>
                                )}
                              </div>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                                msg.type === 'flyer'
                                  ? 'bg-teal-100 text-teal-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {msg.type === 'flyer' ? '🎨 Flyer' : '✉️ Email'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDate(msg.sentAt)} · {msg.communityIds.length} communit{msg.communityIds.length === 1 ? 'y' : 'ies'}
                            </p>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            </section>

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
                  { icon: '✉️', label: 'Send Email',         action: () => openComms('email') },
                  { icon: '🎨', label: 'Create a Flyer',     action: () => openComms('flyer') },
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
