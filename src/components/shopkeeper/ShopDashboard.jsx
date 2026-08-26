import React from 'react';
import { useShopkeeper } from '../../context/ShopkeeperContext';
import { useApp } from '../../context/AppContext';
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
  const { t } = useApp();

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
              नगद: रु {toDevanagariNumerals(cashSales)} | अनलाइन: रु {toDevanagariNumerals(onlineSales)}
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
            <span className="stat-sub">कुल ग्राहक अर्डर</span>
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
            <span className="stat-sub">तयारी तथा डेलिभरी बाँकी</span>
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
            <span className="stat-sub">तत्काल थप्नुपर्ने सामान</span>
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
          <span className="alert-action-link">स्टक हेर्नुहोस् →</span>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="dashboard-quick-actions">
        <h3 className="section-title">छिटो कार्यहरू (Quick Actions)</h3>
        <div className="quick-actions-row">
          <button
            type="button"
            className="btn-quick-action"
            onClick={() => onNavigateTab('orders')}
          >
            <ShoppingBag size={20} />
            <span>अर्डरहरू हेर्नुहोस् ({pendingOrders.length})</span>
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
