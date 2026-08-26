import React, { useState } from 'react';
import { useShopkeeper } from '../../context/ShopkeeperContext';
import { useApp } from '../../context/AppContext';
import ShopDashboard from './ShopDashboard';
import OrdersManager from './OrdersManager';
import InventoryManager from './InventoryManager';
import DailyKhata from './DailyKhata';
import ShopSettings from './ShopSettings';
import LanguagePicker from '../common/LanguagePicker';
import { pick } from '../../utils/i18n';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  DollarSign,
  Settings,
  Store,
  ChevronDown,
  Globe
} from 'lucide-react';

export default function ShopkeeperHome() {
  const { activeShopId, setActiveShopId, shopData, shopOrders, lowStockProducts } = useShopkeeper();
  const { shops, t, language } = useApp();

  // Tab: 'dashboard' | 'orders' | 'inventory' | 'khata' | 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showShopDropdown, setShowShopDropdown] = useState(false);

  const pendingOrdersCount = shopOrders.filter(
    o => o.orderStatus === 'received' || o.orderStatus === 'accepted' || o.orderStatus === 'preparing'
  ).length;

  return (
    <div className="shopkeeper-layout">
      {/* Top Shop Selector Bar for multi-store owners */}
      <div className="shopkeeper-top-bar">
        <div className="current-shop-indicator" onClick={() => setShowShopDropdown(!showShopDropdown)}>
          <div className="shop-icon-circle">
            <Store size={18} />
          </div>
          <div>
            <div className="shop-title-wrap">
              <h2 className="shop-active-name">{shopData.name}</h2>
              <ChevronDown size={14} className={showShopDropdown ? 'rotated' : ''} />
            </div>
            <span className="shop-active-location">{shopData.address}</span>
          </div>
        </div>

        {/* Language selector — clearly labelled so shop owners can find it */}
        <div className="shopkeeper-lang-control">
          <span className="shopkeeper-lang-label">
            <Globe size={14} /> {pick(language, { ne: 'भाषा', en: 'Language', mai: 'भाषा', bho: 'भाषा' })}
          </span>
          <LanguagePicker compact={true} />
        </div>

        {/* Quick Badge Indicators */}
        <div className="shop-quick-stats-pills">
          {pendingOrdersCount > 0 && (
            <button
              type="button"
              className="quick-stat-badge orders pulse"
              onClick={() => setActiveTab('orders')}
            >
              🔔 {pendingOrdersCount} {t.pendingOrders}
            </button>
          )}
          {lowStockProducts.length > 0 && (
            <button
              type="button"
              className="quick-stat-badge stock"
              onClick={() => setActiveTab('inventory')}
            >
              ⚠️ {lowStockProducts.length} कम स्टक
            </button>
          )}
        </div>
      </div>

      {/* Switch Shop Dropdown for Demo */}
      {showShopDropdown && (
        <div className="shopkeeper-stores-dropdown">
          <p className="dropdown-label">पसल छान्नुहोस् (Multi-Tenant Demo):</p>
          {shops.map(s => (
            <button
              key={s.id}
              type="button"
              className={`shop-select-option ${s.id === activeShopId ? 'selected' : ''}`}
              onClick={() => {
                setActiveShopId(s.id);
                setShowShopDropdown(false);
              }}
            >
              <Store size={16} />
              <span>{s.name} ({s.address})</span>
            </button>
          ))}
        </div>
      )}

      {/* Top Navigation Tabs for Shopkeeper */}
      <nav className="shopkeeper-nav-tabs">
        <button
          type="button"
          className={`shop-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>{t.dashboard}</span>
        </button>

        <button
          type="button"
          className={`shop-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag size={18} />
          <span>{t.orders}</span>
          {pendingOrdersCount > 0 && (
            <span className="tab-bubble-count">{pendingOrdersCount}</span>
          )}
        </button>

        <button
          type="button"
          className={`shop-nav-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Package size={18} />
          <span>{t.inventory}</span>
          {lowStockProducts.length > 0 && (
            <span className="tab-bubble-count warning">{lowStockProducts.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`shop-nav-btn ${activeTab === 'khata' ? 'active' : ''}`}
          onClick={() => setActiveTab('khata')}
        >
          <DollarSign size={18} />
          <span>{t.khata}</span>
        </button>

        <button
          type="button"
          className={`shop-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          <span>{t.settings}</span>
        </button>
      </nav>

      {/* Main Tab View */}
      <main className="shopkeeper-main-body">
        {activeTab === 'dashboard' && (
          <ShopDashboard onNavigateTab={setActiveTab} />
        )}
        {activeTab === 'orders' && (
          <OrdersManager />
        )}
        {activeTab === 'inventory' && (
          <InventoryManager />
        )}
        {activeTab === 'khata' && (
          <DailyKhata />
        )}
        {activeTab === 'settings' && (
          <ShopSettings />
        )}
      </main>
    </div>
  );
}
