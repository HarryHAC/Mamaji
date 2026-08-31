# Password-reset OTP — setup

The "Forgot password?" flow sends a **real** 6-digit OTP by **email (Resend)**
and **SMS (Twilio)**. The code is generated, signed, and verified by the Vercel
serverless function [`api/otp.js`](api/otp.js) — the browser never sees the code.

Nothing is shown on-screen anymore; the user must receive the code on their
phone/email. Until the environment variables below are set, the app will say
*"OTP service is not set up yet."*

## 1. Add environment variables in Vercel

Vercel → your project → **Settings → Environment Variables**. Add each of these
(select **Production, Preview, Development**), then **redeploy**:

| Variable | Where to get it |
|---|---|
| `OTP_SECRET` | Any long random string. Run `openssl rand -hex 32` and paste the result. |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys → Create. |
| `RESEND_FROM` | A verified sender, e.g. `Mama Ji <noreply@yourdomain.com>`. For a quick test you can use `onboarding@resend.dev`. |
| `TWILIO_ACCOUNT_SID` | [Twilio Console](https://console.twilio.com) home. |
| `TWILIO_AUTH_TOKEN` | Twilio Console home (next to the SID). |
| `TWILIO_FROM` | An SMS-capable Twilio number in E.164, e.g. `+15005550006`. |

You can enable **just email** or **just SMS** — a channel is used only when its
variables are present. If only email is set, phone-only accounts can't receive a
code (and vice-versa).

### Provider signup notes
- **Resend** (email): free tier ~3,000 emails/month. To send to real inboxes
  reliably, verify your own domain under *Domains*; otherwise use the test sender.
- **Twilio** (SMS): paid. Buy an SMS-capable number and, on a trial account,
  note that you can only text *verified* numbers until you upgrade. Sending to
  Nepal (+977) requires your account to have that region enabled.

## 2. How it works

1. **Send** — the browser finds the account (stored locally), then `POST /api/otp`
   `{action:'send', phone, email}`. The function makes a 6-digit code, delivers it
   via Resend/Twilio, and returns a **signed token** (HMAC of the code + contact +
   expiry using `OTP_SECRET`) plus a 5-minute expiry. The code itself is never returned.
2. **Verify** — the browser sends the code the user typed with the token:
   `POST /api/otp` `{action:'verify', otp, token, expiry, phone, email}`. The
   function recomputes the HMAC; only the correct code matches. On success the app
   updates the password locally.

Because there's no database, verification is stateless (the HMAC token carries the
proof). Basic per-IP rate limiting is included, but it resets on cold starts — for
strong abuse protection, back it with **Vercel KV / Upstash** and store used tokens.

## 3. Note on account storage

User accounts still live in the browser's `localStorage` (this app has no user
database). The **OTP delivery and verification are real and server-side**, but the
password itself is updated locally. Moving accounts fully server-side would require
a real backend + database — a larger change than this OTP feature.

## 4. Local development

`npm run dev` (Vite) does **not** run `/api` functions, so the forgot-password call
will fail locally with a network error. To exercise the function locally, use the
Vercel CLI: `vercel dev` (after `npm i -g vercel` and `vercel link`), with the same
env vars in a local `.env` (see [`.env.example`](.env.example)).
