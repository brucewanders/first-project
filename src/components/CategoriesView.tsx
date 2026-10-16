import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react';
import { Category, Transaction, AppSettings, ExchangeRatesData } from '../types';
import { formatCurrency } from '../utils/formatters';

interface CategoriesViewProps {
  categories: Category[];
  transactions: Transaction[];
  settings: AppSettings;
  exchangeRates?: ExchangeRatesData | null;
  onOpenAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onResetCategories: () => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  transactions,
  settings,
  exchangeRates,
  onOpenAddCategory,
  onEditCategory,
  onDeleteCategory,
  onResetCategories,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income'>('all');
  const [deleteConfirmCatId, setDeleteConfirmCatId] = useState<string | null>(null);

  const txCountMap: Record<string, number> = {};
  const txTotalMap: Record<string, number> = {};
  transactions.forEach((tx) => {
    txCountMap[tx.categoryId] = (txCountMap[tx.categoryId] || 0) + 1;
    txTotalMap[tx.categoryId] = (txTotalMap[tx.categoryId] || 0) + tx.amount;
  });

  const displayedCategories = categories.filter((cat) => {
    if (activeTab === 'expense') return cat.type === 'expense' || cat.type === 'both';
    if (activeTab === 'income') return cat.type === 'income' || cat.type === 'both';
    return true;
  });

  const expenseCount = categories.filter((c) => c.type === 'expense' || c.type === 'both').length;
  const incomeCount = categories.filter((c) => c.type === 'income' || c.type === 'both').length;
  const customCount = categories.filter((c) => c.isCustom).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 theme-card p-5 rounded-2xl border shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight theme-text-primary">
            Categories &amp; Tags
          </h1>
          <div className="flex items-center gap-2 text-xs theme-text-muted mt-1">
            <span>{categories.length} Total Categories</span>
            <span aria-hidden="true">·</span>
            <span>{customCount} Custom Categories</span>
            <span aria-hidden="true">·</span>
            <span>With Visual Emoji Indicators</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetCategories}
            className="px-3 py-2 text-xs font-semibold theme-text-muted hover:theme-text-primary theme-card-subtle hover:theme-hover border theme-border-subtle rounded-lg transition-colors"
          >
            Reset Defaults
          </button>
          <button
            onClick={onOpenAddCategory}
            className="px-4 py-2 text-xs font-semibold theme-btn-primary rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center p-1 theme-card-subtle border theme-border-subtle rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'all'
                ? 'theme-card theme-text-primary shadow-xs font-bold'
                : 'theme-text-muted hover:theme-text-primary'
            }`}
          >
            All ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'expense'
                ? 'theme-card theme-text-primary shadow-xs font-bold'
                : 'theme-text-muted hover:theme-text-primary'
            }`}
          >
            Expenses ({expenseCount})
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'income'
                ? 'theme-card theme-text-primary shadow-xs font-bold'
                : 'theme-text-muted hover:theme-text-primary'
            }`}
          >
            Income ({incomeCount})
          </button>
        </div>

        <span className="text-xs theme-text-muted hidden sm:inline">
          Tap any category to adjust emoji, color, or budget cap
        </span>
      </div>

      {/* Categories Grid with Emojis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedCategories.map((cat) => {
          const count = txCountMap[cat.id] || 0;
          const totalAmount = txTotalMap[cat.id] || 0;
          const isExpense = cat.type === 'expense';

          return (
            <div
              key={cat.id}
              className="theme-card p-5 rounded-2xl border shadow-2xs flex flex-col justify-between hover:border-neutral-500 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl theme-card-subtle flex items-center justify-center shrink-0 text-2xl border theme-border-subtle">
                      <span>{cat.emoji || '🏷️'}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold theme-text-primary truncate">
                        {cat.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs theme-text-muted mt-0.5">
                        <span>{isExpense ? 'Expense' : 'Income'}</span>
                        {cat.isCustom && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-400 font-medium">Custom</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditCategory(cat)}
                      className="p-1.5 theme-text-muted hover:theme-text-primary hover:theme-card-subtle rounded transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {cat.isCustom && (
                      deleteConfirmCatId === cat.id ? (
                        <div className="flex items-center gap-1 bg-rose-500/10 p-1 rounded-lg">
                          <span className="text-[11px] text-rose-400 font-semibold px-1">Delete?</span>
                          <button
                            onClick={() => {
                              onDeleteCategory(cat.id);
                              setDeleteConfirmCatId(null);
                            }}
                            className="px-2 py-0.5 text-[11px] font-bold bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmCatId(null)}
                            className="px-2 py-0.5 text-[11px] font-medium theme-card-subtle theme-text-secondary rounded hover:theme-hover transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmCatId(cat.id)}
                          className="p-1.5 theme-text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {cat.monthlyBudget && isExpense && (
                  <div className="mt-2 text-xs theme-text-muted flex items-center justify-between py-1.5 px-2.5 theme-card-subtle border theme-border-subtle rounded-lg">
                    <span>Monthly Limit:</span>
                    <span className="font-mono font-semibold theme-text-primary">
                      {formatCurrency(cat.monthlyBudget, settings.currency, exchangeRates)}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-3 border-t theme-border-subtle flex items-center justify-between text-xs theme-text-muted">
                <span>{count} recorded {count === 1 ? 'entry' : 'entries'}</span>
                <span className="font-mono font-semibold theme-text-primary tabular-nums">
                  {formatCurrency(totalAmount, settings.currency, exchangeRates)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
