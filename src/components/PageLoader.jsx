// Centered loading spinner shown while a page fetches its data,
// so users see progress instead of a blank/empty screen.
export default function PageLoader({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] gap-3 ${className}`}>
      <Spinner />
      {label && <p className="text-sm text-gray-400">{label}</p>}
    </div>
  )
}

// Inline spinner (no wrapper) for use inside sections/buttons.
export function Spinner({ className = 'w-8 h-8' }) {
  return (
    <svg className={`${className} animate-spin text-[#1a73c8]`} viewBox="0 0 24 24" fill="none" aria-label="Loading">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2Z" />
    </svg>
  )
}
