import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LANGUAGES } from '../../constants/translations';
import { Globe, ChevronDown } from 'lucide-react';

export default function LanguagePicker({ compact = false }) {
  const { language, setLanguage } = useApp();
  const [open, setOpen] = useState(false);

  const langs = Object.values(LANGUAGES);
  const current = langs.find(l => l.code === language) || langs[0];

  // Compact mode (navbar): a single flag button that opens a small dropdown,
  // so it doesn't crowd the navbar on narrow phones.
  if (compact) {
    return (
      <div className="lang-compact-wrap">
        <button
          type="button"
          className="lang-compact-btn"
          onClick={() => setOpen(o => !o)}
          aria-label="Change language"
        >
          <span className="flag">{current.flag}</span>
          <ChevronDown size={13} />
        </button>
        {open && (
          <>
            <div className="lang-compact-backdrop" onClick={() => setOpen(false)} />
            <div className="lang-compact-menu">
              {langs.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  className={`lang-compact-item ${language === lang.code ? 'active' : ''}`}
                  onClick={() => { setLanguage(lang.code); setOpen(false); }}
                >
                  <span className="flag">{lang.flag}</span>
                  <span className="text">{lang.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Full mode (auth / role select): a row of language buttons.
  return (
    <div className="lang-picker-container">
      <span className="lang-label">
        <Globe size={16} />
      </span>
      <div className="lang-buttons">
        {langs.map((lang) => (
          <button
            key={lang.code}
            type="button"
            className={`lang-btn ${language === lang.code ? 'active' : ''}`}
            onClick={() => setLanguage(lang.code)}
          >
            <span className="flag">{lang.flag}</span>
            <span className="text">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
