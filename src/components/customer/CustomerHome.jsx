import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import ShopList from './ShopList';
import ProductCatalog from './ProductCatalog';
import CustomerOrders from './CustomerOrders';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';
import OrderTrackingModal from './OrderTrackingModal';
import { pick } from '../../utils/i18n';
import {
  Home,
  ShoppingBag,
  Clock,
  MapPin,
  Store,
  ChevronDown
} from 'lucide-react';

export default function CustomerHome() {
  const {
    selectedShop,
    shops,
    cart,
    setIsCartOpen,
    language,
    t
  } = useApp();

  // Tab: 'home' | 'shops' | 'orders'
  const [activeTab, setActiveTab] = useState('home');
  const [showShopPicker, setShowShopPicker] = useState(false);

  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="customer-home-layout">
      {/* Active Shop Top Banner */}
      {selectedShop && (
        <div className="active-shop-bar">
          <div className="shop-info-touch" onClick={() => setShowShopPicker(!showShopPicker)}>
            <div className="shop-avatar">
              <Store size={20} />
            </div>
            <div className="shop-text-meta">
              <div className="shop-title-arrow">
                <h2 className="current-shop-name">{selectedShop.name}</h2>
                <ChevronDown size={16} className={`arrow-icon ${showShopPicker ? 'open' : ''}`} />
              </div>
              <p className="current-shop-sub">
                <MapPin size={12} /> {selectedShop.address} • {selectedShop.distanceKm} {t.km}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-change-shop-pill"
            onClick={() => setShowShopPicker(!showShopPicker)}
          >
            {showShopPicker ? (pick(language, { ne: 'बन्द गर्नुहोस्', hi: 'बंद करें', en: 'Close', mai: 'बन्द करू', bho: 'बंद करीं' })) : t.changeShop}
          </button>
        </div>
      )}

      {/* Expandable Nearby Shops List */}
      {selectedShop && showShopPicker && (
        <div className="shop-picker-dropdown">
          <ShopList />
        </div>
      )}

      {/* Main Content Area based on Tab */}
      <main className="customer-main-content">
        {activeTab === 'home' && (
          selectedShop ? (
            <ProductCatalog />
          ) : (
            <div className="empty-state-box">
              <div className="empty-state-icon">🛍️</div>
              <h3>{pick(language, { ne: 'पसल छान्नुहोस्', hi: 'दुकान चुनें', en: 'Choose a shop', mai: 'दोकान चुनू', bho: 'दोकान चुनीं' })}</h3>
              <p>{pick(language, {
                ne: 'सामान हेर्न सुरु गर्न कुनै नजिकको पसल छान्नुहोस्।', hi: 'उत्पाद देखने के लिए पास की कोई दुकान चुनें।',
                en: 'Pick a nearby shop to start browsing products.',
                mai: 'सामान देखय लेल कोनो नजदीकक दोकान चुनू।',
                bho: 'सामान देखे खातिर कवनो नजदीक के दोकान चुनीं।'
              })}</p>
              <button type="button" className="btn-start-shopping" onClick={() => setActiveTab('shops')}>
                {pick(language, { ne: 'पसलहरू हेर्नुहोस्', hi: 'दुकानें देखें', en: 'Browse shops', mai: 'दोकान देखू', bho: 'दोकान देखीं' })}
              </button>
            </div>
          )
        )}

        {activeTab === 'shops' && (
          <ShopList />
        )}

        {activeTab === 'orders' && (
          <CustomerOrders />
        )}
      </main>

      {/* Bottom Sticky Navigation */}
      <nav className="bottom-nav-bar">
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('home');
            setShowShopPicker(false);
          }}
        >
          <Home size={22} />
          <span>{t.home}</span>
        </button>

        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'shops' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('shops');
            setShowShopPicker(false);
          }}
        >
          <Store size={22} />
          <span>{t.shops}</span>
        </button>

        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('orders');
            setShowShopPicker(false);
          }}
        >
          <Clock size={22} />
          <span>{t.myOrders}</span>
        </button>

        <button
          type="button"
          className="nav-tab-btn cart-tab"
          onClick={() => setIsCartOpen(true)}
        >
          <div className="nav-cart-icon-wrap">
            <ShoppingBag size={22} />
            {totalCartCount > 0 && (
              <span className="tab-cart-count">{totalCartCount}</span>
            )}
          </div>
          <span>{t.cart}</span>
        </button>
      </nav>

      {/* Modals */}
      <CartDrawer />
      <CheckoutModal />
      <OrderTrackingModal />
    </div>
  );
}
