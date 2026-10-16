/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  loadTransactions,
  saveTransactions,
  loadCategories,
  saveCategories,
  loadSettings,
  saveSettings,
  isSessionUnlocked,
  setSessionUnlocked,
  calculateBudgetStatus,
  INITIAL_TRANSACTIONS,
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { Transaction, Category, AppSettings, ThemeMode, ExchangeRatesData } from './types';
import { TopNav, NavTab } from './components/TopNav';
import { LockScreen } from './components/LockScreen';
import { Overview } from './components/Overview';
import { TransactionsView } from './components/TransactionsView';
import { BudgetView } from './components/BudgetView';
import { CategoriesView } from './components/CategoriesView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { TransactionModal } from './components/TransactionModal';
import { QuickAirtimeModal } from './components/QuickAirtimeModal';
import { CategoryModal } from './components/CategoryModal';
import { SmartAddModal } from './components/SmartAddModal';
import { DeveloperDiagnosticsModal } from './components/DeveloperDiagnosticsModal';
import { showEveningReminderNotification } from './utils/notifications';
import { fetchLiveExchangeRates } from './utils/exchangeRates';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [categories, setCategories] = useState<Category[]>(loadCategories);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  
  // Lock screen state
  const [isLocked, setIsLocked] = useState<boolean>(() => !isSessionUnlocked());
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');

  // Modals state
  const [isQuickAirtimeOpen, setIsQuickAirtimeOpen] = useState(false);
  const [isSmartAddOpen, setIsSmartAddOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Live Exchange Rates & Diagnostics Modal
  const [exchangeRates, setExchangeRates] = useState<ExchangeRatesData | null>(null);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);

  const refreshExchangeRates = async () => {
    try {
      const data = await fetchLiveExchangeRates();
      setExchangeRates(data);
    } catch (err) {
      console.warn('Failed to load live exchange rates', err);
    }
  };

  useEffect(() => {
    refreshExchangeRates();
  }, []);

  // Apply visual theme to <html> element
  useEffect(() => {
    const currentTheme = settings.theme || 'dark-slate';
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [settings.theme]);

  // Sync state to LocalStorage
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Evening notification trigger check
  useEffect(() => {
    if (!settings.dailyRemindersEnabled) return;

    const checkEveningReminder = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;

      const targetTime = settings.reminderTime || '20:00';
      const todayStr = now.toISOString().split('T')[0];
      const todayCount = transactions.filter((t) => t.date === todayStr).length;

      // If past 8:00 PM and zero transactions logged today, trigger notification
      if (currentTimeStr >= targetTime && todayCount === 0) {
        showEveningReminderNotification();
      }
    };

    // Check once every 60 seconds
    const interval = setInterval(checkEveningReminder, 60000);
    return () => clearInterval(interval);
  }, [settings.dailyRemindersEnabled, settings.reminderTime, transactions]);

  // Derived budget status
  const budgetStatus = useMemo(() => {
    return calculateBudgetStatus(transactions, settings);
  }, [transactions, settings]);

  // Lock handlers
  const handleUnlock = () => {
    setSessionUnlocked(true);
    setIsLocked(false);
  };

  const handleLock = () => {
    setSessionUnlocked(false);
    setIsLocked(true);
  };

  // Theme cycle handler
  const handleCycleTheme = () => {
    const themes: ThemeMode[] = ['dark-slate', 'crisp-light', 'sunset-violet'];
    const currentIndex = themes.indexOf(settings.theme || 'dark-slate');
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setSettings((prev) => ({
      ...prev,
      theme: nextTheme,
    }));
  };

  // Transaction handlers
  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>, existingId?: string) => {
    if (existingId) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === existingId ? { ...txData, id: existingId } : t))
      );
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  const handleAddMultipleTransactions = (newItems: Omit<Transaction, 'id'>[]) => {
    const formatted = newItems.map((item, index) => ({
      ...item,
      id: `tx-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
    }));
    setTransactions((prev) => [...formatted, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTxModalOpen(true);
  };

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setIsTxModalOpen(true);
  };

  // Category handlers
  const handleSaveCategory = (catData: Omit<Category, 'id'>, existingId?: string) => {
    if (existingId) {
      setCategories((prev) =>
        prev.map((c) => (c.id === existingId ? { ...catData, id: existingId } : c))
      );
    } else {
      const newCat: Category = {
        ...catData,
        id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      };
      setCategories((prev) => [...prev, newCat]);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setIsCatModalOpen(true);
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setIsCatModalOpen(true);
  };

  const handleResetCategories = () => {
    setCategories(DEFAULT_CATEGORIES);
    saveCategories(DEFAULT_CATEGORIES);
  };

  // Data recovery & backup handlers
  const handleRestoreSampleData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setCategories(DEFAULT_CATEGORIES);
    saveTransactions(INITIAL_TRANSACTIONS);
    saveCategories(DEFAULT_CATEGORIES);
  };

  const handleImportData = (data: {
    transactions: Transaction[];
    categories: Category[];
    settings?: AppSettings;
  }) => {
    setTransactions(data.transactions);
    setCategories(data.categories);
    if (data.settings) {
      setSettings(data.settings);
    }
  };

  const handleClearAllData = () => {
    setTransactions([]);
    setCategories(DEFAULT_CATEGORIES);
  };

  const airtimeCategory = categories.find((c) => c.id === 'cat-airtime');

  return (
    <div className="min-h-screen theme-canvas theme-text-primary flex flex-col font-sans transition-colors duration-200">
      {/* Top Nav (3-zone contract with theme switch & AI smart add) */}
      <TopNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenQuickAdd={handleOpenNewTransaction}
        onOpenQuickAirtime={() => setIsQuickAirtimeOpen(true)}
        onOpenSmartAdd={() => setIsSmartAddOpen(true)}
        onLockApp={handleLock}
        currentTheme={settings.theme || 'dark-slate'}
        onCycleTheme={handleCycleTheme}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'overview' && (
          <Overview
            transactions={transactions}
            categories={categories}
            settings={settings}
            budgetStatus={budgetStatus}
            exchangeRates={exchangeRates}
            onOpenQuickAdd={handleOpenNewTransaction}
            onOpenQuickAirtime={() => setIsQuickAirtimeOpen(true)}
            onOpenSmartAdd={() => setIsSmartAddOpen(true)}
            onSelectTab={setCurrentTab}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            categories={categories}
            settings={settings}
            exchangeRates={exchangeRates}
            onOpenQuickAdd={handleOpenNewTransaction}
            onOpenQuickAirtime={() => setIsQuickAirtimeOpen(true)}
            onOpenSmartAdd={() => setIsSmartAddOpen(true)}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {currentTab === 'budget' && (
          <BudgetView
            categories={categories}
            transactions={transactions}
            settings={settings}
            budgetStatus={budgetStatus}
            exchangeRates={exchangeRates}
            onUpdateSettings={setSettings}
            onUpdateCategory={(updated) => {
              setCategories((prev) =>
                prev.map((c) => (c.id === updated.id ? updated : c))
              );
            }}
            onOpenAddCategory={handleOpenAddCategory}
          />
        )}

        {currentTab === 'categories' && (
          <CategoriesView
            categories={categories}
            transactions={transactions}
            settings={settings}
            exchangeRates={exchangeRates}
            onOpenAddCategory={handleOpenAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onResetCategories={handleResetCategories}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            transactions={transactions}
            categories={categories}
            settings={settings}
            exchangeRates={exchangeRates}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            transactions={transactions}
            categories={categories}
            exchangeRates={exchangeRates}
            onUpdateSettings={setSettings}
            onRefreshExchangeRates={refreshExchangeRates}
            onOpenDeveloperDiagnostics={() => setIsDiagnosticsOpen(true)}
            onLockApp={handleLock}
            onRestoreSampleData={handleRestoreSampleData}
            onImportData={handleImportData}
            onClearAllData={handleClearAllData}
          />
        )}
      </main>

      {/* Clean quiet footer with unboxed metadata */}
      <footer className="border-t theme-border-subtle theme-card py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs theme-text-muted">
          <div className="flex items-center gap-2">
            <span className="font-semibold theme-text-primary">Centra Finance</span>
            <span aria-hidden="true">·</span>
            <span>Ugandan Shilling (USh)</span>
            <span aria-hidden="true">·</span>
            <span>Biometric &amp; Passcode Protected</span>
            <span aria-hidden="true">·</span>
            <span>Gemini AI Inside</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentTab('overview')}
              className="hover:theme-text-primary transition-colors"
            >
              Overview
            </button>
            <button
              onClick={() => setCurrentTab('budget')}
              className="hover:theme-text-primary transition-colors"
            >
              Budget Limits
            </button>
            <button
              onClick={() => setCurrentTab('settings')}
              className="hover:theme-text-primary transition-colors"
            >
              Settings
            </button>
            <button
              onClick={handleLock}
              className="hover:theme-text-primary transition-colors"
            >
              Lock Vault
            </button>
          </div>
        </div>
      </footer>

      {/* Lock Screen Overlay (Active when locked) */}
      {isLocked && (
        <LockScreen
          settings={settings}
          onUnlock={handleUnlock}
          onUpdateSettings={setSettings}
        />
      )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
        }}
        categories={categories}
        settings={settings}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
      />

      {/* Quick Airtime & Internet Modal */}
      <QuickAirtimeModal
        isOpen={isQuickAirtimeOpen}
        onClose={() => setIsQuickAirtimeOpen(false)}
        airtimeCategory={airtimeCategory}
        settings={settings}
        onAddTransaction={(tx) => handleSaveTransaction(tx)}
      />

      {/* AI Smart Add Natural Language Parser Modal */}
      <SmartAddModal
        isOpen={isSmartAddOpen}
        onClose={() => setIsSmartAddOpen(false)}
        categories={categories}
        settings={settings}
        onAddTransactions={handleAddMultipleTransactions}
      />

      {/* Category Creation / Edit Modal */}
      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => {
          setIsCatModalOpen(false);
          setEditingCategory(null);
        }}
        settings={settings}
        onSave={handleSaveCategory}
        editingCategory={editingCategory}
      />

      {/* Developer & Diagnostics Console Modal */}
      <DeveloperDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        transactions={transactions}
        categories={categories}
        settings={settings}
        exchangeRates={exchangeRates}
        onResetAllData={handleClearAllData}
      />
    </div>
  );
}
