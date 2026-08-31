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
  const [resetToken, setResetToken] = useState(''); // signed token from the server (not the OTP)
  const [resetExpiry, setResetExpiry] = useState(0);
  const [info, setInfo] = useState('');            // success / status message

  const captureLocation = async () => {
    setLocBusy(true);
    try { setShopLoc(await getCurrentLocation()); }
    catch (e) { setError(pick(language, { ne: 'लोकेशन अनुमति दिनुहोस्।', hi: 'लोकेशन अनुमति दें।', en: 'Please allow location access.', mai: 'लोकेशन अनुमति दिअ\'।', bho: 'लोकेशन अनुमति दीं।' })); }
    finally { setLocBusy(false); }
  };

  const ne = language !== 'en'; // Devanagari languages (ne/hi/mai/bho)
  // Hindi rendering for the auth screen, keyed by the Nepali string. This lets
  // the existing L(nep, eng) call sites stay unchanged while Hindi still shows
  // proper Hindi (mai/bho keep the Nepali Devanagari, as before).
  const HI = {
    'बोलेर सामान अर्डर गर्नुहोस् — टाइप गर्नु पर्दैन।': 'बोलकर सामान ऑर्डर करें — टाइप करने की ज़रूरत नहीं।',
    'लगइन': 'लॉगिन',
    'नयाँ खाता': 'नया खाता',
    'पासवर्ड बिर्सनुभयो?': 'पासवर्ड भूल गए?',
    'OTP पठाउन आफ्नो फोन नम्बर वा इमेल दिनुहोस्।': 'OTP पाने के लिए अपना फोन नंबर या ईमेल दें।',
    'तपाईंलाई पठाइएको ६-अंकको OTP र नयाँ पासवर्ड हाल्नुहोस्।': 'आपको भेजा गया 6-अंकों का OTP और नया पासवर्ड डालें।',
    'फोन नम्बर वा इमेल': 'फोन नंबर या ईमेल',
    'OTP पठाउनुहोस्': 'OTP भेजें',
    'तपाईंको फोन/इमेलमा पठाइएको ६-अंकको कोड यहाँ हाल्नुहोस्। (५ मिनेटमा सकिन्छ)': 'अपने फोन/ईमेल पर भेजा गया 6-अंकों का कोड यहाँ डालें। (5 मिनट में समाप्त)',
    '६-अंकको OTP': '6-अंकों का OTP',
    'नयाँ पासवर्ड': 'नया पासवर्ड',
    'पासवर्ड बदल्नुहोस्': 'पासवर्ड बदलें',
    'OTP फेरि पठाउनुहोस्': 'OTP दोबारा भेजें',
    'लगइनमा फर्कनुहोस्': 'लॉगिन पर वापस जाएँ',
    'ग्राहक': 'ग्राहक',
    'पसले': 'दुकानदार',
    'तपाईंको नाम': 'आपका नाम',
    'पसलको नाम (जस्तै: राम किराना)': 'दुकान का नाम (जैसे: राम किराना)',
    'पसलको प्रकार छान्नुहोस्': 'दुकान का प्रकार चुनें',
    'अन्य': 'अन्य',
    'पसलको प्रकार लेख्नुहोस् (जस्तै: फुल पसल)': 'दुकान का प्रकार लिखें (जैसे: फूल की दुकान)',
    'लिँदैछ...': 'ले रहे हैं...',
    'पसलको स्थान लिइयो ✓': 'दुकान का स्थान लिया गया ✓',
    '📍 पसलको स्थान लिनुहोस् (नजिकका ग्राहकलाई देखाउन)': '📍 दुकान का स्थान सेट करें (पास के ग्राहकों तक पहुँचने के लिए)',
    'पासवर्ड': 'पासवर्ड',
    'लगइन गर्नुहोस्': 'लॉगिन करें',
    'खाता बनाउनुहोस्': 'खाता बनाएँ',
    'खाता छैन? ': 'खाता नहीं है? ',
    'पहिले नै खाता छ? ': 'पहले से खाता है? ',
    'दर्ता गर्नुहोस्': 'रजिस्टर करें',
    'नयाँ OTP पठाइयो।': 'नया OTP भेजा गया।',
    'पासवर्ड बदलियो! अब नयाँ पासवर्डले लगइन गर्नुहोस्।': 'पासवर्ड बदल गया! अब नए पासवर्ड से लॉगिन करें।',
    'पासवर्ड बिर्से OTP फोन वा इमेलमा पठाइन्छ।': 'पासवर्ड भूल गए? OTP आपके फोन या ईमेल पर भेजा जाता है।',
  };
  const L = (nep, eng) => {
    if (language === 'en') return eng;
    if (language === 'hi') return HI[nep] || nep; // proper Hindi where known
    return nep; // ne / mai / bho → Nepali Devanagari
  };

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
    setForgotStep(0); setOtpInput(''); setNewPw(''); setResetToken(''); setResetExpiry(0); setResetDest([]);
  };

  const sentToLabel = (destinations) => {
    const where = destinations.map(d => d.masked).join(ne ? ' र ' : ' & ');
    return language === 'en' ? `OTP sent to: ${where}`
      : language === 'hi' ? `OTP भेजा गया: ${where}`
      : `OTP पठाइयो: ${where}`;
  };

  // Forgot step 1 — ask the server to send a real OTP.
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    setBusy(true);
    const res = await requestPasswordReset({ identifier });
    setBusy(false);
    if (!res.success) { setError(res.error); return; }
    setResetDest(res.destinations);
    setResetToken(res.token);
    setResetExpiry(res.expiry);
    setForgotStep(1);
    setInfo(sentToLabel(res.destinations));
  };

  // Forgot step 2 — verify OTP (server) and set the new password.
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    setBusy(true);
    const res = await resetPasswordWithOtp({ identifier, otp: otpInput, newPassword: newPw, token: resetToken, expiry: resetExpiry });
    setBusy(false);
    if (!res.success) { setError(res.error); return; }
    // Success — send the user back to login with their new password.
    setMode('login');
    setForgotStep(0); setOtpInput(''); setNewPw(''); setResetToken(''); setResetExpiry(0); setResetDest([]);
    setPassword('');
    setInfo(L('पासवर्ड बदलियो! अब नयाँ पासवर्डले लगइन गर्नुहोस्।',
              'Password changed! Log in with your new password.'));
  };

  const resendOtp = async () => {
    setError('');
    setBusy(true);
    const res = await requestPasswordReset({ identifier });
    setBusy(false);
    if (res.success) {
      setResetToken(res.token);
      setResetExpiry(res.expiry);
      setResetDest(res.destinations);
      setOtpInput('');
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

                {/* The real code was delivered to the user's phone/email. */}
                <div className="auth-otp-sent">
                  <ShieldCheck size={16} />
                  <small>{L('तपाईंको फोन/इमेलमा पठाइएको ६-अंकको कोड यहाँ हाल्नुहोस्। (५ मिनेटमा सकिन्छ)',
                            'Enter the 6-digit code sent to your phone/email. (Expires in 5 minutes)')}</small>
                </div>

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
          {L('पासवर्ड बिर्से OTP फोन वा इमेलमा पठाइन्छ।',
             'Forgot your password? An OTP is sent to your phone or email.')}
        </p>
      </div>
    </div>
  );
}

function isEmailLike(v) {
  return typeof v === 'string' && v.includes('@');
}
