/*
 * Mama Ji — real password-reset OTP (Vercel serverless function).
 *
 * POST /api/otp  { action: 'send',  phone, email }
 *   → generates a 6-digit OTP server-side, delivers it by email (Resend)
 *     and/or SMS (Twilio), and returns a SIGNED TOKEN (HMAC) — never the OTP.
 *
 * POST /api/otp  { action: 'verify', otp, token, expiry, phone, email }
 *   → recomputes the HMAC and returns { valid: true/false }.
 *
 * Stateless by design (no database): the OTP is bound into an HMAC signature
 * using the server-only OTP_SECRET, so the browser never learns the code and
 * cannot forge a valid token. Set these environment variables in Vercel:
 *
 *   OTP_SECRET            (required) long random string, e.g. `openssl rand -hex 32`
 *   RESEND_API_KEY        Resend API key            (email channel)
 *   RESEND_FROM           verified sender, e.g. "Mama Ji <noreply@yourdomain.com>"
 *   TWILIO_ACCOUNT_SID    Twilio Account SID         (SMS channel)
 *   TWILIO_AUTH_TOKEN     Twilio Auth Token
 *   TWILIO_FROM           Twilio sender number in E.164, e.g. "+15005550006"
 *
 * A channel is used only when its variables are present, so you can ship email
 * first and add SMS later (or vice-versa).
 */

import crypto from 'crypto';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Best-effort, per-warm-instance rate limiting (no store). For strong
// abuse protection in production, back this with Vercel KV / Upstash.
const hits = new Map(); // key -> [timestamps]
function rateLimited(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > max;
}

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return await new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => { d += c; });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

const secret = () => process.env.OTP_SECRET || '';
const payloadStr = (otp, phone, email, expiry) => `${otp}.${phone || ''}.${email || ''}.${expiry}`;
const sign = (otp, phone, email, expiry) =>
  crypto.createHmac('sha256', secret()).update(payloadStr(otp, phone, email, expiry)).digest('hex');

// Nepal mobile numbers are stored as local digits (98########). To E.164.
function toE164(phone) {
  const d = String(phone || '').replace(/\D/g, '').replace(/^0+/, '');
  if (!d) return '';
  return d.startsWith('977') ? `+${d}` : `+977${d}`;
}

async function sendEmail(email, otp) {
  const key = process.env.RESEND_API_KEY, from = process.env.RESEND_FROM;
  if (!key || !from) return { channel: 'email', ok: false, reason: 'not_configured' };
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Mama Ji password reset code: ${otp}`,
        text: `Your Mama Ji password reset code is ${otp}. It expires in 5 minutes. If you did not request this, you can ignore this email.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto">
          <h2 style="color:#166534">Mama Ji — Password Reset</h2>
          <p>Your one-time code is:</p>
          <p style="font-size:30px;font-weight:800;letter-spacing:6px;color:#166534">${otp}</p>
          <p style="color:#555">This code expires in 5 minutes. If you did not request a password reset, please ignore this email.</p>
        </div>`
      })
    });
    return { channel: 'email', ok: r.ok, status: r.status };
  } catch (e) {
    return { channel: 'email', ok: false, reason: 'error' };
  }
}

async function sendSms(phone, otp) {
  const sid = process.env.TWILIO_ACCOUNT_SID, tok = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_FROM;
  if (!sid || !tok || !from) return { channel: 'sms', ok: false, reason: 'not_configured' };
  const to = toE164(phone);
  if (!to) return { channel: 'sms', ok: false, reason: 'bad_number' };
  try {
    const body = new URLSearchParams({ To: to, From: from, Body: `Your Mama Ji password reset code is ${otp} (valid 5 minutes).` });
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${tok}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });
    return { channel: 'sms', ok: r.ok, status: r.status };
  } catch (e) {
    return { channel: 'sms', ok: false, reason: 'error' };
  }
}

async function handleSend(req, res, body) {
  const ip = (req.headers['x-forwarded-for'] || 'ip').toString().split(',')[0].trim();
  if (rateLimited(`send:${ip}`, 5, 10 * 60 * 1000)) {
    return sendJson(res, 429, { error: 'too_many_requests' });
  }
  if (!secret()) return sendJson(res, 500, { error: 'service_not_configured' });

  const phone = (body.phone || '').toString().trim();
  const email = (body.email || '').toString().trim();
  if (!phone && !email) return sendJson(res, 400, { error: 'no_destination' });

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiry = Date.now() + OTP_TTL_MS;

  const results = [];
  if (email) results.push(await sendEmail(email, otp));
  if (phone) results.push(await sendSms(phone, otp));

  const channels = results.filter(r => r.ok).map(r => r.channel);
  if (channels.length === 0) {
    const notConfigured = results.length > 0 && results.every(r => r.reason === 'not_configured');
    return sendJson(res, 502, { error: notConfigured ? 'service_not_configured' : 'send_failed' });
  }

  const token = sign(otp, phone, email, expiry);
  return sendJson(res, 200, { ok: true, token, expiry, channels });
}

function handleVerify(req, res, body) {
  const ip = (req.headers['x-forwarded-for'] || 'ip').toString().split(',')[0].trim();
  if (rateLimited(`verify:${ip}`, 10, 10 * 60 * 1000)) {
    return sendJson(res, 429, { valid: false, error: 'too_many_requests' });
  }
  if (!secret()) return sendJson(res, 500, { valid: false, error: 'service_not_configured' });

  const { otp, token, expiry, phone = '', email = '' } = body;
  if (!otp || !token || !expiry) return sendJson(res, 400, { valid: false, error: 'missing' });
  if (Date.now() > Number(expiry)) return sendJson(res, 200, { valid: false, error: 'expired' });

  const expected = sign(String(otp).trim(), phone, email, Number(expiry));
  let valid = false;
  try {
    valid = expected.length === String(token).length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(token)));
  } catch { valid = false; }

  return sendJson(res, 200, { valid });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed' });
  const body = await readBody(req);
  if (body.action === 'send') return handleSend(req, res, body);
  if (body.action === 'verify') return handleVerify(req, res, body);
  return sendJson(res, 400, { error: 'unknown_action' });
}
