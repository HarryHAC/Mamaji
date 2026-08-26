import React from 'react';
import { useApp } from '../../context/AppContext';
import LanguagePicker from '../common/LanguagePicker';
import { ShoppingBag, Store, Sparkles, MapPin } from 'lucide-react';

export default function RoleSelectModal() {
  const { setRole, t } = useApp();

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
                {t.appName === 'Mama Ji' 
                  ? 'Order groceries easily by voice or tap' 
                  : 'आलु, चामल, चिनी, तेल आदि बोलेर वा छानेर अर्डर गर्नुहोस्'}
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
                {t.appName === 'Mama Ji'
                  ? 'Manage stock, live orders, delivery & daily Khata'
                  : 'स्टक, अर्डर, डेलिभरी र आजको दैनिक खाता चलाउनुहोस्'}
              </p>
            </div>
            <div className="role-arrow">→</div>
          </button>
        </div>

        {/* Feature Highlights Footer */}
        <div className="role-footer-pills">
          <div className="pill">
            <Sparkles size={14} /> <span>एआई भ्वाइस अर्डर</span>
          </div>
          <div className="pill">
            <MapPin size={14} /> <span>नजिकको पसल</span>
          </div>
          <div className="pill">
            <span>eSewa / Khalti / COD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
