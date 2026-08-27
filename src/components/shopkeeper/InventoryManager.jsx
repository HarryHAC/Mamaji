import React, { useState, useRef, useEffect } from 'react';
import { useShopkeeper } from '../../context/ShopkeeperContext';
import { useApp } from '../../context/AppContext';
import { getShopCategories } from '../../constants/shopTypes';
import { toDevanagariNumerals } from '../../utils/deliveryCalculator';
import { pick } from '../../utils/i18n';
import { fileToDataURL, videoFrameToDataURL } from '../../utils/imageCapture';
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Sparkles,
  Search,
  Check,
  X,
  Package,
  Image as ImageIcon,
  RefreshCw,
  Camera,
  Upload
} from 'lucide-react';

export default function InventoryManager() {
  const {
    shopProducts,
    addProduct,
    editProduct,
    deleteProduct,
    updateProductStock,
    toggleProductAvailability,
    suggestImageForProduct,
    shopData
  } = useShopkeeper();
  const { t, language } = useApp();

  // Categories for this shop's type (grocery, sweets, hardware, …).
  const CATEGORIES = getShopCategories(shopData);
  const firstCategoryId = CATEGORIES.find(c => c.id !== 'all')?.id || 'general';

  // Product photo: live camera + file upload
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
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
    setCategory(p.category);
    setPrice(String(p.price));
    setUnit(p.unit);
    setStock(String(p.stock));
    setMinStock(String(p.minStock || 5));
    setImage(p.image);
    setBrand(p.brand || '');
    setIsModalOpen(true);
  };

  // AI Automatic Image Suggestion (Section 8)
  const handleGenerateAIImage = () => {
    const query = nameNe || nameEn;
    const suggested = suggestImageForProduct(query);
    setImage(suggested);
  };

  // ── Upload a photo from the device ──
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
        ne: 'फोटो पढ्न सकिएन।', en: 'Could not read that image.', mai: 'फोटो पढ़ि नै सकल।', bho: 'फोटो पढ़ल ना जा सकल।'
      }));
    } finally {
      setImageBusy(false);
    }
  };

  // ── Live camera capture ──
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(tr => tr.stop());
      streamRef.current = null;
    }
  };

  const openCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(pick(language, {
        ne: 'यो यन्त्रमा क्यामेरा उपलब्ध छैन।', en: 'Camera is not available on this device.',
        mai: 'ई यन्त्रमे क्यामेरा उपलब्ध नै।', bho: 'ई डिवाइस पर क्यामेरा नइखे।'
      }));
      return;
    }
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, audio: false
      });
      streamRef.current = stream;
      // The <video> mounts a render after setShowCamera(true); retry until it exists.
      const attach = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        } else {
          requestAnimationFrame(attach);
        }
      };
      attach();
    } catch (err) {
      setShowCamera(false);
      setCameraError(pick(language, {
        ne: 'क्यामेरा अनुमति दिनुहोस्, अनि फेरि प्रयास गर्नुहोस्।',
        en: 'Please allow camera access and try again.',
        mai: 'क्यामेरा अनुमति दिअ\' आ फेर प्रयास करू।',
        bho: 'क्यामेरा अनुमति दीं आ फेर कोसिस करीं।'
      }));
    }
  };

  const capturePhoto = () => {
    try {
      const dataUrl = videoFrameToDataURL(videoRef.current, 800, 0.82);
      setImage(dataUrl);
    } catch (err) {
      setCameraError(pick(language, {
        ne: 'फोटो खिच्न सकिएन, फेरि प्रयास गर्नुहोस्।', en: 'Could not capture, try again.',
        mai: 'फोटो खींचि नै सकल, फेर करू।', bho: 'फोटो खींच ना सकल, फेर करीं।'
      }));
      return;
    }
    closeCamera();
  };

  const closeCamera = () => {
    stopCamera();
    setShowCamera(false);
  };

  // Release the camera if the modal/component goes away
  useEffect(() => () => stopCamera(), []);
  useEffect(() => { if (!isModalOpen) closeCamera(); }, [isModalOpen]);

  const handleSubmitProduct = (e) => {
    e.preventDefault();
    if (!nameNe.trim() || !price) return;

    const finalImage = image || suggestImageForProduct(nameNe || nameEn);

    if (editingProductId) {
      editProduct(editingProductId, {
        nameNe,
        nameEn: nameEn || nameNe,
        category,
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
        category,
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
            कुल {shopProducts.length} सामानहरू दर्ता छन्
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
            placeholder="सामान खोज्नुहोस्..."
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
                  <span className="stock-label">स्टक (Stock):</span>
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
                  न्यूनतम अलर्ट: {product.minStock || 5} {product.unit}
                </div>

                {/* Availability toggle — customers & the AI assistant respect this */}
                <div className="inv-availability-row">
                  <span className="avail-label">
                    {product.isAvailable ? '✅ उपलब्ध (Available)' : '⛔ अनुपलब्ध (Unavailable)'}
                  </span>
                  <button
                    type="button"
                    className={`avail-toggle ${product.isAvailable ? 'on' : 'off'}`}
                    onClick={() => toggleProductAvailability(product.id)}
                    aria-label="Toggle availability"
                    title={product.isAvailable ? 'अनुपलब्ध बनाउनुहोस्' : 'उपलब्ध बनाउनुहोस्'}
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
                    <span>सम्पादन</span>
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
                    placeholder="जस्तै: आलु (रातो)"
                    value={nameNe}
                    onChange={(e) => {
                      setNameNe(e.target.value);
                      if (!image) {
                        setImage(suggestImageForProduct(e.target.value));
                      }
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.productNameEn}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Red Potato"
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
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">ब्रान्ड / कम्पनी (ऐच्छिक)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="जस्तै: Dhara, DDC, Local"
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

              {/* Product Image Section — camera, upload, or AI suggestion */}
              <div className="ai-image-generator-box">
                <div className="ai-image-header">
                  <label className="form-label">
                    <ImageIcon size={16} className="sparkle-gold" /> {pick(language, {
                      ne: 'सामानको फोटो', en: 'Product Photo', mai: 'सामानक फोटो', bho: 'सामान के फोटो'
                    })}
                  </label>
                </div>

                <div className="image-preview-row">
                  <img
                    src={image || suggestImageForProduct(nameNe || nameEn)}
                    alt="Preview"
                    className="product-modal-img-preview"
                  />
                  <div className="image-url-input-wrap">
                    <div className="photo-source-btns">
                      <button type="button" className="btn-photo-src camera" onClick={openCamera}>
                        <Camera size={15} /> <span>{pick(language, { ne: 'क्यामेरा', en: 'Camera', mai: 'क्यामेरा', bho: 'क्यामेरा' })}</span>
                      </button>
                      <button type="button" className="btn-photo-src upload" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={15} /> <span>{pick(language, { ne: 'अपलोड', en: 'Upload', mai: 'अपलोड', bho: 'अपलोड' })}</span>
                      </button>
                      <button type="button" className="btn-photo-src ai" onClick={handleGenerateAIImage}>
                        <Sparkles size={15} /> <span>{pick(language, { ne: 'एआई', en: 'AI', mai: 'एआई', bho: 'एआई' })}</span>
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />

                    {String(image).startsWith('data:') ? (
                      <div className="photo-attached-chip">
                        <Check size={14} />
                        <span>{pick(language, { ne: 'फोटो संलग्न भयो', en: 'Photo attached', mai: 'फोटो संलग्न भेल', bho: 'फोटो लाग गइल' })}</span>
                        <button type="button" onClick={() => setImage('')} aria-label="remove photo"><X size={13} /></button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="form-input text-xs"
                        placeholder={pick(language, {
                          ne: 'वा फोटोको URL यहाँ हाल्नुहोस्...', en: 'Or paste a photo URL...',
                          mai: 'वा फोटोक URL देब...', bho: 'भा फोटो के URL दीं...'
                        })}
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                      />
                    )}

                    {imageBusy && <small className="hint-text">{pick(language, { ne: 'फोटो प्रशोधन हुँदैछ...', en: 'Processing photo...', mai: 'फोटो प्रोसेस...', bho: 'फोटो प्रोसेस...' })}</small>}
                    {cameraError && <small className="hint-text error">{cameraError}</small>}
                    {!cameraError && !imageBusy && (
                      <small className="hint-text">{pick(language, {
                        ne: 'क्यामेराले खिच्नुहोस्, ग्यालरीबाट अपलोड गर्नुहोस्, वा एआईले फोटो छान्न दिनुहोस्।',
                        en: 'Snap with the camera, upload from gallery, or let AI pick a photo.',
                        mai: 'क्यामेरासँ खींचू, ग्यालरीसँ अपलोड करू, वा एआईके फोटो चुनय दिअ\'।',
                        bho: 'क्यामेरा से खींचीं, गैलरी से अपलोड करीं, भा एआई के फोटो चुने दीं।'
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

      {/* Live Camera Capture Overlay */}
      {showCamera && (
        <div className="camera-modal-backdrop" onClick={closeCamera}>
          <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
            <div className="camera-video-wrap">
              <video ref={videoRef} className="camera-video" playsInline muted autoPlay />
            </div>
            <div className="camera-controls">
              <button type="button" className="btn-cam-cancel" onClick={closeCamera}>
                <X size={18} />
                <span>{pick(language, { ne: 'रद्द', en: 'Cancel', mai: 'रद्द', bho: 'रद्द' })}</span>
              </button>
              <button type="button" className="btn-cam-capture" onClick={capturePhoto} aria-label="capture">
                <Camera size={26} />
              </button>
              <span className="cam-hint">{pick(language, { ne: 'फोटो खिच्नुहोस्', en: 'Take photo', mai: 'फोटो खींचू', bho: 'फोटो खींचीं' })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
