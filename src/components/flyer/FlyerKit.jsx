import { useState, useEffect, useRef } from 'react'

/**
 * Shared flyer engine used by BOTH the vendor Flyer Creator and the community
 * manager's Vendor Recruitment Flyer. Layouts, colors, the scaled live preview
 * and the print document all come from here so the two stay in sync.
 */

export const FLYER_LAYOUTS = [
  { id: 'classic', label: 'Classic', hint: 'Header banner' },
  { id: 'modern',  label: 'Modern',  hint: 'Side panel' },
  { id: 'bold',    label: 'Bold',    hint: 'Full color' },
  { id: 'elegant', label: 'Elegant', hint: 'Framed' },
]

export const FLYER_THEMES = [
  { id: 'ocean',    label: 'Ocean',    from: '#1a73c8', to: '#0d9488', accent: '#1a73c8', soft: '#eef6fd' },
  { id: 'emerald',  label: 'Emerald',  from: '#059669', to: '#0d9488', accent: '#047857', soft: '#ecfdf5' },
  { id: 'sunset',   label: 'Sunset',   from: '#f59e0b', to: '#ea580c', accent: '#ea580c', soft: '#fff7ed' },
  { id: 'royal',    label: 'Royal',    from: '#6d28d9', to: '#2563eb', accent: '#6d28d9', soft: '#f5f3ff' },
  { id: 'rose',     label: 'Rose',     from: '#e11d48', to: '#be185d', accent: '#be185d', soft: '#fff1f2' },
  { id: 'charcoal', label: 'Charcoal', from: '#334155', to: '#0f172a', accent: '#0f766e', soft: '#f1f5f9' },
]

export const flyerGrad = (t) => `linear-gradient(135deg, ${t.from}, ${t.to})`

export const escHtml = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Splits a textarea value into trimmed, non-empty lines. */
export function flyerLines(raw, max = 5) {
  return String(raw || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, max)
}

// Small hook: delays a value so the live preview iframe doesn't rebuild on every keystroke.
export function useDebounced(value, ms) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

// Shared structural + layout CSS. Content builders emit the same class names
// (.cat, .hl, .desc, .c-row, .cta, .footer, …) so every layout works for both
// flyer types.
export const FLYER_BASE_CSS = `
* { box-sizing:border-box; margin:0; padding:0; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; background:#eef2f6; padding:20px; }
.flyer { width:480px; margin:0 auto; background:#fff; overflow:hidden; border-radius:14px; box-shadow:0 12px 40px rgba(0,0,0,.14); }
.cat { font-size:11px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }
.hl { list-style:none; }
.hl li { position:relative; padding-left:27px; font-size:13.5px; line-height:1.5; margin-bottom:9px; color:#374151; }
.hl li:before { content:'✓'; position:absolute; left:0; top:0; width:19px; height:19px; border-radius:50%; background:var(--soft); color:var(--accent); font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; }
.desc { font-size:13.5px; line-height:1.7; white-space:pre-line; color:#4b5563; margin-bottom:18px; }
.c-row { display:flex; align-items:center; gap:9px; font-size:13.5px; color:#374151; margin-bottom:7px; }
.c-ico { flex-shrink:0; width:18px; text-align:center; }
.footer { background:#f9fafb; border-top:1px solid #eef2f6; text-align:center; padding:13px; font-size:11px; color:#9ca3af; }

/* Classic — top banner */
.flyer.classic .header { background:linear-gradient(135deg,var(--from),var(--to)); color:#fff; padding:30px 28px; }
.flyer.classic .header .cat { color:rgba(255,255,255,.82); margin-bottom:9px; }
.flyer.classic .header h1 { font-size:27px; font-weight:800; line-height:1.15; }
.flyer.classic .header .tag { font-size:14px; color:rgba(255,255,255,.9); margin-top:9px; }
.flyer.classic .body { padding:26px 28px; }
.flyer.classic .headline { font-size:19px; font-weight:800; color:#111827; margin-bottom:14px; }
.flyer.classic .hl { margin-bottom:16px; }
.flyer.classic .contacts { background:var(--soft); border-radius:12px; padding:14px 16px; margin-bottom:18px; }
.flyer.classic .cta { background:linear-gradient(135deg,var(--from),var(--to)); color:#fff; text-align:center; padding:14px; border-radius:12px; font-weight:800; font-size:14px; }

/* Modern — side panel */
.flyer.modern .row { display:flex; }
.flyer.modern .side { width:42%; background:linear-gradient(160deg,var(--from),var(--to)); color:#fff; padding:28px 22px; }
.flyer.modern .side .cat { color:rgba(255,255,255,.85); margin-bottom:10px; }
.flyer.modern .side h1 { font-size:22px; font-weight:800; line-height:1.15; }
.flyer.modern .side .tag { font-size:13px; color:rgba(255,255,255,.9); margin-top:9px; }
.flyer.modern .side-contacts { margin-top:22px; border-top:1px solid rgba(255,255,255,.28); padding-top:16px; }
.flyer.modern .side-contacts .c-row { color:#fff; font-size:12.5px; }
.flyer.modern .main { width:58%; padding:26px 22px; }
.flyer.modern .headline { font-size:18px; font-weight:800; color:#111827; margin-bottom:14px; }
.flyer.modern .hl { margin-bottom:16px; }
.flyer.modern .cta { background:linear-gradient(135deg,var(--from),var(--to)); color:#fff; text-align:center; padding:13px; border-radius:12px; font-weight:800; font-size:13.5px; }

/* Bold — full-bleed color */
.flyer.bold { background:linear-gradient(150deg,var(--from),var(--to)); color:#fff; padding:34px 30px; text-align:center; }
.flyer.bold .cat { color:rgba(255,255,255,.85); margin-bottom:12px; }
.flyer.bold h1 { font-size:30px; font-weight:900; line-height:1.1; }
.flyer.bold .tag { font-size:14.5px; color:rgba(255,255,255,.92); margin-top:10px; }
.flyer.bold .headline { font-size:18px; font-weight:700; margin:20px 0 16px; color:#fff; }
.flyer.bold .card { background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.28); border-radius:14px; padding:18px 20px; margin-bottom:18px; text-align:left; }
.flyer.bold .card .hl li { color:#fff; }
.flyer.bold .card .hl li:before { background:rgba(255,255,255,.25); color:#fff; }
.flyer.bold .card .desc { color:rgba(255,255,255,.92); margin-bottom:0; }
.flyer.bold .contacts { display:inline-block; text-align:left; margin-bottom:18px; }
.flyer.bold .c-row { color:#fff; }
.flyer.bold .cta { background:#fff; color:var(--accent); text-align:center; padding:14px; border-radius:12px; font-weight:800; font-size:14px; }
.flyer.bold .footer { background:transparent; border:0; color:rgba(255,255,255,.78); padding:0; margin-top:18px; }

/* Elegant — framed serif */
.flyer.elegant { font-family:Georgia,'Times New Roman',serif; padding:16px; }
.flyer.elegant .frame { border:2px solid var(--accent); padding:30px 26px; text-align:center; }
.flyer.elegant .cat { font-family:-apple-system,'Segoe UI',sans-serif; color:var(--accent); margin-bottom:12px; }
.flyer.elegant h1 { font-size:27px; font-weight:700; color:#1f2937; line-height:1.2; }
.flyer.elegant .rule { width:56px; height:3px; background:var(--accent); margin:14px auto; }
.flyer.elegant .tag { font-size:14.5px; font-style:italic; color:#6b7280; margin-bottom:16px; }
.flyer.elegant .headline { font-size:18px; font-weight:700; color:#1f2937; margin-bottom:14px; }
.flyer.elegant .hl { display:inline-block; text-align:left; margin:0 auto 16px; }
.flyer.elegant .desc { color:#4b5563; }
.flyer.elegant .contacts { border-top:1px solid #e5e7eb; padding-top:14px; margin:16px auto 18px; display:inline-block; text-align:left; }
.flyer.elegant .c-row { font-family:-apple-system,'Segoe UI',sans-serif; }
.flyer.elegant .cta { display:inline-block; background:var(--accent); color:#fff; padding:12px 22px; border-radius:8px; font-weight:700; font-size:13.5px; font-family:-apple-system,'Segoe UI',sans-serif; }
.flyer.elegant .footer { font-family:-apple-system,'Segoe UI',sans-serif; background:transparent; border:0; padding:0; margin-top:16px; }

@media print {
  body { background:#fff; padding:0; }
  .flyer { box-shadow:none; border-radius:0; width:100%; }
  @page { margin:0.4in; }
}
`

/**
 * Wraps flyer body HTML into a complete, self-contained document.
 * Used for BOTH the live preview iframe and the print window, so what the
 * user sees is exactly what prints.
 */
export function flyerDocument({ layoutId, theme, title, body, extraCSS = '', autoPrint = false }) {
  const printScript = autoPrint
    ? `<script>window.addEventListener('load',function(){setTimeout(function(){window.print()},300)})</script>`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>${FLYER_BASE_CSS}${extraCSS}</style>
</head>
<body>
<div class="flyer ${layoutId}" style="--from:${theme.from};--to:${theme.to};--accent:${theme.accent};--soft:${theme.soft}">${body}</div>
${printScript}
</body>
</html>`
}

/** Opens the flyer in a new window and triggers the print dialog. */
export function printFlyer(html) {
  const win = window.open('', '_blank', 'width=720,height=980')
  if (!win) return false
  win.document.write(html)
  win.document.close()
  return true
}

// Renders the real flyer HTML inside a scaled iframe, so the preview is exactly
// what prints (and its CSS is isolated from the app's styles).
export function FlyerPreview({ html }) {
  const wrapRef  = useRef(null)
  const frameRef = useRef(null)
  const DESIGN_W = 520
  const [scale, setScale] = useState(0.7)
  const [docH, setDocH]   = useState(680)

  function measure() {
    const w = wrapRef.current?.clientWidth
    if (w) setScale(w / DESIGN_W)
    const body = frameRef.current?.contentWindow?.document?.body
    if (body) setDocH(body.scrollHeight)
  }

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(measure)
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const t = setTimeout(measure, 80)
    return () => clearTimeout(t)
  }, [html])

  return (
    <div ref={wrapRef} style={{ width: '100%', height: Math.round(docH * scale) }}>
      <iframe
        ref={frameRef}
        title="Flyer preview"
        srcDoc={html}
        onLoad={measure}
        scrolling="no"
        style={{
          width: DESIGN_W,
          height: docH,
          border: 0,
          display: 'block',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

// Tiny schematic shown on each layout button, tinted with the current theme.
export function LayoutThumb({ id, theme }) {
  const grad = flyerGrad(theme)
  const box  = { width: '100%', height: 40, borderRadius: 6, border: '1px solid #e5e7eb', overflow: 'hidden', background: '#fff' }
  const line = (w, i) => <div key={i} style={{ height: 3, width: w, background: '#d1d5db', borderRadius: 2, marginBottom: 3 }} />

  if (id === 'modern') {
    return (
      <div style={{ ...box, display: 'flex' }}>
        <div style={{ width: '38%', background: grad }} />
        <div style={{ flex: 1, padding: 5 }}>{['80%', '60%', '70%'].map(line)}</div>
      </div>
    )
  }
  if (id === 'bold') {
    return (
      <div style={{ ...box, background: grad, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
        <div style={{ height: 5, width: '66%', background: 'rgba(255,255,255,.92)', borderRadius: 2, margin: '0 auto' }} />
        <div style={{ height: 3, width: '46%', background: 'rgba(255,255,255,.6)', borderRadius: 2, margin: '0 auto' }} />
      </div>
    )
  }
  if (id === 'elegant') {
    return (
      <div style={box}>
        <div style={{ margin: 4, height: 'calc(100% - 8px)', border: `2px solid ${theme.accent}`, borderRadius: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 3 }}>
          <div style={{ height: 3, width: '48%', background: '#d1d5db', borderRadius: 2 }} />
          <div style={{ height: 3, width: '30%', background: theme.accent, borderRadius: 2 }} />
        </div>
      </div>
    )
  }
  return (
    <div style={box}>
      <div style={{ height: '42%', background: grad }} />
      <div style={{ padding: 5 }}>{['86%', '64%'].map(line)}</div>
    </div>
  )
}

// ── Shared style-picker UI (layout + color), used by both creators ────────────
export function FlyerStylePickers({ layoutId, setLayoutId, themeId, setThemeId, theme, startIndex = 1 }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          {startIndex} · Choose a Layout
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {FLYER_LAYOUTS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLayoutId(l.id)}
              className={`p-2 rounded-xl border text-left transition-all ${
                layoutId === l.id
                  ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50/40'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <LayoutThumb id={l.id} theme={theme} />
              <p className="text-xs font-bold text-gray-700 mt-1.5">{l.label}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{l.hint}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          {startIndex + 1} · Choose a Color
        </p>
        <div className="flex flex-wrap gap-2">
          {FLYER_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setThemeId(t.id)}
              title={t.label}
              className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border transition-all ${
                themeId === t.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: flyerGrad(t) }} />
              <span className="text-xs font-semibold text-gray-600">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
