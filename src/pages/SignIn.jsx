import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignIn() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [slow, setSlow] = useState(false)

  const from = location.state?.from?.pathname

  function roleHome(role) {
    if (role === 'admin') return '/admin'
    if (role === 'community_manager') return '/manager'
    return '/vendor'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSlow(false)
    setLoading(true)
    // If the API is waking from sleep the first request can take several
    // seconds — let the user know instead of leaving them on a silent spinner.
    const slowTimer = setTimeout(() => setSlow(true), 2500)
    try {
      const user = await login(form.email, form.password)
      navigate(from || roleHome(user.role), { replace: true })
    } catch {
      setError('Invalid email or password.')
    } finally {
      clearTimeout(slowTimer)
      setLoading(false)
      setSlow(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12" style={{background: 'linear-gradient(145deg, #0d3f73 0%, #135aa0 60%, #1a73c8 100%)'}}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Vendor Hub" className="h-14 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-extrabold text-white">Welcome back</h1>
          <p className="text-[#b3d4ed] text-sm mt-1">Sign in to your Vendor Hub account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border border-white/20 p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73c8] focus:border-transparent bg-gray-50"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73c8] focus:border-transparent bg-gray-50"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a73c8] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#135aa0] transition-all shadow-md disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            {slow && (
              <p className="text-center text-xs text-gray-400 leading-relaxed">
                Waking up the server — this can take a few seconds the first time. Hang tight…
              </p>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            New vendor?{' '}
            <Link to="/signup" className="text-[#1a73c8] hover:underline font-semibold">
              Create a free account →
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
