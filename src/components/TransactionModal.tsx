import React, { useState, useEffect } from 'react';
import { X, Check, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Category, Transaction, TransactionType, AppSettings } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  settings: AppSettings;
  onSave: (transaction: Omit<Transaction, 'id'>, existingId?: string) => void;
  editingTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  categories,
  settings,
  onSave,
  editingTransaction,
}) => {
  if (!isOpen) return null;

  const [type, setType] = useState<TransactionType>(editingTransaction?.type || 'expense');
  const [amount, setAmount] = useState<string>(
    editingTransaction ? editingTransaction.amount.toString() : ''
  );
  const [categoryId, setCategoryId] = useState<string>('');
  const [title, setTitle] = useState<string>(editingTransaction?.title || '');
  const [date, setDate] = useState<string>(
    editingTransaction?.date || new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    editingTransaction?.paymentMethod || 'Mobile Money (MTN / Airtel / M-Pesa)'
  );
  const [notes, setNotes] = useState<string>(editingTransaction?.notes || '');
  const [recipient, setRecipient] = useState<string>(editingTransaction?.recipient || '');

  const availableCategories = categories.filter(
    (c) => c.type === type || c.type === 'both'
  );

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategoryId(editingTransaction.categoryId);
      setTitle(editingTransaction.title);
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod);
      setNotes(editingTransaction.notes || '');
      setRecipient(editingTransaction.recipient || '');
    } else {
      const first = availableCategories[0];
      if (first) {
        setCategoryId(first.id);
      }
    }
  }, [editingTransaction]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const validCats = categories.filter((c) => c.type === newType || c.type === 'both');
    if (validCats.length > 0 && !validCats.some((c) => c.id === categoryId)) {
      setCategoryId(validCats[0].id);
    }
  };

  const quickExpensePresets = [
    { label: '📱 Airtime (MTN/Airtel)', cat: 'cat-airtime' },
    { label: '🍔 Food & Snacks', cat: 'cat-food' },
    { label: '🚗 Commute & Fuel / Boda', cat: 'cat-transport' },
    { label: '⚡ Electricity Prepaid Token', cat: 'cat-utilities' },
    { label: '🎬 Cinema & Entertainment', cat: 'cat-entertainment' },
    { label: '🧸 Kids & Family Expenses', cat: 'cat-family' },
    { label: '🏠 Apartment Rent', cat: 'cat-housing' },
  ];

  const quickIncomePresets = [
    { label: '💼 Monthly Salary', cat: 'cat-salary' },
    { label: '💻 Consulting & Web Design', cat: 'cat-freelance' },
    { label: '🏪 Business Sales', cat: 'cat-business' },
    { label: '📈 Investments & Interest', cat: 'cat-investment' },
    { label: '🎁 Family Gift & Transfer', cat: 'cat-gifts' },
  ];

  const handleSelectPreset = (preset: { label: string; cat: string }) => {
    setTitle(preset.label.replace(/^.*? /, ''));
    setCategoryId(preset.cat);
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    onSave(
      {
        type,
        amount: numAmount,
        categoryId: categoryId || availableCategories[0]?.id || 'cat-other-expense',
        emoji: selectedCategory?.emoji || '🏷️',
        title: title.trim() || (type === 'expense' ? 'General Expense' : 'Income'),
        date,
        paymentMethod,
        notes: notes.trim() || undefined,
        recipient: recipient.trim() || undefined,
      },
      editingTransaction ? editingTransaction.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg theme-card rounded-2xl shadow-2xl border theme-border overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b theme-border-subtle flex items-center justify-between">
          <h3 className="text-base font-bold theme-text-primary">
            {editingTransaction ? 'Edit Transaction' : 'Record New Transaction'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:theme-text-primary hover:theme-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Segmented Control */}
          <div className="grid grid-cols-2 p-1 theme-card-subtle border theme-border-subtle rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                type === 'expense'
                  ? 'theme-card text-rose-400 shadow-xs font-bold'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Expense / Spending</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                type === 'income'
                  ? 'theme-card text-emerald-400 shadow-xs font-bold'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Income / Earnings</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold theme-text-secondary mb-1">
              Amount ({settings.currency.symbol})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm font-semibold theme-text-muted">
                {settings.currency.symbol}
              </span>
              <input
                type="number"
                step="any"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-12 pr-4 py-2.5 text-lg font-bold font-mono theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>
          </div>

          {/* Title and Quick Suggestions */}
          <div>
            <label className="block text-xs font-semibold theme-text-secondary mb-1">
              Description / Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'expense' ? 'e.g. Airtime top-up, Food, Electricity token' : 'e.g. Monthly salary, Consulting'}
              className="w-full px-3 py-2 text-sm theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(type === 'expense' ? quickExpensePresets : quickIncomePresets).map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="px-2 py-0.5 text-xs theme-card-subtle hover:theme-hover border theme-border-subtle theme-text-secondary rounded-md transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection with Emojis */}
          <div>
            <label className="block text-xs font-semibold theme-text-secondary mb-1">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1.5 border theme-border theme-card-subtle rounded-lg">
              {availableCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                        : 'border-transparent hover:theme-hover theme-text-secondary'
                    }`}
                  >
                    <span className="text-base shrink-0">{cat.emoji || '🏷️'}</span>
                    <span className="text-xs truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Payment Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold theme-text-secondary mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold theme-text-secondary mb-1">
                Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Mobile Money (MTN / Airtel / M-Pesa)">Mobile Money (MTN / Airtel / M-Pesa)</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Debit/Credit Card">Debit/Credit Card</option>
              </select>
            </div>
          </div>

          {/* Notes & Recipient */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium theme-text-muted mb-1">
                Recipient / Merchant (Optional)
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Supermarket, Landlord, Telco"
                className="w-full px-3 py-1.5 text-xs theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium theme-text-muted mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details..."
                className="w-full px-3 py-1.5 text-xs theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t theme-border-subtle flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium theme-text-muted hover:theme-hover rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold theme-btn-primary rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{editingTransaction ? 'Save Changes' : 'Record Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
