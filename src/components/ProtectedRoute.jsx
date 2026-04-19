import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect each role to their home
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'community_manager') return <Navigate to="/manager" replace />
    return <Navigate to="/vendor" replace />
  }

  return children
}
