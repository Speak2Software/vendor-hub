import { Link } from 'react-router-dom'

// ── Data ─────────────────────────────────────────────────────────────────────


const FEATURES = [
  {
    gradient: 'from-[#1a73c8] to-[#0d3f73]',
    bg: 'bg-[#f0f7fd]',
    iconBg: 'bg-gradient-to-br from-[#1a73c8] to-[#0d3f73]',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: 'One Application, Many Doors',
    desc: 'Apply once and get discovered by hundreds of senior living communities actively seeking your services.',
  },
  {
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
    title: 'Smart Location Matching',
    desc: 'Set your service radius and we match you to nearby communities you can realistically serve — no wasted outreach.',
  },
  {
    gradient: 'from-teal-500 to-cyan-600',
    bg: 'bg-teal-50',
    iconBg: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: 'Trusted & Verified Network',
    desc: 'Every vendor goes through a vetting process. Communities trust our platform — and that trust extends to you.',
  },
  {
    gradient: 'from-orange-500 to-rose-500',
    bg: 'bg-orange-50',
    iconBg: 'bg-gradient-to-br from-orange-500 to-rose-500',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: 'Real-Time Status Tracking',
    desc: 'Know exactly where your application stands. Get updates, manager notes, and approvals — all in one dashboard.',
  },
]

const STEPS = [
  {
    num: '01',
    color: 'text-[#1a73c8]',
    ring: 'ring-[#b3d4ed]',
    bg: 'bg-[#f0f7fd]',
    title: 'Create Your Account',
    desc: 'Sign up free in under 2 minutes. No credit card needed.',
  },
  {
    num: '02',
    color: 'text-emerald-600',
    ring: 'ring-emerald-200',
    bg: 'bg-emerald-50',
    title: 'Set Your Service Area',
    desc: 'Pin your location and define the radius you can serve.',
  },
  {
    num: '03',
    color: 'text-teal-600',
    ring: 'ring-teal-200',
    bg: 'bg-teal-50',
    title: 'Apply to Communities',
    desc: 'Submit your vendor profile to nearby senior living communities.',
  },
  {
    num: '04',
    color: 'text-orange-600',
    ring: 'ring-orange-200',
    bg: 'bg-orange-50',
    title: 'Get Approved & Grow',
    desc: 'Once approved, you\'re in. Build relationships and expand your business.',
  },
]

const CATEGORIES = [
  { emoji: '🏥', label: 'Medical & Healthcare' },
  { emoji: '🚐', label: 'Transportation' },
  { emoji: '🍽️', label: 'Food & Nutrition' },
  { emoji: '🧹', label: 'Housekeeping' },
  { emoji: '💆', label: 'Personal Care' },
  { emoji: '🤸', label: 'Physical Therapy' },
  { emoji: '🧠', label: 'Mental Health' },
  { emoji: '💊', label: 'Pharmacy' },
  { emoji: '💻', label: 'Technology' },
  { emoji: '🔧', label: 'Maintenance' },
  { emoji: '🎭', label: 'Activities' },
  { emoji: '⚖️', label: 'Legal Services' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function Login() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{background: 'linear-gradient(145deg, #0d3f73 0%, #135aa0 60%, #1a73c8 100%)'}}>
        {/* decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-[#4a96d4]/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4a96d4]/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24 flex flex-col items-center text-center">
          <img src="/logo.png" alt="Speak2Vendors" className="h-16 sm:h-20 w-auto mb-8" />

          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Now accepting vendor applications
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl">
            Grow Your Business Inside{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
              Senior Living Communities
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[#b3d4ed] max-w-2xl leading-relaxed">
            VendorHub is the premier marketplace connecting trusted service providers
            with senior living communities nationwide. Join thousands of vendors already
            growing their business with us.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#0d3f73] px-8 py-4 rounded-2xl text-base font-bold hover:bg-[#f0f7fd] transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transform"
            >
              Get Started Free
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              to="/signin"
              className="inline-flex items-center justify-center px-8 py-4 rounded-2xl text-base font-semibold text-white border-2 border-white/30 hover:bg-white/10 transition-all"
            >
              Sign In
            </Link>
          </div>

          <p className="mt-5 text-[#b3d4ed] text-sm">Free to join · No credit card required · Get approved in days</p>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-[#deeef9] text-[#1a73c8] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3">
              Why VendorHub
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Everything you need to succeed</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              We've built the tools and network to help your business land contracts with the communities that need you most.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className={`${f.bg} rounded-2xl p-6 border border-white shadow-sm hover:shadow-md transition-shadow`}>
                <div className={`w-12 h-12 rounded-xl ${f.iconBg} flex items-center justify-center mb-4 shadow-md`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3">
              Getting started
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Up and running in 4 easy steps</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.num} className="relative text-center">
                {/* connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-gray-200" />
                )}
                <div className={`w-16 h-16 mx-auto rounded-2xl ${s.bg} ring-4 ${s.ring} flex items-center justify-center mb-4`}>
                  <span className={`text-xl font-extrabold ${s.color}`}>{s.num}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-[#1a73c8] text-white px-8 py-4 rounded-2xl text-base font-bold hover:bg-[#135aa0] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
            >
              Start Your Application
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Service categories ───────────────────────────────────────────── */}
      <section className="py-16 sm:py-20" style={{background: 'linear-gradient(135deg, #1a2535 0%, #0d3f73 100%)'}}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block bg-white/10 text-[#b3d4ed] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3">
              Who we serve
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">We work with all service types</h2>
            <p className="mt-3 text-[#b3d4ed] max-w-xl mx-auto">
              Whether you provide healthcare, transportation, food service, or anything in between — there's a community waiting for you.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {CATEGORIES.map((c) => (
              <div
                key={c.label}
                className="bg-white/8 hover:bg-white/15 border border-white/10 rounded-xl p-3 text-center transition-colors cursor-default group"
              >
                <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform inline-block">{c.emoji}</div>
                <p className="text-[11px] text-[#b3d4ed] font-medium leading-tight">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-8 py-4 rounded-2xl text-base font-bold hover:from-yellow-300 hover:to-orange-300 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
            >
              Join the Network Today
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <p className="mt-3 text-[#7693aa] text-sm">Already a member? <a href="/signin" className="text-[#b3d4ed] hover:text-white underline">Sign in below ↓</a></p>
          </div>
        </div>
      </section>

    </div>
  )
}
