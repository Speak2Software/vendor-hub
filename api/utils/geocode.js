/**
 * geocode.js — thin wrapper around the Nominatim OpenStreetMap geocoding API.
 * Free, no API key required.
 * Rate limit: 1 request/second — only call this when saving data, not on every read.
 */

/**
 * Convert an address string to { lat, lng }.
 * Returns null if the address cannot be geocoded.
 */
async function geocodeAddress(address) {
  if (!address?.trim()) return null
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    const res  = await fetch(url, {
      headers: { 'User-Agent': 'VendorHub/1.0 (speak2vendors.com)' },
    })
    const data = await res.json()
    if (!data?.[0]) return null
    const lat = parseFloat(data[0].lat)
    const lng = parseFloat(data[0].lon)
    if (isNaN(lat) || isNaN(lng)) return null
    return { lat, lng }
  } catch (err) {
    console.error('[geocode] failed for:', address, err?.message)
    return null
  }
}

module.exports = { geocodeAddress }
