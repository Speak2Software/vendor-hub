import { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, login as storageLogin, logout as storageLogout, createUser } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(getCurrentUser())
    setLoading(false)
  }, [])

  function login(email, password) {
    const u = storageLogin(email, password)
    if (u) setUser(u)
    return u
  }

  function logout() {
    storageLogout()
    setUser(null)
  }

  function signup(data) {
    const u = createUser({ ...data, role: 'vendor' })
    setUser(u)
    return u
  }

  function refreshUser() {
    setUser(getCurrentUser())
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
