// Vendors can serve from multiple business locations. Older profiles only have
// a single `location` + `serviceRadiusMiles`; this normalizes both shapes into
// a consistent array so all readers can treat a profile as multi-location.

export function newLocationId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `loc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Returns a vendor's service locations as an array of
 * { id, label, lat, lng, serviceRadiusMiles }.
 * Falls back to the legacy single-location fields when `locations` is empty.
 */
export function normalizeLocations(profile) {
  if (!profile) return []
  if (Array.isArray(profile.locations) && profile.locations.length) {
    return profile.locations
  }
  const loc = profile.location
  if (loc && (loc.lat || loc.lng)) {
    return [{
      id: 'primary',
      label: 'Main location',
      lat: loc.lat,
      lng: loc.lng,
      serviceRadiusMiles: profile.serviceRadiusMiles || 25,
    }]
  }
  return []
}
