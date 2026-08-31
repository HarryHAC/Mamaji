import React, { useState } from 'react';
import { useShopkeeper } from '../../context/ShopkeeperContext';
import { useApp } from '../../context/AppContext';
import { pick } from '../../utils/i18n';
import { toDevanagariNumerals } from '../../utils/deliveryCalculator';
import {
  Check,
  X,
  MapPin,
  Phone,
  User,
  Truck,
  ShoppingBag,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';

export default function OrdersManager() {
  const {
    shopOrders,
    shopData,
    updateOrderStatus,
    assignRiderToOrder,
    rejectOrder
  } = useShopkeeper();
  const { t, language } = useApp();

  const [selectedLocationOrder, setSelectedLocationOrder] = useState(null);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'pending' | 'completed'

  const filteredOrders = shopOrders.filter(order => {
    if (filterTab === 'pending') {
      return order.orderStatus !== 'delivered' && order.orderStatus !== 'rejected';
    }
    if (filterTab === 'completed') {
      return order.orderStatus === 'delivered' || order.orderStatus === 'rejected';
    }
    return true;
  });

  const handleStatusChange = (orderId, newStep) => {
    const stepMap = {
      1: { status: 'received', step: 1 },
      2: { status: 'accepted', step: 2 },
      3: { status: 'preparing', step: 3 },
      4: { status: 'out_for_delivery', step: 4 },
      5: { status: 'delivered', step: 5 }
    };
    const target = stepMap[newStep];
    if (target) {
      updateOrderStatus(orderId, target.status, target.step);
    }
  };

  return (
    <div className="orders-manager-section">
      <div className="section-header">
        <h2 className="section-title">
          <ShoppingBag size={20} className="section-icon" /> {t.orders}
        </h2>
        <div className="order-filter-pills">
          <button
            type="button"
            className={`filter-pill ${filterTab === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            {pick(language, { ne: 'सबै', hi: 'सभी', en: 'All', mai: 'सब', bho: 'सब' })} ({shopOrders.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${filterTab === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterTab('pending')}
          >
            {pick(language, { ne: 'बाँकी', hi: 'बाकी', en: 'Pending', mai: 'बाँकी', bho: 'बाकी' })} ({shopOrders.filter(o => o.orderStatus !== 'delivered' && o.orderStatus !== 'rejected').length})
          </button>
          <button
            type="button"
            className={`filter-pill ${filterTab === 'completed' ? 'active' : ''}`}
            onClick={() => setFilterTab('completed')}
          >
            {pick(language, { ne: 'सकिएका', hi: 'पूर्ण', en: 'Completed', mai: 'भेल', bho: 'पूरा' })}
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="no-orders-box">
          <div className="empty-icon">📦</div>
          <h3>{pick(language, { ne: 'कुनै अर्डर छैन', hi: 'कोई ऑर्डर नहीं', en: 'No orders', mai: 'कोनो अर्डर नै', bho: 'कवनो आर्डर नइखे' })}</h3>
          <p>{pick(language, { ne: 'यस सूचीमा हाल कुनै अर्डर फेला परेन।', hi: 'इस सूची में अभी कोई ऑर्डर नहीं है।', en: 'No orders in this list right now.', mai: 'एहि सूचीमे एखन कोनो अर्डर नै।', bho: 'ए लिस्ट में अभी कवनो आर्डर नइखे।' })}</p>
        </div>
      ) : (
        <div className="shop-orders-list">
          {filteredOrders.map((order) => {
            const isCompleted = order.orderStatus === 'delivered';
            const isRejected = order.orderStatus === 'rejected';

            return (
              <div
                key={order.id}
                className={`shopkeeper-order-card ${isRejected ? 'rejected' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                {/* Header */}
                <div className="card-top-bar">
                  <div>
                    <span className="order-id-badge">{order.id}</span>
                    <h3 className="customer-name-heading">
                      <User size={16} /> {order.customerName}
                    </h3>
                    <p className="order-phone-sub">
                      <Phone size={14} /> <a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a>
                    </p>
                  </div>

                  <div className="order-pricing-summary">
                    <span className="price-tag-big">
                      रु {toDevanagariNumerals(order.grandTotal)}
                    </span>
                    <span className={`payment-status-badge ${order.paymentStatus}`}>
                      {order.paymentMethod.toUpperCase()} • {order.paymentStatus === 'paid' ? 'Paid' : 'COD'}
                    </span>
                  </div>
                </div>

                {/* Delivery Type & Location Info */}
                <div className="order-location-meta">
                  <div className="order-type-badge">
                    {order.orderType === 'delivery' ? (
                      <span className="badge-delivery">🚚 {t.homeDelivery} ({order.distanceKm} {t.km})</span>
                    ) : (
                      <span className="badge-pickup">🏪 {t.shopPickup}</span>
                    )}
                  </div>

                  <div className="address-text">
                    <MapPin size={14} /> <span>{order.deliveryAddress}</span>
                  </div>

                  {/* Customer Location Privacy Button */}
                  {order.orderType === 'delivery' && (
                    <button
                      type="button"
                      className="btn-view-loc-map"
                      onClick={() => setSelectedLocationOrder(order)}
                    >
                      {order.locationPermissionGranted ? (
                        <>
                          <ShieldCheck size={16} className="icon-green" />
                          <span>{pick(language, { ne: 'ग्राहकको स्थान हेर्नुहोस्', hi: 'ग्राहक का स्थान देखें', en: "View customer's location", mai: 'ग्राहकक स्थान देखू', bho: 'ग्राहक के जगह देखीं' })}</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={16} className="icon-amber" />
                          <span>{pick(language, { ne: 'स्थान अनुमति दिइएको छैन', hi: 'स्थान की अनुमति नहीं दी गई', en: 'Location not shared', mai: 'स्थान अनुमति नै देल', bho: 'जगह के अनुमति नइखे' })}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Customer Special Note if any */}
                {order.customerNote && (
                  <div className="customer-note-banner">
                    <strong>{pick(language, { ne: 'ग्राहकको टिप्पणी:', hi: 'ग्राहक की टिप्पणी:', en: "Customer's note:", mai: 'ग्राहकक टिप्पणी:', bho: 'ग्राहक के नोट:' })}</strong> "{order.customerNote}"
                  </div>
                )}

                {/* Ordered Items List */}
                <div className="ordered-items-table">
                  <h4>{pick(language, { ne: 'सामानको सूची:', hi: 'सामान की सूची:', en: 'Item list:', mai: 'सामानक सूची:', bho: 'सामान के सूची:' })}</h4>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="ordered-item-row">
                      <span className="item-name">
                        • {item.nameNe} ({item.nameEn})
                      </span>
                      <span className="item-qty">
                        {toDevanagariNumerals(item.quantity)} {item.unit}
                      </span>
                      <span className="item-price">
                        रु {toDevanagariNumerals(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="ordered-totals-footer">
                    <span>सामान: रु {toDevanagariNumerals(order.itemsSubtotal)}</span>
                    <span>डेलिभरी: रु {toDevanagariNumerals(order.deliveryCharge)}</span>
                  </div>
                </div>

                {/* Delivery Rider Assignment (Section 18) */}
                {!isRejected && order.orderType === 'delivery' && (
                  <div className="rider-assign-row">
                    <label className="rider-assign-label">
                      <Truck size={16} /> {t.assignDeliveryPerson}:
                    </label>
                    <select
                      className="rider-select-dropdown"
                      value={order.assignedRider || ''}
                      onChange={(e) => assignRiderToOrder(order.id, e.target.value)}
                    >
                      {(shopData.deliveryPersons || ['पसले आफैं', 'रमेश', 'सुमन']).map((rider, i) => (
                        <option key={i} value={rider}>{rider}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Status Stepper Dropdown / Progression */}
                {!isRejected && (
                  <div className="order-status-management">
                    <label className="status-label">{t.updateStatus}:</label>
                    <div className="status-button-steps">
                      {[
                        { step: 1, label: t.status1 },
                        { step: 2, label: t.status2 },
                        { step: 3, label: t.status3 },
                        { step: 4, label: t.status4 },
                        { step: 5, label: t.status5 },
                      ].map((stepObj) => (
                        <button
                          key={stepObj.step}
                          type="button"
                          className={`btn-step-progress ${order.statusStep === stepObj.step ? 'active' : ''} ${order.statusStep > stepObj.step ? 'done' : ''}`}
                          onClick={() => handleStatusChange(order.id, stepObj.step)}
                        >
                          <span className="step-num">{stepObj.step}</span>
                          <span className="step-txt">{stepObj.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accept / Reject Buttons for newly received orders */}
                {order.orderStatus === 'received' && (
                  <div className="order-first-actions">
                    <button
                      type="button"
                      className="btn-accept-order"
                      onClick={() => handleStatusChange(order.id, 2)}
                    >
                      <Check size={18} />
                      <span>{t.acceptOrder}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-reject-order"
                      onClick={() => rejectOrder(order.id)}
                    >
                      <X size={18} />
                      <span>{t.rejectOrder}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Location Map Modal */}
      {selectedLocationOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedLocationOrder(null)}>
          <div className="location-map-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <MapPin size={20} /> {pick(language, { ne: 'ग्राहकको डेलिभरी ठेगाना', hi: 'ग्राहक का डिलीवरी पता', en: 'Customer delivery address', mai: 'ग्राहकक डेलिभरी पता', bho: 'ग्राहक के डेलिभरी पता' })}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedLocationOrder(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="customer-map-card">
                <h4>{selectedLocationOrder.customerName}</h4>
                <p className="phone">
                  <Phone size={14} /> {selectedLocationOrder.customerPhone}
                </p>
                <p className="addr">
                  <MapPin size={14} /> {selectedLocationOrder.deliveryAddress}
                </p>

                {/* Simulated Map View */}
                <div className="map-view-placeholder">
                  <div className="map-pin-pulse">
                    <MapPin size={32} className="pin-icon" />
                    <span className="pin-label">{pick(language, { ne: 'ग्राहकको घर', hi: 'ग्राहक का घर', en: "Customer's home", mai: 'ग्राहकक घर', bho: 'ग्राहक के घर' })}</span>
                  </div>
                  <div className="map-info-overlay">
                    <span>GPS: 27.693° N, 85.338° E</span>
                    <span>{pick(language, { ne: 'दूरी', hi: 'दूरी', en: 'Distance', mai: 'दूरी', bho: 'दूरी' })}: {selectedLocationOrder.distanceKm} {pick(language, { ne: 'कि.मि.', hi: 'कि.मी.', en: 'km', mai: 'कि.मी.', bho: 'कि.मी.' })}</span>
                  </div>
                </div>

                <div className="map-directions-actions">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLocationOrder.deliveryAddress)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-open-google-maps"
                  >
                    {pick(language, { ne: 'Google Maps मा हेर्नुहोस्', hi: 'Google Maps में देखें', en: 'View on Google Maps', mai: 'Google Maps मे देखू', bho: 'Google Maps में देखीं' })} ↗
                  </a>
                  <a
                    href={`tel:${selectedLocationOrder.customerPhone}`}
                    className="btn-call-customer"
                  >
                    <Phone size={16} /> {pick(language, { ne: 'ग्राहकलाई कल गर्नुहोस्', hi: 'ग्राहक को कॉल करें', en: 'Call customer', mai: 'ग्राहकके कॉल करू', bho: 'ग्राहक के कॉल करीं' })}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
