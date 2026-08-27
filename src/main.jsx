import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/agentOverlay.css';
import './styles/auth.css';

// One-time data reset: purge any old demo/sample shops, products, orders and
// payment requests so the app starts empty. Everything is created by real
// users (owners add shops + products, customers place orders). Accounts,
// wallets, language and session are kept. Bump DATA_VERSION to purge again.
const DATA_VERSION = '3-fresh';
try {
  if (localStorage.getItem('apna_data_version') !== DATA_VERSION) {
    ['apna_shops', 'apna_products', 'apna_orders', 'apna_expenses', 'apna_pay_requests']
      .forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('apna_data_version', DATA_VERSION);
  }
} catch (e) { /* ignore */ }

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the service worker for offline/installable PWA (production only,
// so Vite's dev HMR is never intercepted by the cache).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore */ });
  });
}
