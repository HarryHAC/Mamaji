import React from 'react';
import { useApp } from '../../context/AppContext';
import { toDevanagariNumerals } from '../../utils/deliveryCalculator';
import { Clock, RotateCcw, ChevronRight, ShoppingBag, Truck, Store } from 'lucide-react';

export default function CustomerOrders() {
  const { myOrders: orders, shops, setActiveTrackingOrderId, reorderPreviousOrder, t } = useApp();

  return (
    <div className="customer-orders-section">
      <div className="section-header">
        <h2 className="section-title">
          <Clock size={20} className="section-icon" /> {t.myOrders}
        </h2>
        <span className="section-badge">{orders.length} अर्डरहरू</span>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders-box">
          <div className="empty-icon">📦</div>
          <h3>कुनै अर्डर भेटिएन</h3>
          <p>तपाईंले अहिलेसम्म कुनै अर्डर गर्नुभएको छैन।</p>
        </div>
      ) : (
        <div className="orders-history-list">
          {orders.map((order) => {
            const shop = shops.find(s => s.id === order.shopId) || shops[0];
            const isDelivered = order.orderStatus === 'delivered';
            const isRejected = order.orderStatus === 'rejected';

            const statusClass = isDelivered 
              ? 'status-delivered' 
              : isRejected 
                ? 'status-rejected' 
                : 'status-active';

            return (
              <div key={order.id} className="order-history-card">
                <div className="order-card-header">
                  <div>
                    <span className="order-id-tag">{order.id}</span>
                    <h3 className="order-shop-title">{shop.name}</h3>
                    <p className="order-date-text">
                      {new Date(order.createdAt).toLocaleDateString('ne-NP', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className={`order-status-pill ${statusClass}`}>
                    {order.orderStatus === 'received' && t.status1}
                    {order.orderStatus === 'accepted' && t.status2}
                    {order.orderStatus === 'preparing' && t.status3}
                    {order.orderStatus === 'out_for_delivery' && t.status4}
                    {order.orderStatus === 'delivered' && t.status5}
                    {order.orderStatus === 'rejected' && t.statusRejected}
                  </div>
                </div>

                <div className="order-items-snippet">
                  <p>
                    {order.items.map(i => `${i.nameNe} (${i.quantity} ${i.unit})`).join(', ')}
                  </p>
                </div>

                <div className="order-card-footer">
                  <div className="order-total-price">
                    <span className="total-label">जम्मा:</span>
                    <span className="total-val">
                      रु {toDevanagariNumerals(order.grandTotal)}
                    </span>
                    <span className="pay-method-badge">
                      {order.paymentMethod.toUpperCase()}
                    </span>
                  </div>

                  <div className="order-card-buttons">
                    <button
                      type="button"
                      className="btn-quick-reorder"
                      onClick={() => reorderPreviousOrder(order)}
                    >
                      <RotateCcw size={16} />
                      <span>{t.reorder}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-view-tracking"
                      onClick={() => setActiveTrackingOrderId(order.id)}
                    >
                      <span>{t.trackOrder}</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
