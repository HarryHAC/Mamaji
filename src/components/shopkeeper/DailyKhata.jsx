import React, { useState } from 'react';
import { useShopkeeper } from '../../context/ShopkeeperContext';
import { useApp } from '../../context/AppContext';
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
  const { t } = useApp();

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
            <Calendar size={14} /> आजको मिति: {new Date().toLocaleDateString('ne-NP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Net Today Summary Big Card */}
      <div className="khata-grand-card">
        <span className="grand-badge">आजको खुद हिसाब (Net Savings)</span>
        <h1 className="grand-amount-display">
          रु {toDevanagariNumerals(netProfit)}
        </h1>
        <p className="grand-formula-text">
          कुल आम्दानी (रु {toDevanagariNumerals(totalSales)}) - कुल खर्च (रु {toDevanagariNumerals(totalExpenses)})
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
                placeholder="रकम (रु)"
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
                <option value="Delivery">डेलिभरी पेट्रोल</option>
                <option value="Utilities">बिजुली / पानी</option>
                <option value="Supplies">पसलको प्याकिङ</option>
                <option value="Other">अन्य खर्च</option>
              </select>
            </div>
            <button type="submit" className="btn-add-expense">
              <Plus size={18} /> <span>थप्नुहोस्</span>
            </button>
          </div>
        </form>
      </div>

      {/* Expenses List */}
      <div className="expenses-history-card">
        <div className="card-header-row">
          <h3 className="card-heading">
            <Receipt size={18} /> आज भएका खर्चहरू ({shopExpenses.length})
          </h3>
          <span className="total-exp-tag">
            जम्मा खर्च: रु {toDevanagariNumerals(totalExpenses)}
          </span>
        </div>

        {shopExpenses.length === 0 ? (
          <p className="no-expenses-text">आज कुनै खर्च रेकर्ड गरिएको छैन।</p>
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
