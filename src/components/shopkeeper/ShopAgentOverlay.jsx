import React, { useRef, useEffect, useState } from 'react';
import { useShopAgent } from '../../context/ShopAgentContext';
import { useApp } from '../../context/AppContext';
import { pick } from '../../utils/i18n';
import { Mic, StopCircle, Bot, User, ChevronDown, Power, Sparkles, X } from 'lucide-react';

export default function ShopAgentOverlay() {
  const {
    isAgentActive, isAgentPanelOpen, setIsAgentPanelOpen,
    agentState, isListening, isSpeaking, micBlocked, transcript, agentMessages,
    toggleAgent, startListening, stopListening, processUserInput
  } = useShopAgent();
  const { language } = useApp();

  // Steady listening indicator (see AIAgentOverlay) — avoids on/off flicker.
  const listeningDisplay = isAgentActive && !isSpeaking && !micBlocked;

  // Discoverability: a small label above the icon (dismissible), so owners can
  // always find the voice assistant without it covering the main content.
  const [showHint, setShowHint] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages]);

  const handleManualSend = () => {
    const val = inputRef.current?.value?.trim();
    if (val) { processUserInput(val); inputRef.current.value = ''; }
  };

  const stateLabel = isSpeaking
    ? pick(language, { ne: '🔊 बोल्दैछ...', en: '🔊 Speaking...', mai: '🔊 बाजि रहल...', bho: '🔊 बोलत बा...' })
    : micBlocked
      ? pick(language, { ne: '🎤 माइक थिच्नुहोस्', en: '🎤 Tap the mic', mai: '🎤 माइक थिचू', bho: '🎤 माइक दबाईं' })
      : listeningDisplay
        ? pick(language, { ne: '🎤 सुन्दैछ...', en: '🎤 Listening...', mai: '🎤 सुनि रहल...', bho: '🎤 सुनत बा...' })
        : (agentState === 'IDLE'
          ? pick(language, { ne: 'सहायक बन्द', en: 'Assistant Off', mai: 'सहायक बन्द', bho: 'सहायक बंद' })
          : pick(language, { ne: 'तयार — बोल्नुहोस्', en: 'Ready — Speak', mai: 'तैयार — बाजू', bho: 'तैयार — बोलीं' }));

  return (
    <>
      {/* Floating FAB */}
      <div className="ai-agent-fab-container shop-agent-fab-container">
        <button
          type="button"
          className={`ai-agent-fab ${isAgentActive ? 'active' : ''} ${listeningDisplay ? 'listening' : ''} ${!isAgentActive ? 'idle-pulse' : ''}`}
          onClick={() => { if (!isAgentActive) toggleAgent(); else setIsAgentPanelOpen(!isAgentPanelOpen); }}
          aria-label="Shop voice assistant"
          title={pick(language, { ne: 'बोलेर पसल चलाउनुहोस्', en: 'Manage shop by voice', mai: 'बाजिकऽ दोकान चलाउ', bho: 'बोल के दोकान चलाईं' })}
        >
          {listeningDisplay && <div className="fab-ripple-ring"></div>}
          <div className="fab-icon-inner">
            {isAgentActive ? (listeningDisplay ? <Mic size={26} className="mic-pulse" /> : <Bot size={26} />) : <Mic size={26} />}
          </div>
        </button>

        {isAgentActive ? (
          <div className="agent-status-pill" onClick={() => setIsAgentPanelOpen(!isAgentPanelOpen)}>
            <span className={`status-dot ${listeningDisplay ? 'listening' : 'ready'}`}></span>
            <span className="status-text">{stateLabel}</span>
          </div>
        ) : showHint && (
          <div className="agent-hint-bubble" onClick={toggleAgent}>
            <Sparkles size={13} />
            <span>{pick(language, { ne: 'पसल सहायक', en: 'Shop Assistant', mai: 'दोकान सहायक', bho: 'दोकान सहायक' })}</span>
            <button type="button" className="hint-close" onClick={(e) => { e.stopPropagation(); setShowHint(false); }}><X size={12} /></button>
          </div>
        )}
      </div>

      {/* Panel */}
      {isAgentPanelOpen && isAgentActive && (
        <div className="agent-panel-backdrop" onClick={() => setIsAgentPanelOpen(false)}>
          <div className="agent-panel" onClick={(e) => e.stopPropagation()}>
            <div className="agent-panel-header">
              <div className="agent-header-left">
                <div className="agent-avatar-box"><Bot size={22} /></div>
                <div>
                  <h3 className="agent-title">
                    {pick(language, { ne: 'पसल एआई सहायक', en: 'Shop AI Assistant', mai: 'दोकान एआई सहायक', bho: 'दोकान एआई सहायक' })}
                  </h3>
                  <span className={`agent-state-badge ${isSpeaking ? 'speaking' : listeningDisplay ? 'listening' : ''}`}>{stateLabel}</span>
                </div>
              </div>
              <div className="agent-header-actions">
                <button type="button" className="btn-agent-power" onClick={toggleAgent}><Power size={18} /></button>
                <button type="button" className="btn-agent-minimize" onClick={() => setIsAgentPanelOpen(false)}><ChevronDown size={20} /></button>
              </div>
            </div>

            <div className="agent-messages-area">
              {agentMessages.map((msg) => (
                <div key={msg.id} className={`agent-msg ${msg.sender === 'agent' ? 'from-agent' : 'from-user'} ${msg.type}`}>
                  <div className="msg-avatar">{msg.sender === 'agent' ? <Bot size={16} /> : <User size={16} />}</div>
                  <div className="msg-bubble">
                    <p className="msg-text">{msg.text}</p>
                    <span className="msg-time">{msg.timestamp.toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
              {isListening && transcript && (
                <div className="agent-msg from-user live-transcript">
                  <div className="msg-avatar"><Mic size={16} /></div>
                  <div className="msg-bubble"><p className="msg-text live">{transcript}...</p></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="agent-panel-footer">
              <p className="agent-handsfree-hint">
                {pick(language, {
                  ne: '✨ बोलेर सामान थप्नुहोस् वा मूल्य/स्टक बदल्नुहोस्।',
                  en: '✨ Add items or change price/stock just by speaking.',
                  mai: '✨ बाजिकऽ सामान जोड़ू वा दाम/स्टक बदलू।',
                  bho: '✨ बोल के सामान जोड़ीं भा दाम/स्टॉक बदलीं।'
                })}
              </p>
              <div className="agent-input-row">
                <input
                  type="text"
                  ref={inputRef}
                  className="agent-text-input"
                  placeholder={pick(language, { ne: 'यहाँ टाइप गर्नुहोस् वा माइक थिच्नुहोस्...', en: 'Type here or press mic...', mai: 'एतय टाइप करू...', bho: 'इहाँ टाइप करीं...' })}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleManualSend(); }}
                />
                <button type="button" className="btn-agent-send" onClick={handleManualSend}>→</button>
              </div>
              <div className="agent-mic-row">
                <button
                  type="button"
                  className={`agent-mic-btn ${listeningDisplay ? 'active' : ''}`}
                  onClick={() => { if (listeningDisplay) stopListening(); else startListening(); }}
                >
                  {listeningDisplay
                    ? <><StopCircle size={20} /> <span>{pick(language, { ne: 'रोक्नुहोस्', en: 'Stop', mai: 'रोकू', bho: 'रोकीं' })}</span></>
                    : <><Mic size={20} /> <span>{pick(language, { ne: '🎤 बोल्नुहोस्', en: '🎤 Speak', mai: '🎤 बाजू', bho: '🎤 बोलीं' })}</span></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
