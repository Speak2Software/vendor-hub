// Builds an EMAIL-SAFE recruitment flyer used as the HTML body of a vendor
// invite. Email clients (esp. Outlook) strip flexbox, CSS variables and often
// gradients, so this is deliberately table-based with inline styles and solid
// brand colors — unlike the richer on-screen Communications flyer.

const NAVY = '#0d3f73'
const BLUE = '#1a73c8'
const SOFT = '#eef6fd'

function esc(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function defaultInviteSubject(community) {
  return `You're invited to partner with ${community?.name || 'our community'}`
}

/**
 * @param {object} opts
 * @param {object} opts.community  - the manager's community (name, address, logoUrl)
 * @param {string} [opts.applyUrl] - where the QR / button points (signup)
 */
export function buildInviteEmailHTML({ community = {}, applyUrl = 'https://www.speak2vendors.com/signup' } = {}) {
  const name = esc(community.name || 'Our Community')
  const address = community.address ? esc(community.address) : ''
  const url = String(applyUrl).trim()
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&color=${NAVY.replace('#', '')}&bgcolor=ffffff&data=${encodeURIComponent(url)}`

  const logoCell = community.logoUrl
    ? `<img src="${esc(community.logoUrl)}" width="52" height="52" alt="" style="display:block;border-radius:10px;background:#ffffff;object-fit:contain" />`
    : ''

  const steps = [
    `Scan the code below or visit <a href="${esc(url)}" style="color:${BLUE};text-decoration:underline">speak2vendors.com</a>`,
    'Create a free vendor account and complete your profile',
    `Submit your application to <strong>${name}</strong> for review`,
  ]
  const stepsHtml = steps.map((s, i) => `
    <tr>
      <td valign="top" style="padding:0 10px 8px 0;width:24px">
        <div style="width:22px;height:22px;line-height:22px;text-align:center;background:${BLUE};color:#ffffff;border-radius:11px;font-size:12px;font-weight:700">${i + 1}</div>
      </td>
      <td valign="top" style="padding:0 0 8px 0;font-size:14px;color:#374151;line-height:1.5">${s}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb">

        <!-- Header -->
        <tr><td style="background:${NAVY};padding:26px 28px">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
            ${logoCell ? `<td width="52" style="padding-right:14px">${logoCell}</td>` : ''}
            <td valign="middle">
              <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#b3d4ed">Now accepting vendor partners</div>
              <div style="font-size:22px;font-weight:800;color:#ffffff;line-height:1.2;margin-top:4px">${name}</div>
              ${address ? `<div style="font-size:12px;color:#b3d4ed;margin-top:4px">${address}</div>` : ''}
            </td>
          </tr></table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px">
          <div style="font-size:19px;font-weight:700;color:#111827;margin-bottom:8px">Partner with us as a vendor</div>
          <div style="font-size:14px;color:#4b5563;line-height:1.6;margin-bottom:22px">
            We're actively seeking trusted service providers to support our residents. Create your free
            vendor profile and apply to serve ${name}.
          </div>

          <!-- Apply button -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
            <tr><td style="background:${BLUE};border-radius:10px">
              <a href="${esc(url)}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">Create your free account →</a>
            </td></tr>
          </table>

          <!-- Steps -->
          <div style="background:${SOFT};border-radius:12px;padding:18px 20px;margin-bottom:22px">
            <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${BLUE};margin-bottom:12px">How it works</div>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${stepsHtml}</table>
          </div>

          <!-- QR -->
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td align="center">
              <div style="display:inline-block;border:2px solid ${BLUE};border-radius:14px;padding:12px;background:#ffffff">
                <img src="${qr}" width="150" height="150" alt="Scan to apply" style="display:block" />
              </div>
              <div style="font-size:13px;font-weight:700;color:${BLUE};margin-top:10px">Scan to apply</div>
              <div style="font-size:12px;color:#6b7280;margin-top:2px">${esc(url.replace(/^https?:\/\//, ''))}</div>
            </td>
          </tr></table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:14px 28px;text-align:center">
          <div style="font-size:11px;color:#9ca3af">Powered by Vendor Hub · speak2vendors.com</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
