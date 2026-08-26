import React, { useState } from 'react';
import { useShopkeeper } from '../../context/ShopkeeperContext';
import { useApp } from '../../context/AppContext';
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
  const { t } = useApp();

  // Shop basic info
  const [name, setName] = useState(shopData.name);
  const [ownerName, setOwnerName] = useState(shopData.ownerName);
  const [phone, setPhone] = useState(shopData.phone);
  const [address, setAddress] = useState(shopData.address);

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
            पसल, डेलिभरी र भुक्तानी प्राप्त गर्ने खाताहरूको व्यवस्थापन
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="settings-form-layout">
        {/* 1. Basic Info */}
        <div className="settings-card">
          <h3 className="card-heading">
            <Building size={18} /> पसलको सामान्य विवरण
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
        </div>

        {/* 2. Opening Hours & Delivery Availability */}
        <div className="settings-card">
          <h3 className="card-heading">
            <Clock size={18} /> पसलको समय र डेलिभरी सेवा
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
              <h4 className="toggle-title">डेलिभरी सेवा खुल्ला राख्नुहोस्</h4>
              <p className="toggle-sub">
                यो बन्द गरेमा ग्राहकले केवल पसलबाट लिन (Pickup) मात्र पाउनेछन्।
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
            <User size={18} /> डेलिभरी गर्ने व्यक्तिहरू
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
              placeholder="डेलिभरी व्यक्तिको नाम (जस्तै: सन्तोष - ९८xxxx)"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
            />
            <button
              type="button"
              className="btn-add-person"
              onClick={handleAddDeliveryPerson}
            >
              <Plus size={16} /> थप्नुहोस्
            </button>
          </div>
        </div>

        {/* 5. Shopkeeper Payment Receiving Accounts (Section 19) */}
        <div className="settings-card">
          <h3 className="card-heading">
            <CreditCard size={18} /> {t.paymentSettings}
          </h3>
          <p className="hint-text">
            प्रत्येक पसलेको आफ्नै छुट्टाछुट्टै भुक्तानी खाता हुनेछ। ग्राहकले यहाँ तोकिएका खातामा मात्र पैसा पठाउनेछन्।
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
                <strong>ई-सेवा (eSewa ID)</strong>
              </label>
              {esewaEnabled && (
                <input
                  type="text"
                  className="form-input"
                  placeholder="ई-सेवा आइडी वा फोन"
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
                <strong>खल्ती (Khalti ID)</strong>
              </label>
              {khaltiEnabled && (
                <input
                  type="text"
                  className="form-input"
                  placeholder="खल्ती आइडी वा फोन"
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
                <strong>बैंक खाता तथा क्युआर (Bank Transfer)</strong>
              </label>

              {bankTransferEnabled && (
                <div className="bank-inputs-subgrid">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="बैंकको नाम (जस्तै: Nabil Bank)"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="खातावालाको नाम"
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="खाता नम्बर"
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
            <span>सबै सेटिङ सुरक्षित गर्नुहोस्</span>
          </button>
        </div>
      </form>
    </div>
  );
}
