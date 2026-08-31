import React, { useState, useRef } from 'react';
import { useShopkeeper } from '../../context/ShopkeeperContext';
import { useApp } from '../../context/AppContext';
import { getShopCategories } from '../../constants/shopTypes';
import { toDevanagariNumerals } from '../../utils/deliveryCalculator';
import { pick } from '../../utils/i18n';
import { fileToDataURL } from '../../utils/imageCapture';
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Search,
  Check,
  X,
  Package,
  Image as ImageIcon,
  Camera,
  Upload
} from 'lucide-react';

// Neutral "no photo yet" placeholder — works for ANY shop type (grocery,
// sweets, hardware, pharmacy, wholesale, …), not a grocery-specific stock image.
const PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">` +
      `<rect width="120" height="120" rx="14" fill="#f1f3f5"/>` +
      `<g fill="none" stroke="#adb5bd" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">` +
      `<rect x="34" y="40" width="52" height="44" rx="5"/>` +
      `<path d="M44 40l4-8h24l4 8"/><circle cx="60" cy="62" r="11"/></g></svg>`
  );

export default function InventoryManager() {
  const {
    shopProducts,
    addProduct,
    editProduct,
    deleteProduct,
    updateProductStock,
    toggleProductAvailability,
    shopData
  } = useShopkeeper();
  const { t, language } = useApp();

  // Categories for this shop's type (grocery, sweets, hardware, …).
  const CATEGORIES = getShopCategories(shopData);
  const firstCategoryId = CATEGORIES.find(c => c.id !== 'all')?.id || 'general';

  // Product photo: native camera capture + gallery upload (two separate inputs
  // so "Camera" opens the camera and "Upload" opens the gallery on mobile).
  const fileInputRef = useRef(null);   // gallery / files (no capture attribute)
  const cameraInputRef = useRef(null); // camera (capture="environment")
  const [imageBusy, setImageBusy] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  // Form State
  const [nameNe, setNameNe] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState(firstCategoryId);
  const [customCategory, setCustomCategory] = useState(''); // free-text when category === '__custom__'
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [image, setImage] = useState('');
  const [brand, setBrand] = useState('');

  const filteredProducts = shopProducts.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() ||
      p.nameNe.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setNameNe('');
    setNameEn('');
    setCategory(firstCategoryId);
    setCustomCategory('');
    setPrice('');
    setUnit('kg');
    setStock('20');
    setMinStock('5');
    setImage('');
    setBrand('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingProductId(p.id);
    setNameNe(p.nameNe);
    setNameEn(p.nameEn);
    // If the product's category isn't one of this shop-type's presets, treat it
    // as a custom category so the owner can keep/edit it.
    const isKnown = CATEGORIES.some(c => c.id === p.category);
    setCategory(isKnown ? p.category : '__custom__');
    setCustomCategory(isKnown ? '' : (p.category || ''));
    setPrice(String(p.price));
    setUnit(p.unit);
    setStock(String(p.stock));
    setMinStock(String(p.minStock || 5));
    setImage(p.image);
    setBrand(p.brand || '');
    setIsModalOpen(true);
  };

  // ── Read a photo from the device (camera capture OR gallery) ──
  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setImageBusy(true);
    try {
      const dataUrl = await fileToDataURL(file, 800, 0.82);
      setImage(dataUrl);
    } catch (err) {
      setCameraError(pick(language, {
        ne: 'फोटो पढ्न सकिएन।', hi: 'फोटो पढ़ा नहीं जा सका।', en: 'Could not read that image.', mai: 'फोटो पढ़ि नै सकल।', bho: 'फोटो पढ़ल ना जा सकल।'
      }));
    } finally {
      setImageBusy(false);
    }
  };

  const handleSubmitProduct = (e) => {
    e.preventDefault();
    if (!nameNe.trim() || !price) return;

    const finalImage = image || PLACEHOLDER_IMG;
    // Custom category → use the typed text (fall back to the first preset).
    const finalCategory = category === '__custom__'
      ? (customCategory.trim() || firstCategoryId)
      : category;

    if (editingProductId) {
      editProduct(editingProductId, {
        nameNe,
        nameEn: nameEn || nameNe,
        category: finalCategory,
        price: Number(price),
        unit,
        stock: Number(stock),
        minStock: Number(minStock),
        image: finalImage,
        brand
      });
    } else {
      addProduct({
        nameNe,
        nameEn: nameEn || nameNe,
        category: finalCategory,
        price: Number(price),
        unit,
        stock: Number(stock),
        minStock: Number(minStock),
        image: finalImage,
        brand
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="inventory-manager-section">
      {/* Top Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Package size={20} className="section-icon" /> {t.inventory}
          </h2>
          <p className="section-subtitle">
            {pick(language, { ne: 'कुल', hi: 'कुल', en: 'Total', mai: 'कुल', bho: 'कुल' })} {shopProducts.length} {pick(language, { ne: 'सामानहरू दर्ता छन्', hi: 'सामान दर्ज हैं', en: 'items registered', mai: 'सामान दर्ज अछि', bho: 'सामान दर्ज बा' })}
          </p>
        </div>
        <button
          type="button"
          className="btn-add-product-main"
          onClick={handleOpenAddModal}
        >
          <Plus size={18} />
          <span>{t.addProduct}</span>
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="inventory-search-row">
        <div className="search-field-wrap">
          <Search size={18} />
          <input
            type="text"
            className="inv-search-input"
            placeholder={pick(language, { ne: 'सामान खोज्नुहोस्...', hi: 'सामान खोजें...', en: 'Search items...', mai: 'सामान ताकू...', bho: 'सामान खोजीं...' })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="inv-category-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>
              {pick(language, c.name)}
            </option>
          ))}
        </select>
      </div>

      {/* Inventory Products Table / List */}
      <div className="inventory-cards-grid">
        {filteredProducts.map(product => {
          const isOutOfStock = product.stock <= 0 || !product.isAvailable;
          const isLowStock = !isOutOfStock && product.stock <= (product.minStock || 5);

          return (
            <div
              key={product.id}
              className={`inv-product-card ${isOutOfStock ? 'out-of-stock' : ''} ${isLowStock ? 'low-stock' : ''}`}
            >
              <div className="inv-card-image-wrap">
                <img src={product.image} alt={product.nameNe} className="inv-img" />
                {isOutOfStock && (
                  <span className="inv-badge-out">❌ {t.outOfStock}</span>
                )}
                {isLowStock && (
                  <span className="inv-badge-low">⚠️ {t.lowStockWarning}</span>
                )}
              </div>

              <div className="inv-card-info">
                <div className="inv-name-row">
                  <h3 className="inv-name-ne">{product.nameNe}</h3>
                  <span className="inv-price-tag">
                    रु {product.price} / {product.unit}
                  </span>
                </div>
                <p className="inv-name-en">{product.nameEn}</p>

                {/* Stock Controls */}
                <div className="inv-stock-stepper-row">
                  <span className="stock-label">{pick(language, { ne: 'स्टक', hi: 'स्टॉक', en: 'Stock', mai: 'स्टक', bho: 'स्टॉक' })}:</span>
                  <div className="stock-buttons">
                    <button
                      type="button"
                      className="btn-stock-adjust minus"
                      onClick={() => updateProductStock(product.id, -1)}
                    >
                      -
                    </button>
                    <span className="stock-number-display">
                      {product.stock} {product.unit}
                    </span>
                    <button
                      type="button"
                      className="btn-stock-adjust plus"
                      onClick={() => updateProductStock(product.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="inv-min-alert-text">
                  {pick(language, { ne: 'न्यूनतम अलर्ट', hi: 'न्यूनतम अलर्ट', en: 'Min. alert', mai: 'न्यूनतम अलर्ट', bho: 'न्यूनतम अलर्ट' })}: {product.minStock || 5} {product.unit}
                </div>

                {/* Availability toggle — customers & the AI assistant respect this */}
                <div className="inv-availability-row">
                  <span className="avail-label">
                    {product.isAvailable
                      ? '✅ ' + pick(language, { ne: 'उपलब्ध', hi: 'उपलब्ध', en: 'Available', mai: 'उपलब्ध', bho: 'उपलब्ध' })
                      : '⛔ ' + pick(language, { ne: 'अनुपलब्ध', hi: 'अनुपलब्ध', en: 'Unavailable', mai: 'अनुपलब्ध', bho: 'अनुपलब्ध' })}
                  </span>
                  <button
                    type="button"
                    className={`avail-toggle ${product.isAvailable ? 'on' : 'off'}`}
                    onClick={() => toggleProductAvailability(product.id)}
                    aria-label="Toggle availability"
                    title={product.isAvailable
                      ? pick(language, { ne: 'अनुपलब्ध बनाउनुहोस्', hi: 'अनुपलब्ध करें', en: 'Mark unavailable', mai: 'अनुपलब्ध बनाबू', bho: 'अनुपलब्ध बनाईं' })
                      : pick(language, { ne: 'उपलब्ध बनाउनुहोस्', hi: 'उपलब्ध करें', en: 'Mark available', mai: 'उपलब्ध बनाबू', bho: 'उपलब्ध बनाईं' })}
                  >
                    <span className="avail-knob" />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="inv-action-buttons">
                  <button
                    type="button"
                    className="btn-inv-edit"
                    onClick={() => handleOpenEditModal(product)}
                  >
                    <Edit2 size={16} />
                    <span>{pick(language, { ne: 'सम्पादन', hi: 'संपादन', en: 'Edit', mai: 'संपादन', bho: 'एडिट' })}</span>
                  </button>
                  <button
                    type="button"
                    className="btn-inv-delete"
                    onClick={() => deleteProduct(product.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="product-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingProductId ? t.editProduct : t.addProduct}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="product-form-body">
              {/* Product Names */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">{t.productName} *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder={pick(language, { ne: 'सामानको नाम', hi: 'सामान का नाम', en: 'Product name', mai: 'सामानक नाम', bho: 'सामान के नाम' })}
                    value={nameNe}
                    onChange={(e) => setNameNe(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.productNameEn}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={pick(language, { ne: 'नाम (अंग्रेजीमा)', hi: 'नाम (अंग्रेज़ी में)', en: 'Name in English', mai: 'नाम (अंग्रेजीमे)', bho: 'नाम (अंग्रेजी में)' })}
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                  />
                </div>
              </div>

              {/* Category & Brand */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">{t.category}</label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>
                        {pick(language, c.name)}
                      </option>
                    ))}
                    <option value="__custom__">
                      ➕ {pick(language, { ne: 'अन्य / नयाँ कोटि', hi: 'अन्य / नई श्रेणी', en: 'Other / new category', mai: 'अन्य / नव श्रेणी', bho: 'अन्य / नया श्रेणी' })}
                    </option>
                  </select>
                  {category === '__custom__' && (
                    <input
                      type="text"
                      className="form-input"
                      style={{ marginTop: '6px' }}
                      placeholder={pick(language, { ne: 'कोटिको नाम लेख्नुहोस्', hi: 'श्रेणी का नाम लिखें', en: 'Type category name', mai: 'श्रेणीक नाम लिखू', bho: 'श्रेणी के नाम लिखीं' })}
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                    />
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">{pick(language, { ne: 'ब्रान्ड / कम्पनी (ऐच्छिक)', hi: 'ब्रांड / कंपनी (वैकल्पिक)', en: 'Brand / Company (optional)', mai: 'ब्रान्ड / कम्पनी (ऐच्छिक)', bho: 'ब्रांड / कंपनी (वैकल्पिक)' })}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={pick(language, { ne: 'ब्रान्ड नाम', hi: 'ब्रांड नाम', en: 'Brand name', mai: 'ब्रान्ड नाम', bho: 'ब्रांड नाम' })}
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>
              </div>

              {/* Price & Unit */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">{t.price} *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="form-input"
                    placeholder="80"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.unit}</label>
                  <select
                    className="form-input"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    <option value="kg">kg (किलो)</option>
                    <option value="g">g (ग्राम)</option>
                    <option value="litre">litre (लिटर)</option>
                    <option value="ml">ml (मि.लि.)</option>
                    <option value="packet">packet (प्याकेट)</option>
                    <option value="piece">piece (वटा / पिस)</option>
                    <option value="dozen">dozen (दर्जन)</option>
                    <option value="bottle">bottle (बोतल)</option>
                    <option value="box">box (बाकस / क्रेट)</option>
                  </select>
                </div>
              </div>

              {/* Stock & Min Alert Threshold */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">{t.stock} *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="form-input"
                    placeholder="25"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.minStock}</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="5"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                  />
                </div>
              </div>

              {/* Product Image Section — camera capture or gallery upload */}
              <div className="ai-image-generator-box">
                <div className="ai-image-header">
                  <label className="form-label">
                    <ImageIcon size={16} className="sparkle-gold" /> {pick(language, {
                      ne: 'सामानको फोटो', hi: 'सामान की फोटो', en: 'Product Photo', mai: 'सामानक फोटो', bho: 'सामान के फोटो'
                    })}
                  </label>
                </div>

                <div className="image-preview-row">
                  <img
                    src={image || PLACEHOLDER_IMG}
                    alt="Preview"
                    className="product-modal-img-preview"
                  />
                  <div className="image-url-input-wrap">
                    <div className="photo-source-btns">
                      <button type="button" className="btn-photo-src camera" onClick={() => cameraInputRef.current?.click()}>
                        <Camera size={15} /> <span>{pick(language, { ne: 'क्यामेरा', hi: 'कैमरा', en: 'Camera', mai: 'क्यामेरा', bho: 'क्यामेरा' })}</span>
                      </button>
                      <button type="button" className="btn-photo-src upload" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={15} /> <span>{pick(language, { ne: 'ग्यालरी', hi: 'गैलरी', en: 'Gallery', mai: 'ग्यालरी', bho: 'गैलरी' })}</span>
                      </button>
                    </div>

                    {/* Camera: capture="environment" opens the phone camera */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                    {/* Gallery: NO capture attribute → opens the photo gallery */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />

                    {String(image).startsWith('data:') && !String(image).startsWith('data:image/svg') ? (
                      <div className="photo-attached-chip">
                        <Check size={14} />
                        <span>{pick(language, { ne: 'फोटो संलग्न भयो', hi: 'फोटो जोड़ी गई', en: 'Photo attached', mai: 'फोटो संलग्न भेल', bho: 'फोटो लाग गइल' })}</span>
                        <button type="button" onClick={() => setImage('')} aria-label="remove photo"><X size={13} /></button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="form-input text-xs"
                        placeholder={pick(language, {
                          ne: 'वा फोटोको URL यहाँ हाल्नुहोस्...', hi: 'या फोटो का URL यहाँ डालें...', en: 'Or paste a photo URL...',
                          mai: 'वा फोटोक URL देब...', bho: 'भा फोटो के URL दीं...'
                        })}
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                      />
                    )}

                    {imageBusy && <small className="hint-text">{pick(language, { ne: 'फोटो प्रशोधन हुँदैछ...', hi: 'फोटो प्रोसेस हो रही है...', en: 'Processing photo...', mai: 'फोटो प्रोसेस...', bho: 'फोटो प्रोसेस...' })}</small>}
                    {cameraError && <small className="hint-text error">{cameraError}</small>}
                    {!cameraError && !imageBusy && (
                      <small className="hint-text">{pick(language, {
                        ne: 'क्यामेराले फोटो खिच्नुहोस् वा ग्यालरीबाट छान्नुहोस्।',
                        hi: 'कैमरे से फोटो खींचें या गैलरी से चुनें।',
                        en: 'Take a photo with the camera or pick one from the gallery.',
                        mai: 'क्यामेरासँ फोटो खींचू वा ग्यालरीसँ चुनू।',
                        bho: 'क्यामेरा से फोटो खींचीं भा गैलरी से चुनीं।'
                      })}</small>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Footer */}
              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="btn-save-product"
                >
                  <Check size={18} />
                  <span>{t.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
