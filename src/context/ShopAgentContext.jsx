import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useShopkeeper } from './ShopkeeperContext';
import { soundEffects } from '../utils/audioAlerts';
import { SHOP_AGENT } from '../constants/shopAgentPhrases';
import { getShopCategories } from '../constants/shopTypes';
import { parseSpokenNumber, parseUnit } from '../utils/voiceParse';
import { speechLocale } from '../utils/i18n';

const ShopAgentContext = createContext();

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

// Find a product in the shop by matching spoken text against its name/alias.
function findProduct(text, products) {
  const t = (text || '').toLowerCase();
  for (const p of products) {
    const baseNe = (p.nameNe || '').split('(')[0].trim().toLowerCase();
    const baseEn = (p.nameEn || '').split('(')[0].trim().toLowerCase();
    const firstNe = baseNe.split(/\s+/)[0];
    const firstEn = baseEn.split(/\s+/)[0];
    if ((baseNe && t.includes(baseNe)) ||
        (baseEn && baseEn.length > 2 && t.includes(baseEn)) ||
        (firstNe && firstNe.length > 1 && t.includes(firstNe)) ||
        (firstEn && firstEn.length > 2 && t.includes(firstEn)) ||
        (p.aliasId && t.includes(p.aliasId))) {
      return p;
    }
  }
  return null;
}

function detectShopIntent(text) {
  const t = (text || '').toLowerCase();
  if (/नयाँ सामान|सामान थप|नयाँ आइटम|नव सामान|सामान जोड|add item|add product|add.*new|new item|naya saman|item add/.test(t)) return 'add';
  if (/सहायता|मद्दत|help|के गर्न|कसरी/.test(t)) return 'help';
  if (/अनुपलब्ध|उपलब्ध|unavailable|available|out of stock|बन्द गर|लुकाउ|हटाउ|देखाउ/.test(t)) return 'toggle_avail';
  if (/मूल्य|दाम|price|rate|रेट/.test(t)) return 'set_price';
  if (/स्टक|stock|मात्रा|quantity|मौज्दात/.test(t)) return 'set_stock';
  return 'unknown';
}

const YES = ['yes', 'हो', 'हुन्छ', 'ठीक', 'ok', 'okay', 'हँ', 'हजुर', 'भयो', 'गर', 'पक्का', 'yep', 'yeah', 'sure', 'गरिदेऊ'];
const NO = ['no', 'होइन', 'नाहीं', 'रद्द', 'cancel', 'नहीं', 'नहि', 'ना', 'नै', 'nope'];
const isYes = (t) => { const x = (t || '').toLowerCase().trim(); return YES.some(k => x === k || x.startsWith(k + ' ') || x.includes(' ' + k)); };
const isNo = (t) => { const x = (t || '').toLowerCase().trim(); return NO.some(k => x === k || x.includes(k)); };

export function ShopAgentProvider({ children }) {
  const { language } = useApp();
  const { shopData, shopProducts, addProduct, editProduct, toggleProductAvailability } = useShopkeeper();

  const [agentState, setAgentState] = useState('IDLE');
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micBlocked, setMicBlocked] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [agentMessages, setAgentMessages] = useState([]);
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);

  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const wantListenRef = useRef(false);
  const activeRef = useRef(false);
  const restartTimerRef = useRef(null);
  const processTimerRef = useRef(null);
  const finalBufferRef = useRef('');
  const latestRef = useRef({});
  const msgIdRef = useRef(0);
  const draftRef = useRef({});             // product being built step by step
  const stateRef = useRef('IDLE');
  const productsRef = useRef([]);

  useEffect(() => { stateRef.current = agentState; }, [agentState]);
  useEffect(() => { productsRef.current = shopProducts; }, [shopProducts]);

  const defaultCategory = () => {
    const cats = getShopCategories(shopData);
    return (cats.find(c => c.id !== 'all') || { id: 'general' }).id;
  };

  // ── Speech synthesis with mic coordination ──
  const speak = useCallback((text) => {
    const resumeAfter = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      if (wantListenRef.current && activeRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => latestRef.current.startRec?.(), 350);
      }
    };
    if (!('speechSynthesis' in window)) { resumeAfter(); return; }
    try {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      try { recognitionRef.current?.stop(); } catch (e) { /* ignore */ }
      setIsListening(false);
      const u = new SpeechSynthesisUtterance(text);
      const loc = speechLocale(language);
      u.lang = loc;
      u.rate = language === 'en' ? 1.0 : 0.95;
      u.pitch = 1.0;
      const v = bestVoice(loc);
      if (v) u.voice = v;
      let done = false;
      const finish = () => { if (done) return; done = true; resumeAfter(); };
      u.onend = finish; u.onerror = finish;
      setTimeout(finish, Math.min(16000, 2500 + text.length * 55));
      window.speechSynthesis.speak(u);
    } catch (e) { resumeAfter(); }
  }, [language]);

  const addMessage = useCallback((sender, text, type = 'text') => {
    setAgentMessages(prev => [...prev, { id: `s${++msgIdRef.current}`, sender, text, type, timestamp: new Date() }]);
    if (sender === 'agent') speak(text);
  }, [speak]);

  // ── Recognition ──
  const buildRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onstart = () => { setIsListening(true); setMicBlocked(false); };
    rec.onresult = (event) => {
      if (isSpeakingRef.current) return;
      let interim = '', final = '', conf = 0, finalCount = 0;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) { final += r[0].transcript; conf += (r[0].confidence || 0); finalCount++; }
        else interim += r[0].transcript;
      }
      setTranscript(interim || final);
      if (final.trim()) {
        const clean = final.trim();
        const avgConf = finalCount ? conf / finalCount : 0;
        if (clean.length < 2) return;
        if (avgConf > 0 && avgConf < 0.35 && clean.length < 6) return;
        finalBufferRef.current = (finalBufferRef.current + ' ' + final).trim();
        clearTimeout(processTimerRef.current);
        processTimerRef.current = setTimeout(() => {
          const text = finalBufferRef.current.trim();
          finalBufferRef.current = '';
          setTranscript('');
          if (text && text.length >= 2) latestRef.current.process?.(text);
        }, 900);
      }
    };
    rec.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        wantListenRef.current = false;
        setIsListening(false);
        setMicBlocked(true);
        latestRef.current.addMessage?.('agent', SHOP_AGENT.micNeeded(latestRef.current.language));
        return;
      }
      setIsListening(false);
    };
    rec.onend = () => {
      setIsListening(false);
      if (wantListenRef.current && activeRef.current && !isSpeakingRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => latestRef.current.startRec?.(), 300);
      }
    };
    return rec;
  }, []);

  const startRecognitionInternal = useCallback(() => {
    if (!activeRef.current || isSpeakingRef.current) return;
    if (!recognitionRef.current) recognitionRef.current = buildRecognition();
    const rec = recognitionRef.current;
    if (!rec) return;
    rec.lang = speechLocale(language);
    try { rec.start(); setIsListening(true); } catch (e) { /* already started */ }
  }, [buildRecognition, language]);

  // ── Conversation logic ──
  const process = useCallback((text) => {
    if (!text || !text.trim()) return;
    addMessage('user', text);
    const st = stateRef.current;

    // Multi-step add flow
    if (st === 'ADD_NAME') {
      draftRef.current.name = text.trim();
      setAgentState('ADD_PRICE');
      addMessage('agent', SHOP_AGENT.askPrice(language, draftRef.current.name));
      return;
    }
    if (st === 'ADD_PRICE') {
      const n = parseSpokenNumber(text);
      if (n === null || n <= 0) { addMessage('agent', SHOP_AGENT.needNumber(language)); return; }
      draftRef.current.price = Math.round(n);
      setAgentState('ADD_UNIT');
      addMessage('agent', SHOP_AGENT.askUnit(language));
      return;
    }
    if (st === 'ADD_UNIT') {
      draftRef.current.unit = parseUnit(text) || 'piece';
      setAgentState('ADD_STOCK');
      addMessage('agent', SHOP_AGENT.askStock(language));
      return;
    }
    if (st === 'ADD_STOCK') {
      const n = parseSpokenNumber(text);
      if (n === null || n < 0) { addMessage('agent', SHOP_AGENT.needNumber(language)); return; }
      draftRef.current.stock = Math.round(n);
      setAgentState('ADD_CONFIRM');
      addMessage('agent', SHOP_AGENT.confirmAdd(language, draftRef.current), 'confirmation');
      return;
    }
    if (st === 'ADD_CONFIRM') {
      if (isYes(text)) {
        const d = draftRef.current;
        addProduct({
          nameNe: d.name, nameEn: d.name, category: defaultCategory(),
          price: d.price, unit: d.unit, stock: d.stock, minStock: 5, image: '', brand: ''
        });
        setAgentState('GREETING');
        addMessage('agent', SHOP_AGENT.added(language, d.name), 'success');
        draftRef.current = {};
      } else if (isNo(text)) {
        setAgentState('GREETING');
        addMessage('agent', SHOP_AGENT.addCancelled(language));
        draftRef.current = {};
      } else {
        addMessage('agent', SHOP_AGENT.reAskYesNo(language));
      }
      return;
    }

    // Fresh command
    const intent = detectShopIntent(text);
    if (intent === 'add') {
      draftRef.current = {};
      setAgentState('ADD_NAME');
      addMessage('agent', SHOP_AGENT.askName(language));
      return;
    }
    if (intent === 'help') { addMessage('agent', SHOP_AGENT.help(language)); return; }

    if (intent === 'toggle_avail') {
      const p = findProduct(text, productsRef.current);
      if (!p) { addMessage('agent', SHOP_AGENT.productNotFound(language)); return; }
      toggleProductAvailability(p.id);
      const nowAvail = !p.isAvailable;
      addMessage('agent', SHOP_AGENT.availabilityToggled(language, p.nameNe, nowAvail));
      return;
    }
    if (intent === 'set_price') {
      const p = findProduct(text, productsRef.current);
      const n = parseSpokenNumber(text);
      if (!p) { addMessage('agent', SHOP_AGENT.productNotFound(language)); return; }
      if (n === null || n <= 0) { addMessage('agent', SHOP_AGENT.needNumber(language)); return; }
      editProduct(p.id, { price: Math.round(n) });
      addMessage('agent', SHOP_AGENT.priceUpdated(language, p.nameNe, Math.round(n)));
      return;
    }
    if (intent === 'set_stock') {
      const p = findProduct(text, productsRef.current);
      const n = parseSpokenNumber(text);
      if (!p) { addMessage('agent', SHOP_AGENT.productNotFound(language)); return; }
      if (n === null || n < 0) { addMessage('agent', SHOP_AGENT.needNumber(language)); return; }
      editProduct(p.id, { stock: Math.round(n) });
      addMessage('agent', SHOP_AGENT.stockUpdated(language, p.nameNe, Math.round(n)));
      return;
    }

    addMessage('agent', SHOP_AGENT.notUnderstood(language));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, addMessage, addProduct, editProduct, toggleProductAvailability, shopData]);

  useEffect(() => {
    latestRef.current = { process, startRec: startRecognitionInternal, addMessage, language };
  });

  const startListening = useCallback(() => {
    wantListenRef.current = true;
    if (isSpeakingRef.current) { window.speechSynthesis?.cancel(); isSpeakingRef.current = false; setIsSpeaking(false); }
    startRecognitionInternal();
  }, [startRecognitionInternal]);

  const stopListening = useCallback(() => {
    wantListenRef.current = false;
    clearTimeout(restartTimerRef.current);
    clearTimeout(processTimerRef.current);
    try { recognitionRef.current?.stop(); } catch (e) { /* ignore */ }
    setIsListening(false);
  }, []);

  const activateAgent = useCallback(() => {
    setIsAgentActive(true);
    activeRef.current = true;
    wantListenRef.current = true;
    setMicBlocked(false);
    setIsAgentPanelOpen(true);
    setAgentState('GREETING');
    setAgentMessages([]);
    draftRef.current = {};
    recognitionRef.current = buildRecognition();
    soundEffects.playSuccessChime?.();
    const shopName = language === 'en' ? (shopData?.nameEn || shopData?.name || 'your shop') : (shopData?.name || 'तपाईंको पसल');
    addMessage('agent', SHOP_AGENT.greeting(language, shopName));
  }, [language, shopData, addMessage, buildRecognition]);

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
    if (activeRef.current) deactivateAgent(); else activateAgent();
  }, [activateAgent, deactivateAgent]);

  useEffect(() => () => {
    wantListenRef.current = false;
    activeRef.current = false;
    clearTimeout(restartTimerRef.current);
    clearTimeout(processTimerRef.current);
    try { recognitionRef.current?.stop(); } catch (e) { /* ignore */ }
    window.speechSynthesis?.cancel();
  }, []);

  return (
    <ShopAgentContext.Provider value={{
      isAgentActive, isAgentPanelOpen, setIsAgentPanelOpen,
      agentState, isListening, isSpeaking, micBlocked, transcript, agentMessages,
      toggleAgent, activateAgent, deactivateAgent, startListening, stopListening,
      processUserInput: process, addMessage
    }}>
      {children}
    </ShopAgentContext.Provider>
  );
}

export function useShopAgent() {
  const ctx = useContext(ShopAgentContext);
  if (!ctx) throw new Error('useShopAgent must be used within ShopAgentProvider');
  return ctx;
}
