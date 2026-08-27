import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import LanguagePicker from '../common/LanguagePicker';
import { SHOP_TYPE_LIST } from '../../constants/shopTypes';
import { pick } from '../../utils/i18n';
import { getCurrentLocation } from '../../utils/geo';
import { ShoppingBag, Store, Phone, Mail, Lock, User, ArrowRight, Eye, EyeOff, LocateFixed, CheckCircle2 } from 'lucide-react';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const { language } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [role, setRole] = useState('customer'); // 'customer' | 'shopkeeper'
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopType, setShopType] = useState('grocery');
  const [customType, setCustomType] = useState('');
  const [shopLoc, setShopLoc] = useState(null); // {lat, lng}
  const [locBusy, setLocBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const captureLocation = async () => {
    setLocBusy(true);
    try { setShopLoc(await getCurrentLocation()); }
    catch (e) { setError(pick(language, { ne: 'लोकेशन अनुमति दिनुहोस्।', en: 'Please allow location access.', mai: 'लोकेशन अनुमति दिअ\'।', bho: 'लोकेशन अनुमति दीं।' })); }
    finally { setLocBusy(false); }
  };

  const ne = language === 'ne' || language === 'mai' || language === 'bho';
  const L = (nep, eng) => (ne ? nep : eng);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = mode === 'login'
      ? login({ identifier, password })
      : register({ name, identifier, password, role, shopName, shopType, shopTypeLabel: shopType === 'other' ? customType.trim() : '', lat: shopLoc?.lat ?? null, lng: shopLoc?.lng ?? null });
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

          {/* Shop details (register as shop owner) */}
          {mode === 'register' && role === 'shopkeeper' && (
            <>
              <div className="auth-field">
                <Store size={18} className="auth-field-icon" />
                <input
                  type="text"
                  className="auth-input"
                  placeholder={L('पसलको नाम (जस्तै: राम किराना)', 'Shop name (e.g. Ram Kirana)')}
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                />
              </div>
              <div className="auth-shoptype-label">{L('पसलको प्रकार छान्नुहोस्', 'Choose your shop type')}</div>
              <div className="auth-shoptype-grid">
                {SHOP_TYPE_LIST.map(tp => (
                  <button
                    key={tp.id}
                    type="button"
                    className={`auth-shoptype-btn ${shopType === tp.id ? 'selected' : ''}`}
                    onClick={() => setShopType(tp.id)}
                  >
                    <span className="st-icon">{tp.icon}</span>
                    <span className="st-name">{pick(language, tp.name)}</span>
                  </button>
                ))}
                {/* Custom / other shop type */}
                <button
                  type="button"
                  className={`auth-shoptype-btn ${shopType === 'other' ? 'selected' : ''}`}
                  onClick={() => setShopType('other')}
                >
                  <span className="st-icon">➕</span>
                  <span className="st-name">{L('अन्य', 'Other')}</span>
                </button>
              </div>
              {shopType === 'other' && (
                <div className="auth-field">
                  <Store size={18} className="auth-field-icon" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder={L('पसलको प्रकार लेख्नुहोस् (जस्तै: फुल पसल)', 'Type your shop type (e.g. Flower shop)')}
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                  />
                </div>
              )}
              <button type="button" className={`auth-loc-btn ${shopLoc ? 'done' : ''}`} onClick={captureLocation} disabled={locBusy}>
                {shopLoc ? <CheckCircle2 size={16} /> : <LocateFixed size={16} />}
                <span>{locBusy
                  ? L('लिँदैछ...', 'Getting...')
                  : shopLoc
                    ? L('पसलको स्थान लिइयो ✓', 'Shop location captured ✓')
                    : L('📍 पसलको स्थान लिनुहोस् (नजिकका ग्राहकलाई देखाउन)', '📍 Set shop location (to reach nearby customers)')}</span>
              </button>
            </>
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
