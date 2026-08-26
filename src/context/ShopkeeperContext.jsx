import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { INITIAL_PRODUCTS, INITIAL_EXPENSES, GENERIC_PRODUCT_IMAGES } from '../constants/sampleData';
import { soundEffects } from '../utils/audioAlerts';

const ShopkeeperContext = createContext();

export function ShopkeeperProvider({ children }) {
  const { shops, setShops, orders, setOrders, showToast, t } = useApp();

  // Active managed shop by the shopkeeper (defaults to Shop-1 "राम किराना पसल")
  const [activeShopId, setActiveShopId] = useState('shop-1');

  // Shop Products Inventory
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('apna_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  // Shop Expenses for Daily Khata
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('apna_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  // Current Shop Data
  const shopData = shops.find(s => s.id === activeShopId) || shops[0];

  // Persist products and expenses
  useEffect(() => {
    localStorage.setItem('apna_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('apna_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Track previous order count to ring audio chime on new orders
  const [prevOrderCount, setPrevOrderCount] = useState(orders.length);
  useEffect(() => {
    if (orders.length > prevOrderCount) {
      soundEffects.playOrderAlarm();
      showToast(t.newOrderAlert, 'warning');
    }
    setPrevOrderCount(orders.length);
  }, [orders.length, prevOrderCount, showToast, t]);

  // ── Auto-decrement stock when items are sold ──
  // Orders are created in AppContext; here we watch for freshly-placed ones and
  // subtract their quantities from the matching products (by productId). Orders
  // already present at startup (seed/history) are marked applied so we don't
  // double-count them.
  const appliedOrderIdsRef = useRef(null);
  useEffect(() => {
    if (appliedOrderIdsRef.current === null) {
      // First run: treat everything currently loaded as already accounted for.
      appliedOrderIdsRef.current = new Set(orders.map(o => o.id));
      return;
    }
    const fresh = orders.filter(o =>
      o && o.id && !appliedOrderIdsRef.current.has(o.id) && o.orderStatus !== 'rejected'
    );
    if (fresh.length === 0) return;

    fresh.forEach(o => appliedOrderIdsRef.current.add(o.id));

    setProducts(prev => prev.map(p => {
      let sold = 0;
      fresh.forEach(o => {
        (o.items || []).forEach(it => {
          if (it.productId === p.id) sold += Number(it.quantity) || 0;
        });
      });
      if (sold <= 0) return p;
      const newStock = Math.max(0, (Number(p.stock) || 0) - sold);
      return {
        ...p,
        stock: newStock,
        // Keep the owner's manual availability choice, but force-off at zero stock.
        isAvailable: newStock > 0 ? p.isAvailable : false
      };
    }));
  }, [orders]);

  // Filter products for this shop
  const shopProducts = products.filter(p => p.shopId === activeShopId);

  // Low stock products alert
  const lowStockProducts = shopProducts.filter(
    p => p.stock <= (p.minStock || 5) && p.isAvailable
  );

  // Filter orders for this shop
  const shopOrders = orders.filter(o => o.shopId === activeShopId);

  // Add new product
  const addProduct = (newProduct) => {
    const created = {
      ...newProduct,
      id: `prod-${Date.now()}`,
      shopId: activeShopId,
      stock: Number(newProduct.stock) || 0,
      price: Number(newProduct.price) || 0,
      minStock: Number(newProduct.minStock) || 5,
      isAvailable: Number(newProduct.stock) > 0,
      image: newProduct.image || GENERIC_PRODUCT_IMAGES[newProduct.aliasId] || GENERIC_PRODUCT_IMAGES.general
    };
    setProducts(prev => [created, ...prev]);
    showToast(`${created.nameNe} सामान थपियो!`);
    return created;
  };

  // Edit existing product. An explicit `isAvailable` in updatedFields wins;
  // otherwise availability is derived from stock.
  const editProduct = (id, updatedFields) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updatedFields };
        if (updatedFields.isAvailable === undefined && updatedFields.stock !== undefined) {
          updated.isAvailable = Number(updated.stock) > 0;
        }
        return updated;
      }
      return p;
    }));
    showToast('सामानको विवरण सच्याइयो!');
  };

  // Toggle a product available/unavailable independently of stock, so the
  // shop owner can hide an item anytime (e.g. quality issue) and the voice
  // assistant will tell customers it is not available.
  const toggleProductAvailability = (id) => {
    let nowAvailable = false;
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        nowAvailable = !p.isAvailable;
        return { ...p, isAvailable: nowAvailable };
      }
      return p;
    }));
    showToast(nowAvailable ? 'सामान अब उपलब्ध छ ✅' : 'सामान अनुपलब्ध बनाइयो ⛔', nowAvailable ? 'success' : 'info');
  };

  // Delete product
  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('सामान हटाइयो!', 'info');
  };

  // Quick Stock update
  const updateProductStock = (id, delta) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const newStock = Math.max(0, p.stock + delta);
        return {
          ...p,
          stock: newStock,
          isAvailable: newStock > 0
        };
      }
      return p;
    }));
  };

  // Order actions
  const updateOrderStatus = (orderId, newStatus, newStep) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          orderStatus: newStatus,
          statusStep: newStep
        };
      }
      return o;
    }));
    showToast(`अर्डर स्थिति परिवर्तन गरियो: ${newStatus}`);
  };

  const assignRiderToOrder = (orderId, riderName) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          assignedRider: riderName
        };
      }
      return o;
    }));
    showToast(`डेलिभरी तोकियो: ${riderName}`);
  };

  const rejectOrder = (orderId) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          orderStatus: 'rejected',
          statusStep: 0
        };
      }
      return o;
    }));
    showToast('अर्डर अस्वीकृत गरियो!', 'error');
  };

  // Add expense in Khata
  const addExpense = (title, amount, category = 'General') => {
    const newExp = {
      id: `exp-${Date.now()}`,
      shopId: activeShopId,
      title,
      amount: Number(amount) || 0,
      date: new Date().toISOString().split('T')[0],
      category
    };
    setExpenses(prev => [newExp, ...prev]);
    showToast('खर्च खातामा जोडिएको छ!');
  };

  // Update Shop & Delivery Settings
  const updateShopSettings = (updatedSettings) => {
    setShops(prevShops => prevShops.map(s => {
      if (s.id === activeShopId) {
        return { ...s, ...updatedSettings };
      }
      return s;
    }));
    showToast('पसल सेटिङ सुरक्षित गरियो!');
  };

  // AI Product Image suggester
  const suggestImageForProduct = (productName) => {
    const clean = (productName || '').toLowerCase();
    if (clean.includes('alu') || clean.includes('aaloo') || clean.includes('potato') || clean.includes('आलु')) {
      return GENERIC_PRODUCT_IMAGES.potato;
    }
    if (clean.includes('pyaj') || clean.includes('onion') || clean.includes('प्याज')) {
      return GENERIC_PRODUCT_IMAGES.onion;
    }
    if (clean.includes('tomato') || clean.includes('tamatar') || clean.includes('गोलभेंडा')) {
      return GENERIC_PRODUCT_IMAGES.tomato;
    }
    if (clean.includes('sugar') || clean.includes('chini') || clean.includes('चिनी')) {
      return GENERIC_PRODUCT_IMAGES.sugar;
    }
    if (clean.includes('rice') || clean.includes('chamal') || clean.includes('चामल')) {
      return GENERIC_PRODUCT_IMAGES.rice;
    }
    if (clean.includes('oil') || clean.includes('tel') || clean.includes('तेल')) {
      return GENERIC_PRODUCT_IMAGES.oil;
    }
    if (clean.includes('milk') || clean.includes('dudh') || clean.includes('दूध')) {
      return GENERIC_PRODUCT_IMAGES.milk;
    }
    if (clean.includes('dal') || clean.includes('lentil') || clean.includes('दाल')) {
      return GENERIC_PRODUCT_IMAGES.lentil;
    }
    if (clean.includes('salt') || clean.includes('nun') || clean.includes('नुन')) {
      return GENERIC_PRODUCT_IMAGES.salt;
    }
    if (clean.includes('tea') || clean.includes('chiya') || clean.includes('चिया')) {
      return GENERIC_PRODUCT_IMAGES.tea;
    }
    if (clean.includes('wai wai') || clean.includes('noodle') || clean.includes('चाउचाउ')) {
      return GENERIC_PRODUCT_IMAGES.noodles;
    }
    if (clean.includes('soap') || clean.includes('sabun') || clean.includes('साबुन')) {
      return GENERIC_PRODUCT_IMAGES.soap;
    }
    if (clean.includes('biscuit') || clean.includes('बिस्कुट')) {
      return GENERIC_PRODUCT_IMAGES.biscuit;
    }
    if (clean.includes('egg') || clean.includes('anda') || clean.includes('अन्डा')) {
      return GENERIC_PRODUCT_IMAGES.egg;
    }
    return GENERIC_PRODUCT_IMAGES.general;
  };

  // Khata Calculations for Today
  const totalSales = shopOrders
    .filter(o => o.orderStatus !== 'rejected')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const cashSales = shopOrders
    .filter(o => o.orderStatus !== 'rejected' && o.paymentMethod === 'cod')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const onlineSales = shopOrders
    .filter(o => o.orderStatus !== 'rejected' && o.paymentMethod !== 'cod')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const deliveryEarnings = shopOrders
    .filter(o => o.orderStatus !== 'rejected')
    .reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);

  const totalExpenses = expenses
    .filter(e => e.shopId === activeShopId)
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const netProfit = totalSales - totalExpenses;

  return (
    <ShopkeeperContext.Provider value={{
      activeShopId,
      setActiveShopId,
      shopData,
      products,
      setProducts,
      shopProducts,
      lowStockProducts,
      shopOrders,
      expenses,
      addProduct,
      editProduct,
      deleteProduct,
      updateProductStock,
      toggleProductAvailability,
      updateOrderStatus,
      assignRiderToOrder,
      rejectOrder,
      addExpense,
      updateShopSettings,
      suggestImageForProduct,
      totalSales,
      cashSales,
      onlineSales,
      deliveryEarnings,
      totalExpenses,
      netProfit
    }}>
      {children}
    </ShopkeeperContext.Provider>
  );
}

export function useShopkeeper() {
  const context = useContext(ShopkeeperContext);
  if (!context) {
    throw new Error('useShopkeeper must be used within a ShopkeeperProvider');
  }
  return context;
}
