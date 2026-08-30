/*
 * Fresh start — no demo shops, products, orders, or expenses.
 * Shops are created by shop owners at registration; products by owners
 * (manually or by voice); orders by customers. Everything persists in the
 * browser's localStorage.
 */

export const INITIAL_SHOPS = [];
export const INITIAL_PRODUCTS = [];
export const INITIAL_ORDERS = [];
export const INITIAL_EXPENSES = [];

// Neutral, self-contained "no photo yet" placeholder for a product without an
// image. Works for ANY shop type (grocery, wholesale, hardware, pharmacy, …)
// and needs no network (unlike the grocery stock photos below).
export const PRODUCT_PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">` +
      `<rect width="120" height="120" rx="14" fill="#f1f3f5"/>` +
      `<g fill="none" stroke="#adb5bd" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">` +
      `<rect x="34" y="40" width="52" height="44" rx="5"/>` +
      `<path d="M44 40l4-8h24l4 8"/><circle cx="60" cy="62" r="11"/></g></svg>`
  );

// Generic stock photos used as a fallback when an owner doesn't provide an image.
export const GENERIC_PRODUCT_IMAGES = {
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80',
  onion: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&auto=format&fit=crop&q=80',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80',
  sugar: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=400&auto=format&fit=crop&q=80',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
  oil: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
  milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80',
  lentil: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=400&auto=format&fit=crop&q=80',
  salt: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400&auto=format&fit=crop&q=80',
  tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
  noodles: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80',
  soap: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&auto=format&fit=crop&q=80',
  biscuit: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&auto=format&fit=crop&q=80',
  egg: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&auto=format&fit=crop&q=80',
  general: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80'
};
