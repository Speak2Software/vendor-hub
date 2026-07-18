/**
 * geocode.js — forward-geocodes a street address to { lat, lng }
 * using OpenStreetMap's free Nominatim API (same provider as the map tiles).
 *
 * Returns { lat, lng } or null when the address can't be found.
 * Throws on network failure.
 */
export async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(address)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`)
  const results = await res.json()
  if (!results.length) return null
  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }
}
