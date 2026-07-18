import { createContext, useCallback, useContext, useRef, useState } from 'react'

/**
 * Toast.jsx — app-wide toast notifications.
 *
 * Usage:
 *   const toast = useToast()
 *   toast.success('Community saved')
 *   toast.error('Upload failed — try again')
 *
 * Toasts stack top-center, auto-dismiss after 3.5s, and can be
 * dismissed early by clicking.
 */

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

const STYLES = {
  success: {
    bg: 'bg-emerald-600',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    ),
  },
  error: {
    bg: 'bg-red-600',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  info: {
    bg: 'bg-[#1a73c8]',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
      </svg>
    ),
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((type, message) => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => dismiss(id), 3500)
  }, [dismiss])

  const api = useRef({
    success: (msg) => push('success', msg),
    error:   (msg) => push('error', msg),
    info:    (msg) => push('info', msg),
  })
  // keep push reference fresh without changing api identity
  api.current.success = (msg) => push('success', msg)
  api.current.error   = (msg) => push('error', msg)
  api.current.info    = (msg) => push('info', msg)

  return (
    <ToastContext.Provider value={api.current}>
      {children}
      {/* Toast stack */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none px-4 w-full max-w-md">
        {toasts.map((t) => {
          const s = STYLES[t.type] || STYLES.info
          return (
            <button
              key={t.id}
              onClick={() => dismiss(t.id)}
              className={`${s.bg} text-white text-sm font-semibold pl-3.5 pr-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 pointer-events-auto animate-toast-in max-w-full`}
            >
              {s.icon}
              <span className="truncate">{t.message}</span>
            </button>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
