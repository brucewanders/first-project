import React, { useState, useEffect } from 'react';
import {
  X,
  Terminal,
  Activity,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Cpu,
  ShieldCheck,
  Radio,
  HardDrive,
  Database,
  ExternalLink,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { AppSettings, Category, Transaction, ExchangeRatesData, AppLogEntry } from '../types';
import { getLocalStorageUsageKB, loadAppLogs, clearAppLogs } from '../utils/storage';
import { isBiometricsAvailable } from '../utils/biometrics';
import { isNotificationSupported, getNotificationPermissionStatus } from '../utils/notifications';

interface DeveloperDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  settings: AppSettings;
  exchangeRates: ExchangeRatesData | null;
  onResetAllData: () => void;
}

export const DeveloperDiagnosticsModal: React.FC<DeveloperDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  settings,
  exchangeRates,
  onResetAllData,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'diagnostics' | 'state' | 'logs'>('diagnostics');
  const [copied, setCopied] = useState(false);
  const [storageKB, setStorageKB] = useState(0);
  const [biometricsStatus, setBiometricsStatus] = useState<'checking' | 'supported' | 'unsupported'>('checking');
  const [geminiProbeStatus, setGeminiProbeStatus] = useState<'checking' | 'online' | 'fallback'>('checking');
  const [geminiProbeMsg, setGeminiProbeMsg] = useState('');
  const [logs, setLogs] = useState<AppLogEntry[]>([]);
  const [isProbing, setIsProbing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const appStateDump = {
    appVersion: '2.4.0-production',
    timestamp: new Date().toISOString(),
    currency: settings.currency,
    theme: settings.theme,
    ledgerRecordCount: transactions.length,
    categoryCount: categories.length,
    masterMonthlyBudget: settings.overallMonthlyBudget,
    biometricsConfigured: settings.biometricsEnabled,
    dailyRemindersConfigured: settings.dailyRemindersEnabled,
    developerMode: settings.developerModeEnabled,
    storageUsageKB: storageKB,
    exchangeRatesSource: exchangeRates?.source || 'Local fallback',
    exchangeRatesLastUpdated: exchangeRates?.lastUpdated,
    settings,
    categories,
    transactions,
  };

  const runDiagnostics = async () => {
    setIsProbing(true);
    setStorageKB(getLocalStorageUsageKB());
    setLogs(loadAppLogs());

    // Check Biometrics
    try {
      const avail = await isBiometricsAvailable();
      setBiometricsStatus(avail ? 'supported' : 'unsupported');
    } catch {
      setBiometricsStatus('unsupported');
    }

    // Probe Gemini Endpoint
    try {
      const probeRes = await fetch('/api/gemini/parse-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Probe test: bought airtime for 2000 USh',
          categories: [{ id: 'cat-airtime', name: 'Airtime', type: 'expense', emoji: '📱' }],
          currencyCode: 'UGX',
        }),
      });

      if (probeRes.ok) {
        setGeminiProbeStatus('online');
        setGeminiProbeMsg('Gemini 3.8 Flash endpoint connected & operational');
      } else {
        const errData = await probeRes.json().catch(() => ({}));
        setGeminiProbeStatus('fallback');
        setGeminiProbeMsg(errData.error || 'Server responded with fallback status');
      }
    } catch (err: any) {
      setGeminiProbeStatus('fallback');
      setGeminiProbeMsg('Using intelligent offline regex fallback parser');
    } finally {
      setIsProbing(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const handleCopyState = () => {
    navigator.clipboard.writeText(JSON.stringify(appStateDump, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearLogs = () => {
    clearAppLogs();
    setLogs([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl theme-card rounded-2xl shadow-2xl border theme-border overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b theme-border-subtle flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold theme-text-primary">
                  Developer &amp; Diagnostics Console
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  v2.4 DEV
                </span>
              </div>
              <p className="text-xs theme-text-muted">
                Inspect application state, test API integrations, and review runtime logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runDiagnostics}
              disabled={isProbing}
              title="Rerun Diagnostics"
              className="p-2 theme-card-subtle hover:theme-hover border theme-border-subtle rounded-lg text-xs theme-text-secondary transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:theme-text-primary hover:theme-hover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b theme-border-subtle flex gap-4 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'diagnostics'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent theme-text-muted hover:theme-text-primary'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>API &amp; Hardware Diagnostics</span>
          </button>
          <button
            onClick={() => setActiveTab('state')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'state'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent theme-text-muted hover:theme-text-primary'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Application State Tree</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent theme-text-muted hover:theme-text-primary'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Runtime Logs ({logs.length})</span>
          </button>
        </div>

        {/* Content Viewport */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Gemini 3.8 Flash Probe */}
                <div className="p-4 theme-card-subtle border theme-border rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold theme-text-primary flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Gemini API Service
                    </span>
                    <span
                      className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                        geminiProbeStatus === 'online'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {geminiProbeStatus.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs theme-text-muted leading-relaxed">
                    {geminiProbeMsg || 'Testing natural language parse endpoint...'}
                  </p>
                  <div className="text-[11px] font-mono theme-text-secondary pt-1 border-t theme-border-subtle">
                    Model: gemini-3.8-flash (Free Tier)
                  </div>
                </div>

                {/* WebAuthn Biometrics Probe */}
                <div className="p-4 theme-card-subtle border theme-border rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold theme-text-primary flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      WebAuthn Biometrics
                    </span>
                    <span
                      className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                        biometricsStatus === 'supported'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-neutral-500/20 text-neutral-400'
                      }`}
                    >
                      {biometricsStatus.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs theme-text-muted leading-relaxed">
                    {biometricsStatus === 'supported'
                      ? 'Platform fingerprint / Face ID authenticator is available.'
                      : 'Platform authenticator not detected. PIN lock fallback active.'}
                  </p>
                  <div className="text-[11px] font-mono theme-text-secondary pt-1 border-t theme-border-subtle">
                    UserVerification: Preferred with PIN fallback
                  </div>
                </div>

                {/* LocalStorage Footprint */}
                <div className="p-4 theme-card-subtle border theme-border rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold theme-text-primary flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-emerald-400" />
                      Local Storage Footprint
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {storageKB} KB
                    </span>
                  </div>
                  <p className="text-xs theme-text-muted leading-relaxed">
                    Persistent offline storage containing transactions, categories, and settings.
                  </p>
                  <div className="text-[11px] font-mono theme-text-secondary pt-1 border-t theme-border-subtle">
                    {transactions.length} transactions · {categories.length} categories
                  </div>
                </div>

                {/* Exchange Rates Live Feed */}
                <div className="p-4 theme-card-subtle border theme-border rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold theme-text-primary flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-emerald-400" />
                      Live Rates Provider
                    </span>
                    <span className="font-mono text-[11px] font-bold text-emerald-400">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs theme-text-muted leading-relaxed">
                    Source: {exchangeRates?.source || 'Fallback benchmark'}. Base: UGX (USh).
                  </p>
                  <div className="text-[11px] font-mono theme-text-secondary pt-1 border-t theme-border-subtle">
                    1 USD = ~{Math.round(1 / (exchangeRates?.rates['USD'] || 0.0002688)).toLocaleString()} USh
                  </div>
                </div>
              </div>

              {/* Safety Actions */}
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Clear Cache &amp; Reset Defaults
                  </div>
                  <p className="theme-text-muted mt-0.5">
                    Clears all localStorage keys and restores initial sample state for clean APK testing.
                  </p>
                </div>
                {confirmReset ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] text-rose-300 font-bold">Confirm Reset?</span>
                    <button
                      onClick={() => {
                        onResetAllData();
                        onClose();
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors"
                    >
                      Yes, Clear
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="px-2.5 py-1 text-[11px] font-medium theme-card-subtle theme-text-secondary rounded hover:theme-hover transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmReset(true)}
                    className="px-3 py-1.5 font-bold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg transition-colors shrink-0"
                  >
                    Reset All Data
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'state' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold theme-text-muted">
                  Serialized Reactive State (`JSON.stringify`)
                </span>
                <button
                  onClick={handleCopyState}
                  className="px-3 py-1.5 text-xs font-semibold theme-card-subtle hover:theme-hover border theme-border rounded-lg flex items-center gap-1.5 theme-text-secondary transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="p-4 theme-card-subtle border theme-border rounded-xl text-[11px] font-mono overflow-x-auto max-h-96 theme-text-secondary leading-relaxed">
                {JSON.stringify(appStateDump, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold theme-text-muted">
                  Application Runtime Event Logs
                </span>
                {logs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Logs</span>
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center theme-text-muted text-xs theme-card-subtle rounded-xl border theme-border">
                  No log events recorded yet. Actions like transactions, biometrics, and AI parsing log here.
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 theme-card-subtle border theme-border rounded-xl text-xs flex items-start gap-3"
                    >
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                          log.level === 'error'
                            ? 'bg-rose-500/20 text-rose-400'
                            : log.level === 'warn'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {log.level}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-[11px] theme-text-muted mb-0.5">
                          <span className="font-semibold theme-text-primary">{log.category}</span>
                          <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="theme-text-secondary">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
