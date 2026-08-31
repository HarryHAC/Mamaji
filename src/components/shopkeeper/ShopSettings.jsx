import React, { useState } from 'react';
import { useShopkeeper } from '../../context/ShopkeeperContext';
import { useApp } from '../../context/AppContext';
import { pick } from '../../utils/i18n';
import { SHOP_TYPE_LIST } from '../../constants/shopTypes';
import {
  Settings,
  Clock,
  Truck,
  CreditCard,
  Building,
  QrCode,
  Check,
  Plus,
  Trash2,
  Save,
  Phone,
  User,
  MapPin
} from 'lucide-react';

export default function ShopSettings() {
  const { shopData, updateShopSettings } = useShopkeeper();
  const { t, language } = useApp();

  // Shop basic info
  const [name, setName] = useState(shopData.name);
  const [ownerName, setOwnerName] = useState(shopData.ownerName);
  const [phone, setPhone] = useState(shopData.phone);
  const [address, setAddress] = useState(shopData.address);

  // Shop type (drives the product categories) — changeable after registration.
  const knownType = SHOP_TYPE_LIST.some(tp => tp.id === shopData.shopType);
  const [shopType, setShopType] = useState(knownType ? shopData.shopType : (shopData.shopType ? 'other' : 'general'));
  const [customType, setCustomType] = useState(shopData.shopTypeLabel || '');

  // Hours
  const [openingTime, setOpeningTime] = useState(shopData.openingTime || '06:00');
  const [closingTime, setClosingTime] = useState(shopData.closingTime || '21:00');
  const [deliveryAvailable, setDeliveryAvailable] = useState(shopData.deliveryAvailable ?? true);

  // Delivery Pricing
  const [deliveryModel, setDeliveryModel] = useState(shopData.deliveryModel || 'basePlusKm');
  const [baseDeliveryCharge, setBaseDeliveryCharge] = useState(String(shopData.baseDeliveryCharge || 25));
  const [perKmCharge, setPerKmCharge] = useState(String(shopData.perKmCharge || 15));
  const [maxDeliveryDistanceKm, setMaxDeliveryDistanceKm] = useState(String(shopData.maxDeliveryDistanceKm || 6));
  const [minOrderAmount, setMinOrderAmount] = useState(String(shopData.minOrderAmount || 100));

  // Payment Receiving Accounts (Section 19)
  const [esewaEnabled, setEsewaEnabled] = useState(shopData.paymentSettings?.esewaEnabled ?? true);
  const [esewaId, setEsewaId] = useState(shopData.paymentSettings?.esewaId || '9841234567');
  const [khaltiEnabled, setKhaltiEnabled] = useState(shopData.paymentSettings?.khaltiEnabled ?? true);
  const [khaltiId, setKhaltiId] = useState(shopData.paymentSettings?.khaltiId || '9841234567');
  const [bankTransferEnabled, setBankTransferEnabled] = useState(shopData.paymentSettings?.bankTransferEnabled ?? true);
  const [bankName, setBankName] = useState(shopData.paymentSettings?.bankName || 'Nabil Bank Ltd.');
  const [bankAccountHolder, setBankAccountHolder] = useState(shopData.paymentSettings?.bankAccountHolder || 'Ram Bahadur Shrestha');
  const [bankAccountNumber, setBankAccountNumber] = useState(shopData.paymentSettings?.bankAccountNumber || '01201017500123');

  // Delivery personnel
  const [deliveryPersons, setDeliveryPersons] = useState(shopData.deliveryPersons || ['पसले आफैं', 'रमेश (Ramesh)']);
  const [newPersonName, setNewPersonName] = useState('');

  const handleAddDeliveryPerson = () => {
    if (!newPersonName.trim()) return;
    setDeliveryPersons([...deliveryPersons, newPersonName.trim()]);
    setNewPersonName('');
  };

  const handleRemoveDeliveryPerson = (idx) => {
    setDeliveryPersons(deliveryPersons.filter((_, i) => i !== idx));
  };

  const handleSaveAll = (e) => {
    e.preventDefault();

    updateShopSettings({
      name,
      ownerName,
      phone,
      address,
      shopType: shopType === 'other' ? (customType.trim() || 'other') : shopType,
      shopTypeLabel: shopType === 'other' ? customType.trim() : '',
      openingTime,
      closingTime,
      deliveryAvailable,
      deliveryModel,
      baseDeliveryCharge: Number(baseDeliveryCharge),
      perKmCharge: Number(perKmCharge),
      maxDeliveryDistanceKm: Number(maxDeliveryDistanceKm),
      minOrderAmount: Number(minOrderAmount),
      deliveryPersons,
      paymentSettings: {
        ...shopData.paymentSettings,
        esewaEnabled,
        esewaId,
        khaltiEnabled,
        khaltiId,
        bankTransferEnabled,
        bankName,
        bankAccountHolder,
        bankAccountNumber,
        qrImage: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=epay:${encodeURIComponent(bankAccountNumber)}@${encodeURIComponent(bankName)}`
      }
    });
  };

  return (
    <div className="shop-settings-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Settings size={20} className="section-icon" /> {t.shopSettingsTitle}
          </h2>
          <p className="section-subtitle">
            {pick(language, { ne: 'पसल, डेलिभरी र भुक्तानी प्राप्त गर्ने खाताहरूको व्यवस्थापन', hi: 'दुकान, डिलीवरी और भुगतान प्राप्त करने वाले खातों का प्रबंधन', en: 'Manage your shop, delivery and payment-receiving accounts', mai: 'दोकान, डेलिभरी आ भुगतान प्राप्तिक खाताक प्रबंधन', bho: 'दोकान, डेलिभरी आ भुगतान पावे वाला खाता के प्रबंधन' })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="settings-form-layout">
        {/* 1. Basic Info */}
        <div className="settings-card">
          <h3 className="card-heading">
            <Building size={18} /> {pick(language, { ne: 'पसलको सामान्य विवरण', hi: 'दुकान की सामान्य जानकारी', en: 'Shop basic details', mai: 'दोकानक सामान्य विवरण', bho: 'दोकान के सामान्य जानकारी' })}
          </h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">{t.shopName}</label>
              <input
                type="text"
                required
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.ownerName}</label>
              <input
                type="text"
                required
                className="form-input"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.shopPhone}</label>
              <input
                type="tel"
                required
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.shopAddressLabel}</label>
              <input
                type="text"
                required
                className="form-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Shop type — changing this updates the product categories */}
          <div className="settings-shoptype-block">
            <label className="form-label">
              {pick(language, { ne: 'पसलको प्रकार', hi: 'दुकान का प्रकार', en: 'Shop type', mai: 'दोकानक प्रकार', bho: 'दोकान के प्रकार' })}
            </label>
            <p className="hint-text">
              {pick(language, {
                ne: 'यसले सामानका कोटिहरू (जस्तै तरकारी, औजार, कपडा) निर्धारण गर्छ।',
                hi: 'यह उत्पाद श्रेणियाँ (जैसे सब्ज़ी, औज़ार, कपड़े) तय करता है।',
                en: 'This decides the product categories (e.g. vegetables, tools, clothing).',
                mai: 'ई सामानक श्रेणी (जेना तरकारी, औजार, कपड़ा) तय करैत अछि।',
                bho: 'ई सामान के श्रेणी (जइसे तरकारी, औजार, कपड़ा) तय करेला।'
              })}
            </p>
            <div className="auth-shoptype-grid">
              {SHOP_TYPE_LIST.map(tp => (
                <button
                  key={tp.id}
                  type="button"
                  className={`auth-shoptype-btn ${shopType === tp.id ? 'selected' : ''}`}
                  onClick={() => setShopType(tp.id)}
                >
                  <span className="st-icon">{tp.icon}</span>
                  <span className="st-name">{pick(language, tp.name)}</span>
                </button>
              ))}
              <button
                type="button"
                className={`auth-shoptype-btn ${shopType === 'other' ? 'selected' : ''}`}
                onClick={() => setShopType('other')}
              >
                <span className="st-icon">➕</span>
                <span className="st-name">{pick(language, { ne: 'अन्य', hi: 'अन्य', en: 'Other', mai: 'अन्य', bho: 'अन्य' })}</span>
              </button>
            </div>
            {shopType === 'other' && (
              <input
                type="text"
                className="form-input"
                placeholder={pick(language, { ne: 'पसलको प्रकार लेख्नुहोस्', hi: 'दुकान का प्रकार लिखें', en: 'Type your shop type', mai: 'दोकानक प्रकार लिखू', bho: 'दोकान के प्रकार लिखीं' })}
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                style={{ marginTop: '8px' }}
              />
            )}
          </div>
        </div>

        {/* 2. Opening Hours & Delivery Availability */}
        <div className="settings-card">
          <h3 className="card-heading">
            <Clock size={18} /> {pick(language, { ne: 'पसलको समय र डेलिभरी सेवा', hi: 'दुकान का समय और डिलीवरी सेवा', en: 'Shop hours & delivery service', mai: 'दोकानक समय आ डेलिभरी सेवा', bho: 'दोकान के समय आ डेलिभरी सेवा' })}
          </h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">{t.openingTime}</label>
              <input
                type="time"
                className="form-input"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.closingTime}</label>
              <input
                type="time"
                className="form-input"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
              />
            </div>
          </div>

          <div className="toggle-setting-row">
            <div>
              <h4 className="toggle-title">{pick(language, { ne: 'डेलिभरी सेवा खुल्ला राख्नुहोस्', hi: 'डिलीवरी सेवा चालू रखें', en: 'Keep delivery service on', mai: 'डेलिभरी सेवा चालू राखू', bho: 'डेलिभरी सेवा चालू राखीं' })}</h4>
              <p className="toggle-sub">
                {pick(language, { ne: 'यो बन्द गरेमा ग्राहकले केवल पसलबाट लिन (Pickup) मात्र पाउनेछन्।', hi: 'इसे बंद करने पर ग्राहक केवल दुकान से ले जा सकेंगे (Pickup)।', en: 'If turned off, customers can only pick up from the shop.', mai: 'ई बन्द केला पर ग्राहक खाली दोकानसँ लऽ सकताह (Pickup)।', bho: 'ई बंद कइला पर ग्राहक खाली दोकान से ले सकिहें (Pickup)।' })}
              </p>
            </div>
            <input
              type="checkbox"
              className="toggle-checkbox"
              checked={deliveryAvailable}
              onChange={(e) => setDeliveryAvailable(e.target.checked)}
            />
          </div>
        </div>

        {/* 3. Delivery Pricing Model (Section 12) */}
        <div className="settings-card">
          <h3 className="card-heading">
            <Truck size={18} /> {t.deliveryPricingModel}
          </h3>

          <div className="delivery-model-radios">
            <label className={`model-radio-card ${deliveryModel === 'basePlusKm' ? 'active' : ''}`}>
              <input
                type="radio"
                name="delModel"
                value="basePlusKm"
                checked={deliveryModel === 'basePlusKm'}
                onChange={() => setDeliveryModel('basePlusKm')}
              />
              <div>
                <strong>{t.basePlusKm} (Option A)</strong>
                <p>जस्तै: आधार रु २५ + प्रति कि.मि. रु १५</p>
              </div>
            </label>

            <label className={`model-radio-card ${deliveryModel === 'distanceSlabs' ? 'active' : ''}`}>
              <input
                type="radio"
                name="delModel"
                value="distanceSlabs"
                checked={deliveryModel === 'distanceSlabs'}
                onChange={() => setDeliveryModel('distanceSlabs')}
              />
              <div>
                <strong>{t.distanceSlabs} (Option B)</strong>
                <p>०-१ कि.मि. → रु २०, १-३ कि.मि. → रु ४०, ३-६ कि.मि. → रु ७०</p>
              </div>
            </label>
          </div>

          {deliveryModel === 'basePlusKm' && (
            <div className="form-grid-2 mt-3">
              <div className="form-group">
                <label className="form-label">{t.baseCharge}</label>
                <input
                  type="number"
                  className="form-input"
                  value={baseDeliveryCharge}
                  onChange={(e) => setBaseDeliveryCharge(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.perKmCharge}</label>
                <input
                  type="number"
                  className="form-input"
                  value={perKmCharge}
                  onChange={(e) => setPerKmCharge(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-grid-2 mt-3">
            <div className="form-group">
              <label className="form-label">{t.maxDeliveryRadius}</label>
              <input
                type="number"
                className="form-input"
                value={maxDeliveryDistanceKm}
                onChange={(e) => setMaxDeliveryDistanceKm(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.minOrder} (रु)</label>
              <input
                type="number"
                className="form-input"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 4. Delivery Persons List (Section 18) */}
        <div className="settings-card">
          <h3 className="card-heading">
            <User size={18} /> {pick(language, { ne: 'डेलिभरी गर्ने व्यक्तिहरू', hi: 'डिलीवरी करने वाले लोग', en: 'Delivery people', mai: 'डेलिभरी करय बला लोक', bho: 'डेलिभरी करे वाला लोग' })}
          </h3>
          <div className="persons-list-tags">
            {deliveryPersons.map((person, idx) => (
              <div key={idx} className="person-pill">
                <span>{person}</span>
                {deliveryPersons.length > 1 && (
                  <button
                    type="button"
                    className="btn-del-person"
                    onClick={() => handleRemoveDeliveryPerson(idx)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="add-person-input-row">
            <input
              type="text"
              className="form-input"
              placeholder={pick(language, { ne: 'डेलिभरी व्यक्तिको नाम (जस्तै: सन्तोष - ९८xxxx)', hi: 'डिलीवरी व्यक्ति का नाम (जैसे: संतोष - 98xxxx)', en: 'Delivery person name (e.g. Santosh - 98xxxx)', mai: 'डेलिभरी व्यक्तिक नाम (जेना: संतोष - ९८xxxx)', bho: 'डेलिभरी वाला के नाम (जइसे: संतोष - ९८xxxx)' })}
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
            />
            <button
              type="button"
              className="btn-add-person"
              onClick={handleAddDeliveryPerson}
            >
              <Plus size={16} /> {pick(language, { ne: 'थप्नुहोस्', hi: 'जोड़ें', en: 'Add', mai: 'जोड़ू', bho: 'जोड़ीं' })}
            </button>
          </div>
        </div>

        {/* 5. Shopkeeper Payment Receiving Accounts (Section 19) */}
        <div className="settings-card">
          <h3 className="card-heading">
            <CreditCard size={18} /> {t.paymentSettings}
          </h3>
          <p className="hint-text">
            {pick(language, { ne: 'प्रत्येक पसलेको आफ्नै छुट्टाछुट्टै भुक्तानी खाता हुनेछ। ग्राहकले यहाँ तोकिएका खातामा मात्र पैसा पठाउनेछन्।', hi: 'हर दुकानदार का अपना अलग भुगतान खाता होगा। ग्राहक यहाँ तय किए गए खाते में ही पैसे भेजेंगे।', en: 'Each shop owner has their own separate payment accounts. Customers send money only to the accounts set here.', mai: 'प्रत्येक दोकानदारक अपन अलग भुगतान खाता रहत। ग्राहक एतय तय कएल खातामे मात्र पैसा पठौताह।', bho: 'हर दोकानदार के आपन अलग भुगतान खाता रही। ग्राहक इहाँ तय कइल खाता में ही पैसा भेजिहें।' })}
          </p>

          <div className="payment-account-config-grid">
            {/* eSewa */}
            <div className="pay-config-row">
              <label className="pay-toggle-lbl">
                <input
                  type="checkbox"
                  checked={esewaEnabled}
                  onChange={(e) => setEsewaEnabled(e.target.checked)}
                />
                <strong>{pick(language, { ne: 'ई-सेवा (eSewa ID)', hi: 'ई-सेवा (eSewa ID)', en: 'eSewa (eSewa ID)', mai: 'ई-सेवा (eSewa ID)', bho: 'ई-सेवा (eSewa ID)' })}</strong>
              </label>
              {esewaEnabled && (
                <input
                  type="text"
                  className="form-input"
                  placeholder={pick(language, { ne: 'ई-सेवा आइडी वा फोन', hi: 'ई-सेवा आईडी या फोन', en: 'eSewa ID or phone', mai: 'ई-सेवा आईडी वा फोन', bho: 'ई-सेवा आईडी भा फोन' })}
                  value={esewaId}
                  onChange={(e) => setEsewaId(e.target.value)}
                />
              )}
            </div>

            {/* Khalti */}
            <div className="pay-config-row">
              <label className="pay-toggle-lbl">
                <input
                  type="checkbox"
                  checked={khaltiEnabled}
                  onChange={(e) => setKhaltiEnabled(e.target.checked)}
                />
                <strong>{pick(language, { ne: 'खल्ती (Khalti ID)', hi: 'खल्ती (Khalti ID)', en: 'Khalti (Khalti ID)', mai: 'खल्ती (Khalti ID)', bho: 'खल्ती (Khalti ID)' })}</strong>
              </label>
              {khaltiEnabled && (
                <input
                  type="text"
                  className="form-input"
                  placeholder={pick(language, { ne: 'खल्ती आइडी वा फोन', hi: 'खल्ती आईडी या फोन', en: 'Khalti ID or phone', mai: 'खल्ती आईडी वा फोन', bho: 'खल्ती आईडी भा फोन' })}
                  value={khaltiId}
                  onChange={(e) => setKhaltiId(e.target.value)}
                />
              )}
            </div>

            {/* Bank Transfer & QR */}
            <div className="pay-config-row">
              <label className="pay-toggle-lbl">
                <input
                  type="checkbox"
                  checked={bankTransferEnabled}
                  onChange={(e) => setBankTransferEnabled(e.target.checked)}
                />
                <strong>{pick(language, { ne: 'बैंक खाता तथा क्युआर (Bank Transfer)', hi: 'बैंक खाता व QR (Bank Transfer)', en: 'Bank account & QR (Bank Transfer)', mai: 'बैंक खाता आ QR (Bank Transfer)', bho: 'बैंक खाता आ QR (Bank Transfer)' })}</strong>
              </label>

              {bankTransferEnabled && (
                <div className="bank-inputs-subgrid">
                  <input
                    type="text"
                    className="form-input"
                    placeholder={pick(language, { ne: 'बैंकको नाम (जस्तै: Nabil Bank)', hi: 'बैंक का नाम (जैसे: Nabil Bank)', en: 'Bank name (e.g. Nabil Bank)', mai: 'बैंकक नाम (जेना: Nabil Bank)', bho: 'बैंक के नाम (जइसे: Nabil Bank)' })}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder={pick(language, { ne: 'खातावालाको नाम', hi: 'खाताधारक का नाम', en: 'Account holder name', mai: 'खाताधारकक नाम', bho: 'खाताधारक के नाम' })}
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder={pick(language, { ne: 'खाता नम्बर', hi: 'खाता नंबर', en: 'Account number', mai: 'खाता नंबर', bho: 'खाता नंबर' })}
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="settings-submit-footer">
          <button type="submit" className="btn-save-all-settings">
            <Save size={18} />
            <span>{pick(language, { ne: 'सबै सेटिङ सुरक्षित गर्नुहोस्', hi: 'सभी सेटिंग सहेजें', en: 'Save all settings', mai: 'सब सेटिंग सुरक्षित करू', bho: 'सब सेटिंग सेव करीं' })}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
