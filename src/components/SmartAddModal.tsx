import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Mic,
  MicOff,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Smartphone,
  Loader2,
} from 'lucide-react';
import { Category, Transaction, AppSettings } from '../types';
import { parseNaturalLanguageTransactions, ParsedTransactionItem } from '../services/gemini';
import { formatCurrency } from '../utils/formatters';

interface SmartAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  settings: AppSettings;
  onAddTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;
}

export const SmartAddModal: React.FC<SmartAddModalProps> = ({
  isOpen,
  onClose,
  categories,
  settings,
  onAddTransactions,
}) => {
  if (!isOpen) return null;

  const [inputPrompt, setInputPrompt] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedTransactionItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const samplePrompts = [
    'Bought airtime for 2,000 USh and food for 10,000 USh',
    'Paid 50,000 USh for electricity token (Yaka) via MTN Mobile Money',
    'Received 450,000 USh consulting fee for web design',
    'Paid 15,000 USh for boda commute and 35,000 USh for internet bundle',
  ];

  // Speech Recognition support
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your spending.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputPrompt((prev) => (prev ? `${prev} and ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleParse = async () => {
    if (!inputPrompt.trim()) return;

    setIsParsing(true);
    setErrorMessage(null);
    try {
      const results = await parseNaturalLanguageTransactions(
        inputPrompt,
        categories,
        settings.currency.code
      );

      if (results.length === 0) {
        setErrorMessage('Could not find any clear amounts or items. Try: "Bought airtime for 5,000 USh"');
      } else {
        setParsedItems(results);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse prompt.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpdateItem = (index: number, updated: Partial<ParsedTransactionItem>) => {
    setParsedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updated } : item))
    );
  };

  const handleDeleteItem = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmAll = () => {
    if (parsedItems.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newTransactions = parsedItems.map((item) => ({
      title: item.title,
      amount: item.amount,
      categoryId: item.categoryId,
      emoji: item.emoji,
      type: item.type,
      paymentMethod: item.paymentMethod,
      date: today,
      time: nowTime,
      notes: item.notes,
    }));

    onAddTransactions(newTransactions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl theme-card rounded-2xl shadow-2xl border overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 border-b theme-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold theme-text-primary">AI Natural Language Parser</h3>
              <p className="text-xs theme-text-muted">Type or speak your expenses in everyday language</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Natural language input */}
          <div>
            <label className="block text-xs font-semibold theme-text-secondary mb-1.5">
              What did you spend or earn today?
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="e.g., Bought airtime for 2,000 USh and food for 10,000 USh"
                className="w-full p-3 pr-11 text-sm theme-card-subtle theme-text-primary border theme-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-sans"
                autoFocus
              />
              <button
                type="button"
                onClick={handleToggleVoice}
                title={isListening ? 'Stop Listening' : 'Speak into Microphone'}
                className={`absolute right-3 bottom-3 p-1.5 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'theme-card text-neutral-400 hover:text-emerald-400'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider theme-text-muted mb-1.5">
              Example Phrases (Tap to Try)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setInputPrompt(p)}
                  className="px-2.5 py-1 text-xs theme-card-subtle hover:theme-hover border theme-border-subtle rounded-lg text-left theme-text-secondary transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={isParsing || !inputPrompt.trim()}
              onClick={handleParse}
              className="px-4 py-2 theme-btn-primary font-semibold text-xs rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Parsing with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Parse Transactions</span>
                </>
              )}
            </button>
          </div>

          {/* Parsed Items Preview */}
          {parsedItems.length > 0 && (
            <div className="pt-4 border-t theme-border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold theme-text-primary">
                  Parsed Entries ({parsedItems.length})
                </span>
                <span className="text-xs theme-text-muted">Review before recording</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {parsedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 theme-card-subtle border theme-border rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{item.emoji}</span>
                      <div className="min-w-0">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateItem(idx, { title: e.target.value })}
                          className="font-semibold theme-text-primary bg-transparent border-b border-transparent hover:border-neutral-500 focus:border-emerald-500 focus:outline-none w-full"
                        />
                        <div className="text-[11px] theme-text-muted mt-0.5 flex items-center gap-2">
                          <select
                            value={item.categoryId}
                            onChange={(e) => handleUpdateItem(idx, { categoryId: e.target.value })}
                            className="bg-transparent theme-text-secondary border-b border-transparent hover:border-neutral-500 focus:outline-none"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id} className="bg-neutral-800 text-white">
                                {c.emoji} {c.name}
                              </option>
                            ))}
                          </select>
                          <span>·</span>
                          <span>{item.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-mono font-bold theme-text-primary">
                          {formatCurrency(item.amount, settings.currency)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(idx)}
                        className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs theme-text-secondary hover:theme-hover rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAll}
                  className="px-5 py-2 theme-btn-primary font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm &amp; Record {parsedItems.length} Entries</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
