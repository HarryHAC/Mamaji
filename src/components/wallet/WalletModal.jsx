import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { pick } from '../../utils/i18n';
import { toDevanagariNumerals } from '../../utils/deliveryCalculator';
import { generateQrMatrix } from '../../utils/qrcode';
import { X, Wallet, Plus, ArrowDownToLine, Landmark, QrCode, ArrowRight, CheckCircle2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

// Simple shared store of payment requests (owner asks, customer pays by code).
const reqKey = 'apna_pay_requests';
function readReqs() { try { return JSON.parse(localStorage.getItem(reqKey) || '[]'); } catch (e) { return []; } }
function writeReqs(list) { localStorage.setItem(reqKey, JSON.stringify(list)); }

// Renders a real, scannable QR code for the given text.
function QrView({ text }) {
  let matrix = null;
  try { matrix = generateQrMatrix(text); } catch (e) { matrix = null; }
  if (!matrix) return null;
  const size = matrix.length;
  return (
    <div className="qr-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {matrix.flatMap((row, r) => row.map((on, c) => (
        <span key={`${r}-${c}`} className={on ? 'qr-cell on' : 'qr-cell'} />
      )))}
    </div>
  );
}

export default function WalletModal({ open, onClose }) {
  const { balance, bank, txns, addMoney, withdraw, linkBank, pay } = useWallet();
  const { language, t, showToast, role } = useApp();
  const { currentUser } = useAuth();

  const [view, setView] = useState('home'); // home | add | withdraw | bank | request | paycode
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState(bank?.name || '');
  const [bankAcc, setBankAcc] = useState(bank?.account || '');
  const [genReq, setGenReq] = useState(null);
  const [payCode, setPayCode] = useState('');
  const [msg, setMsg] = useState('');

  if (!open) return null;
  const L = (o) => pick(language, o);
  const num = (n) => toDevanagariNumerals(n);

  const reset = () => { setAmount(''); setMsg(''); };

  const doAdd = () => {
    const r = addMoney(amount);
    if (r.success) { showToast(L({ ne: 'पैसा लोड भयो', en: 'Money added', mai: 'पैसा लोड भेल', bho: 'पैसा लोड भइल' })); setView('home'); reset(); }
    else setMsg(L({ ne: 'मान्य रकम हाल्नुहोस्', en: 'Enter a valid amount', mai: 'सही रकम दिअ\'', bho: 'सही रकम दीं' }));
  };
  const doWithdraw = () => {
    const r = withdraw(amount);
    if (r.success) { showToast(L({ ne: 'बैंकमा पठाइयो', en: 'Sent to bank', mai: 'बैंक पठाओल', bho: 'बैंक भेजल' })); setView('home'); reset(); }
    else setMsg(r.error === 'no-bank' ? L({ ne: 'पहिले बैंक लिङ्क गर्नुहोस्', en: 'Link a bank first', mai: 'पहिने बैंक लिङ्क करू', bho: 'पहिले बैंक लिंक करीं' })
      : r.error === 'insufficient' ? L({ ne: 'पर्याप्त ब्यालेन्स छैन', en: 'Not enough balance', mai: 'बैलेंस कम अछि', bho: 'बैलेंस कम बा' })
      : L({ ne: 'मान्य रकम हाल्नुहोस्', en: 'Enter a valid amount', mai: 'सही रकम दिअ\'', bho: 'सही रकम दीं' }));
  };
  const doLink = () => {
    if (!bankName.trim() || !bankAcc.trim()) { setMsg(L({ ne: 'बैंक विवरण भर्नुहोस्', en: 'Fill bank details', mai: 'बैंक विवरण भरू', bho: 'बैंक विवरण भरीं' })); return; }
    linkBank({ name: bankName, account: bankAcc, holder: currentUser?.name });
    showToast(L({ ne: 'बैंक लिङ्क भयो', en: 'Bank linked', mai: 'बैंक लिङ्क भेल', bho: 'बैंक लिंक भइल' }));
    setView('home');
  };
  const doGenReq = () => {
    const amt = Math.round(Number(amount) || 0);
    if (amt <= 0) { setMsg(L({ ne: 'रकम हाल्नुहोस्', en: 'Enter amount', mai: 'रकम दिअ\'', bho: 'रकम दीं' })); return; }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const req = { code, amount: amt, ownerId: currentUser?.id, ownerName: currentUser?.name, at: new Date().toISOString(), paid: false };
    const list = readReqs(); list.unshift(req); writeReqs(list);
    setGenReq(req); setMsg('');
  };
  const doPayCode = () => {
    const list = readReqs();
    const idx = list.findIndex(r => r.code === payCode.trim() && !r.paid);
    if (idx === -1) { setMsg(L({ ne: 'कोड मिलेन वा भुक्तानी भइसक्यो', en: 'Invalid or already-paid code', mai: 'कोड गलत वा भुगतान भऽ गेल', bho: 'कोड गलत भा भुगतान हो गइल' })); return; }
    const req = list[idx];
    const r = pay(req.amount, req.ownerId, L({ ne: 'QR/कोड भुक्तानी', en: 'QR/code payment', mai: 'QR/कोड भुगतान', bho: 'QR/कोड भुगतान' }));
    if (!r.success) { setMsg(L({ ne: 'ब्यालेन्स पुगेन', en: 'Not enough balance', mai: 'बैलेंस कम', bho: 'बैलेंस कम' })); return; }
    list[idx] = { ...req, paid: true }; writeReqs(list);
    showToast(L({ ne: `रु ${num(req.amount)} भुक्तानी भयो`, en: `Paid NPR ${req.amount}`, mai: `रु ${num(req.amount)} भुगतान`, bho: `रु ${num(req.amount)} भुगतान` }));
    setPayCode(''); setView('home');
  };

  const txnLabel = (ty) => ({
    load: L({ ne: 'लोड', en: 'Added', mai: 'लोड', bho: 'लोड' }),
    withdraw: L({ ne: 'झिकेको', en: 'Withdrawn', mai: 'निकासी', bho: 'निकासी' }),
    pay: L({ ne: 'भुक्तानी', en: 'Paid', mai: 'भुगतान', bho: 'भुगतान' }),
    receive: L({ ne: 'प्राप्त', en: 'Received', mai: 'प्राप्त', bho: 'प्राप्त' }),
    link: L({ ne: 'बैंक लिङ्क', en: 'Bank linked', mai: 'बैंक लिङ्क', bho: 'बैंक लिंक' })
  }[ty] || ty);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wallet-header">
          <div className="wallet-head-left"><Wallet size={20} /> <span>{L({ ne: 'वालेट', en: 'Wallet', mai: 'वालेट', bho: 'वालेट' })}</span></div>
          <button type="button" className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Balance card */}
        <div className="wallet-balance-card">
          <span className="wb-label">{L({ ne: 'ब्यालेन्स', en: 'Balance', mai: 'बैलेंस', bho: 'बैलेंस' })}</span>
          <span className="wb-amount">रु {num(balance)}</span>
          {bank && <span className="wb-bank"><Landmark size={12} /> {bank.name} · {bank.account}</span>}
        </div>

        {view === 'home' && (
          <>
            <div className="wallet-actions-grid">
              <button className="wallet-action" onClick={() => { setView('add'); reset(); }}><Plus size={18} /><span>{L({ ne: 'पैसा हाल्नुहोस्', en: 'Add Money', mai: 'पैसा हालू', bho: 'पैसा डालीं' })}</span></button>
              <button className="wallet-action" onClick={() => { setView('withdraw'); reset(); }}><ArrowDownToLine size={18} /><span>{L({ ne: 'झिक्नुहोस्', en: 'Withdraw', mai: 'निकासी', bho: 'निकासी' })}</span></button>
              <button className="wallet-action" onClick={() => { setView('bank'); reset(); }}><Landmark size={18} /><span>{L({ ne: 'बैंक लिङ्क', en: 'Link Bank', mai: 'बैंक लिङ्क', bho: 'बैंक लिंक' })}</span></button>
              {role === 'shopkeeper'
                ? <button className="wallet-action" onClick={() => { setView('request'); setGenReq(null); reset(); }}><QrCode size={18} /><span>{L({ ne: 'भुक्तानी माग्नुहोस्', en: 'Request Pay', mai: 'भुगतान मांगू', bho: 'भुगतान मांगीं' })}</span></button>
                : <button className="wallet-action" onClick={() => { setView('paycode'); setMsg(''); }}><QrCode size={18} /><span>{L({ ne: 'कोडले तिर्नुहोस्', en: 'Pay by Code', mai: 'कोडसँ तिरू', bho: 'कोड से दीं' })}</span></button>}
            </div>

            <div className="wallet-txns">
              <p className="wallet-txns-title">{L({ ne: 'कारोबार', en: 'Transactions', mai: 'लेनदेन', bho: 'लेनदेन' })}</p>
              {(!txns || txns.length === 0) ? (
                <p className="wallet-empty">{L({ ne: 'अहिलेसम्म कुनै कारोबार छैन', en: 'No transactions yet', mai: 'एखन धरि किछु नै', bho: 'अभी ले कुछु नइखे' })}</p>
              ) : (
                <ul className="wallet-txn-list">
                  {txns.slice(0, 20).map(tx => {
                    const credit = tx.type === 'load' || tx.type === 'receive';
                    return (
                      <li key={tx.id} className="wallet-txn">
                        <span className={`txn-icon ${credit ? 'in' : 'out'}`}>{credit ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}</span>
                        <span className="txn-mid"><strong>{txnLabel(tx.type)}</strong><small>{tx.note}</small></span>
                        {tx.type !== 'link' && <span className={`txn-amt ${credit ? 'in' : 'out'}`}>{credit ? '+' : '−'}रु {num(tx.amount)}</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}

        {(view === 'add' || view === 'withdraw') && (
          <div className="wallet-form">
            <label className="form-label">{L({ ne: 'रकम (रु)', en: 'Amount (NPR)', mai: 'रकम (रु)', bho: 'रकम (रु)' })}</label>
            <input type="number" min="1" className="form-input" placeholder="500" value={amount} onChange={e => setAmount(e.target.value)} />
            {msg && <p className="wallet-msg-error">{msg}</p>}
            <div className="wallet-form-btns">
              <button className="btn-cancel" onClick={() => { setView('home'); reset(); }}>{t.cancel}</button>
              <button className="btn-save-product" onClick={view === 'add' ? doAdd : doWithdraw}><span>{view === 'add' ? L({ ne: 'लोड गर्नुहोस्', en: 'Add', mai: 'लोड', bho: 'लोड' }) : L({ ne: 'झिक्नुहोस्', en: 'Withdraw', mai: 'निकासी', bho: 'निकासी' })}</span><ArrowRight size={16} /></button>
            </div>
          </div>
        )}

        {view === 'bank' && (
          <div className="wallet-form">
            <label className="form-label">{L({ ne: 'बैंक/वालेट नाम', en: 'Bank / Wallet name', mai: 'बैंक नाम', bho: 'बैंक नाम' })}</label>
            <input type="text" className="form-input" placeholder="Nabil Bank / eSewa" value={bankName} onChange={e => setBankName(e.target.value)} />
            <label className="form-label">{L({ ne: 'खाता/आईडी नम्बर', en: 'Account / ID number', mai: 'खाता नंबर', bho: 'खाता नंबर' })}</label>
            <input type="text" className="form-input" placeholder="01201017500123" value={bankAcc} onChange={e => setBankAcc(e.target.value)} />
            {msg && <p className="wallet-msg-error">{msg}</p>}
            <div className="wallet-form-btns">
              <button className="btn-cancel" onClick={() => setView('home')}>{t.cancel}</button>
              <button className="btn-save-product" onClick={doLink}><CheckCircle2 size={16} /><span>{L({ ne: 'लिङ्क', en: 'Link', mai: 'लिङ्क', bho: 'लिंक' })}</span></button>
            </div>
          </div>
        )}

        {view === 'request' && (
          <div className="wallet-form">
            {!genReq ? (
              <>
                <label className="form-label">{L({ ne: 'माग्ने रकम (रु)', en: 'Amount to request (NPR)', mai: 'मांगय रकम', bho: 'मांगे के रकम' })}</label>
                <input type="number" min="1" className="form-input" placeholder="500" value={amount} onChange={e => setAmount(e.target.value)} />
                {msg && <p className="wallet-msg-error">{msg}</p>}
                <div className="wallet-form-btns">
                  <button className="btn-cancel" onClick={() => setView('home')}>{t.cancel}</button>
                  <button className="btn-save-product" onClick={doGenReq}><QrCode size={16} /><span>{L({ ne: 'QR बनाउनुहोस्', en: 'Create QR', mai: 'QR बनाउ', bho: 'QR बनाईं' })}</span></button>
                </div>
              </>
            ) : (
              <div className="wallet-qr-box">
                <QrView text={`mamaji:pay?code=${genReq.code}&amt=${genReq.amount}`} />
                <p className="qr-amount">रु {num(genReq.amount)}</p>
                <p className="qr-code-line">{L({ ne: 'भुक्तानी कोड', en: 'Pay code', mai: 'भुगतान कोड', bho: 'भुगतान कोड' })}: <strong>{genReq.code}</strong></p>
                <p className="qr-help">{L({ ne: 'ग्राहकलाई यो QR स्क्यान गर्न वा कोड हाल्न भन्नुहोस्।', en: 'Ask the customer to scan this QR or enter the code.', mai: 'ग्राहकके ई QR स्कैन वा कोड देब कहू।', bho: 'ग्राहक के ई QR स्कैन भा कोड डाले कहीं।' })}</p>
                <button className="btn-cancel" onClick={() => setView('home')}>{L({ ne: 'बन्द', en: 'Close', mai: 'बन्द', bho: 'बंद' })}</button>
              </div>
            )}
          </div>
        )}

        {view === 'paycode' && (
          <div className="wallet-form">
            <label className="form-label">{L({ ne: 'भुक्तानी कोड हाल्नुहोस्', en: 'Enter pay code', mai: 'भुगतान कोड दिअ\'', bho: 'भुगतान कोड दीं' })}</label>
            <input type="text" inputMode="numeric" className="form-input" placeholder="123456" value={payCode} onChange={e => setPayCode(e.target.value)} />
            {msg && <p className="wallet-msg-error">{msg}</p>}
            <div className="wallet-form-btns">
              <button className="btn-cancel" onClick={() => setView('home')}>{t.cancel}</button>
              <button className="btn-save-product" onClick={doPayCode}><span>{L({ ne: 'तिर्नुहोस्', en: 'Pay', mai: 'तिरू', bho: 'दीं' })}</span><ArrowRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
