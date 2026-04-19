import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { getVendorProfile } from './utils/storage'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Signup from './pages/Signup'
import VendorPortalDashboard from './pages/vendor/Dashboard'
import VendorLocation from './pages/vendor/Location'
import CompanyProfile from './pages/vendor/CompanyProfile'
import Apply from './pages/vendor/Apply'
import VendorDashboard from './pages/vendor/VendorDashboard'
import ManagerDashboard from './pages/manager/Dashboard'
import ApplicationDetail from './pages/manager/ApplicationDetail'
import VendorMap from './pages/manager/VendorMap'
import MyVendors from './pages/manager/MyVendors'
import CommunityProfile from './pages/manager/CommunityProfile'
import AdminDashboard from './pages/admin/AdminDashboard'
import CommunitiesAdmin from './pages/admin/Communities'
import ManagersAdmin from './pages/admin/Managers'
import VendorsAdmin from './pages/admin/Vendors'

function RoleRedirect() {
  const { user, loading } = useAuth()
  const [ready, setReady] = useState(false)
  const [dest, setDest]   = useState(null)

  useEffect(() => {
    if (loading) return
    if (!user) { setDest('/login'); setReady(true); return }
    if (user.role === 'admin') { setDest('/admin'); setReady(true); return }
    if (user.role === 'community_manager') { setDest('/manager'); setReady(true); return }
    // Vendors: check if a location profile exists
    getVendorProfile(user.id)
      .then((p) => setDest(p ? '/vendor' : '/vendor/location'))
      .catch(() => setDest('/vendor/location'))
      .finally(() => setReady(true))
  }, [user, loading])

  if (loading || !ready) return null
  return <Navigate to={dest} replace />
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Vendor */}
        <Route path="/vendor" element={
          <ProtectedRoute roles={['vendor']}><VendorPortalDashboard /></ProtectedRoute>
        } />
        <Route path="/vendor/location" element={
          <ProtectedRoute roles={['vendor']}><VendorLocation /></ProtectedRoute>
        } />
        <Route path="/vendor/profile" element={
          <ProtectedRoute roles={['vendor']}><CompanyProfile /></ProtectedRoute>
        } />
        <Route path="/vendor/apply" element={
          <ProtectedRoute roles={['vendor']}><Apply /></ProtectedRoute>
        } />
        <Route path="/vendor/status" element={
          <ProtectedRoute roles={['vendor']}><VendorDashboard /></ProtectedRoute>
        } />

        {/* Community Manager */}
        <Route path="/manager" element={
          <ProtectedRoute roles={['community_manager']}><ManagerDashboard /></ProtectedRoute>
        } />
        <Route path="/manager/application/:id" element={
          <ProtectedRoute roles={['community_manager']}><ApplicationDetail /></ProtectedRoute>
        } />
        <Route path="/manager/vendors" element={
          <ProtectedRoute roles={['community_manager']}><MyVendors /></ProtectedRoute>
        } />
        <Route path="/manager/map" element={
          <ProtectedRoute roles={['community_manager']}><VendorMap /></ProtectedRoute>
        } />
        <Route path="/manager/community" element={
          <ProtectedRoute roles={['community_manager']}><CommunityProfile /></ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/communities" element={
          <ProtectedRoute roles={['admin']}><CommunitiesAdmin /></ProtectedRoute>
        } />
        <Route path="/admin/managers" element={
          <ProtectedRoute roles={['admin']}><ManagersAdmin /></ProtectedRoute>
        } />
        <Route path="/admin/vendors" element={
          <ProtectedRoute roles={['admin']}><VendorsAdmin /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
