import { useEffect, useRef, useState } from 'react'

// Tags we allow through to stored/emailed/printed HTML. Everything else is
// unwrapped (its text kept) so pasted or stray markup can't break layouts
// or carry scripts/styles/handlers.
const ALLOWED = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'BR', 'P', 'DIV'])

export function sanitizeHtml(html) {
  const tpl = document.createElement('template')
  tpl.innerHTML = html || ''
  const walk = (parent) => {
    ;[...parent.children].forEach((el) => {
      walk(el)
      const tag = el.tagName
      if (tag === 'SCRIPT' || tag === 'STYLE') {
        el.remove()
      } else if (!ALLOWED.has(tag)) {
        el.replaceWith(...el.childNodes) // unwrap: keep the text, drop the tag
      } else {
        ;[...el.attributes].forEach((a) => el.removeAttribute(a.name)) // strip all attrs
      }
    })
  }
  walk(tpl.content)
  return tpl.innerHTML
}

// Plain text (with newlines) → simple HTML for seeding the editor from templates.
export function textToHtml(text) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc(text || '').replace(/\n/g, '<br>')
}

// HTML → plain text, for length checks, previews and "is it empty?" validation.
export function stripTags(html) {
  const tpl = document.createElement('template')
  tpl.innerHTML = html || ''
  return (tpl.content.textContent || '').trim()
}

// Read-only renderer for rich-text content stored elsewhere (e.g. an
// application's "services" field shown to a manager). Always re-sanitizes.
export function RichTextView({ html, className = '' }) {
  return (
    <>
      <div className={`rte-view ${className}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
      <style>{`
        .rte-view ul { list-style: disc; padding-left: 1.25rem; margin: 0.25rem 0; }
        .rte-view ol { list-style: decimal; padding-left: 1.25rem; margin: 0.25rem 0; }
        .rte-view li { margin: 0.125rem 0; }
      `}</style>
    </>
  )
}

const ToolbarButton = ({ onClick, title, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onMouseDown={(e) => e.preventDefault()} // keep selection/focus in the editor
    onClick={onClick}
    className="w-8 h-8 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
  >
    {children}
  </button>
)

export default function RichTextEditor({ value, onChange, placeholder = '', minHeight = 160 }) {
  const ref = useRef(null)
  // null (not value) so the first effect run always seeds the editor, even when
  // the initial value is non-empty (e.g. a flyer's default description).
  const lastHtml = useRef(null)
  const [empty, setEmpty] = useState(!stripTags(value))

  // Seed / re-seed the editor when the value changes from outside (e.g. a template),
  // without clobbering what the user is typing.
  useEffect(() => {
    if (ref.current && value !== lastHtml.current) {
      ref.current.innerHTML = value || ''
      lastHtml.current = value || ''
      setEmpty(!stripTags(value))
    }
  }, [value])

  function emit() {
    const html = sanitizeHtml(ref.current.innerHTML)
    lastHtml.current = html
    setEmpty(!stripTags(html))
    onChange(html)
  }

  function exec(cmd) {
    ref.current.focus()
    try { document.execCommand('styleWithCSS', false, false) } catch { /* ignore */ }
    try { document.execCommand(cmd, false, null) } catch { /* ignore */ }
    emit()
  }

  function handlePaste(e) {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    try { document.execCommand('insertText', false, text) } catch { /* ignore */ }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <ToolbarButton title="Bold" onClick={() => exec('bold')}>
          <span className="text-sm font-black">B</span>
        </ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => exec('italic')}>
          <span className="text-sm font-serif italic font-semibold">I</span>
        </ToolbarButton>
        <ToolbarButton title="Underline" onClick={() => exec('underline')}>
          <span className="text-sm font-semibold underline">U</span>
        </ToolbarButton>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton title="Bulleted list" onClick={() => exec('insertUnorderedList')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton title="Numbered list" onClick={() => exec('insertOrderedList')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.242 5.992h12m-12 6.003H20.24m-12 5.999h12M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 7.505a1.125 1.125 0 1 1 1.591 1.59l-1.83 1.83h2.16M2.99 11.995h1.80l-1.80 2.25h1.80" />
          </svg>
        </ToolbarButton>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton title="Clear formatting" onClick={() => exec('removeFormat')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Editable area */}
      <div className="relative">
        {empty && placeholder && (
          <div className="absolute left-4 top-2.5 text-sm text-gray-300 pointer-events-none select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          onPaste={handlePaste}
          style={{ minHeight: `${minHeight}px` }}
          className="rte-content w-full px-4 py-2.5 text-sm text-gray-800 leading-relaxed focus:outline-none overflow-y-auto"
        />
      </div>

      {/* List styling for inside the editor (print/email output has its own CSS) */}
      <style>{`
        .rte-content ul { list-style: disc; padding-left: 1.25rem; margin: 0.25rem 0; }
        .rte-content ol { list-style: decimal; padding-left: 1.25rem; margin: 0.25rem 0; }
        .rte-content li { margin: 0.125rem 0; }
      `}</style>
    </div>
  )
}
