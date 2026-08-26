import React from 'react';
import { useApp } from '../../context/AppContext';
import { MapPin, Star, Clock, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';

export default function ShopList() {
  const { shops, selectedShopId, setSelectedShopId, t } = useApp();

  return (
    <div className="shops-section">
      <div className="section-header">
        <h2 className="section-title">
          <MapPin size={20} className="section-icon" /> {t.shops}
        </h2>
        <span className="section-badge">{shops.length} पसलहरू</span>
      </div>

      <div className="shops-scroll-grid">
        {shops.map(shop => {
          const isSelected = shop.id === selectedShopId;
          return (
            <div
              key={shop.id}
              className={`shop-card ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedShopId(shop.id)}
            >
              <div className="shop-img-wrapper">
                <img src={shop.image} alt={shop.name} className="shop-img" />
                <div className="shop-status-badge">
                  {shop.isOpen ? (
                    <span className="badge-open">
                      <span className="dot"></span> {t.openNow}
                    </span>
                  ) : (
                    <span className="badge-closed">{t.closedNow}</span>
                  )}
                </div>
                <div className="shop-distance-pill">
                  <MapPin size={12} /> {shop.distanceKm} {t.km}
                </div>
              </div>

              <div className="shop-content">
                <div className="shop-title-row">
                  <h3 className="shop-name">{shop.name}</h3>
                  <div className="shop-rating">
                    <Star size={14} className="star-icon" />
                    <span>{shop.rating}</span>
                  </div>
                </div>

                <p className="shop-address">{shop.address}</p>

                <div className="shop-tags-row">
                  {shop.deliveryAvailable ? (
                    <span className="shop-tag delivery">
                      {t.deliveryAvailable}
                    </span>
                  ) : (
                    <span className="shop-tag pickup">
                      {t.pickupAvailable}
                    </span>
                  )}
                  <span className="shop-tag min-order">
                    {t.minOrder}: {t.currency} {shop.minOrderAmount}
                  </span>
                </div>

                <div className="shop-action-row">
                  <button
                    type="button"
                    className={`select-shop-btn ${isSelected ? 'active' : ''}`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 size={16} /> {t.selectedShop}
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} /> यो पसल छान्नुहोस्
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
