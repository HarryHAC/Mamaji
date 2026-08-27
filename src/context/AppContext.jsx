import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants/translations';
import { INITIAL_SHOPS, INITIAL_PRODUCTS, INITIAL_ORDERS } from '../constants/sampleData';
import { soundEffects } from '../utils/audioAlerts';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export function AppProvider({ children }) {
  const { currentUser, logActivity } = useAuth();

  // Role: 'entry' | 'customer' | 'shopkeeper'. Driven by the logged-in account.
  const [role, setRole] = useState(() => localStorage.getItem('apna_role') || 'entry');
  const [language, setLanguage] = useState(() => localStorage.getItem('apna_lang') || 'ne');
  
  // Active selected shop for customer browsing
  const [shops, setShops] = useState(() => {
    const saved = localStorage.getItem('apna_shops');
    return saved ? JSON.parse(saved) : INITIAL_SHOPS;
  });
  const [selectedShopId, setSelectedShopId] = useState(null);

  // Customer Cart: array of { product, quantity, unit }
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('apna_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Customer Orders
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('apna_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  // Customer Profile & Location Permission (seeded from the logged-in account)
  const [customerInfo, setCustomerInfo] = useState(() => {
    const saved = localStorage.getItem('apna_customer_info');
    return saved ? JSON.parse(saved) : {
      name: '',
      phone: '',
      email: '',
      address: '',
      hasLocationPermission: false,
      lat: null,
      lng: null
    };
  });

  // Sync role + customer profile to the authenticated account.
  useEffect(() => {
    if (currentUser) {
      // Role is locked to the account type — a customer never sees the owner UI and vice-versa.
      setRole(currentUser.role);
      setCustomerInfo(prev => ({
        ...prev,
        name: currentUser.name || prev.name,
        phone: currentUser.phone || prev.phone,
        email: currentUser.email || prev.email,
        address: currentUser.address || prev.address,
        lat: currentUser.lat ?? prev.lat,
        lng: currentUser.lng ?? prev.lng
      }));
    } else {
      // Logged out — return to the auth gate.
      setRole('entry');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Active Toast Notifications
  const [toast, setToast] = useState(null);

  // Modals visibility
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(null);

  // Active translations dictionary
  const t = TRANSLATIONS[language] || TRANSLATIONS.ne;

  // Persist key state to localStorage
  useEffect(() => {
    localStorage.setItem('apna_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('apna_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('apna_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('apna_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('apna_customer_info', JSON.stringify(customerInfo));
  }, [customerInfo]);

  useEffect(() => {
    localStorage.setItem('apna_shops', JSON.stringify(shops));
  }, [shops]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const selectedShop = shops.find(s => s.id === selectedShopId) || shops[0] || null;

  // Auto-select a shop for the customer once shops exist (or the current one vanishes).
  useEffect(() => {
    if (shops.length === 0) {
      if (selectedShopId !== null) setSelectedShopId(null);
      return;
    }
    if (!shops.some(s => s.id === selectedShopId)) {
      setSelectedShopId(shops[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shops]);

  // Orders belonging to the logged-in customer (their own history/tracking).
  const myOrders = currentUser
    ? orders.filter(o => o.userId === currentUser.id)
    : [];

  // Cart operations
  const addToCart = (product, quantity = 1, unit = null) => {
    soundEffects.playPop();
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prevCart, {
          product,
          quantity,
          unit: unit || product.unit || 'kg'
        }];
      }
    });
    showToast(`${product.nameNe} (${quantity} ${product.unit}) ${t.itemAdded}`);
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Place Order Action
  const placeOrder = (orderData) => {
    if (!selectedShop) {
      showToast('कुनै पसल छानिएको छैन', 'error');
      return null;
    }
    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      shopId: selectedShop.id,
      userId: currentUser?.id || null,
      customerName: customerInfo.name || currentUser?.name || 'ग्राहक',
      customerPhone: customerInfo.phone || currentUser?.phone || '',
      customerEmail: customerInfo.email || currentUser?.email || '',
      orderType: orderData.orderType || 'delivery',
      deliveryAddress: orderData.deliveryAddress || customerInfo.address,
      distanceKm: selectedShop.distanceKm || 1.0,
      // Allow callers (e.g. the AI voice agent) to pass items explicitly so the
      // order never depends on async cart state settling first. Fall back to cart.
      items: orderData.items || cart.map(item => ({
        productId: item.product.id,
        nameNe: item.product.nameNe,
        nameEn: item.product.nameEn,
        quantity: item.quantity,
        unit: item.unit,
        price: item.product.price
      })),
      itemsSubtotal: orderData.itemsSubtotal,
      deliveryCharge: orderData.deliveryCharge,
      grandTotal: orderData.grandTotal,
      paymentMethod: orderData.paymentMethod || 'cod',
      paymentStatus: orderData.paymentMethod === 'cod' ? 'pending' : 'paid',
      orderStatus: 'received',
      statusStep: 1,
      assignedRider: selectedShop.deliveryPersons?.[0] || 'पसले आफैं',
      locationPermissionGranted: orderData.locationPermissionGranted || false,
      lat: customerInfo.lat,
      lng: customerInfo.lng,
      createdAt: new Date().toISOString(),
      customerNote: orderData.customerNote || ''
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    soundEffects.playSuccessChime();
    setActiveTrackingOrderId(newOrder.id);
    showToast(t.orderPlacedSuccess, 'success');
    if (currentUser) {
      logActivity(currentUser.id, 'order_placed', `${newOrder.id} · रु ${newOrder.grandTotal}`);
    }
    return newOrder;
  };

  // 1-Click Reorder Action
  const reorderPreviousOrder = (order) => {
    order.items.forEach(item => {
      const currentProduct = INITIAL_PRODUCTS.find(p => p.id === item.productId) || {
        id: item.productId,
        nameNe: item.nameNe,
        nameEn: item.nameEn,
        price: item.price,
        unit: item.unit,
        stock: 50,
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80'
      };
      addToCart(currentProduct, item.quantity, item.unit);
    });
    setIsCartOpen(true);
    showToast(`${order.items.length} ${t.itemAdded}`);
  };

  return (
    <AppContext.Provider value={{
      role,
      setRole,
      language,
      setLanguage,
      t,
      shops,
      setShops,
      selectedShopId,
      setSelectedShopId,
      selectedShop,
      cart,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      orders,
      myOrders,
      setOrders,
      placeOrder,
      reorderPreviousOrder,
      customerInfo,
      setCustomerInfo,
      toast,
      showToast,
      isVoiceModalOpen,
      setIsVoiceModalOpen,
      isCartOpen,
      setIsCartOpen,
      isCheckoutOpen,
      setIsCheckoutOpen,
      activeTrackingOrderId,
      setActiveTrackingOrderId
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
