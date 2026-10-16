import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Download,
  Trash2,
  Edit2,
  Filter,
  Smartphone,
  Sparkles,
  Bell,
  X,
  FileSpreadsheet,
  Calendar,
} from 'lucide-react';
import { Category, Transaction, AppSettings, ExchangeRatesData } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { isDailyReminderDismissedToday, dismissDailyReminderToday, addAppLog } from '../utils/storage';
import { exportTransactionsToCSV, exportTodayTransactionsToCSV } from '../utils/csvExport';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  settings: AppSettings;
  exchangeRates?: ExchangeRatesData | null;
  onOpenQuickAdd: () => void;
  onOpenQuickAirtime: () => void;
  onOpenSmartAdd: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  categories,
  settings,
  exchangeRates,
  onOpenQuickAdd,
  onOpenQuickAirtime,
  onOpenSmartAdd,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'this_month' | 'last_30_days'>('this_month');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Fallback reminder check for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter((t) => t.date === todayStr);
  const todayCount = todayTransactions.length;
  const [isReminderDismissed, setIsReminderDismissed] = useState(isDailyReminderDismissedToday);

  // Filter & Sort Logic
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    return transactions
      .filter((tx) => {
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;
        if (timeFilter === 'this_month' && !tx.date.startsWith(currentMonthPrefix)) return false;
        if (timeFilter === 'last_30_days' && tx.date < thirtyDaysAgo) return false;

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const categoryName = categories.find((c) => c.id === tx.categoryId)?.name || '';
          const matchTitle = tx.title.toLowerCase().includes(term);
          const matchCategory = categoryName.toLowerCase().includes(term);
          const matchNotes = tx.notes ? tx.notes.toLowerCase().includes(term) : false;
          const matchRecipient = tx.recipient ? tx.recipient.toLowerCase().includes(term) : false;
          const matchMethod = tx.paymentMethod.toLowerCase().includes(term);
          if (!matchTitle && !matchCategory && !matchNotes && !matchRecipient && !matchMethod) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
        if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [transactions, categories, typeFilter, categoryFilter, timeFilter, searchTerm, sortBy]);

  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const [toastNotice, setToastNotice] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (!toastNotice) return;
    const timer = setTimeout(() => setToastNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [toastNotice]);

  const netFiltered = totalFilteredIncome - totalFilteredExpense;

  // Full CSV Export
  const handleExportAllCSV = () => {
    const res = exportTransactionsToCSV(
      filteredTransactions,
      categories,
      `centra_ledger_${new Date().toISOString().split('T')[0]}.csv`,
      settings.currency.symbol
    );
    if (res.success) {
      addAppLog('info', 'Export', `Exported ${filteredTransactions.length} transactions to CSV`);
      setToastNotice({ type: 'success', text: `Downloaded CSV with ${res.count} records!` });
    } else {
      setToastNotice({ type: 'error', text: res.message });
    }
  };

  // Daily Auto-Export (current day's transactions for external analysis)
  const handleExportTodayCSV = () => {
    const res = exportTodayTransactionsToCSV(transactions, categories, settings.currency.symbol);
    if (res.success) {
      addAppLog('info', 'Daily Export', `Exported ${res.count} today's transactions to CSV`);
      setToastNotice({ type: 'success', text: `Downloaded today's CSV (${res.count} entries)!` });
    } else {
      setToastNotice({ type: 'info', text: res.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice Banner */}
      {toastNotice && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 shadow-md border ${
            toastNotice.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : toastNotice.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : 'bg-sky-500/15 border-sky-500/30 text-sky-300'
          }`}
        >
          <span>{toastNotice.text}</span>
          <button
            onClick={() => setToastNotice(null)}
            className="p-1 hover:opacity-75 rounded transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* In-App Fallback Reminder Card */}
      {!isReminderDismissed && todayCount === 0 && (
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
                No entries recorded today yet. Tap to quickly log your airtime, food, or fuel purchases!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenQuickAirtime}
              className="px-3 py-1.5 font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 rounded-lg transition-colors"
            >
              Airtime 📱
            </button>
            <button
              onClick={onOpenSmartAdd}
              className="px-3 py-1.5 font-semibold theme-btn-primary rounded-lg transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Log</span>
            </button>
            <button
              onClick={() => {
                dismissDailyReminderToday();
                setIsReminderDismissed(true);
              }}
              title="Dismiss"
              className="p-1.5 text-neutral-400 hover:theme-text-primary rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 theme-card p-5 rounded-2xl border shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight theme-text-primary">
            Financial Ledger
          </h1>
          <p className="text-xs theme-text-muted mt-1">
            Search, filter, and review every recorded expense and income
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Daily Auto-Export button */}
          <button
            onClick={handleExportTodayCSV}
            className="px-3 py-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            title="Download today's transactions in CSV for external analysis"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Today's CSV ({todayCount})</span>
          </button>

          {/* Full CSV Export */}
          <button
            onClick={handleExportAllCSV}
            className="px-3 py-2 text-xs font-semibold theme-card-subtle hover:theme-hover border theme-border-subtle theme-text-secondary rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            title="Download complete ledger spreadsheet"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {/* AI Smart Add */}
          <button
            onClick={onOpenSmartAdd}
            className="px-3 py-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Smart Add</span>
          </button>

          {/* Quick Airtime */}
          <button
            onClick={onOpenQuickAirtime}
            className="px-3 py-2 text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Smartphone className="w-4 h-4" />
            <span>Airtime 📱</span>
          </button>

          {/* Standard Add Entry */}
          <button
            onClick={onOpenQuickAdd}
            className="px-4 py-2 text-xs font-semibold theme-btn-primary rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="theme-card p-4 rounded-2xl border shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, airtime, notes, merchant..."
              className="w-full pl-9 pr-3 py-2 text-xs theme-card-subtle border theme-border theme-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Type Segmented Buttons */}
          <div className="md:col-span-3 flex items-center p-1 theme-card-subtle rounded-lg border theme-border-subtle">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                typeFilter === 'all'
                  ? 'theme-card theme-text-primary shadow-xs font-bold'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                typeFilter === 'expense'
                  ? 'theme-card text-rose-400 shadow-xs font-bold'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                typeFilter === 'income'
                  ? 'theme-card text-emerald-400 shadow-xs font-bold'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              Income
            </button>
          </div>

          {/* Category Filter Dropdown */}
          <div className="md:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs theme-card-subtle border theme-border theme-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="theme-card">
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Filter */}
          <div className="md:col-span-2">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="w-full px-2.5 py-2 text-xs theme-card-subtle border theme-border theme-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="this_month">This Month</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Strip */}
        <div className="pt-2 border-t theme-border-subtle flex flex-wrap items-center justify-between text-xs theme-text-muted gap-2">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="theme-text-primary font-mono">{filteredTransactions.length}</strong> entries
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="theme-text-secondary hover:underline"
              >
                Clear search
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 font-mono tabular-nums text-xs">
            <span>
              Income:{' '}
              <strong className="text-emerald-400 font-bold">
                +{formatCurrency(totalFilteredIncome, settings.currency, exchangeRates)}
              </strong>
            </span>
            <span>
              Expense:{' '}
              <strong className="theme-text-primary font-bold">
                -{formatCurrency(totalFilteredExpense, settings.currency, exchangeRates)}
              </strong>
            </span>
            <span>
              Net:{' '}
              <strong className={netFiltered >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {formatCurrency(netFiltered, settings.currency, exchangeRates)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="theme-card rounded-2xl border shadow-2xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <Filter className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
            <h4 className="text-sm font-semibold theme-text-primary">No matching transactions found</h4>
            <p className="text-xs theme-text-muted mt-1 mb-4">
              Try adjusting your search terms or filters to see more results.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setCategoryFilter('all');
                setTimeFilter('all');
              }}
              className="px-3 py-1.5 text-xs font-semibold theme-card-subtle hover:theme-hover border theme-border-subtle rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b theme-border-subtle theme-card-subtle text-[11px] font-semibold theme-text-muted uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Channel</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y theme-border-subtle text-xs">
                {filteredTransactions.map((tx) => {
                  const category = categories.find((c) => c.id === tx.categoryId);
                  const isIncome = tx.type === 'income';
                  const displayEmoji = tx.emoji || category?.emoji || '🏷️';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:theme-hover transition-colors group h-12"
                    >
                      {/* Description with Emoji */}
                      <td className="py-3 px-4 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg shrink-0">{displayEmoji}</span>
                          <div className="min-w-0">
                            <div className="font-semibold theme-text-primary truncate">
                              {tx.title}
                            </div>
                            {tx.notes && (
                              <div className="text-[11px] theme-text-muted truncate max-w-xs">
                                {tx.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 theme-text-secondary whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: category?.color || '#64748b' }}
                          />
                          <span>{category?.name || 'Other'}</span>
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-4 theme-text-muted whitespace-nowrap">
                        {tx.paymentMethod}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 theme-text-muted font-mono tabular-nums whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-bold tabular-nums text-sm ${
                            isIncome ? 'text-emerald-400' : 'theme-text-primary'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrency(tx.amount, settings.currency, exchangeRates)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                        {deleteConfirmId === tx.id ? (
                          <div className="flex items-center justify-end gap-1.5 animate-fadeIn">
                            <span className="text-[11px] text-rose-400 font-semibold">Delete?</span>
                            <button
                              onClick={() => {
                                onDeleteTransaction(tx.id);
                                setDeleteConfirmId(null);
                                setToastNotice({ type: 'info', text: `Deleted "${tx.title}"` });
                              }}
                              className="px-2 py-0.5 text-[11px] font-bold bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-0.5 text-[11px] font-medium theme-card-subtle theme-text-secondary rounded hover:theme-hover transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEditTransaction(tx)}
                              className="p-1.5 theme-text-muted hover:theme-text-primary hover:theme-card-subtle rounded transition-colors"
                              title="Edit entry"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(tx.id)}
                              className="p-1.5 theme-text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
