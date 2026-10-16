import React, { useState } from 'react';
import { X, Smartphone, Zap, Check } from 'lucide-react';
import { Category, PaymentMethod, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { AppSettings } from '../types';

interface QuickAirtimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  airtimeCategory?: Category;
  settings: AppSettings;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

export const QuickAirtimeModal: React.FC<QuickAirtimeModalProps> = ({
  isOpen,
  onClose,
  airtimeCategory,
  settings,
  onAddTransaction,
}) => {
  if (!isOpen) return null;

  const [amount, setAmount] = useState<string>('5000');
  const [provider, setProvider] = useState<string>('MTN Uganda');
  const [purpose, setPurpose] = useState<string>('Airtime Top-up');
  const [paymentMethod, setPaymentMethod] = useState<string>('Mobile Money (MTN / Airtel / M-Pesa)');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isDone, setIsDone] = useState(false);

  // Ugandan Shilling common airtime and bundle denominations
  const presetAmounts = [2000, 5000, 10000, 20000, 35000, 50000];
  const commonPurposes = [
    'Daily Airtime Call & SMS',
    'Emergency 2,000 Airtime Top-up',
    'Weekly 3GB Data Bundle',
    'Monthly 15GB Internet Plan',
    'Voice Calling Minutes',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    onAddTransaction({
      type: 'expense',
      amount: numAmount,
      categoryId: airtimeCategory ? airtimeCategory.id : 'cat-airtime',
      title: `${purpose}${provider ? ` (${provider})` : ''}`,
      emoji: '📱',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      paymentMethod,
      notes: notes || (phoneNumber ? `Top-up for: ${phoneNumber}` : undefined),
      recipient: phoneNumber || provider,
    });

    setIsDone(true);
    setTimeout(() => {
      setIsDone(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-md theme-card rounded-2xl shadow-2xl border theme-border overflow-hidden">
        {/* Header */}
        <div className="bg-sky-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <h3 className="font-semibold text-base leading-tight">Log Airtime &amp; Internet</h3>
              <p className="text-xs text-sky-100">Quick telco top-up expense entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-sky-200 hover:text-white hover:bg-sky-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount presets */}
          <div>
            <label className="block text-xs font-semibold theme-text-secondary mb-2">
              Select Amount ({settings.currency.symbol})
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2">
              {presetAmounts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p.toString())}
                  className={`py-2 text-xs font-mono font-medium rounded-lg border transition-colors ${
                    amount === p.toString()
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'theme-card-subtle theme-text-primary theme-border hover:theme-hover'
                  }`}
                >
                  {p.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-medium theme-text-muted">
                {settings.currency.symbol}
              </span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Or custom amount"
                className="w-full pl-12 pr-3 py-2 text-sm theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Quick Purpose Selection */}
          <div>
            <label className="block text-xs font-semibold theme-text-secondary mb-1.5">
              Top-up Purpose
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {commonPurposes.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPurpose(p)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                    purpose === p
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'theme-card-subtle theme-text-secondary theme-border-subtle hover:theme-hover'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Or enter title (e.g. 500MB Data bundle)"
              className="w-full px-3 py-1.5 text-xs theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Provider / Network */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold theme-text-secondary mb-1">
                Network Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="MTN Uganda">MTN Uganda</option>
                <option value="Airtel Uganda">Airtel Uganda</option>
                <option value="Safaricom">Safaricom</option>
                <option value="Vodafone">Vodafone</option>
                <option value="Lycamobile">Lycamobile</option>
                <option value="Other Provider">Other Telco</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold theme-text-secondary mb-1">
                Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Mobile Money (MTN / Airtel / M-Pesa)">Mobile Money</option>
                <option value="Cash">Cash</option>
                <option value="Debit/Credit Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Optional phone number */}
          <div>
            <label className="block text-xs font-medium theme-text-muted mb-1">
              Phone Number / Recipient (Optional)
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. +256 772 123 456"
              className="w-full px-3 py-1.5 text-xs theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium theme-text-muted hover:theme-hover rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDone}
              className="px-5 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {isDone ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Logged!</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Log Airtime ({formatCurrency(parseFloat(amount) || 0, settings.currency)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
