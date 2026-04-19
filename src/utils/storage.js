/**
 * VendorHub API client — replaces localStorage-based storage.
 *
 * All functions are async and communicate with the Express API.
 * In production VITE_API_URL is the API Gateway base URL.
 * In dev the Vite proxy forwards /api → http://localhost:4000.
 */

const BASE = import.meta.env.VITE_API_URL || ''

// ── Token management ──────────────────────────────────────────────────────────
let _token = null

export function setToken(token) {
  _token = token
  localStorage.setItem('vh_jwt', token)
}

export function clearToken() {
  _token = null
  localStorage.removeItem('vh_jwt')
}

function authHeaders() {
  const token = _token || localStorage.getItem('vh_jwt')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ── Core fetch helpers ────────────────────────────────────────────────────────
async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const apiGet    = (path)        => request('GET',    path)
export const apiPost   = (path, body)  => request('POST',   path, body)
export const apiPut    = (path, body)  => request('PUT',    path, body)
export const apiDelete = (path)        => request('DELETE', path)

// ── Auth (used by AuthContext) ─────────────────────────────────────────────────
// AuthContext calls apiPost/apiGet directly — no wrappers needed here.

// ── Users ─────────────────────────────────────────────────────────────────────
export async function getUsers() {
  return apiGet('/api/users')
}

export async function createUser(data) {
  return apiPost('/api/users', data)
}

export async function updateUser(id, updates) {
  return apiPut(`/api/users/${id}`, updates)
}

// ── Communities ───────────────────────────────────────────────────────────────
export async function getCommunities() {
  return apiGet('/api/communities')
}

export async function getCommunity(id) {
  return apiGet(`/api/communities/${id}`)
}

export async function saveCommunity(community) {
  if (community.id) {
    return apiPut(`/api/communities/${community.id}`, community)
  }
  return apiPost('/api/communities', community)
}

export async function deleteCommunity(id) {
  return apiDelete(`/api/communities/${id}`)
}

// ── Vendor Profiles ───────────────────────────────────────────────────────────
export async function getVendorProfile(userId) {
  return apiGet(`/api/vendor-profiles/${userId}`)
}

export async function saveVendorProfile(profile) {
  return apiPut(`/api/vendor-profiles/${profile.userId}`, profile)
}

// ── Applications ──────────────────────────────────────────────────────────────
export async function getApplications() {
  return apiGet('/api/applications')
}

export async function getApplication(id) {
  return apiGet(`/api/applications/${id}`)
}

export async function getApplicationsForCommunity(communityId) {
  return apiGet(`/api/applications?communityId=${communityId}`)
}

export async function getApplicationsForVendor(vendorId) {
  return apiGet(`/api/applications?vendorId=${vendorId}`)
}

export async function saveApplication(application) {
  if (application.id) {
    return apiPut(`/api/applications/${application.id}`, application)
  }
  return apiPost('/api/applications', application)
}

export async function addApplicationNote(appId, note, managerId) {
  return apiPost(`/api/applications/${appId}/notes`, { text: note, managerId })
}

export async function updateApplicationStatus(appId, status, managerId, note) {
  return apiPost(`/api/applications/${appId}/status`, { status, managerId, note })
}

export async function revokeApplication(id) {
  return apiPost(`/api/applications/${id}/revoke`, {})
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export async function getReview(appId) {
  const reviews = await apiGet(`/api/reviews?appId=${appId}`)
  return reviews[0] || null
}

export async function getReviewsForCommunity(communityId) {
  return apiGet(`/api/reviews?communityId=${communityId}`)
}

export async function saveReview({ appId, vendorId, communityId, managerId, rating, review }) {
  return apiPut(`/api/reviews/${appId}`, { vendorId, communityId, managerId, rating, review })
}

// ── Company Profiles ──────────────────────────────────────────────────────────
export async function getCompanyProfile(userId) {
  return apiGet(`/api/company-profiles/${userId}`)
}

export async function saveCompanyProfile(profile) {
  return apiPut(`/api/company-profiles/${profile.userId}`, profile)
}

// ── Messages ──────────────────────────────────────────────────────────────────
export async function getMessagesForVendor(vendorId) {
  return apiGet(`/api/messages?vendorId=${vendorId}`)
}

export async function saveMessage(message) {
  return apiPost('/api/messages', message)
}

// ── Geo helpers (pure math — no API call needed) ──────────────────────────────
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8 // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Legacy no-op (nothing to seed on client any more) ─────────────────────────
export function seed() { /* data lives in MongoDB Atlas */ }
