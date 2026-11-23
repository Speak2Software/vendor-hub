// Password policy for new accounts — kept in sync with api/utils/passwordRules.js
// (the API enforces the same rules, since client checks are bypassable).
//
// Pragmatic blend: min 8 chars, must include upper + lower + a number, and must
// not be one of the most common passwords.

// A short list of the most common / obvious passwords to reject outright.
export const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', 'passw0rd', 'p@ssword',
  '12345678', '123456789', '1234567890', '123456', '1234567', '12345',
  'qwerty', 'qwerty123', 'qwertyuiop', '1q2w3e4r', 'abc123', 'a1b2c3d4',
  'letmein', 'welcome', 'welcome1', 'admin', 'admin123', 'root', 'login',
  'iloveyou', 'monkey', 'dragon', 'sunshine', 'princess', 'football',
  'baseball', '111111', '000000', '123123', 'test1234', 'changeme',
  'starwars', 'whatever', 'trustno1', 'superman', 'hello123',
  'vendorhub', 'speak2', 'speak2family',
])

export const PASSWORD_RULES = [
  { key: 'length',    label: 'At least 8 characters' },
  { key: 'upper',     label: 'An uppercase letter' },
  { key: 'lower',     label: 'A lowercase letter' },
  { key: 'number',    label: 'A number' },
  { key: 'notCommon', label: 'Not a common password' },
]

export function passwordChecks(pw = '') {
  const p = String(pw)
  return {
    length:    p.length >= 8,
    upper:     /[A-Z]/.test(p),
    lower:     /[a-z]/.test(p),
    number:    /[0-9]/.test(p),
    notCommon: p.length > 0 && !COMMON_PASSWORDS.has(p.toLowerCase()),
  }
}

// Returns { valid, checks, error } — `error` is the first human-readable failure.
export function validatePassword(pw = '') {
  const checks = passwordChecks(pw)
  const valid = Object.values(checks).every(Boolean)
  let error = ''
  if (!valid) {
    if (!checks.length) error = 'Password must be at least 8 characters.'
    else if (!checks.notCommon && COMMON_PASSWORDS.has(String(pw).toLowerCase())) error = 'That password is too common — please choose another.'
    else error = 'Password must include an uppercase letter, a lowercase letter, and a number.'
  }
  return { valid, checks, error }
}
