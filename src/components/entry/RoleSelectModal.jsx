import React from 'react';
import { useApp } from '../../context/AppContext';
import { pick } from '../../utils/i18n';
import LanguagePicker from '../common/LanguagePicker';
import { ShoppingBag, Store, Sparkles, MapPin } from 'lucide-react';

export default function RoleSelectModal() {
  const { setRole, t, language } = useApp();

  return (
    <div className="role-entry-container">
      <div className="role-entry-card">
        {/* Brand Header */}
        <div className="role-brand">
          <div className="brand-logo-badge">
            <span className="logo-icon">🏬</span>
            <span className="nepal-flag-badge">🇳🇵</span>
          </div>
          <h1 className="brand-title">{t.appName}</h1>
          <p className="brand-tagline">{t.tagline}</p>
        </div>

        {/* Language Selection */}
        <div className="role-lang-section">
          <p className="section-subtitle">{t.selectLanguage}</p>
          <LanguagePicker compact={false} />
        </div>

        {/* Big Touch Target Action Cards */}
        <div className="role-options-grid">
          {/* Customer Option */}
          <button
            type="button"
            className="role-select-btn customer-btn"
            onClick={() => setRole('customer')}
          >
            <div className="role-icon-box customer">
              <ShoppingBag size={36} />
            </div>
            <div className="role-info">
              <span className="role-badge">{t.customer}</span>
              <h2 className="role-main-text">{t.customerTag}</h2>
              <p className="role-desc">
                {pick(language, {
                  ne: 'सामान बोलेर वा छानेर सजिलै अर्डर गर्नुहोस्',
                  hi: 'सामान बोलकर या चुनकर आसानी से ऑर्डर करें',
                  en: 'Order items easily by voice or tap',
                  mai: 'सामान बाजिकऽ वा चुनिकऽ सहजे अर्डर करू',
                  bho: 'सामान बोल के भा चुन के आसानी से आर्डर करीं'
                })}
              </p>
            </div>
            <div className="role-arrow">→</div>
          </button>

          {/* Shopkeeper Option */}
          <button
            type="button"
            className="role-select-btn shopkeeper-btn"
            onClick={() => setRole('shopkeeper')}
          >
            <div className="role-icon-box shopkeeper">
              <Store size={36} />
            </div>
            <div className="role-info">
              <span className="role-badge shop">{t.shopkeeper}</span>
              <h2 className="role-main-text">{t.shopkeeperTag}</h2>
              <p className="role-desc">
                {pick(language, {
                  ne: 'स्टक, अर्डर, डेलिभरी र आजको दैनिक खाता चलाउनुहोस्',
                  hi: 'स्टॉक, ऑर्डर, डिलीवरी और रोज़ का खाता संभालें',
                  en: 'Manage stock, live orders, delivery & daily Khata',
                  mai: 'स्टक, अर्डर, डेलिभरी आ रोजक खाता चलाबू',
                  bho: 'स्टॉक, आर्डर, डेलिभरी आ रोज के खाता चलाईं'
                })}
              </p>
            </div>
            <div className="role-arrow">→</div>
          </button>
        </div>

        {/* Feature Highlights Footer */}
        <div className="role-footer-pills">
          <div className="pill">
            <Sparkles size={14} /> <span>{pick(language, { ne: 'एआई भ्वाइस अर्डर', hi: 'एआई वॉइस ऑर्डर', en: 'AI voice order', mai: 'एआई भ्वाइस अर्डर', bho: 'एआई भ्वाइस आर्डर' })}</span>
          </div>
          <div className="pill">
            <MapPin size={14} /> <span>{pick(language, { ne: 'नजिकको पसल', hi: 'पास की दुकान', en: 'Nearby shops', mai: 'नजदीकक दोकान', bho: 'नजदीक के दोकान' })}</span>
          </div>
          <div className="pill">
            <span>eSewa / Khalti / COD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
