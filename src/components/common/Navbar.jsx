import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useShopkeeper } from '../../context/ShopkeeperContext';
import { useAuth } from '../../context/AuthContext';
import { pick } from '../../utils/i18n';
import LanguagePicker from './LanguagePicker';
import { ShoppingBag, Store, Clock, LogOut, Activity, Phone, Mail, Wallet } from 'lucide-react';
import WalletModal from '../wallet/WalletModal';

export default function Navbar() {
  const { role, cart, setIsCartOpen, myOrders, setActiveTrackingOrderId, language, t } = useApp();
  const { shopOrders } = useShopkeeper();
  const { currentUser, logout, getActivity } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  const ne = language !== 'en'; // Devanagari languages (ne/hi/mai/bho) — for date locale only
  const activity = currentUser ? getActivity(currentUser.id).slice(0, 6) : [];
  const activityLabel = (type) => ({
    register: pick(language, { ne: 'खाता दर्ता', hi: 'खाता पंजीकरण', en: 'Registered', mai: 'खाता दर्ता', bho: 'खाता दर्ता' }),
    login: pick(language, { ne: 'लगइन', hi: 'लॉगिन', en: 'Logged in', mai: 'लगइन', bho: 'लगइन' }),
    order_placed: pick(language, { ne: 'अर्डर गरियो', hi: 'ऑर्डर किया', en: 'Order placed', mai: 'अर्डर भेल', bho: 'आर्डर भइल' }),
    voice_order: pick(language, { ne: 'भ्वाइस अर्डर', hi: 'वॉइस ऑर्डर', en: 'Voice order', mai: 'भ्वाइस अर्डर', bho: 'भ्वाइस आर्डर' }),
    password_reset: pick(language, { ne: 'पासवर्ड बदलियो', hi: 'पासवर्ड बदला', en: 'Password reset', mai: 'पासवर्ड बदलल', bho: 'पासवर्ड बदलल' }),
    password_reset_requested: pick(language, { ne: 'OTP मागियो', hi: 'OTP माँगा', en: 'OTP requested', mai: 'OTP मागल', bho: 'OTP मंगलस' })
  }[type] || type);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Active customer orders pending delivery (the logged-in user's own)
  const pendingCustomerOrders = myOrders.filter(
    o => o.orderStatus !== 'delivered' && o.orderStatus !== 'rejected'
  );

  // Pending shopkeeper orders needing action
  const pendingShopOrders = shopOrders.filter(
    o => o.orderStatus === 'received' || o.orderStatus === 'accepted' || o.orderStatus === 'preparing'
  );

  return (
    <header className="app-navbar">
      <div className="navbar-container">
        {/* Left: Brand */}
        <div className="navbar-brand">
          <img src="/icon-192.png" alt="Mama Ji" className="brand-logo-img" />
          <div className="brand-text">
            <h1 className="brand-name">{t.appName}</h1>
            <span className="brand-sub">
              {role === 'shopkeeper' ? t.shopkeeper : t.customer}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="navbar-actions">
          {/* Language Switcher */}
          <LanguagePicker compact={true} />

          {/* Wallet */}
          <button
            type="button"
            className="nav-wallet-btn"
            onClick={() => setWalletOpen(true)}
            aria-label="Wallet"
            title="Wallet"
          >
            <Wallet size={20} />
          </button>

          {/* Customer Specific Controls */}
          {role === 'customer' && (
            <>
              {/* Active Order Tracker Pill if exists */}
              {pendingCustomerOrders.length > 0 && (
                <button
                  type="button"
                  className="active-order-pill"
                  onClick={() => setActiveTrackingOrderId(pendingCustomerOrders[0].id)}
                  title={t.trackOrder}
                >
                  <Clock size={16} className="pulse-icon" />
                  <span className="pill-text">{t.trackOrder}</span>
                </button>
              )}

              {/* Cart Button */}
              <button
                type="button"
                className="nav-cart-btn"
                onClick={() => setIsCartOpen(true)}
                aria-label={t.cart}
              >
                <ShoppingBag size={20} />
                {totalCartItems > 0 && (
                  <span className="cart-badge-count">{totalCartItems}</span>
                )}
              </button>
            </>
          )}

          {/* Shopkeeper Specific Controls */}
          {role === 'shopkeeper' && (
            <div className="shop-pending-pill">
              <span className="pending-indicator"></span>
              <span className="pending-text">
                {pendingShopOrders.length} {t.pendingOrders}
              </span>
            </div>
          )}

          {/* Profile / Account menu */}
          <div className="profile-menu-wrap">
            <button
              type="button"
              className="profile-avatar-btn"
              onClick={() => setMenuOpen(o => !o)}
              title={currentUser?.name || 'Account'}
            >
              <span className="profile-initial">
                {(currentUser?.name || '?').trim().charAt(0).toUpperCase()}
              </span>
            </button>

            {menuOpen && (
              <>
                <div className="profile-menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="profile-dropdown">
                  <div className="profile-dd-head">
                    <div className="profile-dd-avatar">
                      {(currentUser?.name || '?').trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-dd-meta">
                      <strong>{currentUser?.name}</strong>
                      <span className="profile-dd-contact">
                        {currentUser?.loginType === 'email'
                          ? <><Mail size={11} /> {currentUser?.email}</>
                          : <><Phone size={11} /> {currentUser?.phone}</>}
                      </span>
                      <span className="profile-dd-role">
                        {role === 'customer'
                          ? pick(language, { ne: 'ग्राहक', hi: 'ग्राहक', en: 'Customer', mai: 'ग्राहक', bho: 'ग्राहक' })
                          : pick(language, { ne: 'पसले', hi: 'दुकानदार', en: 'Shop Owner', mai: 'दोकानदार', bho: 'दोकानदार' })}
                      </span>
                    </div>
                  </div>

                  {/* Recent activity */}
                  <div className="profile-dd-activity">
                    <p className="profile-dd-section-title">
                      <Activity size={13} /> {pick(language, { ne: 'हालको गतिविधि', hi: 'हाल की गतिविधि', en: 'Recent activity', mai: 'हालक गतिविधि', bho: 'हाल के गतिविधि' })}
                    </p>
                    {activity.length === 0 ? (
                      <p className="profile-dd-empty">{pick(language, { ne: 'अहिलेसम्म केही छैन', hi: 'अभी तक कुछ नहीं', en: 'Nothing yet', mai: 'एखन धरि किछु नै', bho: 'अबले कुछु ना' })}</p>
                    ) : (
                      <ul className="profile-dd-activity-list">
                        {activity.map(a => (
                          <li key={a.id}>
                            <span className="act-type">{activityLabel(a.type)}</span>
                            {a.detail && <span className="act-detail">{a.detail}</span>}
                            <span className="act-time">
                              {new Date(a.at).toLocaleString(ne ? 'ne-NP' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button
                    type="button"
                    className="profile-dd-btn logout"
                    onClick={() => { logout(); setMenuOpen(false); }}
                  >
                    <LogOut size={16} />
                    <span>{pick(language, { ne: 'लगआउट', hi: 'लॉग आउट', en: 'Log out', mai: 'लगआउट', bho: 'लॉग आउट' })}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <WalletModal open={walletOpen} onClose={() => setWalletOpen(false)} />
    </header>
  );
}
