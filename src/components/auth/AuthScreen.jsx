import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import LanguagePicker from '../common/LanguagePicker';
import { ShoppingBag, Store, Phone, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const { language } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [role, setRole] = useState('customer'); // 'customer' | 'shopkeeper'
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const ne = language === 'ne' || language === 'mai' || language === 'bho';
  const L = (nep, eng) => (ne ? nep : eng);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = mode === 'login'
      ? login({ identifier, password })
      : register({ name, identifier, password, role });
    setBusy(false);
    if (!res.success) setError(res.error);
    // On success, AuthProvider sets currentUser → App re-renders into the app.
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-logo-badge">
            <span className="auth-logo-icon">🏬</span>
            <span className="auth-flag">🇳🇵</span>
          </div>
          <h1 className="auth-brand-name">{ne ? 'मामा जी' : 'Mama Ji'}</h1>
          <p className="auth-tagline">
            {L('बोलेर सामान अर्डर गर्नुहोस् — टाइप गर्नु पर्दैन।',
               'Order groceries by voice — no typing needed.')}
          </p>
        </div>

        <div className="auth-lang">
          <LanguagePicker compact={true} />
        </div>

        {/* Mode tabs */}
        <div className="auth-mode-tabs">
          <button
            type="button"
            className={`auth-mode-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            {L('लगइन', 'Log In')}
          </button>
          <button
            type="button"
            className={`auth-mode-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            {L('नयाँ खाता', 'Register')}
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Role choice (register only) */}
          {mode === 'register' && (
            <div className="auth-role-choice">
              <button
                type="button"
                className={`auth-role-btn ${role === 'customer' ? 'selected' : ''}`}
                onClick={() => setRole('customer')}
              >
                <ShoppingBag size={20} />
                <span>{L('ग्राहक', 'Customer')}</span>
              </button>
              <button
                type="button"
                className={`auth-role-btn ${role === 'shopkeeper' ? 'selected' : ''}`}
                onClick={() => setRole('shopkeeper')}
              >
                <Store size={20} />
                <span>{L('पसले', 'Shop Owner')}</span>
              </button>
            </div>
          )}

          {mode === 'register' && (
            <div className="auth-field">
              <User size={18} className="auth-field-icon" />
              <input
                type="text"
                className="auth-input"
                placeholder={L('तपाईंको नाम', 'Your name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            {isEmailLike(identifier) ? <Mail size={18} className="auth-field-icon" /> : <Phone size={18} className="auth-field-icon" />}
            <input
              type="text"
              className="auth-input"
              placeholder={L('फोन नम्बर वा इमेल', 'Phone number or email')}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              inputMode="text"
            />
          </div>

          <div className="auth-field">
            <Lock size={18} className="auth-field-icon" />
            <input
              type={showPw ? 'text' : 'password'}
              className="auth-input"
              placeholder={L('पासवर्ड', 'Password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit-btn" disabled={busy}>
            <span>{mode === 'login' ? L('लगइन गर्नुहोस्', 'Log In') : L('खाता बनाउनुहोस्', 'Create Account')}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <p className="auth-switch-hint">
          {mode === 'login'
            ? L('खाता छैन? ', "Don't have an account? ")
            : L('पहिले नै खाता छ? ', 'Already have an account? ')}
          <button
            type="button"
            className="auth-switch-link"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login' ? L('दर्ता गर्नुहोस्', 'Register') : L('लगइन', 'Log In')}
          </button>
        </p>

        <p className="auth-demo-note">
          {L('सुरक्षाको लागि, वास्तविक प्रयोगमा फोन OTP प्रयोग हुन्छ।',
             'For your security, real deployments use phone OTP verification.')}
        </p>
      </div>
    </div>
  );
}

function isEmailLike(v) {
  return typeof v === 'string' && v.includes('@');
}
