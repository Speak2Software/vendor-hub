import { useState } from 'react'
import {
  FLYER_THEMES, escHtml, flyerLines, useDebounced,
  flyerDocument, printFlyer, FlyerPreview, FlyerStylePickers,
} from './FlyerKit'

/**
 * Vendor Recruitment Flyer — the community manager's counterpart to the
 * vendor Flyer Creator. Same layouts, colors, live preview and print output,
 * with recruitment-specific content (QR code, how-it-works steps).
 */

const RECRUITMENT_CSS = `
.logo-wrap { width:64px; height:64px; border-radius:14px; background:var(--soft); overflow:hidden; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
.logo-wrap img { width:100%; height:100%; object-fit:contain; padding:5px; }
.qr-box { display:inline-block; background:#fff; border:2px solid var(--accent); border-radius:16px; padding:14px; margin-bottom:16px; text-align:center; }
.qr-box img { display:block; width:170px; height:170px; margin:0 auto; }
.scan-label { font-size:14px; font-weight:800; color:var(--accent); margin-top:10px; }
.url-label { font-size:11.5px; color:#6b7280; margin-top:3px; word-break:break-all; }
.steps { text-align:left; background:var(--soft); border-radius:12px; padding:15px 17px; margin-bottom:16px; }
.steps h3 { font-size:10.5px; font-weight:800; color:var(--accent); text-transform:uppercase; letter-spacing:.1em; margin-bottom:10px; }
.step { display:flex; gap:10px; margin-bottom:8px; }
.step:last-child { margin-bottom:0; }
.step-num { width:19px; height:19px; background:var(--accent); color:#fff; border-radius:50%; font-size:10px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
.step-text { font-size:13px; color:#374151; line-height:1.5; }

/* Logo sits on a colored surface in these layouts */
.flyer.classic .header .logo-wrap { background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.3); }
.flyer.modern .side .logo-wrap { background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.3); }
.flyer.elegant .logo-wrap { margin-left:auto; margin-right:auto; }

/* Bold — everything sits on full-bleed color */
.flyer.bold .logo-wrap { background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.3); margin-left:auto; margin-right:auto; }
.flyer.bold .steps { background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.28); }
.flyer.bold .steps h3 { color:#fff; }
.flyer.bold .step-text { color:rgba(255,255,255,.95); }
.flyer.bold .step-num { background:#fff; color:var(--accent); }
.flyer.bold .qr-box { border-color:#fff; }
`

export function buildRecruitmentFlyerHTML(layoutId, theme, data, { autoPrint = false } = {}) {
  const d = {
    eyebrow:       escHtml(data.eyebrow) || 'Now Accepting Vendor Partners',
    communityName: escHtml(data.communityName) || 'Our Community',
    address:       escHtml(data.address),
    headline:      escHtml(data.headline),
    body:          escHtml(data.body),
    cta:           escHtml(data.cta) || 'Scan to Apply',
    phone:         escHtml(data.phone),
    email:         escHtml(data.email),
    website:       escHtml(data.website),
  }
  const applyUrl  = String(data.applyUrl || 'https://www.speak2vendors.com/signup').trim()
  const highlights = flyerLines(data.highlights)
  const steps      = flyerLines(data.steps)
  const hasContacts = Boolean(data.phone || data.email || data.website)

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=340x340&margin=8&color=${
    theme.accent.replace('#', '')
  }&bgcolor=ffffff&data=${encodeURIComponent(applyUrl)}`

  const contacts = [
    d.phone   && `<div class="c-row"><span class="c-ico">📞</span><span>${d.phone}</span></div>`,
    d.email   && `<div class="c-row"><span class="c-ico">✉️</span><span>${d.email}</span></div>`,
    d.website && `<div class="c-row"><span class="c-ico">🌐</span><span>${d.website}</span></div>`,
  ].filter(Boolean).join('')

  const logo   = data.showLogo && data.logoUrl
    ? `<div class="logo-wrap"><img src="${escHtml(data.logoUrl)}" alt="" /></div>`
    : ''
  const cat      = `<div class="cat">${d.eyebrow}</div>`
  const h1       = `<h1>${d.communityName}</h1>`
  const tag      = d.address ? `<div class="tag">${d.address}</div>` : ''
  const headline = d.headline ? `<div class="headline">${d.headline}</div>` : ''
  const desc     = d.body ? `<div class="desc">${d.body}</div>` : ''
  const hl       = highlights.length
    ? `<ul class="hl">${highlights.map((h) => `<li>${escHtml(h)}</li>`).join('')}</ul>`
    : ''
  const qr = `<div class="qr-box"><img src="${qrSrc}" alt="QR code — scan to apply" /><div class="scan-label">${d.cta}</div><div class="url-label">${escHtml(applyUrl.replace(/^https?:\/\//, ''))}</div></div>`
  const stepsBlock = steps.length
    ? `<div class="steps"><h3>How it works</h3>${steps.map((s, i) =>
        `<div class="step"><span class="step-num">${i + 1}</span><span class="step-text">${escHtml(s)}</span></div>`
      ).join('')}</div>`
    : ''
  const contactsBlock = hasContacts ? `<div class="contacts">${contacts}</div>` : ''
  const footer = `<div class="footer">Powered by Vendor Hub · speak2vendors.com</div>`

  let body
  if (layoutId === 'modern') {
    const sideContacts = hasContacts ? `<div class="side-contacts">${contacts}</div>` : ''
    body = `
      <div class="row">
        <aside class="side">${logo}${cat}${h1}${tag}${sideContacts}</aside>
        <main class="main">${headline}${desc}${hl}${qr}${stepsBlock}</main>
      </div>
      ${footer}`
  } else if (layoutId === 'bold') {
    const cardInner = `${desc}${hl}`
    const card = cardInner.trim() ? `<div class="card">${cardInner}</div>` : ''
    body = `${logo}${cat}${h1}${tag}${headline}${card}${qr}${stepsBlock}${contactsBlock}${footer}`
  } else if (layoutId === 'elegant') {
    body = `<div class="frame">${logo}${cat}${h1}<div class="rule"></div>${tag}${headline}${desc}${hl}${qr}${stepsBlock}${contactsBlock}${footer}</div>`
  } else {
    body = `
      <div class="header">${logo}${cat}${h1}${tag}</div>
      <div class="body">${headline}${desc}${hl}${qr}${stepsBlock}${contactsBlock}</div>
      ${footer}`
  }

  return flyerDocument({
    layoutId, theme, body, autoPrint,
    title: `${d.communityName} — Vendor Recruitment Flyer`,
    extraCSS: RECRUITMENT_CSS,
  })
}

const DEFAULT_STEPS = [
  'Scan the QR code or visit speak2vendors.com',
  'Create a free vendor account and complete your profile',
  'Submit your application to our community for review',
].join('\n')

export default function RecruitmentFlyerCreator({ community }) {
  const [layoutId, setLayoutId] = useState('classic')
  const [themeId, setThemeId]   = useState('ocean')
  const [data, setData] = useState({
    eyebrow:       'Now Accepting Vendor Partners',
    communityName: community?.name || '',
    address:       community?.address || '',
    headline:      'Partner With Us as a Vendor',
    body:          'We are actively seeking trusted service providers to support our residents. Scan the QR code to create your free vendor profile and apply.',
    highlights:    '',
    steps:         DEFAULT_STEPS,
    cta:           'Scan to Apply',
    applyUrl:      'https://www.speak2vendors.com/signup',
    phone:         community?.showPhone ? (community?.contactPhone || '') : '',
    email:         community?.showEmail ? (community?.contactEmail || '') : '',
    website:       '',
    logoUrl:       community?.logoUrl || '',
    showLogo:      Boolean(community?.logoUrl),
  })

  const theme = FLYER_THEMES.find((t) => t.id === themeId) || FLYER_THEMES[0]

  const liveHtml    = buildRecruitmentFlyerHTML(layoutId, theme, data)
  const previewHtml = useDebounced(liveHtml, 180)

  function update(field, value) { setData((p) => ({ ...p, [field]: value })) }

  function handlePrint() {
    printFlyer(buildRecruitmentFlyerHTML(layoutId, theme, data, { autoPrint: true }))
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-6">
      <FlyerStylePickers
        layoutId={layoutId} setLayoutId={setLayoutId}
        themeId={themeId} setThemeId={setThemeId}
        theme={theme}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">3 · Fill in Your Details</p>

          {[
            { key: 'eyebrow',       label: 'Eyebrow',        placeholder: 'e.g. Now Accepting Vendor Partners' },
            { key: 'communityName', label: 'Community Name', placeholder: 'Your community name' },
            { key: 'address',       label: 'Address',        placeholder: 'Street, City, State' },
            { key: 'headline',      label: 'Headline',       placeholder: 'e.g. Partner With Us as a Vendor' },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-gray-500 block mb-1">{f.label}</label>
              <input type="text" value={data[f.key]} onChange={(e) => update(f.key, e.target.value)} placeholder={f.placeholder} className={inp} />
            </div>
          ))}

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
            <textarea
              value={data.body}
              onChange={(e) => update('body', e.target.value)}
              placeholder="Tell vendors why they should partner with your community…"
              rows={3}
              className={`${inp} resize-none`}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">
              Why Partner With Us <span className="text-gray-300 font-normal">· one per line</span>
            </label>
            <textarea
              value={data.highlights}
              onChange={(e) => update('highlights', e.target.value)}
              placeholder={'120+ residents\nLong-term contracts\nPrompt payment terms'}
              rows={3}
              className={`${inp} resize-none leading-relaxed`}
            />
            <p className="text-[11px] text-gray-400 mt-1">Shown as a checkmark list. Up to 5 lines.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">
              How It Works <span className="text-gray-300 font-normal">· one step per line</span>
            </label>
            <textarea
              value={data.steps}
              onChange={(e) => update('steps', e.target.value)}
              rows={4}
              className={`${inp} resize-none leading-relaxed`}
            />
            <p className="text-[11px] text-gray-400 mt-1">Shown as a numbered list. Up to 5 steps.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Call to Action</label>
              <input type="text" value={data.cta} onChange={(e) => update('cta', e.target.value)} placeholder="e.g. Scan to Apply" className={inp} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">QR Link</label>
              <input type="text" value={data.applyUrl} onChange={(e) => update('applyUrl', e.target.value)} placeholder="https://www.speak2vendors.com/signup" className={inp} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'phone', label: 'Phone', placeholder: '(555) 000-0000', type: 'tel' },
              { key: 'email', label: 'Email', placeholder: 'you@community.com', type: 'email' },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-gray-500 block mb-1">{f.label}</label>
                <input type={f.type} value={data[f.key]} onChange={(e) => update(f.key, e.target.value)} placeholder={f.placeholder} className={inp} />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Website (optional)</label>
            <input type="text" value={data.website} onChange={(e) => update('website', e.target.value)} placeholder="www.yourcommunity.com" className={inp} />
          </div>

          {data.logoUrl && (
            <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors">
              <input
                type="checkbox"
                checked={data.showLogo}
                onChange={() => update('showLogo', !data.showLogo)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-xs font-semibold text-gray-600">Show community logo on flyer</span>
            </label>
          )}
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-24 self-start">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Preview</p>
            <span className="text-[10px] text-gray-400 font-medium">Exactly what prints</span>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-100 p-2 overflow-hidden">
            <FlyerPreview html={previewHtml} />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
        Print this flyer and display it in your lobby or common areas. Vendors scan the QR code to
        create a free account and apply to your community.
      </p>

      <button
        onClick={handlePrint}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1a73c8] to-[#0d3f73] text-white py-3 rounded-xl text-sm font-bold hover:from-[#135aa0] hover:to-[#0d3f73] transition-all shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
        </svg>
        Print / Save PDF
      </button>
    </div>
  )
}
