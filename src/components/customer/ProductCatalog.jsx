import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useShopkeeper } from '../../context/ShopkeeperContext';
import { useAIAgent } from '../../context/AIAgentContext';
import { getShopCategories } from '../../constants/shopTypes';
import { pick } from '../../utils/i18n';
import { findMatchingProductInCatalog } from '../../constants/productAliases';
import ProductCard from './ProductCard';
import { Search, Mic, Sparkles, Filter, X } from 'lucide-react';

export default function ProductCatalog() {
  const { selectedShop, t, language } = useApp();
  const { products } = useShopkeeper();
  const { isAgentActive, activateAgent, setIsAgentPanelOpen } = useAIAgent();

  // Categories depend on the shop's type (grocery, sweets, hardware, …).
  const CATEGORIES = useMemo(() => getShopCategories(selectedShop), [selectedShop?.shopType]);

  // All in-catalog voice CTAs launch the hands-free assistant.
  const launchVoiceAssistant = () => {
    if (!isAgentActive) activateAgent();
    else setIsAgentPanelOpen(true);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Reset the category filter when switching to a shop of a different type.
  useEffect(() => { setSelectedCategory('all'); }, [selectedShop?.id]);

  // Filter products for this selected shop
  const shopCatalog = useMemo(() => {
    return products.filter(p => p.shopId === selectedShop.id);
  }, [products, selectedShop.id]);

  // Apply search & category filters
  const filteredProducts = useMemo(() => {
    let result = shopCatalog;

    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const nameNeMatch = p.nameNe.toLowerCase().includes(q);
        const nameEnMatch = p.nameEn.toLowerCase().includes(q);
        const aliasMatch = findMatchingProductInCatalog(q, [p]) !== null;
        return nameNeMatch || nameEnMatch || aliasMatch;
      });
    }

    return result;
  }, [shopCatalog, selectedCategory, searchQuery]);

  return (
    <div className="catalog-section">
      {/* Top AI Voice & Search Action Bar */}
      <div className="search-voice-bar">
        <div className="search-input-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="search-field"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Big AI Voice Trigger Button */}
        <button
          type="button"
          className="hero-mic-btn"
          onClick={launchVoiceAssistant}
          title={t.micPrompt}
        >
          <div className="mic-icon-circle">
            <Mic size={22} className="mic-svg" />
          </div>
          <div className="mic-btn-text">
            <span className="mic-action-title">🎤 {t.speak}</span>
            <span className="mic-action-sub">AI Assistant</span>
          </div>
        </button>
      </div>

      {/* Voice Prompt Banner for users with low smartphone experience */}
      <div className="voice-prompt-banner" onClick={launchVoiceAssistant}>
        <div className="banner-icon">
          <Sparkles size={20} />
        </div>
        <div className="banner-content">
          <p className="banner-title">
            <strong>{t.micPrompt}</strong>
          </p>
          <p className="banner-examples">
            "मलाई १ किलो आलु र २ किलो चिनी चाहियो"
          </p>
        </div>
        <span className="banner-tap-cue">थिच्नुहोस् →</span>
      </div>

      {/* Category Pills */}
      <div className="category-scroll-container">
        {CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={`category-pill ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span className="cat-name">
                {pick(language, cat.name)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Products Header & Count */}
      <div className="catalog-header-row">
        <h2 className="catalog-title">
          {selectedCategory === 'all'
            ? t.popularProducts
            : (() => { const c = CATEGORIES.find(c => c.id === selectedCategory); return c ? pick(language, c.name) : t.popularProducts; })()}
        </h2>
        <span className="products-count-badge">
          {filteredProducts.length} {t.allProducts}
        </span>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length > 0 ? (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="no-products-box">
          <p className="no-prod-title">{t.noProductsFound}</p>
          <p className="no-prod-sub">
            {t.searchResultFor} "{searchQuery}"
          </p>
          <button
            type="button"
            className="btn-reset-filters"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
          >
            सबै सामान हेर्नुहोस्
          </button>
        </div>
      )}
    </div>
  );
}
