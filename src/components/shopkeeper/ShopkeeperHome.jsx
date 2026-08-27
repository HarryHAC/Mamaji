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
  const { shopData, shopOrders, lowStockProducts } = useShopkeeper();
  const { t, language } = useApp();

  // Tab: 'dashboard' | 'orders' | 'inventory' | 'khata' | 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');

  const pendingOrdersCount = shopOrders.filter(
    o => o.orderStatus === 'received' || o.orderStatus === 'accepted' || o.orderStatus === 'preparing'
  ).length;

  if (!shopData) {
    return (
      <div className="shopkeeper-layout">
        <div className="empty-state-box">
          <div className="empty-state-icon">🏪</div>
          <h3>{pick(language, { ne: 'पसल तयार हुँदैछ...', en: 'Setting up your shop...', mai: 'दोकान तैयार भऽ रहल...', bho: 'दोकान तैयार होत बा...' })}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="shopkeeper-layout">
      {/* Top Shop Bar */}
      <div className="shopkeeper-top-bar">
        <div className="current-shop-indicator">
          <div className="shop-icon-circle">
            <Store size={18} />
          </div>
          <div>
            <div className="shop-title-wrap">
              <h2 className="shop-active-name">{shopData.name}</h2>
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
              ⚠️ {lowStockProducts.length} {pick(language, { ne: 'कम स्टक', en: 'low stock', mai: 'कम स्टक', bho: 'कम स्टॉक' })}
            </button>
          )}
        </div>
      </div>

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
