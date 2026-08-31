import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getShopTypeMeta, SHOP_TYPES } from '../../constants/shopTypes';
import { pick } from '../../utils/i18n';
import { shopDistanceKm, getCurrentLocation } from '../../utils/geo';
import { MapPin, Star, CheckCircle2, ShoppingBag, LocateFixed, Loader2 } from 'lucide-react';

export default function ShopList() {
  const { shops, selectedShopId, setSelectedShopId, customerInfo, setCustomerInfo, language, t } = useApp();
  const [typeFilter, setTypeFilter] = useState('all');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  const userLoc = customerInfo?.hasLocationPermission ? { lat: customerInfo.lat, lng: customerInfo.lng } : null;

  const requestLocation = async () => {
    setLocError('');
    setLocating(true);
    try {
      const loc = await getCurrentLocation();
      setCustomerInfo(prev => ({ ...prev, lat: loc.lat, lng: loc.lng, hasLocationPermission: true }));
    } catch (e) {
      setLocError(pick(language, {
        ne: 'लोकेशन पाउन सकिएन। अनुमति दिनुहोस्।', hi: 'लोकेशन नहीं मिल सका। अनुमति दें।', en: 'Could not get location. Please allow access.',
        mai: 'लोकेशन नै भेटल। अनुमति दिअ\'।', bho: 'लोकेशन ना मिलल। अनुमति दीं।'
      }));
    } finally {
      setLocating(false);
    }
  };

  // Only show filter chips for shop types that actually exist in the list.
  const availableTypes = useMemo(() => {
    const present = new Set(shops.map(s => s.shopType || 'grocery'));
    return Object.values(SHOP_TYPES).filter(tp => present.has(tp.id));
  }, [shops]);

  // Filter by type, then sort by nearest (real distance if we have the user's location).
  const visibleShops = useMemo(() => {
    const filtered = typeFilter === 'all' ? shops : shops.filter(s => (s.shopType || 'grocery') === typeFilter);
    return [...filtered]
      .map(s => ({ shop: s, dist: shopDistanceKm(userLoc, s) }))
      .sort((a, b) => (a.dist ?? 9999) - (b.dist ?? 9999));
  }, [shops, typeFilter, userLoc]);

  return (
    <div className="shops-section">
      <div className="section-header">
        <h2 className="section-title">
          <MapPin size={20} className="section-icon" /> {t.shops}
        </h2>
        <span className="section-badge">{visibleShops.length} {pick(language, { ne: 'पसलहरू', hi: 'दुकानें', en: 'shops', mai: 'दोकान', bho: 'दोकान' })}</span>
      </div>

      {/* Shop-type filter chips */}
      <div className="shop-type-filter-row">
        <button
          type="button"
          className={`shop-type-chip ${typeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setTypeFilter('all')}
        >
          <span className="chip-icon">🏬</span>
          <span>{pick(language, { ne: 'सबै', hi: 'सभी', en: 'All', mai: 'सब', bho: 'सब' })}</span>
        </button>
        {availableTypes.map(tp => (
          <button
            key={tp.id}
            type="button"
            className={`shop-type-chip ${typeFilter === tp.id ? 'active' : ''}`}
            onClick={() => setTypeFilter(tp.id)}
          >
            <span className="chip-icon">{tp.icon}</span>
            <span>{pick(language, tp.name)}</span>
          </button>
        ))}
      </div>

      {/* Live-location "nearest shops" control */}
      {shops.length > 0 && (
        <button type="button" className="use-location-btn" onClick={requestLocation} disabled={locating}>
          {locating ? <Loader2 size={15} className="spin" /> : <LocateFixed size={15} />}
          <span>{userLoc
            ? pick(language, { ne: 'लोकेशन अनुसार क्रमबद्ध', hi: 'आपके लोकेशन के अनुसार', en: 'Sorted by your location', mai: 'लोकेशन अनुसार', bho: 'लोकेशन अनुसार' })
            : pick(language, { ne: 'मेरो लोकेशनबाट नजिकका पसल', hi: 'मेरे लोकेशन के पास की दुकानें', en: 'Nearest shops to my location', mai: 'हमर लोकेशनसँ नजदीक', bho: 'हमार लोकेशन से नजदीक' })}</span>
        </button>
      )}
      {locError && <p className="loc-error-text">{locError}</p>}

      {shops.length === 0 && (
        <div className="empty-state-box">
          <div className="empty-state-icon">🏪</div>
          <h3>{pick(language, { ne: 'अहिले कुनै पसल छैन', hi: 'अभी कोई दुकान नहीं', en: 'No shops yet', mai: 'एखन कोनो दोकान नै', bho: 'अभी कवनो दोकान नइखे' })}</h3>
          <p>{pick(language, {
            ne: 'तपाईंको नजिकका पसलहरू दर्ता भएपछि यहाँ देखिनेछन्।', hi: 'आपके पास की दुकानें दर्ज होने पर यहाँ दिखेंगी।',
            en: 'Shops near you will appear here once they register.',
            mai: 'अहाँक नजदीकक दोकान दर्ता भेलाक बाद एतय देखाइत।',
            bho: 'रउरा नजदीक के दोकान दर्ता भइला के बाद इहाँ देखाई।'
          })}</p>
        </div>
      )}

      <div className="shops-scroll-grid">
        {visibleShops.map(({ shop, dist }) => {
          const isSelected = shop.id === selectedShopId;
          const typeMeta = getShopTypeMeta(shop.shopType);
          const distText = dist != null ? `${dist < 10 ? dist.toFixed(1) : Math.round(dist)}` : shop.distanceKm;
          return (
            <div
              key={shop.id}
              className={`shop-card ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedShopId(shop.id)}
            >
              <div className="shop-img-wrapper">
                <img src={shop.image} alt={shop.name} className="shop-img" />
                <div className="shop-type-tag">
                  {typeMeta.icon} {shop.shopTypeLabel || pick(language, typeMeta.name)}
                </div>
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
                  <MapPin size={12} /> {distText} {t.km}
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
                        <ShoppingBag size={16} /> {pick(language, { ne: 'यो पसल छान्नुहोस्', hi: 'यह दुकान चुनें', en: 'Choose this shop', mai: 'ई दोकान चुनू', bho: 'ई दोकान चुनीं' })}
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
