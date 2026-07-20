import { useEffect, useState, useCallback } from 'react'
import {
  getCommunity, getApplicationsForCommunity, getReviewsForCommunity,
  getDirectMessageThreads, getBroadcastsForCommunity,
} from '../utils/storage'

/**
 * Loads and derives everything the manager Dashboard and Communications
 * pages need, so both stay in sync without duplicating the logic.
 */
export function useManagerData(user) {
  const [community, setCommunity]       = useState(null)
  const [applications, setApplications] = useState([])
  const [reviews, setReviews]           = useState([])
  const [threads, setThreads]           = useState([])
  const [broadcasts, setBroadcasts]     = useState([])
  const [loaded, setLoaded]             = useState(false)

  const reload = useCallback(async () => {
    if (!user?.communityId) { setLoaded(true); return }
    const [comm, apps, revs, rawThreads, bcs] = await Promise.all([
      getCommunity(user.communityId),
      getApplicationsForCommunity(user.communityId),
      getReviewsForCommunity(user.communityId),
      getDirectMessageThreads(),
      getBroadcastsForCommunity(user.communityId),
    ])
    setCommunity(comm)
    setApplications(apps.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)))
    setReviews(revs)
    setThreads(rawThreads)
    setBroadcasts(bcs)
    setLoaded(true)
  }, [user?.communityId])

  useEffect(() => { reload() }, [reload])

  const approved = applications.filter((a) => a.status === 'approved')
  const pending  = applications.filter((a) => a.status === 'pending')
  const denied   = applications.filter((a) => a.status === 'denied')
  const reviewByApp = Object.fromEntries(reviews.map((r) => [r.appId, r]))

  // Enrich DM threads with vendor (business) names
  const vendorNameMap = Object.fromEntries(
    applications.map((a) => [a.vendorId, a.businessName || a.contactName || 'Vendor'])
  )
  const enrichedThreads = threads.map((t) => ({
    ...t,
    otherPartyName: vendorNameMap[t.vendorId] || 'Vendor',
  }))
  const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0)

  // Approved vendors available for broadcast / messaging
  const availableParties = approved.map((a) => ({
    vendorId:    a.vendorId,
    communityId: user.communityId,
    name:        a.businessName || a.contactName || 'Vendor',
  })).filter((p, i, arr) => arr.findIndex((x) => x.vendorId === p.vendorId) === i)

  return {
    loaded, reload,
    community, applications, reviews, threads, broadcasts,
    approved, pending, denied, reviewByApp,
    enrichedThreads, totalUnread, availableParties,
  }
}
