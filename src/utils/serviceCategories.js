// Canonical list of vendor service categories, shared by the vendor profile
// form, the manager vendor list/map, and the dashboard coverage indicator.

export const SERVICE_CATEGORIES = [
  'Medical / Healthcare',
  'Transportation',
  'Food & Nutrition Services',
  'Housekeeping & Laundry',
  'Maintenance & Facilities',
  'Personal Care & Grooming',
  'Physical / Occupational Therapy',
  'Mental Health & Counseling',
  'Entertainment & Activities',
  'Technology & Telehealth',
  'Financial Services',
  'Legal Services',
  'Insurance',
  'Staffing & Workforce',
  'Pharmacy & Medical Supplies',
  'Other',
]

export const SERVICE_CATEGORY_ICONS = {
  'Medical / Healthcare': '🏥',
  'Transportation': '🚐',
  'Food & Nutrition Services': '🍽️',
  'Housekeeping & Laundry': '🧹',
  'Maintenance & Facilities': '🔧',
  'Personal Care & Grooming': '💆',
  'Physical / Occupational Therapy': '🤸',
  'Mental Health & Counseling': '🧠',
  'Entertainment & Activities': '🎭',
  'Technology & Telehealth': '💻',
  'Financial Services': '💼',
  'Legal Services': '⚖️',
  'Insurance': '📋',
  'Staffing & Workforce': '👥',
  'Pharmacy & Medical Supplies': '💊',
  'Other': '📦',
}

export const categoryIcon = (c) => SERVICE_CATEGORY_ICONS[c] || '📦'

/**
 * Buckets the canonical categories into covered (has ≥1 approved vendor) and
 * gaps, given the community's approved applications.
 * "Other" is reported only when it actually has vendors — it's a catch-all,
 * not a gap worth chasing.
 */
export function serviceCoverage(approvedApps = []) {
  const counts = {}
  for (const app of approvedApps) {
    const c = app.serviceCategory
    if (!c) continue
    counts[c] = (counts[c] || 0) + 1
  }

  const covered = SERVICE_CATEGORIES
    .filter((c) => counts[c] > 0)
    .map((c) => ({ category: c, count: counts[c] }))

  // Categories a vendor typed that aren't in the canonical list still count.
  const extra = Object.keys(counts)
    .filter((c) => !SERVICE_CATEGORIES.includes(c))
    .map((c) => ({ category: c, count: counts[c] }))

  const gaps = SERVICE_CATEGORIES.filter((c) => c !== 'Other' && !counts[c])

  const trackable = SERVICE_CATEGORIES.filter((c) => c !== 'Other').length
  const coveredTrackable = SERVICE_CATEGORIES.filter((c) => c !== 'Other' && counts[c] > 0).length

  return {
    covered: [...covered, ...extra].sort((a, b) => b.count - a.count),
    gaps,
    coveredCount: coveredTrackable,
    totalCount: trackable,
    percent: trackable ? Math.round((coveredTrackable / trackable) * 100) : 0,
  }
}
