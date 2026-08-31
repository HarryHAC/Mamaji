import React, { useState } from 'react';
import { useShopkeeper } from '../../context/ShopkeeperContext';
import { useApp } from '../../context/AppContext';
import { pick } from '../../utils/i18n';
import { toDevanagariNumerals } from '../../utils/deliveryCalculator';
import {
  DollarSign,
  Plus,
  TrendingUp,
  CreditCard,
  Banknote,
  Truck,
  Receipt,
  Trash2,
  Calendar,
  PieChart
} from 'lucide-react';

export default function DailyKhata() {
  const {
    shopData,
    expenses,
    addExpense,
    totalSales,
    cashSales,
    onlineSales,
    deliveryEarnings,
    totalExpenses,
    netProfit
  } = useShopkeeper();
  const { t, language } = useApp();

  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Delivery');

  const shopExpenses = expenses.filter(e => e.shopId === shopData.id);

  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) return;
    addExpense(expenseTitle, expenseAmount, expenseCategory);
    setExpenseTitle('');
    setExpenseAmount('');
  };

  return (
    <div className="daily-khata-section">
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <DollarSign size={20} className="section-icon" /> {t.khataTitle}
          </h2>
          <p className="section-subtitle">
            <Calendar size={14} /> {pick(language, { ne: 'आजको मिति', hi: 'आज की तारीख', en: "Today's date", mai: 'आजुक मिति', bho: 'आज के तारीख' })}: {new Date().toLocaleDateString(language === 'en' ? 'en-US' : language === 'hi' ? 'hi-IN' : 'ne-NP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Net Today Summary Big Card */}
      <div className="khata-grand-card">
        <span className="grand-badge">{pick(language, { ne: 'आजको खुद हिसाब', hi: 'आज का शुद्ध लाभ', en: 'Net Savings Today', mai: 'आजुक शुद्ध बचत', bho: 'आज के शुद्ध बचत' })}</span>
        <h1 className="grand-amount-display">
          रु {toDevanagariNumerals(netProfit)}
        </h1>
        <p className="grand-formula-text">
          {pick(language, { ne: 'कुल आम्दानी', hi: 'कुल आय', en: 'Total income', mai: 'कुल आमदनी', bho: 'कुल आमदनी' })} (रु {toDevanagariNumerals(totalSales)}) - {pick(language, { ne: 'कुल खर्च', hi: 'कुल खर्च', en: 'total expenses', mai: 'कुल खर्च', bho: 'कुल खरचा' })} (रु {toDevanagariNumerals(totalExpenses)})
        </p>
      </div>

      {/* Income Breakdown Cards */}
      <div className="khata-breakdown-grid">
        {/* Total Sales */}
        <div className="khata-stat-card income">
          <div className="icon-wrap income">
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <span className="label">{t.todaySales}</span>
            <h3 className="value">रु {toDevanagariNumerals(totalSales)}</h3>
          </div>
        </div>

        {/* Cash Sales */}
        <div className="khata-stat-card cash">
          <div className="icon-wrap cash">
            <Banknote size={22} />
          </div>
          <div className="stat-info">
            <span className="label">{t.cashSales}</span>
            <h3 className="value">रु {toDevanagariNumerals(cashSales)}</h3>
          </div>
        </div>

        {/* Online Payments */}
        <div className="khata-stat-card online">
          <div className="icon-wrap online">
            <CreditCard size={22} />
          </div>
          <div className="stat-info">
            <span className="label">{t.onlineSales}</span>
            <h3 className="value">रु {toDevanagariNumerals(onlineSales)}</h3>
          </div>
        </div>

        {/* Delivery Charges Earnings */}
        <div className="khata-stat-card delivery">
          <div className="icon-wrap delivery">
            <Truck size={22} />
          </div>
          <div className="stat-info">
            <span className="label">{t.deliveryEarnings}</span>
            <h3 className="value">रु {toDevanagariNumerals(deliveryEarnings)}</h3>
          </div>
        </div>
      </div>

      {/* Add Expense Form */}
      <div className="add-expense-card">
        <h3 className="card-heading">
          <Plus size={18} /> {t.addExpense}
        </h3>
        <form onSubmit={handleAddExpenseSubmit} className="expense-form">
          <div className="expense-inputs-row">
            <div className="input-field-wrap grow">
              <input
                type="text"
                required
                className="form-input"
                placeholder={t.expenseTitle}
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
              />
            </div>
            <div className="input-field-wrap price">
              <input
                type="number"
                required
                min="1"
                className="form-input"
                placeholder={pick(language, { ne: 'रकम (रु)', hi: 'राशि (रु)', en: 'Amount (Rs)', mai: 'रकम (रु)', bho: 'रकम (रु)' })}
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>
            <div className="input-field-wrap cat">
              <select
                className="form-input"
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
              >
                <option value="Delivery">{pick(language, { ne: 'डेलिभरी पेट्रोल', hi: 'डिलीवरी पेट्रोल', en: 'Delivery / Fuel', mai: 'डेलिभरी पेट्रोल', bho: 'डेलिभरी पेट्रोल' })}</option>
                <option value="Utilities">{pick(language, { ne: 'बिजुली / पानी', hi: 'बिजली / पानी', en: 'Electricity / Water', mai: 'बिजली / पानी', bho: 'बिजली / पानी' })}</option>
                <option value="Supplies">{pick(language, { ne: 'पसलको प्याकिङ', hi: 'दुकान की पैकिंग', en: 'Shop supplies', mai: 'दोकानक पैकिंग', bho: 'दोकान के पैकिंग' })}</option>
                <option value="Other">{pick(language, { ne: 'अन्य खर्च', hi: 'अन्य खर्च', en: 'Other expense', mai: 'अन्य खर्च', bho: 'अन्य खरचा' })}</option>
              </select>
            </div>
            <button type="submit" className="btn-add-expense">
              <Plus size={18} /> <span>{pick(language, { ne: 'थप्नुहोस्', hi: 'जोड़ें', en: 'Add', mai: 'जोड़ू', bho: 'जोड़ीं' })}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Expenses List */}
      <div className="expenses-history-card">
        <div className="card-header-row">
          <h3 className="card-heading">
            <Receipt size={18} /> {pick(language, { ne: 'आज भएका खर्चहरू', hi: 'आज के खर्च', en: "Today's expenses", mai: 'आजुक खर्च', bho: 'आज के खरचा' })} ({shopExpenses.length})
          </h3>
          <span className="total-exp-tag">
            {pick(language, { ne: 'जम्मा खर्च', hi: 'कुल खर्च', en: 'Total expense', mai: 'जम्मा खर्च', bho: 'कुल खरचा' })}: रु {toDevanagariNumerals(totalExpenses)}
          </span>
        </div>

        {shopExpenses.length === 0 ? (
          <p className="no-expenses-text">{pick(language, { ne: 'आज कुनै खर्च रेकर्ड गरिएको छैन।', hi: 'आज कोई खर्च दर्ज नहीं किया गया।', en: 'No expenses recorded today.', mai: 'आजु कोनो खर्च दर्ज नै भेल।', bho: 'आज कवनो खरचा दर्ज नइखे भइल।' })}</p>
        ) : (
          <div className="expenses-table">
            {shopExpenses.map((exp) => (
              <div key={exp.id} className="expense-table-row">
                <div className="exp-info">
                  <h4 className="exp-title">{exp.title}</h4>
                  <span className="exp-cat-badge">{exp.category}</span>
                </div>
                <div className="exp-amount">
                  - रु {toDevanagariNumerals(exp.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
