// Editable marketing copy for the public signup page. These defaults mirror the
// original hardcoded copy, so the page looks identical until an admin edits it
// under Admin → Content. Only the header and left column are managed.

export const SIGNUP_CONTENT_DEFAULTS = {
  header: {
    badge:          'Free to join — always',
    titleLine1:     'Tap Into a',
    titleHighlight: '$4.3 Trillion',
    titleLine2:     'Market',
    subtitle:       'The 65+ population controls over 70% of U.S. disposable income. Senior living communities need trusted vendors — and Vendor Hub puts you in front of them.',
  },
  left: {
    eyebrow:     'Why vendors choose us',
    heading:     "The smartest business decision you'll make this year",
    description: 'Senior living communities represent a stable, growing, and high-value client base. Our platform removes the friction of finding and landing those contracts — so you can focus on delivering great service.',
    benefits: [
      { emoji: '💰', title: '$4.3 Trillion Market',        desc: 'Senior care is one of the fastest-growing industries in the U.S. — and the wealthiest generation is driving it.' },
      { emoji: '📈', title: 'Recurring Revenue',           desc: 'Community contracts mean predictable, repeat business — not one-time jobs. Build a stable client base.' },
      { emoji: '🤝', title: 'Pre-Qualified Leads',         desc: 'Every community in our network is actively looking for vendors like you. No cold calling. No guessing.' },
      { emoji: '🏆', title: 'Stand Out From Competitors',  desc: 'Verified vendor status signals trust and credibility — giving you a leg up on competitors not in our network.' },
    ],
    testimonialQuote:    'We landed three long-term contracts within 60 days of joining Vendor Hub. The senior care market is consistent, well-funded, and our best source of recurring revenue.',
    testimonialInitials: 'JR',
    testimonialName:     'James R.',
    testimonialTitle:    'Owner, BrightCare Medical Supplies',
  },
}

/**
 * Overlays a stored content doc on top of the defaults so missing fields always
 * fall back. Benefits use the stored array only when it's a non-empty array.
 */
export function mergeSignupContent(stored) {
  const d = SIGNUP_CONTENT_DEFAULTS
  if (!stored) return d
  const benefits = Array.isArray(stored.left?.benefits) && stored.left.benefits.length
    ? stored.left.benefits
    : d.left.benefits
  return {
    header: { ...d.header, ...(stored.header || {}) },
    left:   { ...d.left, ...(stored.left || {}), benefits },
  }
}
