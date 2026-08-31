import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/*
 * Client-side authentication for Mama Ji.
 *
 * NOTE: This is a self-contained demo auth that stores accounts in the
 * browser's localStorage so the app works with no backend. Passwords are
 * lightly hashed (not cryptographically secure). For a real production
 * deployment, replace login()/register() with calls to a real backend
 * (e.g. phone OTP via SMS, or email + hashed password on a server).
 */

const AuthContext = createContext();

const USERS_KEY = 'apna_users';
const SESSION_KEY = 'apna_session_uid';

// Lightweight, deterministic hash — demo only.
function hashPassword(pw) {
  const s = 'apnakirana::' + String(pw);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return 'h' + (h >>> 0).toString(16);
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Basic validators
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v) => /^(\+?977[- ]?)?9\d{9}$/.test(String(v).replace(/[\s-]/g, ''));
const normalizePhone = (v) => String(v).replace(/[\s-]/g, '').replace(/^\+?977/, '');

// ── Password-reset OTP (real delivery) ──
// The OTP is generated, signed, and verified by the serverless function at
// /api/otp (which sends it over email via Resend and/or SMS via Twilio). The
// browser never sees the code — it only holds a signed token between the two
// steps. See api/otp.js for the required environment variables.
const OTP_ENDPOINT = '/api/otp';

const maskPhone = (p) => (!p ? '' : (p.length > 4 ? p.slice(0, 2) + '****' + p.slice(-2) : p));
const maskEmail = (e) => {
  if (!e) return '';
  const [u, d] = e.split('@');
  if (!d) return e;
  const mu = u.length <= 2 ? u[0] + '*' : u.slice(0, 2) + '*'.repeat(Math.max(1, u.length - 2));
  return `${mu}@${d}`;
};

const findUserByIdentifier = (rawId) => {
  const cleanId = (rawId || '').trim();
  if (!cleanId) return null;
  const phone = isPhone(cleanId) ? normalizePhone(cleanId) : '';
  const email = isEmail(cleanId) ? cleanId.toLowerCase() : '';
  if (!phone && !email) return null;
  return loadUsers().find(u => (phone && u.phone === phone) || (email && u.email === email)) || null;
};

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(loadUsers);
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Restore session on load
  useEffect(() => {
    try {
      const uid = localStorage.getItem(SESSION_KEY);
      if (uid) {
        const u = loadUsers().find(x => x.id === uid);
        if (u) setCurrentUser(u);
      }
    } catch (e) { /* ignore */ }
    setAuthReady(true);
  }, []);

  const persistUsers = useCallback((next) => {
    setUsers(next);
    saveUsers(next);
  }, []);

  // Append an entry to the user's activity log.
  const logActivity = useCallback((userId, type, detail = '') => {
    if (!userId) return;
    try {
      const key = `apna_activity_${userId}`;
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({ id: Date.now() + Math.random(), type, detail, at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(list.slice(0, 100)));
    } catch (e) { /* ignore */ }
  }, []);

  const getActivity = useCallback((userId) => {
    try {
      const raw = localStorage.getItem(`apna_activity_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }, []);

  // Register a new account. `identifier` is phone or email.
  const register = useCallback(({ name, identifier, password, role = 'customer', address = '', shopName = '', shopType = 'grocery', shopTypeLabel = '', lat = null, lng = null }) => {
    const cleanName = (name || '').trim();
    const cleanId = (identifier || '').trim();

    if (!cleanName) return { success: false, error: 'नाम लेख्नुहोस् / Please enter your name.' };
    if (!cleanId) return { success: false, error: 'फोन वा इमेल लेख्नुहोस् / Enter phone or email.' };

    const asPhone = isPhone(cleanId);
    const asEmail = isEmail(cleanId);
    if (!asPhone && !asEmail) {
      return { success: false, error: 'मान्य फोन नम्बर (98########) वा इमेल दिनुहोस् / Enter a valid phone (98########) or email.' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'कम्तिमा ४ अक्षरको पासवर्ड / Password must be at least 4 characters.' };
    }

    const phone = asPhone ? normalizePhone(cleanId) : '';
    const email = asEmail ? cleanId.toLowerCase() : '';

    const existing = loadUsers();
    const dup = existing.find(u =>
      (phone && u.phone === phone) || (email && u.email === email)
    );
    if (dup) {
      return { success: false, error: 'यो खाता पहिले नै दर्ता छ। लगइन गर्नुहोस् / Account already exists. Please log in.' };
    }

    const user = {
      id: 'usr-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: cleanName,
      role,                       // 'customer' | 'shopkeeper'
      loginType: asPhone ? 'phone' : 'email',
      phone,
      email,
      passwordHash: hashPassword(password),
      address: address || '',
      lat: lat != null ? lat : null,
      lng: lng != null ? lng : null,
      // Shopkeepers own a shop of a chosen type (created on first login).
      shopName: role === 'shopkeeper' ? (shopName || '').trim() : undefined,
      shopType: role === 'shopkeeper' ? (shopType || 'grocery') : undefined,
      shopTypeLabel: role === 'shopkeeper' ? (shopTypeLabel || '').trim() : undefined,
      createdAt: new Date().toISOString()
    };

    const next = [...existing, user];
    persistUsers(next);
    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, user.id);
    logActivity(user.id, 'register', role);
    return { success: true, user };
  }, [persistUsers, logActivity]);

  // Log in with phone/email + password.
  const login = useCallback(({ identifier, password }) => {
    const cleanId = (identifier || '').trim();
    if (!cleanId || !password) {
      return { success: false, error: 'फोन/इमेल र पासवर्ड दिनुहोस् / Enter phone/email and password.' };
    }
    const phone = isPhone(cleanId) ? normalizePhone(cleanId) : '';
    const email = isEmail(cleanId) ? cleanId.toLowerCase() : '';

    const found = loadUsers().find(u =>
      (phone && u.phone === phone) || (email && u.email === email)
    );
    if (!found) {
      return { success: false, error: 'खाता भेटिएन। दर्ता गर्नुहोस् / Account not found. Please register.' };
    }
    if (found.passwordHash !== hashPassword(password)) {
      return { success: false, error: 'पासवर्ड मिलेन / Incorrect password.' };
    }

    setCurrentUser(found);
    localStorage.setItem(SESSION_KEY, found.id);
    logActivity(found.id, 'login', '');
    return { success: true, user: found };
  }, [logActivity]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  // ── Forgot password: step 1 — ask the server to send a real OTP ──
  // Finds the account locally, then calls /api/otp which generates the code,
  // emails/SMSes it, and returns a signed token (never the code). The token +
  // expiry are handed back to the caller to hold until verification.
  const requestPasswordReset = useCallback(async ({ identifier }) => {
    const user = findUserByIdentifier(identifier);
    if (!user) {
      return { success: false, error: 'यो फोन/इमेलमा खाता भेटिएन / No account found for that phone/email.' };
    }
    if (!user.phone && !user.email) {
      return { success: false, error: 'यो खातामा फोन/इमेल छैन / This account has no phone or email on file.' };
    }

    let data;
    try {
      const r = await fetch(OTP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', phone: user.phone || '', email: user.email || '' })
      });
      data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) {
        const err = data && data.error;
        const msg = err === 'service_not_configured'
          ? 'OTP सेवा अझै सक्रिय छैन (एडमिनले सर्भरमा RESEND/TWILIO कुञ्जी राख्नुपर्छ) / OTP service is not set up yet (admin must add the RESEND/TWILIO keys).'
          : err === 'too_many_requests'
            ? 'धेरै पटक प्रयास भयो, केही बेरमा फेरि गर्नुहोस् / Too many requests, try again shortly.'
            : 'OTP पठाउन सकिएन, फेरि प्रयास गर्नुहोस् / Could not send the OTP. Please try again.';
        return { success: false, error: msg };
      }
    } catch (e) {
      return { success: false, error: 'नेटवर्क समस्या — इन्टरनेट जाँच्नुहोस् / Network error. Check your connection and try again.' };
    }

    // Which contacts actually received it (server tells us the channels).
    const sentChannels = data.channels || [];
    const destinations = [];
    if (user.email && sentChannels.includes('email')) destinations.push({ channel: 'email', masked: maskEmail(user.email) });
    if (user.phone && sentChannels.includes('sms')) destinations.push({ channel: 'phone', masked: maskPhone(user.phone) });
    if (destinations.length === 0) {
      // Fallback label if the server didn't report channels for some reason.
      if (user.email) destinations.push({ channel: 'email', masked: maskEmail(user.email) });
      if (user.phone) destinations.push({ channel: 'phone', masked: maskPhone(user.phone) });
    }

    logActivity(user.id, 'password_reset_requested', sentChannels.join('+'));
    return { success: true, token: data.token, expiry: data.expiry, destinations };
  }, [logActivity]);

  // ── Forgot password: step 2 — verify the OTP (server) and set the password ──
  const resetPasswordWithOtp = useCallback(async ({ identifier, otp, newPassword, token, expiry }) => {
    const user = findUserByIdentifier(identifier);
    if (!user) {
      return { success: false, error: 'खाता भेटिएन / Account not found.' };
    }
    if (!token || !expiry) {
      return { success: false, error: 'पहिले OTP माग्नुहोस् / Request an OTP first.' };
    }
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'कम्तिमा ४ अक्षरको नयाँ पासवर्ड / New password must be at least 4 characters.' };
    }

    let data;
    try {
      const r = await fetch(OTP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', otp, token, expiry, phone: user.phone || '', email: user.email || '' })
      });
      data = await r.json().catch(() => ({}));
    } catch (e) {
      return { success: false, error: 'नेटवर्क समस्या / Network error. Please try again.' };
    }

    if (!data.valid) {
      const msg = data.error === 'expired'
        ? 'OTP को समय सकियो, फेरि माग्नुहोस् / OTP expired. Please request a new one.'
        : data.error === 'too_many_requests'
          ? 'धेरै पटक प्रयास भयो, केही बेरमा फेरि गर्नुहोस् / Too many attempts, try again shortly.'
          : 'OTP मिलेन / Incorrect OTP.';
      return { success: false, error: msg };
    }

    // Verified — update the password locally (accounts live in this browser).
    const merged = { ...user, passwordHash: hashPassword(newPassword) };
    const next = loadUsers().map(u => (u.id === user.id ? merged : u));
    persistUsers(next);
    logActivity(user.id, 'password_reset', '');
    return { success: true };
  }, [persistUsers, logActivity]);

  // Update the current user's profile.
  const updateProfile = useCallback((fields) => {
    if (!currentUser) return;
    const merged = { ...currentUser, ...fields };
    const next = loadUsers().map(u => (u.id === currentUser.id ? merged : u));
    persistUsers(next);
    setCurrentUser(merged);
    return merged;
  }, [currentUser, persistUsers]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      authReady,
      isAuthenticated: !!currentUser,
      register,
      login,
      logout,
      requestPasswordReset,
      resetPasswordWithOtp,
      updateProfile,
      logActivity,
      getActivity
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
