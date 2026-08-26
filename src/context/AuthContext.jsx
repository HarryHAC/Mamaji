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
  const register = useCallback(({ name, identifier, password, role = 'customer', address = '' }) => {
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
      address: address || (role === 'customer' ? 'नयाँ बानेश्वर, काठमाडौं' : ''),
      lat: 27.693,
      lng: 85.338,
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
