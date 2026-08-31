import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { parseVoiceOrder } from '../utils/aiSpeechParser';
import { toDevanagariNumerals } from '../utils/deliveryCalculator';
import { soundEffects } from '../utils/audioAlerts';
import { INITIAL_PRODUCTS } from '../constants/sampleData';
import { AGENT } from '../constants/agentPhrases';
import { pick, speechLocale } from '../utils/i18n';

// Pick the clearest available voice for a speech locale.
function bestVoice(loc) {
  try {
    const voices = window.speechSynthesis.getVoices() || [];
    const base = loc.split('-')[0];
    return voices.find(v => v.lang === loc && /google|natural|neural/i.test(v.name))
      || voices.find(v => v.lang === loc)
      || voices.find(v => v.lang && v.lang.replace('_', '-').startsWith(base))
      || (base !== 'en' ? voices.find(v => v.lang && v.lang.startsWith('hi')) : null)
      || null;
  } catch (e) { return null; }
}

const AIAgentContext = createContext();

/*
 * Fully hands-free AI Agent.
 *
 * Design goals (no button pressing required):
 *   • The mic stays ON continuously while the assistant is active.
 *   • The mic is paused ONLY while the assistant itself is speaking (TTS),
 *     so it never transcribes its own voice, then auto-resumes the instant
 *     speech finishes (utterance `onend`) — no fixed guess-timers.
 *   • Speech is acted on as soon as a FINAL result arrives, so saying
 *     "हो / yes" immediately places the order with zero clicks.
 *
 * State machine:
 *   IDLE → GREETING → (LISTENING) → PROCESSING → CONFIRMING → PLACING_ORDER → ORDER_DONE
 */

const INTENTS = {
  ORDER: 'order',
  TRACK_ORDER: 'track_order',
  SHOW_CART: 'show_cart',
  CONFIRM_YES: 'confirm_yes',
  CONFIRM_NO: 'confirm_no',
  CANCEL: 'cancel',
  HELP: 'help',
  UNKNOWN: 'unknown',
};

// Keywords for intent detection across all 4 languages
const INTENT_KEYWORDS = {
  [INTENTS.CONFIRM_YES]: [
    'yes', 'हो', 'हुन्छ', 'ठीक', 'ok', 'okay', 'हँ', 'ठीक छ', 'गर्नुहोस्', 'अर्डर गर्नुहोस्',
    'confirm', 'place', 'हँ करू', 'ठीक बा', 'हँ अछि', 'राखू', 'करू', 'करीं', 'yep', 'yeah',
    'sure', 'गर', 'गरिदेऊ', 'गरिदिनुस', 'पक्का', 'भयो', 'हजुर'
  ],
  [INTENTS.CONFIRM_NO]: [
    'no', 'होइन', 'नाहीं', 'रद्द', 'cancel', 'नहीं', 'नहि', 'छोड', 'नको', 'ना', 'back', 'फिर्ता', 'nope'
  ],
  [INTENTS.CANCEL]: [
    'cancel', 'stop', 'रोक', 'बन्द', 'cancel order', 'रद्द गर्नुहोस्', 'रोकीं', 'बंद करीं'
  ],
  [INTENTS.TRACK_ORDER]: [
    'track', 'order status', 'ट्र्याक', 'अर्डर कहाँ', 'कहाँ पुग्यो', 'order dekhau', 'order कता'
  ],
  [INTENTS.SHOW_CART]: [
    'cart', 'कार्ट', 'झोला', 'bag', 'basket', 'झोला देखाउ', 'cart open'
  ],
  [INTENTS.HELP]: [
    'help', 'सहायता', 'मद्दत', 'what can you do', 'के गर्न सक्नुहुन्छ', 'कसरी'
  ],
};

function detectIntent(transcript) {
  if (!transcript) return INTENTS.UNKNOWN;
  const t = transcript.toLowerCase().trim();

  // Check confirmation first (typically short replies)
  for (const kw of INTENT_KEYWORDS[INTENTS.CONFIRM_YES]) {
    if (t === kw || t.startsWith(kw + ' ') || t.endsWith(' ' + kw) || t.includes(' ' + kw + ' ')) return INTENTS.CONFIRM_YES;
  }
  if (['हो', 'हुन्छ', 'yes', 'ok', 'हँ', 'ठीक', 'हजुर', 'भयो'].includes(t)) return INTENTS.CONFIRM_YES;

  for (const kw of INTENT_KEYWORDS[INTENTS.CONFIRM_NO]) {
    if (t === kw || t.includes(kw)) return INTENTS.CONFIRM_NO;
  }
  for (const kw of INTENT_KEYWORDS[INTENTS.CANCEL]) {
    if (t.includes(kw)) return INTENTS.CANCEL;
  }
  for (const kw of INTENT_KEYWORDS[INTENTS.TRACK_ORDER]) {
    if (t.includes(kw)) return INTENTS.TRACK_ORDER;
  }
  for (const kw of INTENT_KEYWORDS[INTENTS.SHOW_CART]) {
    if (t.includes(kw)) return INTENTS.SHOW_CART;
  }
  for (const kw of INTENT_KEYWORDS[INTENTS.HELP]) {
    if (t.includes(kw)) return INTENTS.HELP;
  }

  // Product / quantity / order words → ORDER intent
  const hasQuantity = /\d|एक|दुई|तीन|चार|one|two|three|किलो|kg|लिटर|litre|प्याकेट|packet|वटा/i.test(t);
  const hasProductWord = /आलु|चिनी|चामल|दाल|तेल|दूध|नुन|साबुन|बिस्कुट|चाउचाउ|potato|sugar|rice|oil|milk|salt|lentil|noodle|tea|onion|tomato|flour|egg|चिया/i.test(t);
  const hasOrderWord = /चाहियो|चाहिन्छ|दिनुहोस्|order|मलाई|want|need|चाही|दीं|दिनू/i.test(t);

  if (hasQuantity || hasProductWord || hasOrderWord) return INTENTS.ORDER;

  return INTENTS.UNKNOWN;
}

export function AIAgentProvider({ children }) {
  const {
    selectedShop,
    addToCart,
    clearCart,
    placeOrder,
    setIsCartOpen,
    setActiveTrackingOrderId,
    orders,
    cart,
    customerInfo,
    language,
  } = useApp();

  const [agentState, setAgentState] = useState('IDLE');
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micBlocked, setMicBlocked] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [agentMessages, setAgentMessages] = useState([]);
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);

  // ── Refs (stable across renders, read by long-lived speech callbacks) ──
  const recognitionRef = useRef(null);
  const productsRef = useRef([]);
  const isSpeakingRef = useRef(false);   // true while TTS is talking
  const wantListenRef = useRef(false);   // true while we intend the mic to be on
  const activeRef = useRef(false);       // mirror of isAgentActive
  const restartTimerRef = useRef(null);
  const processTimerRef = useRef(null);
  const finalBufferRef = useRef('');
  const msgIdRef = useRef(0);            // monotonic, collision-free message ids
  const pendingOrderDataRef = useRef(null); // authoritative pending order (closure-safe)
  const latestRef = useRef({});          // latest handlers/values for callbacks

  // Load products from localStorage, falling back to the built-in catalog so a
  // customer who ONLY ever starts the voice assistant can still order.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('apna_products');
      const parsed = saved ? JSON.parse(saved) : null;
      productsRef.current = (Array.isArray(parsed) && parsed.length > 0) ? parsed : INITIAL_PRODUCTS;
    } catch (e) {
      productsRef.current = INITIAL_PRODUCTS;
    }
  }, [agentState, selectedShop, isAgentActive]);

  const getShopCatalog = useCallback(() => {
    const shopId = selectedShop?.id;
    const list = productsRef.current.filter(p => p.shopId === shopId);
    return list.length > 0 ? list : productsRef.current;
  }, [selectedShop]);

  // ── Speech Synthesis with mic coordination ──
  // Speaks `text`, pausing the mic while talking and resuming it (if still
  // wanted) the instant speech finishes. This is what makes the loop hands-free.
  const speak = useCallback((text) => {
    const resumeAfter = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      if (wantListenRef.current && activeRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => latestRef.current.startRecognitionInternal?.(), 350);
      }
    };

    if (!('speechSynthesis' in window)) {
      // No TTS available — just keep listening.
      resumeAfter();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      // Pause the mic so we don't transcribe our own voice.
      try { recognitionRef.current?.stop(); } catch (e) { /* ignore */ }
      setIsListening(false);

      const utterance = new SpeechSynthesisUtterance(text);
      const loc = speechLocale(language);
      utterance.lang = loc;
      utterance.rate = language === 'en' ? 1.0 : 0.95; // clear, natural pace
      utterance.pitch = 1.0;
      const v = bestVoice(loc);
      if (v) utterance.voice = v;

      let finished = false;
      const done = () => { if (finished) return; finished = true; resumeAfter(); };
      utterance.onend = done;
      utterance.onerror = done;

      // Safety net: some browsers never fire `onend`. Resume anyway.
      const fallbackMs = Math.min(16000, 2500 + text.length * 55);
      setTimeout(done, fallbackMs);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      resumeAfter();
    }
  }, [language]);

  // ── Add a message to the conversation log (agent messages are spoken) ──
  const addMessage = useCallback((sender, text, type = 'text') => {
    const msg = {
      id: `m${++msgIdRef.current}`,
      sender,
      text,
      type,
      timestamp: new Date()
    };
    setAgentMessages(prev => [...prev, msg]);
    if (sender === 'agent') speak(text);
    return msg;
  }, [speak]);

  // ── Build the SpeechRecognition object once; callbacks read latestRef ──
  const buildRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;      // keep the mic open
    recognition.interimResults = true;  // live transcript for the UI
    recognition.maxAlternatives = 1;

    recognition.onstart = () => { setIsListening(true); setMicBlocked(false); };

    recognition.onresult = (event) => {
      if (isSpeakingRef.current) return; // ignore anything captured while we talk

      let interim = '';
      let final = '';
      let conf = 0, finalCount = 0;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) { final += res[0].transcript; conf += (res[0].confidence || 0); finalCount++; }
        else interim += res[0].transcript;
      }

      setTranscript(interim || final);

      if (final.trim()) {
        const clean = final.trim();
        const avgConf = finalCount ? conf / finalCount : 0;
        // Drop only obvious background noise: single-character blips, or a 1–2
        // char fragment the engine is very unsure about. IMPORTANT: never drop
        // short confirmations like "हो"/"yes"/"हँ" just for low confidence —
        // that used to silently break hands-free order confirmation.
        if (clean.length < 2) return;
        if (avgConf > 0 && avgConf < 0.2 && clean.length < 3) return;

        finalBufferRef.current = (finalBufferRef.current + ' ' + final).trim();
        // Debounce: wait briefly in case the sentence arrives in several pieces.
        clearTimeout(processTimerRef.current);
        processTimerRef.current = setTimeout(() => {
          const text = finalBufferRef.current.trim();
          finalBufferRef.current = '';
          setTranscript('');
          if (text && text.length >= 2) latestRef.current.processUserInput?.(text);
        }, 900);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        // Mic permission denied — stop trying and tell the user (once).
        wantListenRef.current = false;
        setIsListening(false);
        setMicBlocked(true);
        latestRef.current.addMessage?.('agent', AGENT.micNeeded(latestRef.current.language));
        return;
      }
      // 'no-speech' / 'aborted' / 'network' are transient — onend will restart.
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart to keep the loop alive (unless we're speaking or done).
      if (wantListenRef.current && activeRef.current && !isSpeakingRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => latestRef.current.startRecognitionInternal?.(), 300);
      }
    };

    return recognition;
  }, []);

  // Low-level: start the recognizer (idempotent, guarded).
  const startRecognitionInternal = useCallback(() => {
    if (!activeRef.current || isSpeakingRef.current) return;
    if (!recognitionRef.current) recognitionRef.current = buildRecognition();
    const rec = recognitionRef.current;
    if (!rec) return;
    // Apply the current language on every start so switches take effect.
    rec.lang = speechLocale(language);
    try {
      rec.start();
      setIsListening(true);
      // No beep on auto-restart — it fires on every silence gap and feels like toggling.
    } catch (e) {
      // Already started — that's fine, we're already listening.
    }
  }, [buildRecognition, language]);

  // ── Core: process one finalized user utterance ──
  const processUserInput = useCallback((text) => {
    if (!text || !text.trim()) return;
    addMessage('user', text);

    const intent = detectIntent(text);

    if (agentState === 'CONFIRMING') {
      handleConfirmation(intent, text);
    } else if (agentState === 'PAYMENT_SELECT') {
      handlePaymentSelect(text);
    } else {
      handleFreshIntent(intent, text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentState, addMessage]);

  // ── Fresh intent (no pending confirmation) ──
  const handleFreshIntent = useCallback((intent, text) => {
    switch (intent) {
      case INTENTS.ORDER: {
        setAgentState('PROCESSING');
        addMessage('agent', AGENT.processing(language));

        setTimeout(() => {
          const catalog = getShopCatalog();
          const result = parseVoiceOrder(text, selectedShop, catalog, language);

          // Items the shop doesn't have or has marked unavailable / out of stock.
          const unavailable = result.unavailable || [];
          const unNote = unavailable.length ? pick(language, {
            ne: `\n\n⚠️ अहिले उपलब्ध छैन: ${unavailable.join(', ')}।`,
            hi: `\n\n⚠️ अभी उपलब्ध नहीं: ${unavailable.join(', ')}।`,
            en: `\n\n⚠️ Not available right now: ${unavailable.join(', ')}.`,
            mai: `\n\n⚠️ एखन उपलब्ध नै: ${unavailable.join(', ')}।`,
            bho: `\n\n⚠️ अभी उपलब्ध नइखे: ${unavailable.join(', ')}।`
          }) : '';

          if (result.success && result.items.length > 0) {
            const dn = (n) => toDevanagariNumerals(n);
            const devLines = result.items.map(i =>
              `• ${i.product.nameNe} — ${dn(i.quantity)} ${i.unit} — रु ${dn(i.itemTotal)}`
            ).join('\n');
            const enLines = result.items.map(i =>
              `• ${i.product.nameEn} — ${i.quantity} ${i.unit} — NPR ${i.itemTotal}`
            ).join('\n');
            const { subtotal, deliveryCharge: delivery, grandTotal: grand } = result;

            const summary = pick(language, {
              ne: `तपाईंले चाहनुभएको सामान:\n${devLines}${unNote}\n\nसामानको जम्मा: रु ${dn(subtotal)}\nडेलिभरी शुल्क: रु ${dn(delivery)}\nकुल रकम: रु ${dn(grand)}`,
              hi: `आपका सामान:\n${devLines}${unNote}\n\nसामान का कुल: रु ${dn(subtotal)}\nडिलीवरी शुल्क: रु ${dn(delivery)}\nकुल राशि: रु ${dn(grand)}`,
              en: `Your order:\n${enLines}${unNote}\n\nSubtotal: NPR ${subtotal}\nDelivery: NPR ${delivery}\nTotal: NPR ${grand}`,
              mai: `अहाँक सामान:\n${devLines}${unNote}\n\nसामानक कुल: रु ${dn(subtotal)}\nडेलिभरी शुल्क: रु ${dn(delivery)}\nजम्मा रकम: रु ${dn(grand)}`,
              bho: `रउरा सामान:\n${devLines}${unNote}\n\nसामान के कुल: रु ${dn(subtotal)}\nडेलिभरी चार्ज: रु ${dn(delivery)}\nकुल रकम: रु ${dn(grand)}`
            }) + AGENT.confirmCue(language);

            setPendingOrderData({
              items: result.items,
              subtotal: result.subtotal,
              deliveryCharge: result.deliveryCharge,
              grandTotal: result.grandTotal
            });
            setAgentState('CONFIRMING');
            // Speak the summary; the mic auto-resumes when speech ends, so the
            // user can just say "हो/yes" to confirm — no button needed.
            addMessage('agent', summary, 'confirmation');
          } else if (unavailable.length > 0) {
            // We understood the items, but the shop can't fulfil any of them.
            setAgentState('GREETING');
            addMessage('agent',
              AGENT.allUnavailable(language, unavailable.join(', '),
                language === 'en' ? (selectedShop?.nameEn || selectedShop?.name || 'this shop') : (selectedShop?.name || 'यो पसल')),
              'error'
            );
          } else {
            setAgentState('GREETING');
            addMessage('agent', AGENT.notUnderstoodItems(language));
          }
        }, 700);
        break;
      }

      case INTENTS.TRACK_ORDER: {
        const activeOrder = orders.find(o => o.orderStatus !== 'delivered' && o.orderStatus !== 'rejected');
        if (activeOrder) {
          setActiveTrackingOrderId(activeOrder.id);
          addMessage('agent', AGENT.trackOpening(language, activeOrder.id));
        } else {
          addMessage('agent', AGENT.noActiveOrder(language));
        }
        break;
      }

      case INTENTS.SHOW_CART: {
        setIsCartOpen(true);
        addMessage('agent', AGENT.cartOpening(language, cart.length));
        break;
      }

      case INTENTS.HELP: {
        addMessage('agent', AGENT.help(language));
        break;
      }

      case INTENTS.CANCEL: {
        setPendingOrderData(null);
        setAgentState('GREETING');
        addMessage('agent', AGENT.cancelAck(language));
        break;
      }

      default: {
        addMessage('agent', AGENT.notUnderstood(language));
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, selectedShop, getShopCatalog, addMessage, orders, cart, setActiveTrackingOrderId, setIsCartOpen]);

  // ── Handle a Yes/No reply to a pending order ──
  const handleConfirmation = useCallback((intent, text) => {
    if (intent === INTENTS.CONFIRM_YES) {
      if (!pendingOrderData) {
        setAgentState('GREETING');
        addMessage('agent', AGENT.noOrderReady(language));
        return;
      }
      // Order confirmed — now ask how they want to pay (online or cash).
      setAgentState('PAYMENT_SELECT');
      addMessage('agent', AGENT.askPayment(language), 'confirmation');

    } else if (intent === INTENTS.CONFIRM_NO || intent === INTENTS.CANCEL) {
      setPendingOrderData(null);
      setAgentState('GREETING');
      addMessage('agent', AGENT.cancelled(language));
    } else {
      // Something ambiguous — re-ask.
      addMessage('agent', AGENT.reAskYesNo(language));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOrderData, language, addMessage]);

  // Detect the spoken payment choice, then place the order with that method.
  const handlePaymentSelect = useCallback((text) => {
    const t = (text || '').toLowerCase();
    const wantsKhalti = /khalti|खल्ती|खल्टी/.test(t);
    const wantsEsewa = /esewa|इसेवा|एसेवा|ईसेवा/.test(t);
    const wantsOnline = wantsKhalti || wantsEsewa ||
      /online|अनलाइन|अनलाईन|digital|qr|क्यूआर|wallet|वालेट|बैंक|bank/.test(t);
    const wantsCod = /cash|cod|नगद|नगदी|क्यास|क्याश|डेलिभरीमा|डेलिभरी मा|पैसा पछि|नगद देले|hath|हात/.test(t);

    if (!wantsOnline && !wantsCod) {
      addMessage('agent', AGENT.paymentReask(language));
      return;
    }

    const method = wantsOnline ? (wantsKhalti ? 'khalti' : 'esewa') : 'cod';
    finalizeOrder(method);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, addMessage]);

  // Place the pending order with the chosen payment method (simulating an
  // online payment when the method is not cash-on-delivery).
  const finalizeOrder = useCallback((method) => {
    const pending = pendingOrderDataRef.current;
    if (!pending) {
      setAgentState('GREETING');
      addMessage('agent', AGENT.noOrderReady(language));
      return;
    }

    const isOnline = method !== 'cod';

    // Build line-items directly so the order never depends on async cart state.
    const orderItems = pending.items.map(item => ({
      productId: item.product.id,
      nameNe: item.product.nameNe,
      nameEn: item.product.nameEn,
      quantity: item.quantity,
      unit: item.unit,
      price: item.product.price
    }));
    const total = pending.grandTotal;

    // Mirror into the visible cart for on-screen feedback.
    clearCart();
    pending.items.forEach(item => addToCart(item.product, item.quantity, item.unit));

    const doPlace = () => {
      setAgentState('PLACING_ORDER');
      addMessage('agent', AGENT.placing(language));
      setTimeout(() => {
        const newOrder = placeOrder({
          orderType: 'delivery',
          deliveryAddress: customerInfo.address || customerInfo.name || '',
          items: orderItems,
          itemsSubtotal: pending.subtotal,
          deliveryCharge: pending.deliveryCharge,
          grandTotal: total,
          paymentMethod: method,           // 'cod' | 'esewa' | 'khalti'
          customerNote: 'एआई सहायकबाट अर्डर गरिएको',
          locationPermissionGranted: true
        });

        setAgentState('ORDER_DONE');
        setPendingOrderData(null);
        addMessage('agent',
          AGENT.orderSuccess(language, newOrder.id, toDevanagariNumerals(total), AGENT.payLabel(language, method)),
          'success');
      }, 400);
    };

    if (isOnline) {
      // Simulate the online payment gateway completing, then place the order.
      setAgentState('PLACING_ORDER');
      addMessage('agent', AGENT.processingPayment(language));
      setTimeout(doPlace, 1600);
    } else {
      doPlace();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOrderData, language, addMessage, clearCart, addToCart, placeOrder, customerInfo]);

  // Mirror the pending order into a ref so payment/finalize logic always reads
  // the current value, immune to stale useCallback closures.
  useEffect(() => {
    pendingOrderDataRef.current = pendingOrderData;
  }, [pendingOrderData]);

  // Keep the latest handlers/values available to the long-lived speech callbacks.
  useEffect(() => {
    latestRef.current = {
      processUserInput,
      startRecognitionInternal,
      addMessage,
      language,
    };
  });

  // ── Manual mic controls (fallback buttons in the panel) ──
  const startListening = useCallback(() => {
    wantListenRef.current = true;
    // If the assistant is mid-sentence, cut it off so the user can talk.
    if (isSpeakingRef.current) {
      window.speechSynthesis?.cancel();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }
    startRecognitionInternal();
  }, [startRecognitionInternal]);

  const stopListening = useCallback(() => {
    wantListenRef.current = false;
    clearTimeout(restartTimerRef.current);
    clearTimeout(processTimerRef.current);
    try { recognitionRef.current?.stop(); } catch (e) { /* ignore */ }
    setIsListening(false);
  }, []);

  // ── Activate / Deactivate ──
  const activateAgent = useCallback(() => {
    setIsAgentActive(true);
    activeRef.current = true;
    wantListenRef.current = true;
    setMicBlocked(false);
    setIsAgentPanelOpen(true);
    setAgentState('GREETING');
    setAgentMessages([]);
    setPendingOrderData(null);
    finalBufferRef.current = '';

    recognitionRef.current = buildRecognition();
    soundEffects.playSuccessChime?.();

    const shopName = language === 'en'
      ? (selectedShop?.nameEn || selectedShop?.name || 'the shop')
      : (selectedShop?.name || 'पसल');

    // Speaking the greeting auto-starts the mic when it finishes (hands-free).
    addMessage('agent', AGENT.greeting(language, shopName));
  }, [language, selectedShop, addMessage, buildRecognition]);

  const deactivateAgent = useCallback(() => {
    setIsAgentActive(false);
    activeRef.current = false;
    wantListenRef.current = false;
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    setIsListening(false);
    setAgentState('IDLE');
    clearTimeout(restartTimerRef.current);
    clearTimeout(processTimerRef.current);
    try { recognitionRef.current?.stop(); } catch (e) { /* ignore */ }
    window.speechSynthesis?.cancel();
  }, []);

  const toggleAgent = useCallback(() => {
    if (activeRef.current) deactivateAgent();
    else activateAgent();
  }, [activateAgent, deactivateAgent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wantListenRef.current = false;
      activeRef.current = false;
      clearTimeout(restartTimerRef.current);
      clearTimeout(processTimerRef.current);
      try { recognitionRef.current?.stop(); } catch (e) { /* ignore */ }
      window.speechSynthesis?.cancel();
    };
  }, []);

  return (
    <AIAgentContext.Provider value={{
      isAgentActive,
      isAgentPanelOpen,
      setIsAgentPanelOpen,
      agentState,
      isListening,
      isSpeaking,
      micBlocked,
      transcript,
      agentMessages,
      pendingOrderData,
      toggleAgent,
      activateAgent,
      deactivateAgent,
      startListening,
      stopListening,
      processUserInput,
      addMessage
    }}>
      {children}
    </AIAgentContext.Provider>
  );
}

export function useAIAgent() {
  const ctx = useContext(AIAgentContext);
  if (!ctx) throw new Error('useAIAgent must be used within AIAgentProvider');
  return ctx;
}
