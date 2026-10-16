export type TransactionType = 'expense' | 'income';

export type PaymentMethod =
  | 'Mobile Money (MTN / Airtel / M-Pesa)'
  | 'Cash'
  | 'Bank Transfer'
  | 'Debit/Credit Card';

export type ThemeMode = 'dark-slate' | 'crisp-light' | 'sunset-violet';

export interface Category {
  id: string;
  name: string;
  type: TransactionType | 'both';
  icon: string;
  emoji: string;
  color: string;
  isCustom?: boolean;
  monthlyBudget?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // Stored in base currency (UGX / USh)
  categoryId: string;
  title: string;
  emoji?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  paymentMethod: PaymentMethod | string;
  notes?: string;
  recipient?: string; // e.g. phone number for airtime or merchant name
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

export interface ExchangeRatesData {
  base: string; // e.g. "UGX"
  rates: Record<string, number>; // e.g. { "USD": 0.00027, "EUR": 0.00025, "KES": 0.035, "UGX": 1 }
  lastUpdated: string;
  source: string;
}

export interface AppLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  category: string;
  message: string;
}

export interface AppSettings {
  currency: CurrencyConfig;
  overallMonthlyBudget: number; // Stored in base currency (UGX / USh)
  theme: ThemeMode;
  hasCustomPin: boolean;
  pinHash: string; // SHA-256 hex or hashed PIN
  biometricsEnabled: boolean;
  biometricCredentialId?: string;
  dailyRemindersEnabled: boolean;
  reminderTime: string; // e.g. "20:00"
  autoExportDaily: boolean; // Daily auto-export preference
  developerModeEnabled: boolean; // Developer & diagnostics mode
  liveRatesEnabled: boolean; // Enable live dynamic conversion
  autoLockMinutes: number; // 0 for disabled
  securityQuestion?: string;
  securityAnswerHash?: string;
  userName?: string;
}

export interface MonthlyBudgetStatus {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  dailyAllowanceRemaining: number;
}
