import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { pick } from '../utils/i18n';

// WalletProvider sits outside AppProvider, so it can't use useApp() for the
// language — read the saved language directly instead.
const lang = () => localStorage.getItem('apna_lang') || 'ne';

/*
 * In-app wallet — Mama Ji's own payment system (no third-party gateway).
 * Each user has a wallet in localStorage (apna_wallet_<uid>): a balance, an
 * optional linked bank, and a transaction log. Customers pay shop owners
 * wallet-to-wallet; money is loaded from / withdrawn to a linked bank
 * (simulated). Owners can raise a payment request (amount + code / QR).
 */

const WalletContext = createContext();

const walletKey = (uid) => `apna_wallet_${uid}`;

function readWallet(uid) {
  try {
    const raw = localStorage.getItem(walletKey(uid));
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { balance: 0, bank: null, txns: [] };
}

function writeWallet(uid, w) {
  localStorage.setItem(walletKey(uid), JSON.stringify(w));
}

function addTxn(w, type, amount, note) {
  const txn = {
    id: 'txn-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    type, amount, note: note || '', at: new Date().toISOString(),
    balanceAfter: w.balance
  };
  w.txns = [txn, ...(w.txns || [])].slice(0, 200);
  return w;
}

export function WalletProvider({ children }) {
  const { currentUser } = useAuth();
  const [wallet, setWallet] = useState({ balance: 0, bank: null, txns: [] });

  const uid = currentUser?.id || null;

  const reload = useCallback(() => {
    if (uid) setWallet(readWallet(uid));
    else setWallet({ balance: 0, bank: null, txns: [] });
  }, [uid]);

  useEffect(() => { reload(); }, [reload]);

  // Load money from the linked bank into the wallet (simulated).
  const addMoney = useCallback((amount) => {
    const amt = Math.round(Number(amount) || 0);
    if (!uid || amt <= 0) return { success: false, error: 'invalid amount' };
    const w = readWallet(uid);
    w.balance += amt;
    addTxn(w, 'load', amt, `${w.bank ? w.bank.name + ' ' : ''}${pick(lang(), { ne: w.bank ? 'बाट लोड' : 'बैंकबाट लोड', hi: 'से लोड', en: 'loaded', mai: 'सँ लोड', bho: 'से लोड' })}`);
    writeWallet(uid, w);
    setWallet({ ...w });
    return { success: true };
  }, [uid]);

  // Withdraw to the linked bank (simulated).
  const withdraw = useCallback((amount) => {
    const amt = Math.round(Number(amount) || 0);
    if (!uid || amt <= 0) return { success: false, error: 'invalid amount' };
    const w = readWallet(uid);
    if (!w.bank) return { success: false, error: 'no-bank' };
    if (w.balance < amt) return { success: false, error: 'insufficient' };
    w.balance -= amt;
    addTxn(w, 'withdraw', amt, `${w.bank.name} ${pick(lang(), { ne: 'मा झिकियो', hi: 'में निकाला', en: 'withdrawn', mai: 'मे निकालल', bho: 'में निकालल' })}`);
    writeWallet(uid, w);
    setWallet({ ...w });
    return { success: true };
  }, [uid]);

  const linkBank = useCallback((bank) => {
    if (!uid) return { success: false };
    const w = readWallet(uid);
    w.bank = { name: bank.name || '', account: bank.account || '', holder: bank.holder || '' };
    addTxn(w, 'link', 0, `${w.bank.name} ${pick(lang(), { ne: 'लिङ्क गरियो', hi: 'लिंक किया', en: 'linked', mai: 'लिंक भेल', bho: 'लिंक भइल' })}`);
    writeWallet(uid, w);
    setWallet({ ...w });
    return { success: true };
  }, [uid]);

  // Pay another user (e.g. a shop) wallet-to-wallet.
  const pay = useCallback((amount, toUid, note) => {
    const amt = Math.round(Number(amount) || 0);
    if (!uid || amt <= 0) return { success: false, error: 'invalid' };
    const payer = readWallet(uid);
    if (payer.balance < amt) return { success: false, error: 'insufficient' };
    payer.balance -= amt;
    addTxn(payer, 'pay', amt, note || pick(lang(), { ne: 'भुक्तानी', hi: 'भुगतान', en: 'Payment', mai: 'भुगतान', bho: 'भुगतान' }));
    writeWallet(uid, payer);
    setWallet({ ...payer });
    // Credit the payee's wallet (a shop owner) directly in their storage.
    if (toUid) {
      const payee = readWallet(toUid);
      payee.balance += amt;
      addTxn(payee, 'receive', amt, note || pick(lang(), { ne: 'ग्राहकबाट भुक्तानी', hi: 'ग्राहक से भुगतान', en: 'Payment from customer', mai: 'ग्राहकसँ भुगतान', bho: 'ग्राहक से भुगतान' }));
      writeWallet(toUid, payee);
    }
    return { success: true };
  }, [uid]);

  const hasBalance = useCallback((amount) => wallet.balance >= Math.round(Number(amount) || 0), [wallet.balance]);

  return (
    <WalletContext.Provider value={{
      balance: wallet.balance,
      bank: wallet.bank,
      txns: wallet.txns || [],
      addMoney, withdraw, linkBank, pay, hasBalance, reload
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
