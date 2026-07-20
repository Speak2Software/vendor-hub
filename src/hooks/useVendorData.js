import { useEffect, useState, useCallback } from 'react'
import {
  getApplicationsForVendor, getCommunity, getVendorProfile,
  getCompanyProfile, getMessagesForVendor, getDirectMessageThreads,
} from '../utils/storage'

/**
 * Loads and derives everything the vendor Dashboard and Communications
 * pages need, so both stay in sync without duplicating the logic.
 */
export function useVendorData(user) {
  const [apps, setApps]                     = useState([])
  const [messages, setMessages]             = useState([])
  const [threads, setThreads]               = useState([])
  const [companyProfile, setCompanyProfile] = useState(null)
  const [profile, setProfile]               = useState(null)
  const [loaded, setLoaded]                 = useState(false)

  const load = useCallback(async () => {
    const raw = await getApplicationsForVendor(user.id)
    const enriched = await Promise.all(
      raw.map((a) => getCommunity(a.communityId).then((c) => ({ ...a, community: c })))
    )
    setApps(enriched.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)))
    const [msgs, rawThreads, cp, vp] = await Promise.all([
      getMessagesForVendor(user.id),
      getDirectMessageThreads(),
      getCompanyProfile(user.id),
      getVendorProfile(user.id),
    ])
    setMessages(msgs)
    setThreads(rawThreads)
    setCompanyProfile(cp)
    setProfile(vp)
    setLoaded(true)
  }, [user.id])

  useEffect(() => { load() }, [load])

  const approvedApps = apps.filter((a) => a.status === 'approved')
  const pendingApps  = apps.filter((a) => a.status === 'pending')
  const deniedApps   = apps.filter((a) => a.status === 'denied')
  const revokedApps  = apps.filter((a) => a.status === 'revoked')

  // Vendor identity — company profile first, fall back to application data.
  const primaryApp = apps.find((a) => a.businessName)
  const src = companyProfile || primaryApp || {}
  const vendorInfo = {
    vendorId:        user.id,
    businessName:    src.businessName    || user.name,
    contactName:     src.contactName     || user.name,
    email:           src.contactEmail    || user.email,
    phone:           src.contactPhone    || '',
    serviceCategory: src.serviceCategory || '',
    yearsInBusiness: src.yearsInBusiness || '',
  }

  const communityNameMap = Object.fromEntries(
    apps.filter((a) => a.community).map((a) => [a.communityId, a.community.name])
  )
  const enrichedThreads = threads.map((t) => ({
    ...t,
    otherPartyName: communityNameMap[t.communityId] || 'Community',
  }))
  const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0)

  // Communities the vendor can message: every one they've applied to.
  const availableParties = apps.map((a) => ({
    vendorId:    user.id,
    communityId: a.communityId,
    name:        a.community?.name || 'Community',
  })).filter((p, i, arr) => arr.findIndex((x) => x.communityId === p.communityId) === i)

  const activityFeed = apps
    .flatMap((a) => (a.statusHistory || []).map((h) => ({
      ...h,
      communityName: a.community?.name || 'Unknown Community',
      businessName:  a.businessName,
    })))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 8)

  return {
    loaded, load,
    apps, messages, threads, companyProfile, profile,
    approvedApps, pendingApps, deniedApps, revokedApps,
    vendorInfo, enrichedThreads, totalUnread, availableParties, activityFeed,
  }
}
