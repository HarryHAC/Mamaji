import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useShopkeeper } from '../../context/ShopkeeperContext';
import { useAuth } from '../../context/AuthContext';
import LanguagePicker from './LanguagePicker';
import { ShoppingBag, Store, User, RotateCcw, Clock, LogOut, Activity, Phone, Mail } from 'lucide-react';

export default function Navbar() {
  const { role, setRole, cart, setIsCartOpen, myOrders, setActiveTrackingOrderId, language, t } = useApp();
  const { shopOrders } = useShopkeeper();
  const { currentUser, logout, getActivity } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const ne = language === 'ne' || language === 'mai' || language === 'bho';
  const activity = currentUser ? getActivity(currentUser.id).slice(0, 6) : [];
  const activityLabel = (type) => ({
    register: ne ? 'खाता दर्ता' : 'Registered',
    login: ne ? 'लगइन' : 'Logged in',
    order_placed: ne ? 'अर्डर गरियो' : 'Order placed',
    voice_order: ne ? 'भ्वाइस अर्डर' : 'Voice order'
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
        <div className="navbar-brand" onClick={() => setRole('entry')}>
          <div className="brand-logo-small">
            <span>🏬</span>
          </div>
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
                        {role === 'customer' ? (ne ? 'ग्राहक' : 'Customer') : (ne ? 'पसले' : 'Shop Owner')}
                      </span>
                    </div>
                  </div>

                  {/* Recent activity */}
                  <div className="profile-dd-activity">
                    <p className="profile-dd-section-title">
                      <Activity size={13} /> {ne ? 'हालको गतिविधि' : 'Recent activity'}
                    </p>
                    {activity.length === 0 ? (
                      <p className="profile-dd-empty">{ne ? 'अहिलेसम्म केही छैन' : 'Nothing yet'}</p>
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

                  {/* Demo role switch */}
                  <button
                    type="button"
                    className="profile-dd-btn switch"
                    onClick={() => { setRole(role === 'customer' ? 'shopkeeper' : 'customer'); setMenuOpen(false); }}
                  >
                    <RotateCcw size={16} />
                    <span>{role === 'customer' ? (ne ? 'पसले मोडमा जानुहोस्' : 'Switch to Shop Owner') : (ne ? 'ग्राहक मोडमा जानुहोस्' : 'Switch to Customer')}</span>
                  </button>

                  <button
                    type="button"
                    className="profile-dd-btn logout"
                    onClick={() => { logout(); setMenuOpen(false); }}
                  >
                    <LogOut size={16} />
                    <span>{ne ? 'लगआउट' : 'Log out'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
