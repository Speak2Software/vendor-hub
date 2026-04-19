import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const BENEFITS = [
  {
    emoji: '💰',
    title: '$4.3 Trillion Market',
    desc: 'Senior care is one of the fastest-growing industries in the U.S. — and the wealthiest generation is driving it.',
  },
  {
    emoji: '📈',
    title: 'Recurring Revenue',
    desc: 'Community contracts mean predictable, repeat business — not one-time jobs. Build a stable client base.',
  },
  {
    emoji: '🤝',
    title: 'Pre-Qualified Leads',
    desc: 'Every community in our network is actively looking for vendors like you. No cold calling. No guessing.',
  },
  {
    emoji: '🏆',
    title: 'Stand Out From Competitors',
    desc: 'Verified vendor status signals trust and credibility — giving you a leg up on competitors not in our network.',
  },
]


export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      await signup({ name: form.name, email: form.email, password: form.password })
      navigate('/vendor', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white">

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-teal-700 py-12 sm:py-16">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-12 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-5 tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Free to join — always
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Tap Into a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
              $4.3 Trillion
            </span>{' '}
            Market
          </h1>
          <p className="mt-4 text-blue-100 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            The 65+ population controls over <strong className="text-white">70% of U.S. disposable income</strong>.
            Senior living communities need trusted vendors — and VendorHub puts you in front of them.
          </p>
        </div>
      </section>

      {/* ── Two-column layout: benefits + form ───────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

        {/* Left: benefits */}
        <div>
          <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4">
            Why vendors choose us
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 leading-snug">
            The smartest business decision you'll make this year
          </h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Senior living communities represent a stable, growing, and high-value client base. Our platform
            removes the friction of finding and landing those contracts — so you can focus on delivering
            great service.
          </p>

          <div className="space-y-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-teal-100 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm border border-indigo-100">
                  {b.emoji}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{b.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial-style pull quote */}
          <div className="mt-10 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
            <p className="text-sm text-gray-700 leading-relaxed italic">
              "We landed three long-term contracts within 60 days of joining VendorHub.
              The senior care market is consistent, well-funded, and our best source of recurring revenue."
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-800">JR</div>
              <div>
                <p className="text-xs font-bold text-gray-800">James R.</p>
                <p className="text-xs text-gray-500">Owner, BrightCare Medical Supplies</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: sign-up form */}
        <div className="lg:sticky lg:top-20">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Form header */}
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-8 py-6 text-center">
              <h2 className="text-xl font-extrabold text-white">Create Your Free Account</h2>
              <p className="text-indigo-200 text-sm mt-1">Start connecting with communities in minutes</p>
            </div>

            <div className="px-8 py-7">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-700">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={update('name')}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 placeholder-gray-400"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={update('email')}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 placeholder-gray-400"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={update('password')}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 placeholder-gray-400"
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={form.confirm}
                    onChange={update('confirm')}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 placeholder-gray-400"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3.5 rounded-xl text-sm font-bold hover:from-blue-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform disabled:opacity-60 disabled:transform-none mt-2"
                >
                  {loading ? 'Creating your account…' : 'Create My Free Account →'}
                </button>
              </form>

              {/* Trust signals */}
              <div className="mt-5 flex items-center justify-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Free forever
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  No credit card
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Cancel anytime
                </span>
              </div>

              <p className="text-center text-sm text-gray-400 mt-4">
                Already a member?{' '}
                <Link to="/login" className="text-indigo-600 hover:underline font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* ── Bottom CTA strip ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            The senior care boom is here.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
              Don't miss your window.
            </span>
          </p>
          <p className="text-indigo-300 text-sm mb-6 max-w-lg mx-auto">
            By 2030, all Baby Boomers will be over 65. That's 73 million potential clients — and senior
            living communities are already scaling up to meet demand. Get your foot in the door now.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-8 py-4 rounded-2xl text-base font-bold hover:from-yellow-300 hover:to-orange-300 transition-all shadow-lg hover:-translate-y-0.5 transform"
          >
            Join VendorHub Free
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

    </div>
  )
}
