import React, { useState } from 'react';
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Check,
  Save,
  Plus,
  ArrowRight,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { Category, Transaction, AppSettings, MonthlyBudgetStatus, ExchangeRatesData } from '../types';
import { formatCurrency } from '../utils/formatters';

interface BudgetViewProps {
  categories: Category[];
  transactions: Transaction[];
  settings: AppSettings;
  budgetStatus: MonthlyBudgetStatus;
  exchangeRates?: ExchangeRatesData | null;
  onUpdateSettings: (settings: AppSettings) => void;
  onUpdateCategory: (category: Category) => void;
  onOpenAddCategory: () => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  categories,
  transactions,
  settings,
  budgetStatus,
  exchangeRates,
  onUpdateSettings,
  onUpdateCategory,
  onOpenAddCategory,
}) => {
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [totalBudgetInput, setTotalBudgetInput] = useState(
    settings.overallMonthlyBudget.toString()
  );

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catBudgetInput, setCatBudgetInput] = useState<string>('');

  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const monthExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(currentMonthPrefix)
  );

  const spentByCat: Record<string, number> = {};
  monthExpenses.forEach((t) => {
    spentByCat[t.categoryId] = (spentByCat[t.categoryId] || 0) + t.amount;
  });

  const expenseCategories = categories.filter(
    (c) => c.type === 'expense' || c.type === 'both'
  );

  const totalAllocatedToCategories = expenseCategories.reduce(
    (sum, c) => sum + (c.monthlyBudget || 0),
    0
  );

  const handleSaveTotalBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(totalBudgetInput);
    if (!isNaN(val) && val > 0) {
      onUpdateSettings({
        ...settings,
        overallMonthlyBudget: val,
      });
      setIsEditingTotal(false);
    }
  };

  const handleStartEditCat = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatBudgetInput((cat.monthlyBudget || 0).toString());
  };

  const handleSaveCatBudget = (cat: Category) => {
    const val = parseFloat(catBudgetInput);
    const updatedBudget = !isNaN(val) && val >= 0 ? val : undefined;
    onUpdateCategory({
      ...cat,
      monthlyBudget: updatedBudget,
    });
    setEditingCatId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 theme-card p-5 rounded-2xl border shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight theme-text-primary">
            Monthly Budget &amp; Spending Caps
          </h1>
          <p className="text-xs theme-text-muted mt-1">
            Track and cap spending for {currentMonthName} across each essential category
          </p>
        </div>

        <button
          onClick={onOpenAddCategory}
          className="px-4 py-2 text-xs font-semibold theme-btn-primary rounded-lg transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Budget Category</span>
        </button>
      </div>

      {/* Master Budget Card */}
      <div className="theme-card p-6 rounded-2xl border shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b theme-border-subtle">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider theme-text-muted">
              Master Monthly Budget Pool
            </div>
            {isEditingTotal ? (
              <form onSubmit={handleSaveTotalBudget} className="flex items-center gap-2 mt-1">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm font-semibold theme-text-muted">
                    {settings.currency.symbol}
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={totalBudgetInput}
                    onChange={(e) => setTotalBudgetInput(e.target.value)}
                    className="pl-12 pr-3 py-1.5 text-lg font-bold font-mono theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-52"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 theme-btn-primary text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTotal(false)}
                  className="px-3 py-2 text-xs theme-text-muted hover:theme-hover rounded-lg"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-extrabold font-mono theme-text-primary tabular-nums">
                  {formatCurrency(settings.overallMonthlyBudget, settings.currency, exchangeRates)}
                </span>
                <button
                  onClick={() => {
                    setTotalBudgetInput(settings.overallMonthlyBudget.toString());
                    setIsEditingTotal(true);
                  }}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit limit</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 text-xs theme-text-muted">
            <div>
              <div>Total Spent this Month</div>
              <div className="text-lg font-bold font-mono theme-text-primary tabular-nums mt-0.5">
                {formatCurrency(budgetStatus.totalSpent, settings.currency, exchangeRates)}
              </div>
            </div>
            <div>
              <div>{budgetStatus.isOverBudget ? 'Over Budget' : 'Remaining Pool'}</div>
              <div
                className={`text-lg font-bold font-mono tabular-nums mt-0.5 ${
                  budgetStatus.isOverBudget ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {formatCurrency(Math.abs(budgetStatus.remaining), settings.currency, exchangeRates)}
              </div>
            </div>
            <div>
              <div>Allocated to Categories</div>
              <div className="text-lg font-bold font-mono theme-text-primary tabular-nums mt-0.5">
                {formatCurrency(totalAllocatedToCategories, settings.currency, exchangeRates)}
              </div>
            </div>
          </div>
        </div>

        {/* Master Progress Bar */}
        <div className="pt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold theme-text-secondary">
              Overall Budget Consumption: <strong className="font-mono theme-text-primary">{budgetStatus.percentUsed}%</strong>
            </span>
            <span className="theme-text-muted">
              {budgetStatus.isOverBudget
                ? `Exceeded limit by ${formatCurrency(Math.abs(budgetStatus.remaining), settings.currency, exchangeRates)}`
                : `${formatCurrency(budgetStatus.remaining, settings.currency, exchangeRates)} remaining`}
            </span>
          </div>

          <div className="w-full theme-card-subtle rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                budgetStatus.isOverBudget
                  ? 'bg-rose-500'
                  : budgetStatus.percentUsed > 85
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(budgetStatus.percentUsed, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Budget Cards Grid with Emojis */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold theme-text-primary">Category Allowances</h3>
            <p className="text-xs theme-text-muted">
              Set spending caps on Airtime 📱, Food 🍔, Commute 🚗, and Electricity ⚡
            </p>
          </div>
          <span className="text-xs theme-text-muted font-mono">
            {expenseCategories.length} categories
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expenseCategories.map((cat) => {
            const spent = spentByCat[cat.id] || 0;
            const budget = cat.monthlyBudget || 0;
            const hasBudget = budget > 0;
            const percent = hasBudget ? Math.round((spent / budget) * 100) : 0;
            const isOver = hasBudget && spent > budget;
            const remaining = hasBudget ? budget - spent : 0;
            const isEditing = editingCatId === cat.id;

            return (
              <div
                key={cat.id}
                className="theme-card p-5 rounded-2xl border shadow-2xs flex flex-col justify-between space-y-4"
              >
                {/* Top Row: Category Info with Emoji & Limit Editor */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl theme-card-subtle flex items-center justify-center shrink-0 text-xl border theme-border-subtle">
                      <span>{cat.emoji || '🏷️'}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold theme-text-primary truncate">
                        {cat.name}
                      </div>
                      <div className="text-xs theme-text-muted mt-0.5">
                        {cat.id === 'cat-airtime' ? 'Phone calls, SMS & data bundle' : 'Monthly spending cap'}
                      </div>
                    </div>
                  </div>

                  {/* Limit editor */}
                  <div className="shrink-0 text-right">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          value={catBudgetInput}
                          onChange={(e) => setCatBudgetInput(e.target.value)}
                          className="w-24 px-2 py-1 text-xs font-mono theme-card-subtle theme-text-primary border theme-border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveCatBudget(cat)}
                          className="p-1 theme-btn-primary rounded"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEditCat(cat)}
                        className="text-xs font-semibold theme-text-secondary hover:theme-text-primary flex items-center gap-1 px-2.5 py-1 theme-card-subtle hover:theme-hover border theme-border-subtle rounded-md transition-colors"
                      >
                        <span className="font-mono tabular-nums">
                          {hasBudget ? formatCurrency(budget, settings.currency, exchangeRates) : 'Set limit'}
                        </span>
                        <Edit3 className="w-3 h-3 text-neutral-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {hasBudget ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="theme-text-muted">
                        Spent: <strong className="font-mono theme-text-primary">{formatCurrency(spent, settings.currency, exchangeRates)}</strong>
                      </span>
                      <span className="font-mono tabular-nums font-semibold theme-text-primary">
                        {percent}%
                      </span>
                    </div>

                    <div className="w-full theme-card-subtle rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver ? 'bg-rose-500' : percent > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${Math.min(percent, 100)}%`,
                          backgroundColor: isOver ? undefined : cat.color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] theme-text-muted">
                      <span>
                        {isOver ? (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            Over budget by {formatCurrency(Math.abs(remaining), settings.currency, exchangeRates)}
                          </span>
                        ) : (
                          <span>Remaining: <strong className="font-mono theme-text-secondary">{formatCurrency(remaining, settings.currency, exchangeRates)}</strong></span>
                        )}
                      </span>
                      <span>Target: {formatCurrency(budget, settings.currency, exchangeRates)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 px-3 theme-card-subtle border theme-border-subtle rounded-xl theme-text-muted text-xs flex items-center justify-between">
                    <span>Current spent: <strong className="font-mono theme-text-primary">{formatCurrency(spent, settings.currency, exchangeRates)}</strong></span>
                    <button
                      onClick={() => handleStartEditCat(cat)}
                      className="text-emerald-400 font-semibold hover:underline"
                    >
                      Assign Limit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
