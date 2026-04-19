import { createContext, useContext, useState, useEffect } from 'react'
import { apiPost, apiGet, setToken, clearToken } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount: restore session from stored JWT
  useEffect(() => {
    const token = localStorage.getItem('vh_jwt')
    if (!token) {
      setLoading(false)
      return
    }
    setToken(token)
    apiGet('/api/users/me')
      .then((u) => setUser(u))
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const { token, user: u } = await apiPost('/api/auth/login', { email, password })
    setToken(token)
    setUser(u)
    return u
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  async function signup({ name, email, password }) {
    const { token, user: u } = await apiPost('/api/auth/register', { name, email, password, role: 'vendor' })
    setToken(token)
    setUser(u)
    return u
  }

  async function refreshUser() {
    const u = await apiGet('/api/users/me')
    setUser(u)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
