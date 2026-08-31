import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { toDevanagariNumerals } from '../../utils/deliveryCalculator';
import { pick } from '../../utils/i18n';
import LiveDeliveryTracker from './LiveDeliveryTracker';
import {
  X,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  Star,
  RotateCcw
} from 'lucide-react';

export default function OrderTrackingModal() {
  const {
    activeTrackingOrderId,
    setActiveTrackingOrderId,
    orders,
    shops,
    reorderPreviousOrder,
    showToast,
    language,
    t
  } = useApp();

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);

  if (!activeTrackingOrderId) return null;

  const order = orders.find(o => o.id === activeTrackingOrderId);
  if (!order) return null;

  const shop = shops.find(s => s.id === order.shopId) || shops[0];

  const STATUS_STEPS = [
    { step: 1, key: 'received', label: t.status1, icon: <Clock size={20} /> },
    { step: 2, key: 'accepted', label: t.status2, icon: <CheckCircle2 size={20} /> },
    { step: 3, key: 'preparing', label: t.status3, icon: <Package size={20} /> },
    { step: 4, key: 'out_for_delivery', label: t.status4, icon: <Truck size={20} /> },
    { step: 5, key: 'delivered', label: t.status5, icon: <ShoppingBag size={20} /> },
  ];

  const currentStep = order.statusStep || 1;
  const isDelivered = order.orderStatus === 'delivered' || currentStep >= 5;
  const isRejected = order.orderStatus === 'rejected';

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    setHasSubmittedReview(true);
    showToast(t.reviewSubmitted);
  };

  return (
    <div className="modal-backdrop" onClick={() => setActiveTrackingOrderId(null)}>
      <div className="tracking-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tracking-header">
          <div>
            <span className="tracking-badge">{t.orderStatus}</span>
            <h2 className="tracking-order-num">{order.id}</h2>
            <p className="tracking-shop-name">{shop.name}</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setActiveTrackingOrderId(null)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tracking Body */}
        <div className="tracking-body">
          {/* Status Stepper */}
          {isRejected ? (
            <div className="rejected-status-banner">
              <span className="rejected-icon">❌</span>
              <h3>{t.statusRejected}</h3>
              <p>{pick(language, {
                ne: 'पसलमा सामानको अभाव वा प्राविधिक कारणले अर्डर रद्द भएको छ।', hi: 'स्टॉक की कमी या तकनीकी कारण से ऑर्डर रद्द कर दिया गया।',
                en: 'The order was cancelled due to stock shortage or a technical reason.',
                mai: 'दोकानमे सामानक कमी वा प्राविधिक कारणसँ अर्डर रद्द भऽ गेल।',
                bho: 'दोकान में सामान के कमी भा तकनीकी कारण से आर्डर रद्द हो गइल।'
              })}</p>
            </div>
          ) : (
            <div className="stepper-container">
              {STATUS_STEPS.map((stepItem) => {
                const isCompleted = currentStep >= stepItem.step;
                const isCurrent = currentStep === stepItem.step;
                return (
                  <div
                    key={stepItem.step}
                    className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
                  >
                    <div className="step-marker">
                      <div className="step-icon-circle">
                        {stepItem.icon}
                      </div>
                      {stepItem.step < 5 && <div className="step-connector-line"></div>}
                    </div>
                    <div className="step-content">
                      <h4 className="step-title">{stepItem.label}</h4>
                      {isCurrent && !isDelivered && (
                        <span className="step-live-pulse">{pick(language, {
                          ne: 'अहिले यो चरणमा छ...', hi: 'अभी इस चरण में है...',
                          en: 'Currently at this step...',
                          mai: 'एखन एहि चरणमे अछि...',
                          bho: 'अभी एह चरण में बा...'
                        })}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Live delivery tracking (active delivery orders) */}
          {order.orderType === 'delivery' && !isDelivered && !isRejected && (
            <LiveDeliveryTracker order={order} shop={shop} language={language} />
          )}

          {/* Delivery Rider Dispatch Notice (Section 18) */}
          {order.orderType === 'delivery' && order.assignedRider && (
            <div className="delivery-rider-card">
              <div className="rider-avatar">
                <User size={24} />
              </div>
              <div className="rider-details">
                <span className="rider-label">{t.deliveredBy}</span>
                <h4 className="rider-name">
                  {pick(language, {
                    ne: `तपाईंको अर्डर ${order.assignedRider} ले डेलिभर गर्दै हुनुहुन्छ।`, hi: `${order.assignedRider} आपका ऑर्डर डिलीवर कर रहे हैं।`,
                    en: `${order.assignedRider} is delivering your order.`,
                    mai: `अहाँक अर्डर ${order.assignedRider} डेलिभर कऽ रहल छथि।`,
                    bho: `रउरा आर्डर ${order.assignedRider} डेलिभर करत बाड़न।`
                  })}
                </h4>
              </div>
            </div>
          )}

          {/* Order Details Accordion */}
          <div className="order-items-summary-card">
            <h4 className="card-section-title">{pick(language, {
              ne: 'अर्डर गरिएका सामानहरू:', hi: 'ऑर्डर किए गए सामान:',
              en: 'Ordered items:',
              mai: 'अर्डर कएल सामान:',
              bho: 'आर्डर कइल सामान:'
            })}</h4>
            <div className="summary-items-list">
              {order.items.map((item, idx) => (
                <div key={idx} className="summary-item-line">
                  <span className="item-qty-name">
                    {item.nameNe} × {toDevanagariNumerals(item.quantity)} {item.unit}
                  </span>
                  <span className="item-price">
                    रु {toDevanagariNumerals(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-bill-footer">
              <div className="bill-sub-line">
                <span>{t.subtotal}:</span>
                <strong>रु {toDevanagariNumerals(order.itemsSubtotal)}</strong>
              </div>
              <div className="bill-sub-line">
                <span>{t.deliveryCharge}:</span>
                <strong>रु {toDevanagariNumerals(order.deliveryCharge)}</strong>
              </div>
              <div className="bill-sub-line grand-line">
                <span>{t.grandTotal} ({order.paymentMethod.toUpperCase()}):</span>
                <strong className="grand-price">
                  रु {toDevanagariNumerals(order.grandTotal)}
                </strong>
              </div>
            </div>
          </div>

          {/* Rating Section (Section 42) */}
          {isDelivered && (
            <div className="review-section-card">
              <h4 className="review-title">{t.rateShop}</h4>
              {!hasSubmittedReview ? (
                <form onSubmit={handleReviewSubmit}>
                  <div className="stars-picker">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= rating ? 'active' : ''}`}
                        onClick={() => setRating(star)}
                      >
                        <Star size={28} />
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="review-input"
                    placeholder={pick(language, {
                      ne: 'छोटो प्रतिक्रिया लेख्नुहोस् (ऐच्छिक)...', hi: 'छोटी समीक्षा लिखें (वैकल्पिक)...',
                      en: 'Write a short review (optional)...',
                      mai: 'छोट प्रतिक्रिया लिखू (ऐच्छिक)...',
                      bho: 'छोट राय लिखीं (ऐच्छिक)...'
                    })}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />
                  <button type="submit" className="btn-submit-review">
                    {t.submitReview}
                  </button>
                </form>
              ) : (
                <div className="review-thankyou-box">
                  <CheckCircle2 size={24} className="icon-green" />
                  <p>{t.reviewSubmitted}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="tracking-footer">
          <button
            type="button"
            className="btn-reorder-now"
            onClick={() => {
              reorderPreviousOrder(order);
              setActiveTrackingOrderId(null);
            }}
          >
            <RotateCcw size={18} />
            <span>{t.reorder}</span>
          </button>
          <button
            type="button"
            className="btn-close-tracking"
            onClick={() => setActiveTrackingOrderId(null)}
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
