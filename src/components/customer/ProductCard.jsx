import React from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Minus, Check, ShoppingBag, AlertTriangle } from 'lucide-react';

export default function ProductCard({ product }) {
  const { cart, addToCart, updateCartQuantity, t } = useApp();

  const cartItem = cart.find(item => item.product.id === product.id);
  const currentQuantity = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock <= 0 || !product.isAvailable;
  const isLowStock = !isOutOfStock && product.stock <= (product.minStock || 5);

  return (
    <div className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      <div className="product-image-container">
        <img
          src={product.image}
          alt={product.nameNe}
          className="product-image"
          loading="lazy"
        />

        {isOutOfStock ? (
          <div className="stock-overlay-badge out">
            <span>{t.outOfStock}</span>
          </div>
        ) : isLowStock ? (
          <div className="stock-overlay-badge low">
            <AlertTriangle size={12} />
            <span>{t.lowStockWarning} ({product.stock} {product.unit})</span>
          </div>
        ) : null}

        {product.brand && (
          <span className="product-brand-tag">{product.brand}</span>
        )}
      </div>

      <div className="product-details">
        <h3 className="product-title-ne">{product.nameNe}</h3>
        <p className="product-title-en">{product.nameEn}</p>

        <div className="product-price-row">
          <div className="price-tag">
            <span className="currency-sym">{t.currency}</span>
            <span className="price-value">{product.price}</span>
            <span className="unit-label">/ {product.unit}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="product-card-actions">
          {isOutOfStock ? (
            <button type="button" className="btn-add-cart disabled" disabled>
              {t.outOfStock}
            </button>
          ) : currentQuantity > 0 ? (
            <div className="qty-stepper-btn">
              <button
                type="button"
                className="stepper-action minus"
                onClick={() => updateCartQuantity(product.id, currentQuantity - 1)}
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="stepper-count">
                {currentQuantity} <small>{product.unit}</small>
              </span>
              <button
                type="button"
                className="stepper-action plus"
                onClick={() => {
                  if (currentQuantity < product.stock) {
                    updateCartQuantity(product.id, currentQuantity + 1);
                  }
                }}
                disabled={currentQuantity >= product.stock}
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-add-cart"
              onClick={() => addToCart(product, 1)}
            >
              <Plus size={18} />
              <span>{t.addToCart}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
