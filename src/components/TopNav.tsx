import React from 'react';
import { Lock, Plus, Smartphone, Sparkles, Moon, Sun, Palette, Terminal } from 'lucide-react';
import { ThemeMode } from '../types';

export type NavTab = 'overview' | 'transactions' | 'budget' | 'categories' | 'analytics' | 'settings';

interface TopNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenQuickAdd: () => void;
  onOpenQuickAirtime: () => void;
  onOpenSmartAdd: () => void;
  onLockApp: () => void;
  currentTheme: ThemeMode;
  onCycleTheme: () => void;
  isDeveloperMode?: boolean;
  onOpenDeveloperDiagnostics?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickAdd,
  onOpenQuickAirtime,
  onOpenSmartAdd,
  onLockApp,
  currentTheme,
  onCycleTheme,
  isDeveloperMode,
  onOpenDeveloperDiagnostics,
}) => {
  const getThemeLabel = (theme: ThemeMode) => {
    switch (theme) {
      case 'dark-slate':
        return 'Dark Slate';
      case 'crisp-light':
        return 'Crisp Light';
      case 'sunset-violet':
        return 'Sunset Violet';
      default:
        return 'Theme';
    }
  };

  return (
    <header className="sticky top-0 z-40 theme-card/95 backdrop-blur-md border-b theme-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('overview')}
              className="text-lg font-bold tracking-tight theme-text-primary hover:opacity-85 transition-opacity whitespace-nowrap flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-neutral-950 flex items-center justify-center font-mono font-bold text-sm shadow-xs">
                C
              </div>
              <span>Centra</span>
            </button>
            <span className="hidden sm:inline-block text-xs theme-text-muted">
              Finance &amp; Budget
            </span>
          </div>

          {/* Zone 2: Navigation Links (Single-line whitespace-nowrap) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium theme-text-muted">
            <button
              onClick={() => onSelectTab('overview')}
              className={`hover:theme-text-primary transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'overview'
                  ? 'theme-text-primary font-bold border-b-2 border-emerald-500'
                  : ''
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onSelectTab('transactions')}
              className={`hover:theme-text-primary transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'transactions'
                  ? 'theme-text-primary font-bold border-b-2 border-emerald-500'
                  : ''
              }`}
            >
              Ledger
            </button>
            <button
              onClick={() => onSelectTab('budget')}
              className={`hover:theme-text-primary transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'budget'
                  ? 'theme-text-primary font-bold border-b-2 border-emerald-500'
                  : ''
              }`}
            >
              Budget &amp; Limits
            </button>
            <button
              onClick={() => onSelectTab('categories')}
              className={`hover:theme-text-primary transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'categories'
                  ? 'theme-text-primary font-bold border-b-2 border-emerald-500'
                  : ''
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => onSelectTab('analytics')}
              className={`hover:theme-text-primary transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'analytics'
                  ? 'theme-text-primary font-bold border-b-2 border-emerald-500'
                  : ''
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => onSelectTab('settings')}
              className={`hover:theme-text-primary transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'settings'
                  ? 'theme-text-primary font-bold border-b-2 border-emerald-500'
                  : ''
              }`}
            >
              Settings
            </button>
          </nav>

          {/* Zone 3: Functional Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme switcher shortcut */}
            <button
              onClick={onCycleTheme}
              title={`Theme: ${getThemeLabel(currentTheme)} (Tap to switch)`}
              className="p-2 theme-card-subtle hover:theme-hover border theme-border-subtle rounded-lg text-xs theme-text-secondary transition-colors flex items-center gap-1.5"
            >
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline text-[11px] font-medium">
                {getThemeLabel(currentTheme)}
              </span>
            </button>

            {/* Developer Console Shortcut if enabled */}
            {isDeveloperMode && (
              <button
                onClick={onOpenDeveloperDiagnostics}
                title="Open Developer & Diagnostics Console"
                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs transition-colors flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="hidden xl:inline text-[11px] font-mono font-bold">DEV</span>
              </button>
            )}

            {/* AI Smart Parser Button */}
            <button
              onClick={onOpenSmartAdd}
              title="Type or speak in natural language to log spending with Gemini"
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Smart Add</span>
            </button>

            {/* Quick Airtime Shortcut */}
            <button
              onClick={onOpenQuickAirtime}
              title="Quick Log Airtime or Data bundle"
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Airtime</span>
            </button>

            {/* Standard Add Entry */}
            <button
              onClick={onOpenQuickAdd}
              className="px-3 sm:px-3.5 py-1.5 text-xs font-semibold theme-btn-primary rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>

            {/* Lock Button */}
            <button
              onClick={onLockApp}
              title="Lock app with password/biometrics"
              className="p-2 theme-card-subtle hover:theme-hover border theme-border-subtle rounded-lg theme-text-muted hover:theme-text-primary transition-colors shrink-0"
              aria-label="Lock App"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Sub-Navigation */}
        <div className="flex md:hidden overflow-x-auto py-2.5 border-t theme-border-subtle gap-4 text-xs font-medium theme-text-muted no-scrollbar">
          <button
            onClick={() => onSelectTab('overview')}
            className={`whitespace-nowrap ${
              currentTab === 'overview' ? 'theme-text-primary font-bold' : ''
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onSelectTab('transactions')}
            className={`whitespace-nowrap ${
              currentTab === 'transactions' ? 'theme-text-primary font-bold' : ''
            }`}
          >
            Ledger
          </button>
          <button
            onClick={() => onSelectTab('budget')}
            className={`whitespace-nowrap ${
              currentTab === 'budget' ? 'theme-text-primary font-bold' : ''
            }`}
          >
            Budget &amp; Limits
          </button>
          <button
            onClick={() => onSelectTab('categories')}
            className={`whitespace-nowrap ${
              currentTab === 'categories' ? 'theme-text-primary font-bold' : ''
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className={`whitespace-nowrap ${
              currentTab === 'analytics' ? 'theme-text-primary font-bold' : ''
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => onSelectTab('settings')}
            className={`whitespace-nowrap ${
              currentTab === 'settings' ? 'theme-text-primary font-bold' : ''
            }`}
          >
            Settings
          </button>
        </div>
      </div>
    </header>
  );
};
