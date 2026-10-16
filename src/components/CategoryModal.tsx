import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Category, TransactionType, AppSettings } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (category: Omit<Category, 'id'>, existingId?: string) => void;
  editingCategory?: Category | null;
}

const PRESET_EMOJIS = [
  '📱', '🍔', '🚗', '⚡', '🎬', '💻', '🧸', '🏠', '🛍️', '💊', '💼', '🏪', '📈', '🎁', '☕', '✈️', '🏋️', '📚', '🍕', '🏷️'
];

const PRESET_COLORS = [
  '#0284c7', // Sky
  '#2563eb', // Blue
  '#4f46e5', // Indigo
  '#7c3aed', // Violet
  '#9333ea', // Purple
  '#c026d3', // Fuchsia
  '#e11d48', // Rose
  '#ef4444', // Red
  '#ea580c', // Orange
  '#d97706', // Amber
  '#eab308', // Yellow
  '#16a34a', // Emerald
  '#0d9488', // Teal
  '#0891b2', // Cyan
  '#475569', // Slate
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  editingCategory,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState<string>(editingCategory?.name || '');
  const [type, setType] = useState<TransactionType>(
    editingCategory?.type === 'income' ? 'income' : 'expense'
  );
  const [emoji, setEmoji] = useState<string>(editingCategory?.emoji || '🏷️');
  const [icon, setIcon] = useState<string>(editingCategory?.icon || 'Tag');
  const [color, setColor] = useState<string>(editingCategory?.color || PRESET_COLORS[0]);
  const [monthlyBudget, setMonthlyBudget] = useState<string>(
    editingCategory?.monthlyBudget ? editingCategory.monthlyBudget.toString() : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedBudget = monthlyBudget ? parseFloat(monthlyBudget) : undefined;

    onSave(
      {
        name: name.trim(),
        type,
        icon,
        emoji,
        color,
        isCustom: true,
        monthlyBudget: parsedBudget && parsedBudget > 0 ? parsedBudget : undefined,
      },
      editingCategory?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md theme-card rounded-2xl shadow-2xl border theme-border overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b theme-border-subtle flex items-center justify-between">
          <h3 className="text-base font-bold theme-text-primary">
            {editingCategory ? 'Edit Category' : 'Create Custom Category'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:theme-text-primary hover:theme-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category Type */}
          <div className="grid grid-cols-2 p-1 theme-card-subtle border theme-border-subtle rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'expense'
                  ? 'theme-card theme-text-primary font-bold shadow-xs'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              Expense Category
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'income'
                  ? 'theme-card theme-text-primary font-bold shadow-xs'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              Income Category
            </button>
          </div>

          {/* Name & Emoji Indicator */}
          <div>
            <label className="block text-xs font-semibold theme-text-secondary mb-1">
              Category Name &amp; Emoji
            </label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl theme-card-subtle border theme-border flex items-center justify-center text-2xl shrink-0">
                <span>{emoji}</span>
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Internet Bundles, Side Hustle"
                className="flex-1 px-3 py-2 text-sm theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>
          </div>

          {/* Emoji Picker */}
          <div>
            <label className="block text-xs font-semibold theme-text-secondary mb-1.5">
              Select Category Emoji
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2 theme-card-subtle border theme-border-subtle rounded-xl">
              {PRESET_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`h-9 rounded-lg text-lg flex items-center justify-center transition-transform ${
                    emoji === em ? 'scale-125 bg-emerald-500/20 ring-1 ring-emerald-500' : 'hover:scale-110'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-semibold theme-text-secondary mb-2">
              Color Accent
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-emerald-400 ring-offset-2' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Monthly Budget Limit */}
          {type === 'expense' && (
            <div>
              <label className="block text-xs font-semibold theme-text-secondary mb-1">
                Monthly Spending Budget Limit (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-medium theme-text-muted">
                  {settings.currency.symbol}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full pl-12 pr-3 py-2 text-xs theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
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
              className="px-5 py-2 text-xs font-bold theme-btn-primary rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
