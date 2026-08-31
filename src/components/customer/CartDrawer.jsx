import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateDeliveryFee, toDevanagariNumerals } from '../../utils/deliveryCalculator';
import { pick } from '../../utils/i18n';
import { X, Plus, Minus, Trash2, ShoppingBag, Truck, Store, ArrowRight } from 'lucide-react';

export default function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    selectedShop,
    setIsCheckoutOpen,
    language,
    t
  } = useApp();

  const [orderType, setOrderType] = useState('delivery'); // 'delivery' | 'pickup'

  if (!isCartOpen) return null;

  const itemsSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryCharge = selectedShop ? calculateDeliveryFee(selectedShop, selectedShop?.distanceKm || 1.2, orderType) : 0;
  const grandTotal = itemsSubtotal + deliveryCharge;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="cart-backdrop" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer-card" onClick={(e) => e.stopPropagation()}>
        {/* Cart Header */}
        <div className="cart-header">
          <div className="cart-title-box">
            <ShoppingBag size={22} className="cart-icon" />
            <div>
              <h2 className="cart-heading">{t.cart}</h2>
              <p className="cart-shop-name">{selectedShop?.name || ''}</p>
            </div>
          </div>
          <button
            type="button"
            className="cart-close-btn"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="empty-cart-state">
              <div className="empty-cart-icon">🛒</div>
              <h3 className="empty-title">{t.cartEmpty}</h3>
              <p className="empty-sub">{t.cartEmptySub}</p>
              <button
                type="button"
                className="btn-start-shopping"
                onClick={() => setIsCartOpen(false)}
              >
                {pick(language, { ne: 'सामान छान्नुहोस्', hi: 'खरीदारी शुरू करें', en: 'Start Shopping', mai: 'सामान चुनू', bho: 'सामान चुनीं' })}
              </button>
            </div>
          ) : (
            <>
              {/* Order Type Toggle: Home Delivery vs Pickup */}
              <div className="order-type-picker">
                <span className="picker-label">{t.orderType}:</span>
                <div className="order-type-tabs">
                  <button
                    type="button"
                    className={`order-type-tab ${orderType === 'delivery' ? 'active' : ''}`}
                    onClick={() => setOrderType('delivery')}
                  >
                    <Truck size={18} />
                    <span>{t.homeDelivery}</span>
                  </button>
                  <button
                    type="button"
                    className={`order-type-tab ${orderType === 'pickup' ? 'active' : ''}`}
                    onClick={() => setOrderType('pickup')}
                  >
                    <Store size={18} />
                    <span>{t.shopPickup}</span>
                  </button>
                </div>
                {orderType === 'pickup' && (
                  <p className="pickup-info-note">{t.pickupNote}</p>
                )}
              </div>

              {/* Items List */}
              <div className="cart-items-scroll">
                {cart.map(item => (
                  <div key={item.product.id} className="cart-item-card">
                    <img
                      src={item.product.image}
                      alt={item.product.nameNe}
                      className="cart-item-img"
                    />
                    <div className="cart-item-info">
                      <h4 className="cart-item-title">{item.product.nameNe}</h4>
                      <p className="cart-item-unit-rate">
                        रु {item.product.price} / {item.unit}
                      </p>
                      <div className="cart-item-subtotal">
                        रु {toDevanagariNumerals(item.product.price * item.quantity)}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="cart-qty-controls">
                      <button
                        type="button"
                        className="btn-qty-step"
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="cart-qty-val">
                        {toDevanagariNumerals(item.quantity)} <small>{item.unit}</small>
                      </span>
                      <button
                        type="button"
                        className="btn-qty-step"
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-remove-item"
                        onClick={() => removeFromCart(item.product.id)}
                        title="Delete item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Cart Footer Summary */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-bill-breakdown">
              <div className="bill-row">
                <span>{t.subtotal}:</span>
                <strong>रु {toDevanagariNumerals(itemsSubtotal)}</strong>
              </div>
              <div className="bill-row">
                <span>
                  {t.deliveryCharge} {orderType === 'delivery' && selectedShop ? `(${selectedShop.distanceKm} ${t.km})` : ''}:
                </span>
                <strong>
                  {orderType === 'pickup' 
                    ? t.freeDelivery 
                    : `रु ${toDevanagariNumerals(deliveryCharge)}`}
                </strong>
              </div>
              <div className="bill-row total-highlight">
                <span>{t.grandTotal}:</span>
                <strong className="grand-val">
                  रु {toDevanagariNumerals(grandTotal)}
                </strong>
              </div>
            </div>

            <div className="cart-actions-row">
              <button
                type="button"
                className="btn-clear-cart"
                onClick={clearCart}
              >
                {pick(language, { ne: 'खाली गर्नुहोस्', hi: 'खाली करें', en: 'Clear', mai: 'खाली करू', bho: 'खाली करीं' })}
              </button>
              <button
                type="button"
                className="btn-checkout"
                onClick={handleProceedToCheckout}
              >
                <span>{t.placeOrder}</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
