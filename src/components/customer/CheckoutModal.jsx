import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useWallet } from '../../context/WalletContext';
import { calculateDeliveryFee, toDevanagariNumerals } from '../../utils/deliveryCalculator';
import { pick } from '../../utils/i18n';
import { getCurrentLocation } from '../../utils/geo';
import confetti from 'canvas-confetti';
import {
  X,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  CreditCard,
  Banknote,
  QrCode,
  Truck,
  Store,
  CheckCircle2,
  AlertCircle,
  Wallet,
  LocateFixed
} from 'lucide-react';

export default function CheckoutModal() {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    selectedShop,
    customerInfo,
    setCustomerInfo,
    placeOrder,
    showToast,
    language,
    t
  } = useApp();
  const { balance: walletBalance, pay: walletPay } = useWallet();

  const [orderType, setOrderType] = useState('delivery'); // 'delivery' | 'pickup'
  const [deliveryAddress, setDeliveryAddress] = useState(customerInfo.address || '');
  const [customerName, setCustomerName] = useState(customerInfo.name || '');
  const [customerPhone, setCustomerPhone] = useState(customerInfo.phone || '');
  const [customerNote, setCustomerNote] = useState('');
  
  // Location privacy state
  const [hasLocationPermission, setHasLocationPermission] = useState(customerInfo.hasLocationPermission || false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  // Payment method: 'cod' | 'esewa' | 'khalti' | 'bankTransfer'
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Simulated online payment gateway: 'idle' | 'processing' | 'success'
  const [paymentStage, setPaymentStage] = useState('idle');
  const [locBusy, setLocBusy] = useState(false);

  const handleUseMyLocation = async () => {
    setLocBusy(true);
    try {
      const loc = await getCurrentLocation();
      setHasLocationPermission(true);
      setCustomerInfo(prev => ({ ...prev, lat: loc.lat, lng: loc.lng, hasLocationPermission: true }));
    } catch (e) {
      showToast(pick(language, { ne: 'लोकेशन पाउन सकिएन', hi: 'लोकेशन नहीं मिला', en: 'Could not get location', mai: 'लोकेशन नै भेटल', bho: 'लोकेशन ना मिलल' }), 'error');
    } finally {
      setLocBusy(false);
    }
  };

  if (!isCheckoutOpen || !selectedShop) return null;

  const itemsSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryCharge = calculateDeliveryFee(selectedShop, selectedShop?.distanceKm || 1.2, orderType);
  const grandTotal = itemsSubtotal + deliveryCharge;

  const handleGrantLocation = () => {
    setHasLocationPermission(true);
    setShowLocationDialog(false);
    setCustomerInfo(prev => ({ ...prev, hasLocationPermission: true }));
  };

  const handleDenyLocation = () => {
    setHasLocationPermission(false);
    setShowLocationDialog(false);
  };

  const isWallet = paymentMethod === 'wallet';
  const isOnlinePayment = paymentMethod === 'esewa' || paymentMethod === 'khalti' || paymentMethod === 'bankTransfer';

  // Actually place the order and close the modal.
  const completeOrder = () => {
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (e) { /* ignore */ }

    placeOrder({
      orderType,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : pick(language, {
        ne: 'पसलबाट लिन आउने (Pickup)', hi: 'दुकान से लेने आएँ (Pickup)', en: 'Pickup from shop', mai: 'दोकानसँ लेबाक (Pickup)', bho: 'दोकान से लेबे के (Pickup)'
      }),
      itemsSubtotal,
      deliveryCharge,
      grandTotal,
      paymentMethod,
      customerNote,
      locationPermissionGranted: hasLocationPermission
    });

    setIsSubmitting(false);
    setPaymentStage('idle');
    setIsCheckoutOpen(false);
  };

  const handleSubmitOrder = () => {
    // If delivery is selected and location permission hasn't been asked yet, ask now
    if (orderType === 'delivery' && !hasLocationPermission && !showLocationDialog) {
      setShowLocationDialog(true);
      return;
    }

    // Pay from the in-app wallet (no third party) — money moves to the shop owner.
    if (isWallet) {
      if (walletBalance < grandTotal) {
        showToast(pick(language, {
          ne: 'वालेटमा पर्याप्त ब्यालेन्स छैन', hi: 'वॉलेट में पर्याप्त बैलेंस नहीं', en: 'Not enough wallet balance', mai: 'वालेटमे बैलेंस कम', bho: 'वालेट में बैलेंस कम'
        }), 'error');
        return;
      }
      setIsSubmitting(true);
      const r = walletPay(grandTotal, selectedShop?.ownerId, pick(language, { ne: 'अर्डर भुक्तानी', hi: 'ऑर्डर भुगतान', en: 'Order payment', mai: 'अर्डर भुगतान', bho: 'आर्डर भुगतान' }));
      if (!r.success) {
        setIsSubmitting(false);
        showToast(pick(language, { ne: 'भुक्तानी असफल', hi: 'भुगतान असफल', en: 'Payment failed', mai: 'भुगतान असफल', bho: 'भुगतान असफल' }), 'error');
        return;
      }
      setTimeout(completeOrder, 500);
      return;
    }

    setIsSubmitting(true);

    if (isOnlinePayment) {
      // Simulate the online payment gateway (eSewa / Khalti / bank QR).
      setPaymentStage('processing');
      setTimeout(() => {
        setPaymentStage('success');
        setTimeout(completeOrder, 1000);
      }, 1700);
    } else {
      setTimeout(completeOrder, 500);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsCheckoutOpen(false)}>
      <div className="checkout-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="checkout-header">
          <div className="title-area">
            <h2 className="modal-heading">{t.placeOrder}</h2>
            <p className="modal-subheading">{selectedShop.name}</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setIsCheckoutOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="checkout-body">
          {/* 1. Order Type Selection */}
          <div className="checkout-section">
            <h3 className="section-title">{t.orderType}</h3>
            <div className="order-type-tabs">
              <button
                type="button"
                className={`order-type-tab ${orderType === 'delivery' ? 'active' : ''}`}
                onClick={() => setOrderType('delivery')}
              >
                <Truck size={18} />
                <span>{t.homeDelivery}</span>
              </button>
              <button
                type="button"
                className={`order-type-tab ${orderType === 'pickup' ? 'active' : ''}`}
                onClick={() => setOrderType('pickup')}
              >
                <Store size={18} />
                <span>{t.shopPickup}</span>
              </button>
            </div>
          </div>

          {/* 2. Customer Contact & Delivery Info */}
          <div className="checkout-section">
            <h3 className="section-title">{pick(language, {
              ne: 'ग्राहकको विवरण', hi: 'संपर्क विवरण', en: 'Contact Details', mai: 'ग्राहकक विवरण', bho: 'ग्राहक के विवरण'
            })}</h3>
            
            <div className="input-group">
              <label className="input-label">
                <User size={16} /> {t.customerName}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={t.enterName}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                <Phone size={16} /> {t.customerPhone}
              </label>
              <input
                type="tel"
                className="form-input"
                placeholder={t.enterPhone}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            {orderType === 'delivery' && (
              <div className="input-group">
                <label className="input-label">
                  <MapPin size={16} /> {t.deliveryAddress}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t.enterAddress}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
                <button type="button" className="checkout-loc-btn" onClick={handleUseMyLocation} disabled={locBusy}>
                  <LocateFixed size={14} />
                  <span>{locBusy
                    ? pick(language, { ne: 'लोकेशन लिँदैछ...', hi: 'लोकेशन ले रहे हैं...', en: 'Getting location...', mai: 'लोकेशन लैत...', bho: 'लोकेशन लेत...' })
                    : hasLocationPermission && customerInfo.lat
                      ? pick(language, { ne: '📍 लोकेशन सेयर गरियो ✓', hi: '📍 लोकेशन शेयर किया ✓', en: '📍 Location shared ✓', mai: '📍 लोकेशन सेयर भेल ✓', bho: '📍 लोकेशन सेयर भइल ✓' })
                      : pick(language, { ne: '📍 मेरो लाइभ लोकेशन प्रयोग गर्नुहोस्', hi: '📍 मेरा लाइव लोकेशन इस्तेमाल करें', en: '📍 Use my live location', mai: '📍 हमर लाइव लोकेशन', bho: '📍 हमार लाइव लोकेशन' })}</span>
                </button>
              </div>
            )}

            <div className="input-group">
              <label className="input-label">{t.orderNote}</label>
              <input
                type="text"
                className="form-input"
                placeholder={pick(language, {
                  ne: 'जस्तै: घरको गेट रातो छ, फोन गर्नुहोस्...', hi: 'जैसे: घर का गेट लाल है, पहुँचने पर फोन करें...',
                  en: 'e.g. Red gate house, please call on arrival...',
                  mai: 'जेना: घरक गेट लाल अछि, फोन करू...',
                  bho: 'जइसे: घर के गेट लाल बा, फोन करीं...'
                })}
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
              />
            </div>
          </div>

          {/* 3. Location Permission Indicator */}
          {orderType === 'delivery' && (
            <div className="location-permission-box">
              <div className="loc-perm-info">
                <ShieldCheck size={22} className={hasLocationPermission ? 'icon-green' : 'icon-gray'} />
                <div>
                  <h4 className="loc-title">{pick(language, {
                    ne: 'स्थान गोपनीयता', hi: 'लोकेशन गोपनीयता', en: 'Location Privacy', mai: 'स्थान गोपनीयता', bho: 'लोकेशन गोपनीयता'
                  })}</h4>
                  <p className="loc-desc">
                    {hasLocationPermission
                      ? pick(language, {
                          ne: 'डेलिभरीका लागि पसललाई स्थान पठाउने अनुमति दिइएको छ।', hi: 'डिलीवरी के लिए दुकान को लोकेशन भेजने की अनुमति दी गई है।',
                          en: 'You have allowed sharing your location with the shop for delivery.',
                          mai: 'डेलिभरीक लेल दोकानके स्थान पठएबाक अनुमति देल गेल अछि।',
                          bho: 'डेलिभरी खातिर दोकान के लोकेशन भेजे के अनुमति दिहल गइल बा।'
                        })
                      : pick(language, {
                          ne: 'डेलिभरी सजिलो बनाउन आफ्नो स्थान पसललाई पठाउन सक्नुहुन्छ।', hi: 'डिलीवरी आसान बनाने के लिए आप अपना लोकेशन दुकान को भेज सकते हैं।',
                          en: 'You can share your location with the shop to make delivery easier.',
                          mai: 'डेलिभरी सहज बनएबाक लेल अपन स्थान दोकानके पठा सकैत छी।',
                          bho: 'डेलिभरी आसान बनावे खातिर आपन लोकेशन दोकान के भेज सकीलें।'
                        })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={`btn-loc-toggle ${hasLocationPermission ? 'granted' : ''}`}
                onClick={() => setHasLocationPermission(!hasLocationPermission)}
              >
                {hasLocationPermission
                  ? pick(language, { ne: 'अनुमति हटाउनुहोस्', hi: 'अनुमति हटाएँ', en: 'Revoke access', mai: 'अनुमति हटाउ', bho: 'अनुमति हटाईं' })
                  : pick(language, { ne: 'स्थान अनुमति दिनुहोस्', hi: 'लोकेशन अनुमति दें', en: 'Allow location', mai: 'स्थान अनुमति दिअ\'', bho: 'लोकेशन अनुमति दीं' })}
              </button>
            </div>
          )}

          {/* 4. Payment Method Picker */}
          <div className="checkout-section">
            <h3 className="section-title">{t.paymentMethod}</h3>
            <p className="payment-note">{t.payNote}</p>

            <div className="payment-methods-grid">
              {/* Mama Ji Wallet */}
              <label className={`payment-option-card ${paymentMethod === 'wallet' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="wallet"
                  checked={paymentMethod === 'wallet'}
                  onChange={() => setPaymentMethod('wallet')}
                />
                <div className="pay-icon-box wallet">
                  <Wallet size={24} />
                </div>
                <div className="pay-details">
                  <span className="pay-title">{pick(language, { ne: 'मामा जी वालेट', hi: 'मामा जी वॉलेट', en: 'Mama Ji Wallet', mai: 'मामा जी वालेट', bho: 'मामा जी वालेट' })}</span>
                  <span className="pay-desc">{pick(language, {
                    ne: `ब्यालेन्स: रु ${toDevanagariNumerals(walletBalance)}`, hi: `बैलेंस: रु ${toDevanagariNumerals(walletBalance)}`, en: `Balance: NPR ${walletBalance}`, mai: `बैलेंस: रु ${toDevanagariNumerals(walletBalance)}`, bho: `बैलेंस: रु ${toDevanagariNumerals(walletBalance)}`
                  })}</span>
                </div>
              </label>

              {/* Cash on Delivery */}
              <label className={`payment-option-card ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <div className="pay-icon-box cod">
                  <Banknote size={24} />
                </div>
                <div className="pay-details">
                  <span className="pay-title">Cash on Delivery</span>
                  <span className="pay-desc">{pick(language, {
                    ne: 'सामान पाएपछि नगद दिने', hi: 'सामान मिलने पर नगद दें', en: 'Pay cash when you receive', mai: 'सामान भेटलाक बाद नगद दिअ\'', bho: 'सामान मिलला के बाद नगद दीं'
                  })}</span>
                </div>
              </label>

              {/* eSewa */}
              {selectedShop.paymentSettings?.esewaEnabled && (
                <label className={`payment-option-card ${paymentMethod === 'esewa' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="esewa"
                    checked={paymentMethod === 'esewa'}
                    onChange={() => setPaymentMethod('esewa')}
                  />
                  <div className="pay-icon-box esewa">
                    <span className="nepal-pay-logo">e</span>
                  </div>
                  <div className="pay-details">
                    <span className="pay-title">eSewa Mobile Wallet</span>
                    <span className="pay-desc">
                      {pick(language, { ne: 'पसलेको eSewa ID:', hi: 'दुकान का eSewa ID:', en: "Shop's eSewa ID:", mai: 'दोकानक eSewa ID:', bho: 'दोकान के eSewa ID:' })} <strong>{selectedShop.paymentSettings.esewaId}</strong>
                    </span>
                  </div>
                </label>
              )}

              {/* Khalti */}
              {selectedShop.paymentSettings?.khaltiEnabled && (
                <label className={`payment-option-card ${paymentMethod === 'khalti' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="khalti"
                    checked={paymentMethod === 'khalti'}
                    onChange={() => setPaymentMethod('khalti')}
                  />
                  <div className="pay-icon-box khalti">
                    <span className="nepal-pay-logo">K</span>
                  </div>
                  <div className="pay-details">
                    <span className="pay-title">Khalti Digital Wallet</span>
                    <span className="pay-desc">
                      {pick(language, { ne: 'पसलेको Khalti ID:', hi: 'दुकान का Khalti ID:', en: "Shop's Khalti ID:", mai: 'दोकानक Khalti ID:', bho: 'दोकान के Khalti ID:' })} <strong>{selectedShop.paymentSettings.khaltiId}</strong>
                    </span>
                  </div>
                </label>
              )}

              {/* Bank Transfer / QR */}
              {selectedShop.paymentSettings?.bankTransferEnabled && (
                <label className={`payment-option-card ${paymentMethod === 'bankTransfer' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="bankTransfer"
                    checked={paymentMethod === 'bankTransfer'}
                    onChange={() => setPaymentMethod('bankTransfer')}
                  />
                  <div className="pay-icon-box bank">
                    <QrCode size={24} />
                  </div>
                  <div className="pay-details">
                    <span className="pay-title">Bank Transfer / QR Code</span>
                    <span className="pay-desc">{selectedShop.paymentSettings.bankName}</span>
                  </div>
                </label>
              )}
            </div>

            {/* If Bank QR selected, show QR preview */}
            {paymentMethod === 'bankTransfer' && selectedShop.paymentSettings && (
              <div className="bank-qr-preview-box">
                <div className="qr-img-wrapper">
                  <img
                    src={selectedShop.paymentSettings.qrImage}
                    alt="Shop QR"
                    className="shop-qr-code"
                  />
                </div>
                <div className="bank-account-info">
                  <p><strong>{t.bankName}:</strong> {selectedShop.paymentSettings.bankName}</p>
                  <p><strong>{t.accountName}:</strong> {selectedShop.paymentSettings.bankAccountHolder}</p>
                  <p><strong>{t.accountNumber}:</strong> {selectedShop.paymentSettings.bankAccountNumber}</p>
                </div>
              </div>
            )}
          </div>

          {/* 5. Order Total Bill Card */}
          <div className="checkout-bill-card">
            <div className="bill-line">
              <span>{t.subtotal} ({cart.length} {pick(language, { ne: 'सामान', hi: 'सामान', en: 'items', mai: 'सामान', bho: 'सामान' })}):</span>
              <strong>रु {toDevanagariNumerals(itemsSubtotal)}</strong>
            </div>
            <div className="bill-line">
              <span>{t.deliveryCharge}:</span>
              <strong>
                {orderType === 'pickup' 
                  ? t.freeDelivery 
                  : `रु ${toDevanagariNumerals(deliveryCharge)}`}
              </strong>
            </div>
            <div className="bill-line grand">
              <span>{t.grandTotal}:</span>
              <strong className="grand-price">
                रु {toDevanagariNumerals(grandTotal)}
              </strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="checkout-footer">
          <button
            type="button"
            className="btn-cancel-checkout"
            onClick={() => setIsCheckoutOpen(false)}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            className="btn-confirm-order"
            onClick={handleSubmitOrder}
            disabled={isSubmitting || cart.length === 0}
          >
            {isSubmitting ? t.loading : `${isOnlinePayment
              ? pick(language, { ne: 'अनलाइन भुक्तानी गर्नुहोस्', hi: 'ऑनलाइन भुगतान करें', en: 'Pay Online', mai: 'अनलाइन भुगतान करू', bho: 'अनलाइन भुगतान करीं' })
              : pick(language, { ne: 'अर्डर पक्का गर्नुहोस्', hi: 'ऑर्डर पक्का करें', en: 'Confirm Order', mai: 'अर्डर पक्का करू', bho: 'आर्डर पक्का करीं' })
            } (रु ${toDevanagariNumerals(grandTotal)})`}
          </button>
        </div>

        {/* Location Privacy Prompt Modal (Section 13) */}
        {showLocationDialog && (
          <div className="inner-modal-backdrop">
            <div className="inner-dialog-card">
              <div className="dialog-icon-header">
                <MapPin size={32} className="loc-dialog-icon" />
              </div>
              <h3 className="dialog-title">{t.locationPromptTitle}</h3>
              <p className="dialog-message">{t.locationPromptMsg}</p>
              
              <div className="dialog-actions">
                <button
                  type="button"
                  className="btn-allow-loc"
                  onClick={handleGrantLocation}
                >
                  <CheckCircle2 size={18} />
                  <span>{t.allowLocation}</span>
                </button>
                <button
                  type="button"
                  className="btn-deny-loc"
                  onClick={handleDenyLocation}
                >
                  <span>{t.denyLocation}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simulated Online Payment Gateway Overlay */}
        {paymentStage !== 'idle' && (
          <div className="inner-modal-backdrop">
            <div className={`payment-gateway-card ${paymentMethod}`}>
              {paymentStage === 'processing' ? (
                <>
                  <div className="pay-gateway-logo">
                    {paymentMethod === 'esewa' ? <span className="nepal-pay-logo big esewa">e</span>
                      : paymentMethod === 'khalti' ? <span className="nepal-pay-logo big khalti">K</span>
                      : <QrCode size={40} />}
                  </div>
                  <div className="pay-spinner" />
                  <h3 className="pay-gateway-title">
                    {pick(language, {
                      ne: 'भुक्तानी प्रक्रियामा छ...', hi: 'भुगतान प्रोसेस हो रहा है...', en: 'Processing payment...', mai: 'भुगतान प्रक्रियामे अछि...', bho: 'भुगतान प्रोसेस में बा...'
                    })}
                  </h3>
                  <p className="pay-gateway-amount">रु {toDevanagariNumerals(grandTotal)}</p>
                  <p className="pay-gateway-via">
                    {pick(language, { ne: 'माध्यम', hi: 'माध्यम', en: 'via', mai: 'माध्यम', bho: 'माध्यम' })}: {' '}
                    {paymentMethod === 'esewa' ? 'eSewa' : paymentMethod === 'khalti' ? 'Khalti' : 'Bank / QR'}
                  </p>
                </>
              ) : (
                <>
                  <div className="pay-success-check">
                    <CheckCircle2 size={54} />
                  </div>
                  <h3 className="pay-gateway-title success">
                    {pick(language, {
                      ne: 'भुक्तानी सफल भयो!', hi: 'भुगतान सफल हुआ!', en: 'Payment Successful!', mai: 'भुगतान सफल भेल!', bho: 'भुगतान सफल भइल!'
                    })}
                  </h3>
                  <p className="pay-gateway-amount">रु {toDevanagariNumerals(grandTotal)}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
