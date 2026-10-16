import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Smartphone,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  AlertTriangle,
  Zap,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Bell,
  X,
  RefreshCw,
} from 'lucide-react';
import { Category, Transaction, AppSettings, MonthlyBudgetStatus, ExchangeRatesData } from '../types';
import { formatCurrency, formatDate, getRelativeDateLabel } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { isDailyReminderDismissedToday, dismissDailyReminderToday } from '../utils/storage';
import { getAISpendingInsights } from '../services/gemini';

interface OverviewProps {
  transactions: Transaction[];
  categories: Category[];
  settings: AppSettings;
  budgetStatus: MonthlyBudgetStatus;
  exchangeRates?: ExchangeRatesData | null;
  onOpenQuickAdd: () => void;
  onOpenQuickAirtime: () => void;
  onOpenSmartAdd: () => void;
  onSelectTab: (tab: 'overview' | 'transactions' | 'budget' | 'categories' | 'analytics' | 'settings') => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  transactions,
  categories,
  settings,
  budgetStatus,
  exchangeRates,
  onOpenQuickAdd,
  onOpenQuickAirtime,
  onOpenSmartAdd,
  onSelectTab,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Today transactions
  const todayTransactions = transactions.filter((t) => t.date === todayStr);
  const [isReminderDismissed, setIsReminderDismissed] = useState(isDailyReminderDismissedToday);

  // AI Insights State
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState<boolean>(false);

  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonthStr));
  
  const totalIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Airtime specific stats
  const airtimeTransactions = monthTransactions.filter((t) => t.categoryId === 'cat-airtime');
  const airtimeSpent = airtimeTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Category spending aggregation
  const categorySpendingMap: Record<string, number> = {};
  monthTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categorySpendingMap[t.categoryId] = (categorySpendingMap[t.categoryId] || 0) + t.amount;
    });

  const categorySpendingList = Object.entries(categorySpendingMap)
    .map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId);
      return {
        catId,
        name: cat?.name || 'Uncategorized',
        emoji: cat?.emoji || '🏷️',
        color: cat?.color || '#64748b',
        icon: cat?.icon || 'Tag',
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        budget: cat?.monthlyBudget,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Load AI Insights
  useEffect(() => {
    let isMounted = true;
    const fetchInsight = async () => {
      setIsLoadingInsight(true);
      const topCats = categorySpendingList.slice(0, 3).map((c) => ({
        name: c.name,
        amount: c.amount,
        percentage: c.percentage,
      }));

      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysRemaining = Math.max(daysInMonth - now.getDate() + 1, 1);

      const text = await getAISpendingInsights({
        totalBudget: settings.overallMonthlyBudget,
        totalSpent: budgetStatus.totalSpent,
        totalIncome,
        savingsRate,
        currencySymbol: settings.currency.symbol,
        topCategories: topCats,
        dailyAllowance: budgetStatus.dailyAllowanceRemaining,
        daysRemaining,
      });

      if (isMounted) {
        setAiInsight(text);
        setIsLoadingInsight(false);
      }
    };

    fetchInsight();
    return () => {
      isMounted = false;
    };
  }, [budgetStatus.totalSpent, totalIncome, settings.overallMonthlyBudget]);

  const handleDismissReminder = () => {
    dismissDailyReminderToday();
    setIsReminderDismissed(true);
  };

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(`${b.date}T12:00:00`).getTime() - new Date(`${a.date}T12:00:00`).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Daily Expense Logging Reminder Banner (Fallback Banner requested by user) */}
      {!isReminderDismissed && todayTransactions.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-amber-300">
                Did you forget to record today's expenses?
              </p>
              <p className="theme-text-muted mt-0.5">
                Zero entries logged for today so far. Tap to quickly log your airtime, food, or fuel purchases!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenQuickAirtime}
              className="px-3 py-1.5 font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 rounded-lg transition-colors"
            >
              Log Airtime 📱
            </button>
            <button
              onClick={onOpenSmartAdd}
              className="px-3 py-1.5 font-semibold theme-btn-primary rounded-lg transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Log</span>
            </button>
            <button
              onClick={handleDismissReminder}
              title="Dismiss for today"
              className="p-1.5 text-neutral-400 hover:theme-text-primary rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Welcome & Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 theme-card p-5 rounded-2xl border shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight theme-text-primary">
            Financial Dashboard
          </h1>
          <div className="flex items-center gap-2 text-xs theme-text-muted mt-1">
            <span>{currentMonthName}</span>
            <span aria-hidden="true">·</span>
            <span>{transactions.length} Ledger Records</span>
            <span aria-hidden="true">·</span>
            <span>Default PIN: 1234</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSmartAdd}
            className="px-3 py-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Smart Add</span>
          </button>
          <button
            onClick={onOpenQuickAirtime}
            className="px-3 py-2 text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Smartphone className="w-4 h-4" />
            <span>Airtime 📱</span>
          </button>
          <button
            onClick={onOpenQuickAdd}
            className="px-4 py-2 text-xs font-semibold theme-btn-primary rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record Entry</span>
          </button>
        </div>
      </div>

      {/* AI Spending Insights Pill/Banner */}
      <div className="p-4 rounded-2xl theme-card border theme-border shadow-2xs relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Gemini AI Spending Trajectory
              </span>
              {isLoadingInsight && (
                <span className="text-[11px] theme-text-muted">Analyzing...</span>
              )}
            </div>
            <p className="text-xs theme-text-secondary leading-relaxed">
              {aiInsight || 'Analyzing current month pacing and savings trajectory...'}
            </p>
          </div>
        </div>
      </div>

      {/* 4-KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Monthly Balance */}
        <div className="theme-card p-5 rounded-2xl border shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between theme-text-muted mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Net Balance</span>
            <div className="w-8 h-8 rounded-lg theme-card-subtle flex items-center justify-center theme-text-secondary">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight theme-text-primary tabular-nums">
              {formatCurrency(netSavings, settings.currency, exchangeRates)}
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-1 theme-text-muted">
              <span>Savings Rate:</span>
              <span className={`font-semibold font-mono ${savingsRate >= 20 ? 'text-emerald-400' : 'theme-text-primary'}`}>
                {savingsRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="theme-card p-5 rounded-2xl border shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between theme-text-muted mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Monthly Income</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
              +{formatCurrency(totalIncome, settings.currency, exchangeRates)}
            </div>
            <div className="text-xs theme-text-muted mt-1">
              {monthTransactions.filter((t) => t.type === 'income').length} income source entries
            </div>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="theme-card p-5 rounded-2xl border shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between theme-text-muted mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Spent</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight theme-text-primary tabular-nums">
              {formatCurrency(totalExpense, settings.currency, exchangeRates)}
            </div>
            <div className="text-xs theme-text-muted mt-1">
              {monthTransactions.filter((t) => t.type === 'expense').length} expense transactions
            </div>
          </div>
        </div>

        {/* Budget Health Card */}
        <div className="theme-card p-5 rounded-2xl border shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between theme-text-muted mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Master Budget</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                budgetStatus.isOverBudget
                  ? 'bg-rose-500/10 text-rose-400'
                  : budgetStatus.percentUsed > 80
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              {budgetStatus.isOverBudget ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-2xl font-bold font-mono tracking-tight theme-text-primary tabular-nums">
                {budgetStatus.percentUsed}%
              </span>
              <span className="text-xs font-mono theme-text-muted tabular-nums">
                {formatCurrency(budgetStatus.totalSpent, settings.currency, exchangeRates)} / {formatCurrency(budgetStatus.totalBudget, settings.currency, exchangeRates)}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full theme-card-subtle rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  budgetStatus.isOverBudget
                    ? 'bg-rose-500'
                    : budgetStatus.percentUsed > 85
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(budgetStatus.percentUsed, 100)}%` }}
              />
            </div>
            <div className="text-xs theme-text-muted mt-1.5 flex justify-between">
              <span>{budgetStatus.isOverBudget ? 'Over budget by' : 'Remaining'}:</span>
              <span className={`font-mono font-medium ${budgetStatus.isOverBudget ? 'text-rose-400' : 'theme-text-primary'}`}>
                {formatCurrency(Math.abs(budgetStatus.remaining), settings.currency, exchangeRates)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Everyday Essentials & Budget Pacing Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Budget Health & Everyday Shortcuts with Emojis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Budget Pace Banner */}
          <div className="theme-card p-5 rounded-2xl border shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold theme-text-primary">Monthly Spending Pace</h3>
                <p className="text-xs theme-text-muted">
                  Recommended safe spending based on days left in {currentMonthName}
                </p>
              </div>
              <button
                onClick={() => onSelectTab('budget')}
                className="text-xs font-semibold theme-text-secondary hover:theme-text-primary flex items-center gap-1 transition-colors"
              >
                <span>Adjust Budget</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t theme-border-subtle">
              <div>
                <div className="text-xs theme-text-muted">Safe Daily Allowance</div>
                <div className="text-xl font-bold font-mono theme-text-primary tabular-nums mt-0.5">
                  {formatCurrency(budgetStatus.dailyAllowanceRemaining, settings.currency, exchangeRates)}
                  <span className="text-xs font-normal theme-text-muted"> /day</span>
                </div>
              </div>
              <div>
                <div className="text-xs theme-text-muted">Total Spent this Month</div>
                <div className="text-xl font-bold font-mono theme-text-primary tabular-nums mt-0.5">
                  {formatCurrency(budgetStatus.totalSpent, settings.currency, exchangeRates)}
                </div>
              </div>
              <div>
                <div className="text-xs theme-text-muted">Remaining Budget Pool</div>
                <div
                  className={`text-xl font-bold font-mono tabular-nums mt-0.5 ${
                    budgetStatus.remaining < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatCurrency(budgetStatus.remaining, settings.currency, exchangeRates)}
                </div>
              </div>
            </div>
          </div>

          {/* Everyday Essentials Quick-Tap Cards with graphical emoji indicators */}
          <div className="theme-card p-5 rounded-2xl border shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold theme-text-primary">Everyday Spending Essentials</h3>
                <p className="text-xs theme-text-muted">
                  Log your most frequent day-to-day transactions with 1 tap
                </p>
              </div>
              <span className="text-xs theme-text-muted font-mono">Quick Shortcuts</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {/* Airtime */}
              <button
                onClick={onOpenQuickAirtime}
                className="p-3 theme-card-subtle hover:theme-hover border theme-border-subtle rounded-xl text-left transition-colors group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📱</span>
                  <Plus className="w-4 h-4 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <div className="text-xs font-semibold theme-text-primary">Airtime &amp; Internet</div>
                  <div className="text-[11px] font-mono text-sky-400 mt-0.5">
                    {formatCurrency(airtimeSpent, settings.currency, exchangeRates)}
                  </div>
                </div>
              </button>

              {/* Food & Snacks */}
              <button
                onClick={onOpenQuickAdd}
                className="p-3 theme-card-subtle hover:theme-hover border theme-border-subtle rounded-xl text-left transition-colors group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🍔</span>
                  <Plus className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <div className="text-xs font-semibold theme-text-primary">Food &amp; Snacks</div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                    Meals &amp; Groceries
                  </div>
                </div>
              </button>

              {/* Commute & Fuel / Rideshare */}
              <button
                onClick={onOpenQuickAdd}
                className="p-3 theme-card-subtle hover:theme-hover border theme-border-subtle rounded-xl text-left transition-colors group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🚗</span>
                  <Plus className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <div className="text-xs font-semibold theme-text-primary">Commute &amp; Fuel</div>
                  <div className="text-[11px] font-mono text-amber-400 mt-0.5">
                    Boda &amp; Rideshare
                  </div>
                </div>
              </button>

              {/* Electricity & Utilities */}
              <button
                onClick={onOpenQuickAdd}
                className="p-3 theme-card-subtle hover:theme-hover border theme-border-subtle rounded-xl text-left transition-colors group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">⚡</span>
                  <Plus className="w-4 h-4 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <div className="text-xs font-semibold theme-text-primary">Electricity &amp; Yaka</div>
                  <div className="text-[11px] font-mono text-orange-400 mt-0.5">
                    Prepaid Power
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Category Spending Breakdown with Emojis */}
        <div className="theme-card p-5 rounded-2xl border shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold theme-text-primary">Spending by Category</h3>
              <button
                onClick={() => onSelectTab('analytics')}
                className="text-xs theme-text-muted hover:theme-text-primary transition-colors"
              >
                View all
              </button>
            </div>

            {categorySpendingList.length === 0 ? (
              <div className="py-8 text-center theme-text-muted text-xs">
                No expense entries logged for this month yet.
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {categorySpendingList.slice(0, 5).map((item) => (
                  <div key={item.catId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sm shrink-0">{item.emoji}</span>
                        <span className="font-medium theme-text-secondary truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                        <span className="theme-text-primary font-semibold">
                          {formatCurrency(item.amount, settings.currency, exchangeRates)}
                        </span>
                        <span className="theme-text-muted text-[11px]">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                    {/* Tiny progress bar */}
                    <div className="w-full theme-card-subtle rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t theme-border-subtle flex items-center justify-between text-xs theme-text-muted">
            <span>Categories tracked:</span>
            <span className="font-mono font-semibold theme-text-primary">
              {categorySpendingList.length} active
            </span>
          </div>
        </div>
      </div>

      {/* Recent Transactions Ledger with Emojis & Zero-Pill format */}
      <div className="theme-card rounded-2xl border shadow-2xs overflow-hidden">
        <div className="p-5 border-b theme-border-subtle flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold theme-text-primary">Recent Transactions</h3>
            <p className="text-xs theme-text-muted">Latest recorded income and expenses</p>
          </div>
          <button
            onClick={() => onSelectTab('transactions')}
            className="text-xs font-semibold theme-text-secondary hover:theme-text-primary flex items-center gap-1 transition-colors"
          >
            <span>Full Ledger ({transactions.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm theme-text-muted mb-3">No transactions recorded yet</p>
            <button
              onClick={onOpenQuickAdd}
              className="px-4 py-2 text-xs font-semibold theme-btn-primary rounded-lg transition-colors"
            >
              Record First Entry
            </button>
          </div>
        ) : (
          <div className="divide-y theme-border-subtle">
            {recentTransactions.map((tx) => {
              const category = categories.find((c) => c.id === tx.categoryId);
              const isIncome = tx.type === 'income';
              const displayEmoji = tx.emoji || category?.emoji || '🏷️';

              return (
                <div
                  key={tx.id}
                  className="p-4 sm:px-6 flex items-center justify-between hover:theme-hover transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl theme-card-subtle flex items-center justify-center shrink-0 text-xl border theme-border-subtle">
                      <span>{displayEmoji}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold theme-text-primary truncate">
                        {tx.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs theme-text-muted mt-0.5 truncate">
                        <span>{category?.name || 'General'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{tx.paymentMethod}</span>
                        <span aria-hidden="true">·</span>
                        <span>{getRelativeDateLabel(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 pl-3">
                    <div className="text-right">
                      <div
                        className={`text-sm font-bold font-mono tabular-nums ${
                          isIncome ? 'text-emerald-400' : 'theme-text-primary'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount, settings.currency, exchangeRates)}
                      </div>
                    </div>

                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="text-xs font-medium theme-text-muted hover:theme-text-primary px-2 py-1 hover:theme-hover rounded transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
