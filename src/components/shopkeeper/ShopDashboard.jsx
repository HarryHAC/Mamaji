import React from 'react';
import { useShopkeeper } from '../../context/ShopkeeperContext';
import { useApp } from '../../context/AppContext';
import { pick } from '../../utils/i18n';
import { toDevanagariNumerals } from '../../utils/deliveryCalculator';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  Store,
  DollarSign,
  PackageCheck
} from 'lucide-react';

export default function ShopDashboard({ onNavigateTab }) {
  const {
    shopData,
    shopOrders,
    lowStockProducts,
    totalSales,
    cashSales,
    onlineSales,
    netProfit
  } = useShopkeeper();
  const { t, language } = useApp();

  const pendingOrders = shopOrders.filter(
    o => o.orderStatus === 'received' || o.orderStatus === 'accepted' || o.orderStatus === 'preparing'
  );

  return (
    <div className="shop-dashboard-view">
      {/* Welcome Banner */}
      <div className="shopkeeper-hero-card">
        <div className="shop-hero-text">
          <span className="shop-badge">{t.shopkeeper} ड्यासबोर्ड</span>
          <h2 className="shop-welcome-name">{shopData.name}</h2>
          <p className="shop-welcome-sub">
            {shopData.ownerName} • {shopData.address}
          </p>
        </div>
        <div className="shop-status-pill-toggle">
          <span className="status-dot-pulse"></span>
          <span className="status-text">{t.openNow}</span>
        </div>
      </div>

      {/* Main KPI Stat Cards (Section 21) */}
      <div className="dashboard-stats-grid">
        {/* 1. Today's Sales */}
        <div className="stat-card sales">
          <div className="stat-icon-box sales">
            <TrendingUp size={24} />
          </div>
          <div className="stat-meta">
            <span className="stat-label">{t.todaySales}</span>
            <h3 className="stat-number">
              रु {toDevanagariNumerals(totalSales)}
            </h3>
            <span className="stat-sub">
              {pick(language, { ne: 'नगद', hi: 'नगद', en: 'Cash', mai: 'नगद', bho: 'नगद' })}: रु {toDevanagariNumerals(cashSales)} | {pick(language, { ne: 'अनलाइन', hi: 'ऑनलाइन', en: 'Online', mai: 'अनलाइन', bho: 'अनलाइन' })}: रु {toDevanagariNumerals(onlineSales)}
            </span>
          </div>
        </div>

        {/* 2. Today's Orders */}
        <div className="stat-card orders" onClick={() => onNavigateTab('orders')}>
          <div className="stat-icon-box orders">
            <ShoppingBag size={24} />
          </div>
          <div className="stat-meta">
            <span className="stat-label">{t.todayOrders}</span>
            <h3 className="stat-number">{toDevanagariNumerals(shopOrders.length)}</h3>
            <span className="stat-sub">{pick(language, { ne: 'कुल ग्राहक अर्डर', hi: 'कुल ग्राहक ऑर्डर', en: 'Total customer orders', mai: 'कुल ग्राहक अर्डर', bho: 'कुल ग्राहक आर्डर' })}</span>
          </div>
        </div>

        {/* 3. Pending Orders */}
        <div className="stat-card pending" onClick={() => onNavigateTab('orders')}>
          <div className="stat-icon-box pending">
            <Clock size={24} />
          </div>
          <div className="stat-meta">
            <span className="stat-label">{t.pendingOrders}</span>
            <h3 className="stat-number text-orange">
              {toDevanagariNumerals(pendingOrders.length)}
            </h3>
            <span className="stat-sub">{pick(language, { ne: 'तयारी तथा डेलिभरी बाँकी', hi: 'तैयारी व डिलीवरी बाकी', en: 'Preparing & delivery pending', mai: 'तैयारी आ डेलिभरी बाँकी', bho: 'तैयारी आ डेलिभरी बाकी' })}</span>
          </div>
        </div>

        {/* 4. Low Stock Alert */}
        <div className="stat-card low-stock" onClick={() => onNavigateTab('inventory')}>
          <div className="stat-icon-box low-stock">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-meta">
            <span className="stat-label">{t.lowStockCount}</span>
            <h3 className="stat-number text-red">
              {toDevanagariNumerals(lowStockProducts.length)}
            </h3>
            <span className="stat-sub">{pick(language, { ne: 'तत्काल थप्नुपर्ने सामान', hi: 'तुरंत भरने वाला सामान', en: 'Items to restock soon', mai: 'तुरंत भरय बला सामान', bho: 'तुरंत भरे वाला सामान' })}</span>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Alert Bar */}
      {lowStockProducts.length > 0 && (
        <div className="low-stock-alert-banner" onClick={() => onNavigateTab('inventory')}>
          <AlertTriangle size={22} className="alert-pulse-icon" />
          <div className="banner-text">
            <h4>{t.lowStockWarning}</h4>
            <p>
              {lowStockProducts.map(p => `${p.nameNe} (${p.stock} ${p.unit})`).join(', ')}
            </p>
          </div>
          <span className="alert-action-link">{pick(language, { ne: 'स्टक हेर्नुहोस्', hi: 'स्टॉक देखें', en: 'View stock', mai: 'स्टक देखू', bho: 'स्टॉक देखीं' })} →</span>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="dashboard-quick-actions">
        <h3 className="section-title">{pick(language, { ne: 'छिटो कार्यहरू', hi: 'त्वरित कार्य', en: 'Quick Actions', mai: 'छिट कार्य', bho: 'जल्दी काम' })}</h3>
        <div className="quick-actions-row">
          <button
            type="button"
            className="btn-quick-action"
            onClick={() => onNavigateTab('orders')}
          >
            <ShoppingBag size={20} />
            <span>{pick(language, { ne: 'अर्डरहरू हेर्नुहोस्', hi: 'ऑर्डर देखें', en: 'View orders', mai: 'अर्डर देखू', bho: 'आर्डर देखीं' })} ({pendingOrders.length})</span>
          </button>
          <button
            type="button"
            className="btn-quick-action"
            onClick={() => onNavigateTab('inventory')}
          >
            <Plus size={20} />
            <span>{t.addProduct}</span>
          </button>
          <button
            type="button"
            className="btn-quick-action"
            onClick={() => onNavigateTab('khata')}
          >
            <DollarSign size={20} />
            <span>{t.khata}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
