import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useShopkeeper } from '../../context/ShopkeeperContext';
import { parseVoiceOrder, speakTextAloud } from '../../utils/aiSpeechParser';
import { soundEffects } from '../../utils/audioAlerts';
import { toDevanagariNumerals } from '../../utils/deliveryCalculator';
import { Mic, MicOff, Volume2, Sparkles, Check, X, RotateCcw, ShoppingBag, ArrowRight } from 'lucide-react';

export default function VoiceShoppingModal() {
  const {
    isVoiceModalOpen,
    setIsVoiceModalOpen,
    selectedShop,
    addToCart,
    setIsCheckoutOpen,
    t,
    language
  } = useApp();
  const { products } = useShopkeeper();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [isSpeakingResponse, setIsSpeakingResponse] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef(null);

  const shopCatalog = products.filter(p => p.shopId === selectedShop.id);

  // Initialize Web Speech API if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      
      if (language === 'ne' || language === 'mai' || language === 'bho') {
        recognition.lang = 'ne-NP';
      } else {
        recognition.lang = 'en-US';
      }

      recognition.onstart = () => {
        setIsListening(true);
        soundEffects.playMicBeep();
      };

      recognition.onresult = (event) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  // When transcript changes and recognition stops, process order with AI NLP
  const handleProcessOrder = (textToProcess) => {
    const text = textToProcess || transcript;
    if (!text.trim()) return;

    setIsProcessing(true);

    setTimeout(() => {
      const result = parseVoiceOrder(text, selectedShop, shopCatalog, language);
      setParsedResult(result);
      setIsProcessing(false);

      if (result.success && result.speechText) {
        setIsSpeakingResponse(true);
        speakTextAloud(result.speechText, language);
        setTimeout(() => setIsSpeakingResponse(false), 5000);
      }
    }, 400);
  };

  const startListening = () => {
    setParsedResult(null);
    setTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // restart
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      }
    } else {
      setIsListening(true);
      soundEffects.playMicBeep();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    if (transcript.trim()) {
      handleProcessOrder(transcript);
    }
  };

  // 1-Tap preset query runner
  const handleSampleClick = (sampleText) => {
    setTranscript(sampleText);
    handleProcessOrder(sampleText);
  };

  // Confirm order and add items to cart, proceed to checkout
  const handleConfirmOrder = () => {
    if (!parsedResult || !parsedResult.items) return;

    parsedResult.items.forEach(item => {
      addToCart(item.product, item.quantity, item.unit);
    });

    setIsVoiceModalOpen(false);
    setIsCheckoutOpen(true);
  };

  if (!isVoiceModalOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => setIsVoiceModalOpen(false)}>
      <div className="voice-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="voice-modal-header">
          <div className="modal-title-box">
            <Sparkles size={22} className="ai-sparkle-icon" />
            <div>
              <h2 className="modal-heading">{t.aiAssistantTitle}</h2>
              <p className="modal-subheading">{selectedShop.name}</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setIsVoiceModalOpen(false)}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="voice-modal-body">
          {/* Visual Voice Wave / Mic Button */}
          <div className="voice-mic-center">
            <div className={`mic-ripple-ring ${isListening ? 'listening' : ''}`}></div>
            <button
              type="button"
              className={`giant-mic-button ${isListening ? 'active' : ''}`}
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? <MicOff size={44} /> : <Mic size={44} />}
            </button>
            <p className="mic-status-label">
              {isListening 
                ? t.listening 
                : isProcessing 
                  ? t.aiProcessing 
                  : t.aiVoiceHelp}
            </p>
          </div>

          {/* Spoken Text Display or Manual Input */}
          <div className="voice-transcript-box">
            <input
              type="text"
              className="transcript-input"
              placeholder="वा यहाँ लेख्नुहोस् (जस्तै: १ किलो आलु र २ किलो चिनी)..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleProcessOrder(e.target.value);
              }}
            />
            {transcript && !isListening && (
              <button
                type="button"
                className="btn-process-text"
                onClick={() => handleProcessOrder(transcript)}
              >
                जाँच्नुहोस्
              </button>
            )}
          </div>

          {/* Quick Preset Samples */}
          {!parsedResult && (
            <div className="voice-samples-row">
              <span className="sample-tag-label">यसलाई थिचेर प्रयास गर्नुहोस्:</span>
              <div className="sample-chips">
                <button
                  type="button"
                  className="sample-chip"
                  onClick={() => handleSampleClick('मलाई १ किलो आलु र २ किलो चिनी चाहिन्छ')}
                >
                  🥔 १ किलो आलु र २ किलो चिनी
                </button>
                <button
                  type="button"
                  className="sample-chip"
                  onClick={() => handleSampleClick('२ प्याकेट वाइवाइ चाउचाउ र १ लिटर धारा तेल')}
                >
                  🍜 २ प्याकेट वाइवाइ र १ लिटर तेल
                </button>
                <button
                  type="button"
                  className="sample-chip"
                  onClick={() => handleSampleClick('१ किलो जिरा मसिना चामल र १ प्याकेट आयो नुन')}
                >
                  🌾 १ किलो चामल र १ प्याकेट नुन
                </button>
                <button
                  type="button"
                  className="sample-chip"
                  onClick={() => handleSampleClick('२ वटा लाइफब्वाय साबुन र आधा किलो चिनी')}
                >
                  🧼 २ वटा साबुन र आधा किलो चिनी
                </button>
              </div>
            </div>
          )}

          {/* AI Parsed Response & Order Confirmation Card */}
          {parsedResult && (
            <div className="ai-response-card">
              <div className="ai-response-header">
                <div className="ai-badge">
                  <Sparkles size={16} /> <span>एआई प्रतिक्रिया (AI Response)</span>
                </div>
                {parsedResult.speechText && (
                  <button
                    type="button"
                    className="btn-speak-again"
                    onClick={() => speakTextAloud(parsedResult.speechText, language)}
                    title="Play voice again"
                  >
                    <Volume2 size={18} />
                  </button>
                )}
              </div>

              {parsedResult.success ? (
                <>
                  {/* Items List in Devanagari */}
                  <div className="parsed-items-list">
                    {parsedResult.items.map((item, idx) => (
                      <div key={idx} className="parsed-item-row">
                        <div className="item-icon-box">
                          <img
                            src={item.product.image}
                            alt={item.product.nameNe}
                            className="item-tiny-thumb"
                          />
                        </div>
                        <div className="item-info">
                          <h4 className="item-name">{item.product.nameNe}</h4>
                          <span className="item-qty-tag">
                            {toDevanagariNumerals(item.quantity)} {item.unit} @ रु {toDevanagariNumerals(item.product.price)}
                          </span>
                        </div>
                        <div className="item-cost">
                          रु {toDevanagariNumerals(item.itemTotal)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="parsed-summary-box">
                    <div className="summary-line">
                      <span>{t.subtotal}:</span>
                      <strong>रु {toDevanagariNumerals(parsedResult.subtotal)}</strong>
                    </div>
                    <div className="summary-line">
                      <span>{t.deliveryCharge} ({selectedShop.distanceKm} कि.मि.):</span>
                      <strong>रु {toDevanagariNumerals(parsedResult.deliveryCharge)}</strong>
                    </div>
                    <div className="summary-line grand-total">
                      <span>{t.grandTotal}:</span>
                      <strong className="grand-price">
                        रु {toDevanagariNumerals(parsedResult.grandTotal)}
                      </strong>
                    </div>
                  </div>

                  {/* User Confirmation Question */}
                  <div className="ai-question-prompt">
                    <p className="question-text">{t.aiConfirmOrderPrompt}</p>
                  </div>

                  {/* Confirmation Buttons */}
                  <div className="voice-confirm-actions">
                    <button
                      type="button"
                      className="btn-voice-confirm"
                      onClick={handleConfirmOrder}
                    >
                      <Check size={20} />
                      <span>{t.confirmOrderBtn}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-voice-change"
                      onClick={() => setParsedResult(null)}
                    >
                      <RotateCcw size={18} />
                      <span>{t.changeItemsBtn}</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="ai-error-box">
                  <p className="error-text">{parsedResult.message}</p>
                  <button
                    type="button"
                    className="btn-try-again"
                    onClick={() => {
                      setParsedResult(null);
                      startListening();
                    }}
                  >
                    फेरि बोल्नुहोस्
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
