/**
 * mailer.js — thin wrapper around the Resend SDK.
 *
 * All send functions are fire-and-forget: they log errors but never throw,
 * so a mail failure never breaks the API response.
 *
 * Set RESEND_API_KEY in Railway (production) and api/.env (local dev).
 * Set MAIL_FROM to override the sender address (default: noreply@speak2vendors.com).
 */

const { Resend } = require('resend')

const resend  = new Resend(process.env.RESEND_API_KEY)
const FROM    = process.env.MAIL_FROM || 'Speak2Vendors <noreply@speak2vendors.com>'
const APP_URL = process.env.APP_URL   || 'https://www.speak2vendors.com'

// ── Internal helper ───────────────────────────────────────────────────────────
async function send({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[mailer] RESEND_API_KEY is not set — skipping email to', to)
    return
  }
  try {
    console.error('[mailer] Sending email to', to, '| subject:', subject)
    const result = await resend.emails.send({ from: FROM, to, subject, html })
    console.error('[mailer] Email sent OK to', to, '| id:', result?.data?.id || result?.id)
  } catch (err) {
    console.error('[mailer] Failed to send email to', to, err?.message, err?.response?.data)
  }
}

// ── Notification templates ─────────────────────────────────────────────────────

/**
 * Sent to the recipient of a direct message.
 *
 * @param {object} opts
 * @param {string} opts.toEmail       - recipient's email address
 * @param {string} opts.toName        - recipient's display name
 * @param {string} opts.senderName    - display name of the message sender
 * @param {string} opts.messageBody   - first ~200 chars of the message
 */
async function notifyDirectMessage({ toEmail, toName, senderName, messageBody }) {
  const preview = messageBody.length > 200 ? messageBody.slice(0, 200) + '…' : messageBody
  await send({
    to:      toEmail,
    subject: `New message from ${senderName} — Speak2Vendors`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="background:linear-gradient(135deg,#2563eb,#0d9488);padding:28px 24px">
          <p style="margin:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.7)">Speak2Vendors</p>
          <p style="margin:8px 0 0;font-size:22px;font-weight:800;color:#fff">You have a new message</p>
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 16px;font-size:15px;color:#111827">Hi ${toName},</p>
          <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.6">
            <strong style="color:#111827">${senderName}</strong> sent you a message on Speak2Vendors:
          </p>
          <div style="background:#f3f4f6;border-left:3px solid #2563eb;border-radius:0 8px 8px 0;padding:14px 16px;margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6">
            ${preview}
          </div>
          <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#0d9488);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">
            View Message →
          </a>
        </div>
        <div style="background:#f9fafb;padding:14px 24px;border-top:1px solid #f3f4f6;text-align:center">
          <p style="margin:0;font-size:11px;color:#9ca3af">You received this because you have an account on Speak2Vendors.</p>
        </div>
      </div>
    `,
  })
}

/**
 * Sent to each vendor who receives a broadcast.
 *
 * @param {object} opts
 * @param {string}   opts.toEmail      - vendor's email
 * @param {string}   opts.toName       - vendor's name
 * @param {string}   opts.communityName
 * @param {string}   opts.subject      - broadcast subject (may be empty)
 * @param {string}   opts.body
 */
async function notifyBroadcast({ toEmail, toName, communityName, subject, body }) {
  const preview = body.length > 300 ? body.slice(0, 300) + '…' : body
  await send({
    to:      toEmail,
    subject: subject || `Message from ${communityName} — Speak2Vendors`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="background:linear-gradient(135deg,#2563eb,#0d9488);padding:28px 24px">
          <p style="margin:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.7)">Speak2Vendors</p>
          <p style="margin:8px 0 0;font-size:22px;font-weight:800;color:#fff">Message from ${communityName}</p>
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 16px;font-size:15px;color:#111827">Hi ${toName},</p>
          ${subject ? `<p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827">${subject}</p>` : ''}
          <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;white-space:pre-line">
            ${preview}
          </div>
          <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#0d9488);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">
            Open Speak2Vendors →
          </a>
        </div>
        <div style="background:#f9fafb;padding:14px 24px;border-top:1px solid #f3f4f6;text-align:center">
          <p style="margin:0;font-size:11px;color:#9ca3af">You received this because you are a vendor partner of ${communityName} on Speak2Vendors.</p>
        </div>
      </div>
    `,
  })
}

/**
 * Sent to a community manager when a vendor uses the Email Composer.
 *
 * @param {object} opts
 * @param {string} opts.toEmail       - manager's email
 * @param {string} opts.toName        - manager's name
 * @param {string} opts.vendorName    - vendor business name
 * @param {string} opts.subject       - email subject from composer
 * @param {string} opts.body          - email body from composer
 */
async function notifyVendorEmail({ toEmail, toName, vendorName, subject, body }) {
  const preview = body.length > 400 ? body.slice(0, 400) + '…' : body
  await send({
    to:      toEmail,
    subject: subject || `Message from ${vendorName} — Speak2Vendors`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="background:linear-gradient(135deg,#2563eb,#0d9488);padding:28px 24px">
          <p style="margin:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.7)">Speak2Vendors</p>
          <p style="margin:8px 0 0;font-size:22px;font-weight:800;color:#fff">Message from ${vendorName}</p>
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 16px;font-size:15px;color:#111827">Hi ${toName},</p>
          ${subject ? `<p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827">${subject}</p>` : ''}
          <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;white-space:pre-line">
            ${preview}
          </div>
          <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#0d9488);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">
            View on Speak2Vendors →
          </a>
        </div>
        <div style="background:#f9fafb;padding:14px 24px;border-top:1px solid #f3f4f6;text-align:center">
          <p style="margin:0;font-size:11px;color:#9ca3af">Sent via Speak2Vendors by ${vendorName}. You received this because you manage a community on Speak2Vendors.</p>
        </div>
      </div>
    `,
  })
}

module.exports = { notifyDirectMessage, notifyBroadcast, notifyVendorEmail }
