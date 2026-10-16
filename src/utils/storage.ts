import { Category, Transaction, AppSettings, MonthlyBudgetStatus, AppLogEntry } from '../types';
import { CURRENCY_OPTIONS } from './formatters';

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense Categories with requested emoji indicators
  {
    id: 'cat-airtime',
    name: 'Airtime & Internet',
    type: 'expense',
    icon: 'Smartphone',
    emoji: '📱',
    color: '#0284c7', // Sky 600
    monthlyBudget: 80000,
  },
  {
    id: 'cat-food',
    name: 'Food & Snacks',
    type: 'expense',
    icon: 'Utensils',
    emoji: '🍔',
    color: '#16a34a', // Emerald 600
    monthlyBudget: 450000,
  },
  {
    id: 'cat-transport',
    name: 'Commute & Fuel / Rideshare',
    type: 'expense',
    icon: 'Car',
    emoji: '🚗',
    color: '#eab308', // Yellow 500
    monthlyBudget: 200000,
  },
  {
    id: 'cat-utilities',
    name: 'Electricity & Utilities',
    type: 'expense',
    icon: 'Zap',
    emoji: '⚡',
    color: '#ea580c', // Orange 600
    monthlyBudget: 120000,
  },
  {
    id: 'cat-housing',
    name: 'Rent & Housing',
    type: 'expense',
    icon: 'Home',
    emoji: '🏠',
    color: '#7c3aed', // Violet 600
    monthlyBudget: 600000,
  },
  {
    id: 'cat-entertainment',
    name: 'Cinema & Entertainment',
    type: 'expense',
    icon: 'Film',
    emoji: '🎬',
    color: '#c026d3', // Fuchsia 600
    monthlyBudget: 100000,
  },
  {
    id: 'cat-family',
    name: 'Kids & Family Expenses',
    type: 'expense',
    icon: 'Users',
    emoji: '🧸',
    color: '#4f46e5', // Indigo 600
    monthlyBudget: 150000,
  },
  {
    id: 'cat-shopping',
    name: 'Shopping & Clothes',
    type: 'expense',
    icon: 'ShoppingBag',
    emoji: '🛍️',
    color: '#0891b2', // Cyan 600
    monthlyBudget: 100000,
  },
  {
    id: 'cat-health',
    name: 'Health & Pharmacy',
    type: 'expense',
    icon: 'HeartPulse',
    emoji: '💊',
    color: '#e11d48', // Rose 600
    monthlyBudget: 60000,
  },
  {
    id: 'cat-other-expense',
    name: 'Miscellaneous',
    type: 'expense',
    icon: 'MoreHorizontal',
    emoji: '🏷️',
    color: '#64748b', // Slate 500
    monthlyBudget: 50000,
  },

  // Income Categories
  {
    id: 'cat-salary',
    name: 'Main Salary',
    type: 'income',
    icon: 'Briefcase',
    emoji: '💼',
    color: '#059669', // Emerald 600
  },
  {
    id: 'cat-freelance',
    name: 'Consulting & Web Design',
    type: 'income',
    icon: 'Laptop',
    emoji: '💻',
    color: '#2563eb', // Blue 600
  },
  {
    id: 'cat-business',
    name: 'Business Sales',
    type: 'income',
    icon: 'Store',
    emoji: '🏪',
    color: '#9333ea', // Purple 600
  },
  {
    id: 'cat-investment',
    name: 'Investments & Interest',
    type: 'income',
    icon: 'TrendingUp',
    emoji: '📈',
    color: '#0d9488', // Teal 600
  },
  {
    id: 'cat-gifts',
    name: 'Gifts & Transfers',
    type: 'income',
    icon: 'Gift',
    emoji: '🎁',
    color: '#d97706', // Amber 600
  },
];

const getDateDaysAgo = (daysAgo: number): string => {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return d.toISOString().split('T')[0];
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'income',
    amount: 2500000,
    categoryId: 'cat-salary',
    title: 'Monthly Salary Credit',
    emoji: '💼',
    date: getDateDaysAgo(14),
    paymentMethod: 'Bank Transfer',
    notes: 'Direct employer payroll deposit',
  },
  {
    id: 'tx-2',
    type: 'expense',
    amount: 600000,
    categoryId: 'cat-housing',
    title: 'Monthly Apartment Rent',
    emoji: '🏠',
    date: getDateDaysAgo(13),
    paymentMethod: 'Bank Transfer',
    notes: 'Monthly housing rent payment',
  },
  {
    id: 'tx-3',
    type: 'expense',
    amount: 5000,
    categoryId: 'cat-airtime',
    title: 'Airtime Top-up (MTN / Airtel)',
    emoji: '📱',
    date: getDateDaysAgo(10),
    paymentMethod: 'Mobile Money (MTN / Airtel / M-Pesa)',
    notes: 'Talk-time and voice bundle',
    recipient: '+256 772 123 456',
  },
  {
    id: 'tx-4',
    type: 'expense',
    amount: 35000,
    categoryId: 'cat-airtime',
    title: 'Monthly 15GB Internet Data Bundle',
    emoji: '📱',
    date: getDateDaysAgo(8),
    paymentMethod: 'Mobile Money (MTN / Airtel / M-Pesa)',
    notes: '4G WiFi / mobile data bundle renewal',
  },
  {
    id: 'tx-5',
    type: 'expense',
    amount: 85000,
    categoryId: 'cat-food',
    title: 'Supermarket Food & Snacks',
    emoji: '🍔',
    date: getDateDaysAgo(7),
    paymentMethod: 'Mobile Money (MTN / Airtel / M-Pesa)',
    notes: 'Groceries, market produce, cooking ingredients',
  },
  {
    id: 'tx-6',
    type: 'income',
    amount: 450000,
    categoryId: 'cat-freelance',
    title: 'Consulting & Web Design Milestone',
    emoji: '💻',
    date: getDateDaysAgo(5),
    paymentMethod: 'Mobile Money (MTN / Airtel / M-Pesa)',
    notes: 'Frontend client UI delivery payment',
  },
  {
    id: 'tx-7',
    type: 'expense',
    amount: 50000,
    categoryId: 'cat-utilities',
    title: 'Electricity Prepaid Meter Token (Yaka)',
    emoji: '⚡',
    date: getDateDaysAgo(4),
    paymentMethod: 'Mobile Money (MTN / Airtel / M-Pesa)',
    notes: 'Purchased 60 kWh prepaid electricity units',
  },
  {
    id: 'tx-8',
    type: 'expense',
    amount: 18000,
    categoryId: 'cat-transport',
    title: 'Commute & Fuel / Rideshare',
    emoji: '🚗',
    date: getDateDaysAgo(3),
    paymentMethod: 'Cash',
    notes: 'Boda boda & taxi trips across town',
  },
  {
    id: 'tx-9',
    type: 'expense',
    amount: 25000,
    categoryId: 'cat-entertainment',
    title: 'Cinema & Entertainment Tickets',
    emoji: '🎬',
    date: getDateDaysAgo(2),
    paymentMethod: 'Debit/Credit Card',
    notes: 'Weekend movie & snacks',
  },
  {
    id: 'tx-10',
    type: 'expense',
    amount: 40000,
    categoryId: 'cat-family',
    title: 'Kids & Family Expenses',
    emoji: '🧸',
    date: getDateDaysAgo(1),
    paymentMethod: 'Mobile Money (MTN / Airtel / M-Pesa)',
    notes: 'Family supplies and weekend treats',
  },
];

// Default SHA-256 of "1234"
export const DEFAULT_PIN_HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

export const DEFAULT_SETTINGS: AppSettings = {
  currency: CURRENCY_OPTIONS[0], // Ugandan Shilling (USh)
  overallMonthlyBudget: 1800000, // 1,800,000 USh
  theme: 'dark-slate', // Default dark slate theme requested
  hasCustomPin: true,
  pinHash: DEFAULT_PIN_HASH,
  biometricsEnabled: false,
  dailyRemindersEnabled: true,
  reminderTime: '20:00',
  autoExportDaily: false,
  developerModeEnabled: false,
  liveRatesEnabled: true,
  autoLockMinutes: 15,
  securityQuestion: 'What is your favorite personal project?',
  securityAnswerHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  userName: 'Bruce',
};

const STORAGE_KEYS = {
  TRANSACTIONS: 'centra_transactions_v2',
  CATEGORIES: 'centra_categories_v2',
  SETTINGS: 'centra_settings_v2',
  SESSION_UNLOCKED: 'centra_unlocked_session_v2',
  LAST_ACTIVITY: 'centra_last_activity_v2',
  DISMISSED_REMINDER_DATE: 'centra_dismissed_reminder_date_v2',
  APP_LOGS: 'centra_app_logs_v2',
};

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      saveTransactions(INITIAL_TRANSACTIONS);
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading transactions', err);
    return INITIAL_TRANSACTIONS;
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    console.error('Error saving transactions', err);
  }
}

export function loadCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading categories', err);
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (err) {
    console.error('Error saving categories', err);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Error loading settings', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings', err);
  }
}

export function isSessionUnlocked(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.SESSION_UNLOCKED) === 'true';
  } catch {
    return false;
  }
}

export function setSessionUnlocked(unlocked: boolean): void {
  try {
    if (unlocked) {
      sessionStorage.setItem(STORAGE_KEYS.SESSION_UNLOCKED, 'true');
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_UNLOCKED);
    }
  } catch (err) {
    console.error('Error setting unlock state', err);
  }
}

export function isDailyReminderDismissedToday(): boolean {
  const today = new Date().toISOString().split('T')[0];
  return localStorage.getItem(STORAGE_KEYS.DISMISSED_REMINDER_DATE) === today;
}

export function dismissDailyReminderToday(): void {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(STORAGE_KEYS.DISMISSED_REMINDER_DATE, today);
}

export function calculateBudgetStatus(
  transactions: Transaction[],
  settings: AppSettings
): MonthlyBudgetStatus {
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthExpenses = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBudget = settings.overallMonthlyBudget || 1;
  const remaining = totalBudget - currentMonthExpenses;
  const percentUsed = Math.min(Math.round((currentMonthExpenses / totalBudget) * 100), 999);
  const isOverBudget = currentMonthExpenses > totalBudget;

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(daysInMonth - now.getDate() + 1, 1);
  const dailyAllowanceRemaining = Math.max(0, Math.round((remaining / daysRemaining)));

  return {
    totalBudget,
    totalSpent: currentMonthExpenses,
    remaining,
    percentUsed,
    isOverBudget,
    dailyAllowanceRemaining,
  };
}

export function getLocalStorageUsageKB(): number {
  try {
    let total = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += (localStorage[key].length + key.length) * 2;
      }
    }
    return Math.round((total / 1024) * 10) / 10;
  } catch {
    return 0;
  }
}

export function loadAppLogs(): AppLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APP_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addAppLog(
  level: 'info' | 'warn' | 'error',
  category: string,
  message: string
): void {
  try {
    const logs = loadAppLogs();
    const newLog: AppLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
    };
    const updated = [newLog, ...logs].slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.APP_LOGS, JSON.stringify(updated));
  } catch {}
}

export function clearAppLogs(): void {
  localStorage.removeItem(STORAGE_KEYS.APP_LOGS);
}

export function hasAutoExportedToday(): boolean {
  const today = new Date().toISOString().split('T')[0];
  return localStorage.getItem('centra_last_auto_export_date') === today;
}

export function markAutoExportedToday(): void {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem('centra_last_auto_export_date', today);
}

