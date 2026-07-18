/**
 * formatPhone.js — formats US phone numbers as (555) 123-4567 while typing.
 * Strips non-digits, caps at 10 digits, and adds punctuation progressively.
 */
export function formatPhone(val) {
  const d = val.replace(/\D/g, '').slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}
