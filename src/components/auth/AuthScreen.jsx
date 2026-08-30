import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import LanguagePicker from '../common/LanguagePicker';
import { SHOP_TYPE_LIST } from '../../constants/shopTypes';
import { pick } from '../../utils/i18n';
import { getCurrentLocation } from '../../utils/geo';
import { ShoppingBag, Store, Phone, Mail, Lock, User, ArrowRight, Eye, EyeOff, LocateFixed, CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';

export default function AuthScreen() {
  const { login, register, requestPasswordReset, resetPasswordWithOtp } = useAuth();
  const { language } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
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

  // Forgot-password (OTP) flow state
  const [forgotStep, setForgotStep] = useState(0); // 0 = enter phone/email, 1 = enter OTP + new password
  const [otpInput, setOtpInput] = useState('');
  const [newPw, setNewPw] = useState('');
  const [resetDest, setResetDest] = useState([]); // [{channel, masked}]
  const [demoOtp, setDemoOtp] = useState('');      // shown because there is no SMS/email backend
  const [info, setInfo] = useState('');            // success / status message

  const captureLocation = async () => {
    setLocBusy(true);
    try { setShopLoc(await getCurrentLocation()); }
    catch (e) { setError(pick(language, { ne: 'लोकेशन अनुमति दिनुहोस्।', en: 'Please allow location access.', mai: 'लोकेशन अनुमति दिअ\'।', bho: 'लोकेशन अनुमति दीं।' })); }
    finally { setLocBusy(false); }
  };

  const ne = language !== 'en'; // Devanagari languages (ne/hi/mai/bho)
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

  // Switch modes and clear any transient messages / forgot-flow state.
  const switchMode = (next) => {
    setMode(next);
    setError(''); setInfo('');
    setForgotStep(0); setOtpInput(''); setNewPw(''); setDemoOtp(''); setResetDest([]);
  };

  // Forgot step 1 — request an OTP for the given phone/email.
  const handleSendOtp = (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    setBusy(true);
    const res = requestPasswordReset({ identifier });
    setBusy(false);
    if (!res.success) { setError(res.error); return; }
    setResetDest(res.destinations);
    setDemoOtp(res.demoOtp);
    setForgotStep(1);
    const where = res.destinations.map(d => d.masked).join(ne ? ' र ' : ' & ');
    setInfo(L(`OTP पठाइयो: ${where}`, `OTP sent to: ${where}`));
  };

  // Forgot step 2 — verify OTP and set the new password.
  const handleResetPassword = (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    setBusy(true);
    const res = resetPasswordWithOtp({ identifier, otp: otpInput, newPassword: newPw });
    setBusy(false);
    if (!res.success) { setError(res.error); return; }
    // Success — send the user back to login with their new password.
    setMode('login');
    setForgotStep(0); setOtpInput(''); setNewPw(''); setDemoOtp(''); setResetDest([]);
    setPassword('');
    setInfo(L('पासवर्ड बदलियो! अब नयाँ पासवर्डले लगइन गर्नुहोस्।',
              'Password changed! Log in with your new password.'));
  };

  const resendOtp = () => {
    const res = requestPasswordReset({ identifier });
    if (res.success) {
      setDemoOtp(res.demoOtp);
      setResetDest(res.destinations);
      setOtpInput('');
      setError('');
      setInfo(L('नयाँ OTP पठाइयो।', 'A new OTP has been sent.'));
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <img src="/logo-web.png" alt="Mama Ji — Your Local Shopping Partner" className="auth-logo-img" />
          <p className="auth-tagline">
            {L('बोलेर सामान अर्डर गर्नुहोस् — टाइप गर्नु पर्दैन।',
               'Order groceries by voice — no typing needed.')}
          </p>
        </div>

        <div className="auth-lang">
          <LanguagePicker compact={true} />
        </div>

        {/* Mode tabs (hidden during the forgot-password flow) */}
        {mode !== 'forgot' && (
          <div className="auth-mode-tabs">
            <button
              type="button"
              className={`auth-mode-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              {L('लगइन', 'Log In')}
            </button>
            <button
              type="button"
              className={`auth-mode-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              {L('नयाँ खाता', 'Register')}
            </button>
          </div>
        )}

        {/* Success / status banner (e.g. after a password reset) */}
        {info && mode !== 'forgot' && <div className="auth-info">{info}</div>}

        {/* ── Forgot-password (OTP) flow ── */}
        {mode === 'forgot' && (
          <div className="auth-forgot">
            <div className="auth-forgot-head">
              <div className="auth-forgot-icon"><KeyRound size={22} /></div>
              <h2 className="auth-forgot-title">{L('पासवर्ड बिर्सनुभयो?', 'Forgot password?')}</h2>
              <p className="auth-forgot-sub">
                {forgotStep === 0
                  ? L('OTP पठाउन आफ्नो फोन नम्बर वा इमेल दिनुहोस्।',
                       'Enter your phone or email to receive an OTP.')
                  : L('तपाईंलाई पठाइएको ६-अंकको OTP र नयाँ पासवर्ड हाल्नुहोस्।',
                       'Enter the 6-digit OTP sent to you and a new password.')}
              </p>
            </div>

            {forgotStep === 0 && (
              <form className="auth-form" onSubmit={handleSendOtp}>
                <div className="auth-field">
                  {isEmailLike(identifier) ? <Mail size={18} className="auth-field-icon" /> : <Phone size={18} className="auth-field-icon" />}
                  <input
                    type="text"
                    className="auth-input"
                    placeholder={L('फोन नम्बर वा इमेल', 'Phone number or email')}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                  />
                </div>
                {error && <div className="auth-error">{error}</div>}
                <button type="submit" className="auth-submit-btn" disabled={busy}>
                  <span>{L('OTP पठाउनुहोस्', 'Send OTP')}</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            )}

            {forgotStep === 1 && (
              <form className="auth-form" onSubmit={handleResetPassword}>
                {info && <div className="auth-info">{info}</div>}

                {/* Demo notice — no SMS/email backend, so the code is shown here. */}
                {demoOtp && (
                  <div className="auth-otp-demo">
                    <ShieldCheck size={16} />
                    <div>
                      <strong>{L('डेमो OTP:', 'Demo OTP:')} <span className="auth-otp-code">{demoOtp}</span></strong>
                      <small>{L('यो डेमो हो — वास्तविक SMS/इमेल पठाइँदैन। वास्तविक प्रयोगमा यो कोड तपाईंको फोन/इमेलमा जान्छ।',
                                 'This is a demo — no real SMS/email is sent. In production this code is delivered to your phone/email.')}</small>
                    </div>
                  </div>
                )}

                <div className="auth-field">
                  <KeyRound size={18} className="auth-field-icon" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder={L('६-अंकको OTP', '6-digit OTP')}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </div>

                <div className="auth-field">
                  <Lock size={18} className="auth-field-icon" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="auth-input"
                    placeholder={L('नयाँ पासवर्ड', 'New password')}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button type="submit" className="auth-submit-btn" disabled={busy}>
                  <span>{L('पासवर्ड बदल्नुहोस्', 'Reset Password')}</span>
                  <ArrowRight size={18} />
                </button>

                <button type="button" className="auth-resend-link" onClick={resendOtp}>
                  {L('OTP फेरि पठाउनुहोस्', 'Resend OTP')}
                </button>
              </form>
            )}

            <button type="button" className="auth-switch-link auth-back-login" onClick={() => switchMode('login')}>
              ← {L('लगइनमा फर्कनुहोस्', 'Back to log in')}
            </button>
          </div>
        )}

        {mode !== 'forgot' && (
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

          {/* Forgot-password entry (login only) */}
          {mode === 'login' && (
            <button
              type="button"
              className="auth-forgot-link"
              onClick={() => switchMode('forgot')}
            >
              {L('पासवर्ड बिर्सनुभयो?', 'Forgot password?')}
            </button>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit-btn" disabled={busy}>
            <span>{mode === 'login' ? L('लगइन गर्नुहोस्', 'Log In') : L('खाता बनाउनुहोस्', 'Create Account')}</span>
            <ArrowRight size={18} />
          </button>
        </form>
        )}

        {mode !== 'forgot' && (
        <p className="auth-switch-hint">
          {mode === 'login'
            ? L('खाता छैन? ', "Don't have an account? ")
            : L('पहिले नै खाता छ? ', 'Already have an account? ')}
          <button
            type="button"
            className="auth-switch-link"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? L('दर्ता गर्नुहोस्', 'Register') : L('लगइन', 'Log In')}
          </button>
        </p>
        )}

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
