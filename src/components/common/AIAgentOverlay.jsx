import React, { useRef, useEffect, useState } from 'react';
import { useAIAgent } from '../../context/AIAgentContext';
import { useApp } from '../../context/AppContext';
import { pick } from '../../utils/i18n';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  Volume2,
  StopCircle,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Power
} from 'lucide-react';

export default function AIAgentOverlay() {
  const {
    isAgentActive,
    isAgentPanelOpen,
    setIsAgentPanelOpen,
    agentState,
    isListening,
    isSpeaking,
    micBlocked,
    transcript,
    agentMessages,
    toggleAgent,
    startListening,
    stopListening,
    processUserInput
  } = useAIAgent();
  const { t, language } = useApp();

  // Stable "listening" indicator: while the assistant is active and not
  // speaking (and the mic isn't blocked) we show a steady listening state,
  // so the raw recognition start/stop churn never flickers the UI on/off.
  const listeningDisplay = isAgentActive && !isSpeaking && !micBlocked;

  // Small discoverability label above the icon (dismissible), so customers can
  // always find the voice assistant without it covering the main content.
  const [showHint, setShowHint] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages]);

  const handleManualSend = () => {
    const val = inputRef.current?.value?.trim();
    if (val) {
      processUserInput(val);
      inputRef.current.value = '';
    }
  };

  const stateLabels = {
    IDLE: pick(language, { ne: 'सहायक बन्द छ', hi: 'सहायक बंद है', en: 'Assistant Off', mai: 'सहायक बन्द', bho: 'सहायक बंद' }),
    GREETING: pick(language, { ne: 'तयार छ — बोल्नुहोस्', hi: 'तैयार है — बोलिए', en: 'Ready — Speak', mai: 'तैयार — बाजू', bho: 'तैयार — बोलीं' }),
    SPEAKING: pick(language, { ne: '🔊 बोल्दैछ...', hi: '🔊 बोल रहा है...', en: '🔊 Speaking...', mai: '🔊 बाजि रहल...', bho: '🔊 बोलत बा...' }),
    LISTENING: pick(language, { ne: '🎤 सुन्दैछ...', hi: '🎤 सुन रहा है...', en: '🎤 Listening...', mai: '🎤 सुनि रहल...', bho: '🎤 सुनत बा...' }),
    TAP_MIC: pick(language, { ne: '🎤 माइक थिच्नुहोस्', hi: '🎤 माइक दबाएँ', en: '🎤 Tap the mic', mai: '🎤 माइक थिचू', bho: '🎤 माइक दबाईं' }),
    PROCESSING: pick(language, { ne: 'बुझ्दैछ...', hi: 'समझ रहा है...', en: 'Processing...', mai: 'बुझि रहल...', bho: 'समझत बा...' }),
    CHECKOUT_PREP: pick(language, { ne: 'अर्डर तयार...', hi: 'ऑर्डर तैयार...', en: 'Preparing...', mai: 'अर्डर तैयार...', bho: 'आर्डर तैयार...' }),
    CONFIRMING: pick(language, { ne: 'पुष्टि चाहिन्छ', hi: 'पुष्टि करें?', en: 'Confirm?', mai: 'पक्का करू?', bho: 'पक्का करीं?' }),
    PAYMENT_SELECT: pick(language, { ne: '💳 भुक्तानी छान्नुहोस्', hi: '💳 भुगतान चुनें', en: '💳 Choose payment', mai: '💳 भुगतान चुनू', bho: '💳 भुगतान चुनीं' }),
    PLACING_ORDER: pick(language, { ne: 'अर्डर पठाउँदैछ...', hi: 'ऑर्डर भेज रहा है...', en: 'Placing...', mai: 'अर्डर पठा रहल...', bho: 'आर्डर भेजत बा...' }),
    ORDER_DONE: pick(language, { ne: '✅ अर्डर भयो!', hi: '✅ ऑर्डर हो गया!', en: '✅ Done!', mai: '✅ अर्डर भेल!', bho: '✅ आर्डर भइल!' }),
    ERROR: pick(language, { ne: '⚠️ समस्या', hi: '⚠️ समस्या', en: '⚠️ Error', mai: '⚠️ समस्या', bho: '⚠️ समस्या' }),
  };

  return (
    <>
      {/* ── Floating AI Agent FAB Button ── */}
      <div className="ai-agent-fab-container">
        <button
          type="button"
          className={`ai-agent-fab ${isAgentActive ? 'active' : ''} ${listeningDisplay ? 'listening' : ''} ${!isAgentActive ? 'idle-pulse' : ''}`}
          onClick={() => {
            if (!isAgentActive) {
              toggleAgent();
            } else {
              setIsAgentPanelOpen(!isAgentPanelOpen);
            }
          }}
          aria-label="AI voice assistant"
          title={pick(language, { ne: 'बोलेर सामान अर्डर गर्नुहोस्', hi: 'बोलकर सामान ऑर्डर करें', en: 'Order by voice', mai: 'बाजिकऽ अर्डर करू', bho: 'बोल के आर्डर करीं' })}
        >
          {listeningDisplay && <div className="fab-ripple-ring"></div>}
          <div className="fab-icon-inner">
            {isAgentActive ? (
              listeningDisplay ? <Mic size={26} className="mic-pulse" /> : <Bot size={26} />
            ) : (
              <Mic size={26} />
            )}
          </div>
        </button>

        {/* Status Pill (active) / discoverability hint (inactive) */}
        {isAgentActive ? (
          <div className="agent-status-pill" onClick={() => setIsAgentPanelOpen(!isAgentPanelOpen)}>
            <span className={`status-dot ${listeningDisplay ? 'listening' : 'ready'}`}></span>
            <span className="status-text">
              {isSpeaking
                ? stateLabels.SPEAKING
                : micBlocked
                  ? stateLabels.TAP_MIC
                  : listeningDisplay
                    ? stateLabels.LISTENING
                    : stateLabels[agentState] || stateLabels.GREETING}
            </span>
          </div>
        ) : showHint && (
          <div className="agent-hint-bubble" onClick={toggleAgent}>
            <Sparkles size={13} />
            <span>{pick(language, { ne: 'बोलेर अर्डर गर्नुहोस्', hi: 'बोलकर ऑर्डर करें', en: 'Order by voice', mai: 'बाजिकऽ अर्डर', bho: 'बोल के आर्डर' })}</span>
            <button type="button" className="hint-close" onClick={(e) => { e.stopPropagation(); setShowHint(false); }}><X size={12} /></button>
          </div>
        )}

      </div>

      {/* ── Agent Conversation Panel ── */}
      {isAgentPanelOpen && isAgentActive && (
        <div className="agent-panel-backdrop" onClick={() => setIsAgentPanelOpen(false)}>
          <div className="agent-panel" onClick={(e) => e.stopPropagation()}>
            {/* Panel Header */}
            <div className="agent-panel-header">
              <div className="agent-header-left">
                <div className="agent-avatar-box">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="agent-title">
                    {pick(language, { ne: 'मामा जी एआई सहायक', hi: 'मामा जी एआई सहायक', en: 'Mama Ji AI Assistant', mai: 'मामा जी एआई सहायक', bho: 'मामा जी एआई सहायक' })}
                  </h3>
                  <span className={`agent-state-badge ${isSpeaking ? 'speaking' : listeningDisplay ? 'listening' : agentState.toLowerCase()}`}>
                    {isSpeaking
                      ? stateLabels.SPEAKING
                      : micBlocked
                        ? stateLabels.TAP_MIC
                        : listeningDisplay
                          ? stateLabels.LISTENING
                          : stateLabels[agentState] || stateLabels.GREETING}
                  </span>
                </div>
              </div>
              <div className="agent-header-actions">
                <button
                  type="button"
                  className="btn-agent-power"
                  onClick={toggleAgent}
                  title="Turn off assistant"
                >
                  <Power size={18} />
                </button>
                <button
                  type="button"
                  className="btn-agent-minimize"
                  onClick={() => setIsAgentPanelOpen(false)}
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="agent-messages-area">
              {agentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`agent-msg ${msg.sender === 'agent' ? 'from-agent' : 'from-user'} ${msg.type}`}
                >
                  <div className="msg-avatar">
                    {msg.sender === 'agent' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className="msg-bubble">
                    <p className="msg-text">{msg.text}</p>
                    <span className="msg-time">
                      {msg.timestamp.toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Live Transcript Preview */}
              {isListening && transcript && (
                <div className="agent-msg from-user live-transcript">
                  <div className="msg-avatar"><Mic size={16} /></div>
                  <div className="msg-bubble">
                    <p className="msg-text live">{transcript}...</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Controls */}
            <div className="agent-panel-footer">
              {/* Manual text input for users who prefer typing */}
              <div className="agent-input-row">
                <input
                  type="text"
                  ref={inputRef}
                  className="agent-text-input"
                  placeholder={pick(language, {
                    ne: 'यहाँ टाइप गर्नुहोस् वा माइक थिच्नुहोस्...',
                    hi: 'यहाँ टाइप करें या माइक दबाएँ...',
                    en: 'Type here or press mic...',
                    mai: 'एतय टाइप करू वा माइक थिचू...',
                    bho: 'इहाँ टाइप करीं भा माइक दबाईं...'
                  })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleManualSend();
                  }}
                />
                <button
                  type="button"
                  className="btn-agent-send"
                  onClick={handleManualSend}
                >
                  →
                </button>
              </div>

              {/* Hands-free hint — the mic below is only a manual fallback */}
              <p className="agent-handsfree-hint">
                {pick(language, {
                  ne: '✨ बस बोल्नुहोस् — केही थिच्नु पर्दैन। "हो" भन्दा अर्डर आफैं हुन्छ।',
                  hi: '✨ बस बोलिए — कुछ दबाने की ज़रूरत नहीं। "हाँ" कहते ही ऑर्डर हो जाता है।',
                  en: '✨ Just speak — no need to press. Say "Yes" and it orders itself.',
                  mai: '✨ बस बाजू — किछु थिचय के जरूरत नै। "हँ" कहलापर अर्डर आपसे भऽ जाइत अछि।',
                  bho: '✨ बस बोलीं — कुछु दबावे के जरूरत नइखे। "हँ" कहला पर आर्डर अपने-आप हो जाला।'
                })}
              </p>

              {/* Big Mic Toggle (manual fallback) */}
              <div className="agent-mic-row">
                <button
                  type="button"
                  className={`agent-mic-btn ${listeningDisplay ? 'active' : ''}`}
                  onClick={() => {
                    if (listeningDisplay) {
                      stopListening();
                    } else {
                      startListening();
                    }
                  }}
                >
                  {listeningDisplay ? (
                    <>
                      <StopCircle size={20} />
                      <span>{pick(language, { ne: 'रोक्नुहोस्', hi: 'रोकें', en: 'Stop', mai: 'रोकू', bho: 'रोकीं' })}</span>
                    </>
                  ) : (
                    <>
                      <Mic size={20} />
                      <span>{pick(language, { ne: '🎤 बोल्नुहोस्', hi: '🎤 बोलें', en: '🎤 Speak', mai: '🎤 बाजू', bho: '🎤 बोलीं' })}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
