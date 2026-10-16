import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Smartphone,
  CreditCard,
  Sparkles,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { Category, Transaction, AppSettings, ExchangeRatesData } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getAISpendingInsights } from '../services/gemini';

interface AnalyticsViewProps {
  transactions: Transaction[];
  categories: Category[];
  settings: AppSettings;
  exchangeRates?: ExchangeRatesData | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  categories,
  settings,
  exchangeRates,
}) => {
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonthPrefix));

  const totalIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Breakdown by Category
  const catSpending: Record<string, number> = {};
  monthTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      catSpending[t.categoryId] = (catSpending[t.categoryId] || 0) + t.amount;
    });

  const categoryBreakdown = Object.entries(catSpending)
    .map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId);
      return {
        catId,
        name: cat?.name || 'Other',
        emoji: cat?.emoji || '🏷️',
        color: cat?.color || '#64748b',
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Breakdown by Payment Channel
  const paymentBreakdown: Record<string, { count: number; total: number }> = {};
  monthTransactions.forEach((t) => {
    if (!paymentBreakdown[t.paymentMethod]) {
      paymentBreakdown[t.paymentMethod] = { count: 0, total: 0 };
    }
    paymentBreakdown[t.paymentMethod].count += 1;
    paymentBreakdown[t.paymentMethod].total += t.amount;
  });

  // Airtime specific analytics
  const airtimeTxs = monthTransactions.filter((t) => t.categoryId === 'cat-airtime');
  const totalAirtime = airtimeTxs.reduce((s, t) => s + t.amount, 0);
  const airtimeCount = airtimeTxs.length;

  const largestExpense = [...monthTransactions]
    .filter((t) => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)[0];

  // AI Insights State
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isRefreshingAi, setIsRefreshingAi] = useState(false);

  const fetchAiInsight = async () => {
    setIsRefreshingAi(true);
    const topCats = categoryBreakdown.slice(0, 3).map((c) => ({
      name: c.name,
      amount: c.amount,
      percentage: c.percentage,
    }));

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(daysInMonth - now.getDate() + 1, 1);
    const remainingBudget = Math.max(0, settings.overallMonthlyBudget - totalExpense);
    const dailyAllowance = Math.round(remainingBudget / daysRemaining);

    const text = await getAISpendingInsights({
      totalBudget: settings.overallMonthlyBudget,
      totalSpent: totalExpense,
      totalIncome,
      savingsRate,
      currencySymbol: settings.currency.symbol,
      topCategories: topCats,
      dailyAllowance,
      daysRemaining,
    });

    setAiInsight(text);
    setIsRefreshingAi(false);
  };

  useEffect(() => {
    fetchAiInsight();
  }, [totalExpense, totalIncome]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="theme-card p-5 rounded-2xl border shadow-2xs">
        <h1 className="text-xl font-bold tracking-tight theme-text-primary">
          Financial Analytics &amp; Insights
        </h1>
        <p className="text-xs theme-text-muted mt-1">
          Deep dive into spending trends, income velocity, and payment distribution for {currentMonthName}
        </p>
      </div>

      {/* Automated AI Spending Insights Banner (Requested by user) */}
      <div className="theme-card p-6 rounded-2xl border theme-border shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold theme-text-primary">
                Automated AI Spending Insights (Gemini 3.8 Flash)
              </h3>
              <p className="text-xs theme-text-muted">
                Trajectory analysis relative to your Master Monthly Budget and Savings Rate
              </p>
            </div>
          </div>

          <button
            onClick={fetchAiInsight}
            disabled={isRefreshingAi}
            className="px-3 py-1.5 text-xs font-semibold theme-card-subtle hover:theme-hover border theme-border-subtle theme-text-secondary rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAi ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
        </div>

        <div className="p-4 theme-card-subtle border theme-border-subtle rounded-xl text-xs theme-text-primary leading-relaxed">
          {aiInsight || 'Generating financial trajectory summary with Gemini...'}
        </div>
      </div>

      {/* Top 3 High-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="theme-card p-5 rounded-2xl border shadow-2xs">
          <div className="text-xs font-semibold uppercase tracking-wider theme-text-muted mb-1">
            Net Savings Rate
          </div>
          <div className="text-2xl font-bold font-mono theme-text-primary tabular-nums">
            {savingsRate}%
          </div>
          <p className="text-xs theme-text-muted mt-1">
            {savingsRate >= 20
              ? 'Healthy savings trajectory this month'
              : 'Review discretionary spending to boost savings'}
          </p>
        </div>

        <div className="theme-card p-5 rounded-2xl border shadow-2xs">
          <div className="text-xs font-semibold uppercase tracking-wider theme-text-muted mb-1">
            Airtime &amp; Internet Spending 📱
          </div>
          <div className="text-2xl font-bold font-mono text-sky-400 tabular-nums">
            {formatCurrency(totalAirtime, settings.currency, exchangeRates)}
          </div>
          <p className="text-xs theme-text-muted mt-1">
            Across {airtimeCount} top-ups (MTN / Airtel / M-Pesa bundles)
          </p>
        </div>

        <div className="theme-card p-5 rounded-2xl border shadow-2xs">
          <div className="text-xs font-semibold uppercase tracking-wider theme-text-muted mb-1">
            Largest Single Expense
          </div>
          <div className="text-2xl font-bold font-mono theme-text-primary tabular-nums truncate">
            {largestExpense ? formatCurrency(largestExpense.amount, settings.currency, exchangeRates) : '—'}
          </div>
          <p className="text-xs theme-text-muted mt-1 truncate">
            {largestExpense ? `${largestExpense.emoji || ''} ${largestExpense.title}` : 'No expenses logged'}
          </p>
        </div>
      </div>

      {/* Cash Flow Comparison Bar */}
      <div className="theme-card p-6 rounded-2xl border shadow-2xs">
        <h3 className="text-base font-bold theme-text-primary mb-1">
          Monthly Cash Flow Overview
        </h3>
        <p className="text-xs theme-text-muted mb-6">
          Comparison between total income inflows and spending outflows
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Total Inflows (Income)
              </span>
              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                +{formatCurrency(totalIncome, settings.currency, exchangeRates)}
              </span>
            </div>
            <div className="w-full theme-card-subtle rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{
                  width: `${totalIncome > 0 ? Math.min(100, Math.round((totalIncome / (totalIncome + totalExpense || 1)) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold theme-text-primary flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                Total Outflows (Expenses)
              </span>
              <span className="font-mono font-bold theme-text-primary tabular-nums">
                -{formatCurrency(totalExpense, settings.currency, exchangeRates)}
              </span>
            </div>
            <div className="w-full theme-card-subtle rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                style={{
                  width: `${totalExpense > 0 ? Math.min(100, Math.round((totalExpense / (totalIncome + totalExpense || 1)) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Payment Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="theme-card p-6 rounded-2xl border shadow-2xs">
          <h3 className="text-base font-bold theme-text-primary mb-1">
            Category Spending Distribution
          </h3>
          <p className="text-xs theme-text-muted mb-5">
            Where your money went this month
          </p>

          {categoryBreakdown.length === 0 ? (
            <p className="text-xs theme-text-muted py-6 text-center">
              No expenses recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((item) => (
                <div key={item.catId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span>{item.emoji}</span>
                      <span className="font-medium theme-text-secondary">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="font-semibold theme-text-primary">
                        {formatCurrency(item.amount, settings.currency, exchangeRates)}
                      </span>
                      <span className="theme-text-muted text-[11px]">
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full theme-card-subtle rounded-full h-2 overflow-hidden">
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

        <div className="theme-card p-6 rounded-2xl border shadow-2xs">
          <h3 className="text-base font-bold theme-text-primary mb-1">
            Payment Channels &amp; Wallets
          </h3>
          <p className="text-xs theme-text-muted mb-5">
            Transaction volume by payment medium
          </p>

          <div className="space-y-3">
            {Object.entries(paymentBreakdown).map(([method, data]) => (
              <div
                key={method}
                className="p-3 theme-card-subtle rounded-xl border theme-border-subtle flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg theme-card flex items-center justify-center theme-text-secondary border theme-border-subtle">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold theme-text-primary">
                      {method}
                    </div>
                    <div className="text-[11px] theme-text-muted">
                      {data.count} {data.count === 1 ? 'transaction' : 'transactions'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold font-mono theme-text-primary tabular-nums">
                    {formatCurrency(data.total, settings.currency, exchangeRates)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
