import React, { useState, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  Coins,
  Wallet,
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertCircle,
  Fingerprint,
  Bell,
  Palette,
  Terminal,
  Radio,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { AppSettings, CurrencyConfig, Transaction, Category, ThemeMode, ExchangeRatesData } from '../types';
import { CURRENCY_OPTIONS, hashString } from '../utils/formatters';
import {
  isBiometricsAvailable,
  registerBiometricCredential,
  authenticateWithBiometrics,
} from '../utils/biometrics';
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermissionStatus,
  showEveningReminderNotification,
} from '../utils/notifications';
import { getExchangeRateLabel, fetchLiveExchangeRates } from '../utils/exchangeRates';
import { exportTodayTransactionsToCSV } from '../utils/csvExport';
import { addAppLog } from '../utils/storage';

interface SettingsViewProps {
  settings: AppSettings;
  transactions: Transaction[];
  categories: Category[];
  exchangeRates: ExchangeRatesData | null;
  onUpdateSettings: (settings: AppSettings) => void;
  onRefreshExchangeRates: () => Promise<void>;
  onOpenDeveloperDiagnostics: () => void;
  onLockApp: () => void;
  onRestoreSampleData: () => void;
  onImportData: (data: { transactions: Transaction[]; categories: Category[]; settings?: AppSettings }) => void;
  onClearAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  transactions,
  categories,
  exchangeRates,
  onUpdateSettings,
  onRefreshExchangeRates,
  onOpenDeveloperDiagnostics,
  onLockApp,
  onRestoreSampleData,
  onImportData,
  onClearAllData,
}) => {
  // Password change state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Currency state
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(settings.currency.code);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);

  // Budget
  const [budgetInput, setBudgetInput] = useState(settings.overallMonthlyBudget.toString());
  const [savedBudgetNotice, setSavedBudgetNotice] = useState(false);

  // Biometrics State
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsStatusMsg, setBiometricsStatusMsg] = useState<string | null>(null);

  // Notifications State
  const [notificationPermission, setNotificationPermission] = useState<string>('default');

  // Toast notice and non-blocking confirmation state
  const [toastNotice, setToastNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<'sample_data' | 'erase_all' | null>(null);

  useEffect(() => {
    if (!toastNotice) return;
    const timer = setTimeout(() => setToastNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [toastNotice]);

  useEffect(() => {
    isBiometricsAvailable().then(setBiometricsAvailable);
    setNotificationPermission(getNotificationPermissionStatus());
  }, []);

  const handleChangeTheme = (theme: ThemeMode) => {
    onUpdateSettings({
      ...settings,
      theme,
    });
    addAppLog('info', 'Settings', `Switched theme to ${theme}`);
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    const hashedCurrent = await hashString(currentPin);
    if (hashedCurrent !== settings.pinHash) {
      setPasswordMsg({ type: 'error', text: 'Current passcode is incorrect.' });
      return;
    }

    if (!newPin.trim() || newPin.length < 4) {
      setPasswordMsg({ type: 'error', text: 'New passcode must be at least 4 characters/digits.' });
      return;
    }

    if (newPin !== confirmPin) {
      setPasswordMsg({ type: 'error', text: 'New passcodes do not match.' });
      return;
    }

    const hashedNew = await hashString(newPin);
    onUpdateSettings({
      ...settings,
      pinHash: hashedNew,
      hasCustomPin: true,
    });

    setPasswordMsg({ type: 'success', text: 'Passcode updated successfully!' });
    addAppLog('info', 'Security', 'User updated vault passcode');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => setPasswordMsg(null), 3000);
  };

  const handleToggleBiometrics = async () => {
    setBiometricsStatusMsg(null);
    if (!settings.biometricsEnabled) {
      const res = await registerBiometricCredential(settings.userName || 'Centra User');
      if (res.success) {
        onUpdateSettings({
          ...settings,
          biometricsEnabled: true,
          biometricCredentialId: res.credentialId,
        });
        setBiometricsStatusMsg('Biometric fingerprint authentication enabled successfully!');
        addAppLog('info', 'Security', 'Biometric fingerprint authentication registered');
      } else {
        setBiometricsStatusMsg(res.error || 'Failed to register biometric credentials.');
      }
    } else {
      onUpdateSettings({
        ...settings,
        biometricsEnabled: false,
        biometricCredentialId: undefined,
      });
      setBiometricsStatusMsg('Biometric authentication disabled.');
      addAppLog('info', 'Security', 'Biometric fingerprint authentication disabled');
    }
  };

  const handleTestBiometrics = async () => {
    setBiometricsStatusMsg(null);
    const res = await authenticateWithBiometrics(settings.biometricCredentialId);
    if (res.success) {
      setBiometricsStatusMsg('Fingerprint verified successfully! Vault access confirmed.');
    } else {
      setBiometricsStatusMsg(res.error || 'Biometric test failed. PIN fallback is always ready.');
    }
  };

  const handleToggleNotifications = async () => {
    if (!settings.dailyRemindersEnabled) {
      const granted = await requestNotificationPermission();
      setNotificationPermission(getNotificationPermissionStatus());
      onUpdateSettings({
        ...settings,
        dailyRemindersEnabled: granted,
      });
      addAppLog('info', 'Settings', `Evening notifications enabled (granted: ${granted})`);
    } else {
      onUpdateSettings({
        ...settings,
        dailyRemindersEnabled: false,
      });
      addAppLog('info', 'Settings', 'Evening notifications disabled');
    }
  };

  const handleSendTestNotification = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(getNotificationPermissionStatus());
    if (granted) {
      showEveningReminderNotification();
      setToastNotice({ type: 'success', text: 'Evening reminder notification sent to your device!' });
    } else {
      setToastNotice({
        type: 'error',
        text: 'Notification permissions are blocked in your browser. Please enable notifications in your browser settings.',
      });
    }
  };

  const handleCurrencyChange = (code: string) => {
    setSelectedCurrencyCode(code);
    const found = CURRENCY_OPTIONS.find((c) => c.code === code);
    if (found) {
      onUpdateSettings({
        ...settings,
        currency: found,
      });
      addAppLog('info', 'Currency', `Display currency changed to ${found.code} (${found.symbol})`);
    }
  };

  const handleRefreshRates = async () => {
    setIsRefreshingRates(true);
    await onRefreshExchangeRates();
    setIsRefreshingRates(false);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val > 0) {
      onUpdateSettings({
        ...settings,
        overallMonthlyBudget: val,
      });
      setSavedBudgetNotice(true);
      setTimeout(() => setSavedBudgetNotice(false), 2000);
      addAppLog('info', 'Budget', `Master monthly budget updated to ${val} ${settings.currency.symbol}`);
    }
  };

  const handleToggleDeveloperMode = () => {
    const nextState = !settings.developerModeEnabled;
    onUpdateSettings({
      ...settings,
      developerModeEnabled: nextState,
    });
    addAppLog('info', 'DeveloperMode', `Developer mode ${nextState ? 'enabled' : 'disabled'}`);
  };

  const handleExportBackup = () => {
    const backupData = {
      version: '2.4',
      exportedAt: new Date().toISOString(),
      settings,
      categories,
      transactions,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `centra_finance_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addAppLog('info', 'Backup', 'Downloaded full JSON backup');
    setToastNotice({ type: 'success', text: 'Backup downloaded successfully as JSON file.' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.transactions) && Array.isArray(parsed.categories)) {
          onImportData({
            transactions: parsed.transactions,
            categories: parsed.categories,
            settings: parsed.settings,
          });
          setToastNotice({
            type: 'success',
            text: `Backup restored successfully! Loaded ${parsed.transactions.length} transactions and ${parsed.categories.length} categories.`,
          });
          addAppLog('info', 'Backup', `Restored ${parsed.transactions.length} transactions from JSON backup`);
        } else {
          setToastNotice({
            type: 'error',
            text: 'Invalid backup format. File must contain transactions and categories arrays.',
          });
        }
      } catch (err) {
        setToastNotice({
          type: 'error',
          text: 'Failed to read file as valid JSON backup.',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
            <AlertCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="theme-card p-5 rounded-2xl border shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight theme-text-primary">
            Settings &amp; Preferences
          </h1>
          <p className="text-xs theme-text-muted mt-1">
            Visual themes, biometric security, exchange rates, and developer diagnostics
          </p>
        </div>

        {/* Developer Diagnostics Trigger button if dev mode is enabled */}
        {settings.developerModeEnabled && (
          <button
            onClick={onOpenDeveloperDiagnostics}
            className="px-3.5 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Developer Console</span>
          </button>
        )}
      </div>

      {/* Visual UI Themes Switcher */}
      <div className="theme-card p-6 rounded-2xl border shadow-2xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b theme-border-subtle">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold theme-text-primary">Visual UI Themes</h3>
            <p className="text-xs theme-text-muted">
              Choose your preferred dashboard aesthetic and color scheme
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Theme 1: Dark Slate */}
          <button
            type="button"
            onClick={() => handleChangeTheme('dark-slate')}
            className={`p-4 rounded-xl border text-left transition-all ${
              settings.theme === 'dark-slate'
                ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-[#1E293B]'
                : 'border-neutral-700 bg-[#162032] hover:border-neutral-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">Dark Slate</span>
              {settings.theme === 'dark-slate' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mb-3">
              Deep slate (#121826) with emerald accents (#10B981)
            </p>
            <div className="flex gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#121826] border border-neutral-700" />
              <span className="w-4 h-4 rounded-full bg-[#1E293B]" />
              <span className="w-4 h-4 rounded-full bg-[#10B981]" />
            </div>
          </button>

          {/* Theme 2: Crisp Light */}
          <button
            type="button"
            onClick={() => handleChangeTheme('crisp-light')}
            className={`p-4 rounded-xl border text-left transition-all ${
              settings.theme === 'crisp-light'
                ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-white'
                : 'border-neutral-200 bg-neutral-100 hover:border-neutral-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900">Crisp Light Mode</span>
              {settings.theme === 'crisp-light' && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Clean light (#F8FAFC) with pure white cards &amp; dark text
            </p>
            <div className="flex gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#F8FAFC] border border-neutral-300" />
              <span className="w-4 h-4 rounded-full bg-[#FFFFFF] border border-neutral-300" />
              <span className="w-4 h-4 rounded-full bg-[#0F172A]" />
            </div>
          </button>

          {/* Theme 3: Sunset Violet */}
          <button
            type="button"
            onClick={() => handleChangeTheme('sunset-violet')}
            className={`p-4 rounded-xl border text-left transition-all ${
              settings.theme === 'sunset-violet'
                ? 'border-purple-500 ring-2 ring-purple-500/30 bg-[#1A1538]'
                : 'border-purple-900 bg-[#15112E] hover:border-purple-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-100">Sunset Violet</span>
              {settings.theme === 'sunset-violet' && (
                <span className="w-2 h-2 rounded-full bg-purple-400" />
              )}
            </div>
            <p className="text-[11px] text-purple-300 mb-3">
              Dark indigo/purple background with vibrant fuchsia highlights
            </p>
            <div className="flex gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#0F0C20] border border-purple-900" />
              <span className="w-4 h-4 rounded-full bg-[#1A1538]" />
              <span className="w-4 h-4 rounded-full bg-[#A855F7]" />
            </div>
          </button>
        </div>
      </div>

      {/* Multi-Currency & Live Exchange Rates (Free API Integration) */}
      <div className="theme-card p-6 rounded-2xl border shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b theme-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold theme-text-primary">
                Multi-Currency &amp; Live Rates
              </h3>
              <p className="text-xs theme-text-muted">
                Free real-time currency conversion with Ugandan Shilling (USh) base
              </p>
            </div>
          </div>

          <button
            onClick={handleRefreshRates}
            disabled={isRefreshingRates}
            className="px-3 py-1.5 text-xs font-semibold theme-card-subtle hover:theme-hover border theme-border-subtle theme-text-secondary rounded-lg transition-colors flex items-center gap-1.5"
            title="Refresh live exchange rates"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRates ? 'animate-spin' : ''}`} />
            <span>Refresh Rates</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold theme-text-secondary mb-1">
              Select Display Currency
            </label>
            <select
              value={selectedCurrencyCode}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-3 py-2 text-xs theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code} className="theme-card">
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] theme-text-muted mt-1.5">
              Ledger transactions and budget caps adapt to this currency.
            </p>
          </div>

          <div className="p-3.5 theme-card-subtle border theme-border-subtle rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold theme-text-primary">Live Rate Benchmark</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {exchangeRates?.source ? 'LIVE' : 'BENCHMARK'}
                </span>
              </div>
              <div className="text-sm font-bold font-mono text-emerald-400">
                {getExchangeRateLabel(selectedCurrencyCode, exchangeRates)}
              </div>
            </div>
            <div className="text-[10px] theme-text-muted mt-2">
              Source: {exchangeRates?.source || 'Central Bank Benchmark'}. Last sync: {new Date(exchangeRates?.lastUpdated || Date.now()).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Biometric & Passcode Protection with Fallback Logic */}
      <div className="theme-card p-6 rounded-2xl border shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b theme-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold theme-text-primary">
                Biometric &amp; Passcode Protection
              </h3>
              <p className="text-xs theme-text-muted">
                Unlock your vault with WebAuthn fingerprint, Face ID, or PIN
              </p>
            </div>
          </div>

          <button
            onClick={onLockApp}
            className="px-3.5 py-1.5 text-xs font-semibold theme-card-subtle hover:theme-hover border theme-border-subtle theme-text-secondary rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Vault</span>
          </button>
        </div>

        {/* Biometrics Toggle & Hardware Detection */}
        <div className="p-4 theme-card-subtle border theme-border-subtle rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold theme-text-primary">
                Enable Biometric / Fingerprint Unlock
              </span>
              {settings.biometricsEnabled && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs theme-text-muted mt-0.5">
              {biometricsAvailable
                ? "Standard WebAuthn platform authenticator detected on your device."
                : "Biometric hardware is unavailable on this browser/environment. Centra automatically secures your vault using your 4-digit PIN."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {settings.biometricsEnabled && (
              <button
                type="button"
                onClick={handleTestBiometrics}
                className="px-3 py-1.5 text-xs font-semibold theme-card hover:theme-hover border theme-border theme-text-secondary rounded-lg transition-colors"
              >
                Test Fingerprint
              </button>
            )}
            <button
              type="button"
              onClick={handleToggleBiometrics}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                settings.biometricsEnabled
                  ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                  : 'theme-btn-primary'
              }`}
            >
              {settings.biometricsEnabled ? 'Disable Biometrics' : 'Enable Fingerprint'}
            </button>
          </div>
        </div>

        {biometricsStatusMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{biometricsStatusMsg}</span>
          </div>
        )}

        {/* Change Passcode Form */}
        <form onSubmit={handleChangePin} className="space-y-4 max-w-md pt-2">
          <div className="text-xs font-semibold theme-text-primary">
            Change 4-Digit Passcode (Fallback PIN)
          </div>

          <div>
            <label className="block text-xs theme-text-muted mb-1">
              Current Passcode
            </label>
            <input
              type="password"
              required
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              placeholder="Enter current passcode (default: 1234)"
              className="w-full px-3 py-2 text-xs theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs theme-text-muted mb-1">
                New Passcode
              </label>
              <input
                type="password"
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="At least 4 digits"
                className="w-full px-3 py-2 text-xs theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs theme-text-muted mb-1">
                Confirm Passcode
              </label>
              <input
                type="password"
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Repeat new passcode"
                className="w-full px-3 py-2 text-xs theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {passwordMsg && (
            <div
              className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold theme-btn-primary rounded-lg transition-colors flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Update Passcode</span>
          </button>
        </form>
      </div>

      {/* Daily Auto-Export & Reminders */}
      <div className="theme-card p-6 rounded-2xl border shadow-2xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b theme-border-subtle">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold theme-text-primary">
              Daily Reminders &amp; Daily Auto-Export
            </h3>
            <p className="text-xs theme-text-muted">
              Scheduled prompts and one-tap daily transaction CSV exports
            </p>
          </div>
        </div>

        <div className="p-4 theme-card-subtle border theme-border-subtle rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold theme-text-primary">
                Daily Evening Expense Reminders
              </span>
              {settings.dailyRemindersEnabled && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  Enabled
                </span>
              )}
            </div>
            <p className="text-xs theme-text-muted mt-0.5">
              Scheduled evening prompt (8:00 PM): "Did you forget to record today's expenses? Tap to quickly log your airtime, food, or fuel purchases!"
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSendTestNotification}
              className="px-3 py-1.5 text-xs font-semibold theme-card hover:theme-hover border theme-border theme-text-secondary rounded-lg transition-colors"
            >
              Test Notification
            </button>
            <button
              type="button"
              onClick={handleToggleNotifications}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                settings.dailyRemindersEnabled
                  ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                  : 'theme-btn-primary'
              }`}
            >
              {settings.dailyRemindersEnabled ? 'Turn Off' : 'Turn On'}
            </button>
          </div>
        </div>

        {/* Daily CSV Export shortcut */}
        <div className="p-4 theme-card-subtle border theme-border-subtle rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-xs font-bold theme-text-primary">
              Daily Auto-Export to CSV
            </span>
            <p className="text-xs theme-text-muted mt-0.5">
              Formats today's transactions into a downloadable CSV spreadsheet for external bookkeeping and analysis.
            </p>
          </div>

          <button
            type="button"
            onClick={() => exportTodayTransactionsToCSV(transactions, categories, settings.currency.symbol)}
            className="px-3.5 py-1.5 text-xs font-semibold theme-btn-primary rounded-lg transition-all flex items-center gap-1.5 shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Today's CSV</span>
          </button>
        </div>
      </div>

      {/* Master Budget Ceiling */}
      <div className="theme-card p-6 rounded-2xl border shadow-2xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b theme-border-subtle">
          <div className="w-9 h-9 rounded-xl theme-card-subtle text-emerald-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold theme-text-primary">Master Monthly Pool</h3>
            <p className="text-xs theme-text-muted">Total spending ceiling in {settings.currency.symbol}</p>
          </div>
        </div>

        <form onSubmit={handleSaveBudget} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs font-medium theme-text-muted mb-1">
              Monthly Budget Limit ({settings.currency.symbol})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-medium theme-text-muted">
                {settings.currency.symbol}
              </span>
              <input
                type="number"
                step="any"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-full pl-12 pr-3 py-2 text-xs font-mono font-bold theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold theme-btn-primary rounded-lg transition-colors"
            >
              Save Target
            </button>
            {savedBudgetNotice && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Developer Mode & Diagnostics Module (Requested by user) */}
      <div className="theme-card p-6 rounded-2xl border shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b theme-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold theme-text-primary">
                Developer &amp; Diagnostics Mode
              </h3>
              <p className="text-xs theme-text-muted">
                Enables debug tools, application state inspection, runtime logs, and cache controls
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleDeveloperMode}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              settings.developerModeEnabled
                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                : 'theme-btn-primary'
            }`}
          >
            {settings.developerModeEnabled ? 'Disable Dev Mode' : 'Enable Dev Mode'}
          </button>
        </div>

        {settings.developerModeEnabled ? (
          <div className="p-4 theme-card-subtle border border-emerald-500/30 rounded-xl flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold theme-text-primary">
                  Developer Mode Active
                </span>
              </div>
              <p className="text-xs theme-text-muted mt-0.5">
                Inspect raw JSON state, verify Gemini endpoints, test WebAuthn, and audit app logs.
              </p>
            </div>

            <button
              onClick={onOpenDeveloperDiagnostics}
              className="px-3.5 py-1.5 text-xs font-bold theme-btn-primary rounded-lg transition-all flex items-center gap-1.5 shrink-0"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Launch Console</span>
            </button>
          </div>
        ) : (
          <p className="text-xs theme-text-muted">
            Developer mode is currently disabled. Toggle it above to view runtime memory, test API connections, and run hardware diagnostics.
          </p>
        )}
      </div>

      {/* Backup, Restore, and Reset */}
      <div className="theme-card p-6 rounded-2xl border shadow-2xs space-y-4">
        <h3 className="text-sm font-bold theme-text-primary">Data Management &amp; Portability</h3>
        <p className="text-xs theme-text-muted">
          Your finances are saved offline on your device. Export a backup or restore sample data at any time.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="px-3.5 py-2 text-xs font-semibold theme-card-subtle hover:theme-hover border theme-border-subtle theme-text-secondary rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download JSON Backup</span>
          </button>

          <label className="px-3.5 py-2 text-xs font-semibold theme-card-subtle hover:theme-hover border theme-border-subtle theme-text-secondary rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Restore Backup File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {confirmAction === 'sample_data' ? (
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30">
              <span className="text-xs text-sky-300 font-semibold">Reset to sample data?</span>
              <button
                onClick={() => {
                  onRestoreSampleData();
                  setConfirmAction(null);
                  setToastNotice({ type: 'success', text: 'Sample financial dataset reloaded!' });
                }}
                className="px-2.5 py-1 text-xs font-bold bg-sky-500 text-white rounded hover:bg-sky-600 transition-colors"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="px-2 py-1 text-xs theme-card-subtle theme-text-secondary rounded hover:theme-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmAction('sample_data')}
              className="px-3.5 py-2 text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Load Relatable Sample Data</span>
            </button>
          )}

          {confirmAction === 'erase_all' ? (
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 ml-auto">
              <span className="text-xs text-rose-300 font-semibold">Erase all records?</span>
              <button
                onClick={() => {
                  onClearAllData();
                  setConfirmAction(null);
                  setToastNotice({ type: 'info', text: 'All transaction records erased.' });
                }}
                className="px-2.5 py-1 text-xs font-bold bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors"
              >
                Yes, Erase
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="px-2 py-1 text-xs theme-card-subtle theme-text-secondary rounded hover:theme-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmAction('erase_all')}
              className="px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-auto"
            >
              Erase All Records
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
