import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  AlertCircle,
  ShieldCheck,
  Fingerprint,
} from 'lucide-react';
import { hashString } from '../utils/formatters';
import { AppSettings } from '../types';
import { authenticateWithBiometrics, isBiometricsAvailable } from '../utils/biometrics';

interface LockScreenProps {
  settings: AppSettings;
  onUnlock: () => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  settings,
  onUnlock,
  onUpdateSettings,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [hasBiometricsHardware, setHasBiometricsHardware] = useState(false);
  const [isAuthenticatingBiometric, setIsAuthenticatingBiometric] = useState(false);

  useEffect(() => {
    isBiometricsAvailable().then((avail) => setHasBiometricsHardware(avail));
  }, []);

  const handleVerify = async (codeToTest = pinInput) => {
    if (!codeToTest.trim()) {
      setErrorMsg('Please enter your passcode or password');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const hashed = await hashString(codeToTest);
      if (hashed === settings.pinHash) {
        onUnlock();
      } else {
        setErrorMsg('Incorrect passcode. Please try again.');
        setPinInput('');
      }
    } catch {
      setErrorMsg('Failed to verify passcode. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setIsAuthenticatingBiometric(true);
    setErrorMsg(null);
    try {
      const res = await authenticateWithBiometrics(settings.biometricCredentialId);
      if (res.success) {
        onUnlock();
      } else if (res.error) {
        setErrorMsg(`${res.error} You can use your PIN below.`);
      }
    } catch (err: any) {
      setErrorMsg('Biometric verification failed. Please enter your PIN.');
    } finally {
      setIsAuthenticatingBiometric(false);
    }
  };

  const handleKeyPress = (digit: string) => {
    setErrorMsg(null);
    if (pinInput.length < 12) {
      const updated = pinInput + digit;
      setPinInput(updated);
      if (updated.length === 4) {
        handleVerify(updated);
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setErrorMsg(null);
    setPinInput('');
  };

  const handleQuickDemoUnlock = async () => {
    setPinInput('1234');
    await handleVerify('1234');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.length < 4) {
      setErrorMsg('New passcode must be at least 4 digits or characters');
      return;
    }

    const hashedNewPin = await hashString(newPin);
    const updated: AppSettings = {
      ...settings,
      pinHash: hashedNewPin,
      hasCustomPin: true,
    };
    onUpdateSettings(updated);
    setResetSuccess(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setResetSuccess(false);
      setPinInput(newPin);
      onUnlock();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-sm theme-card rounded-2xl shadow-2xl border theme-border overflow-hidden">
        {/* Header Banner */}
        <div className="theme-card-subtle p-6 text-center border-b theme-border-subtle">
          <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight theme-text-primary">Centra Vault</h2>
          <p className="text-xs theme-text-muted mt-1">Passcode &amp; Biometric Protected</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Biometric Quick Button if Enabled & Supported */}
          {settings.biometricsEnabled && (
            <div className="mb-5">
              <button
                type="button"
                disabled={isAuthenticatingBiometric}
                onClick={handleBiometricUnlock}
                className="w-full py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Fingerprint className="w-4 h-4" />
                <span>
                  {isAuthenticatingBiometric
                    ? 'Scanning Fingerprint...'
                    : 'Unlock with Fingerprint / Biometrics'}
                </span>
              </button>
              <div className="flex items-center gap-3 my-4">
                <div className="h-px flex-1 theme-border-subtle border-t" />
                <span className="text-[11px] theme-text-muted uppercase tracking-wider">
                  Or enter PIN
                </span>
                <div className="h-px flex-1 theme-border-subtle border-t" />
              </div>
            </div>
          )}

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-3 mb-5">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pinInput.length > index;
              return (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                    isFilled
                      ? 'bg-emerald-400 scale-110 shadow-xs'
                      : 'border-2 theme-border bg-transparent'
                  }`}
                />
              );
            })}
          </div>

          {/* Keyboard input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="mb-4"
          >
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Or type password / PIN"
              className="w-full text-center px-4 py-2 text-xs theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              autoFocus
            />

            {errorMsg && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-medium mt-2 text-center">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-11 rounded-xl theme-card-subtle hover:theme-hover theme-text-primary text-base font-semibold font-mono flex items-center justify-center border theme-border-subtle transition-colors touch-manipulation"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-xl theme-card-subtle hover:theme-hover theme-text-muted text-xs font-medium flex items-center justify-center transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-11 rounded-xl theme-card-subtle hover:theme-hover theme-text-primary text-base font-semibold font-mono flex items-center justify-center border theme-border-subtle transition-colors touch-manipulation"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 rounded-xl theme-card-subtle hover:theme-hover theme-text-secondary text-xs font-medium flex items-center justify-center transition-colors"
            >
              Del
            </button>
          </div>

          <button
            type="button"
            disabled={isSubmitting || !pinInput}
            onClick={() => handleVerify()}
            className="w-full py-2.5 px-4 theme-btn-primary font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock Vault</span>
          </button>

          {/* Quick Demo Helper & Reset */}
          <div className="mt-5 pt-4 border-t theme-border-subtle flex flex-col items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleQuickDemoUnlock}
              className="theme-text-muted hover:theme-text-primary flex items-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Demo PIN:{' '}
                <strong className="font-mono theme-text-primary">1234</strong> (tap to unlock)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="theme-text-muted hover:theme-text-primary transition-colors text-[11px]"
            >
              Change or reset passcode
            </button>
          </div>
        </div>
      </div>

      {/* Reset Passcode Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm theme-card rounded-xl p-5 shadow-xl border theme-border">
            <h3 className="text-sm font-semibold theme-text-primary mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Reset Passcode
            </h3>
            <p className="text-xs theme-text-muted mb-4">
              Enter a new 4-digit PIN to secure your Centra finances.
            </p>

            {resetSuccess ? (
              <div className="p-3 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg text-center font-medium">
                Passcode updated successfully! Unlocking...
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium theme-text-secondary mb-1">
                    New Passcode / PIN
                  </label>
                  <input
                    type="password"
                    maxLength={16}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full px-3 py-2 text-xs theme-card-subtle theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-1.5 text-xs font-medium theme-text-muted hover:theme-hover rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 text-xs font-medium theme-btn-primary rounded-lg transition-colors"
                  >
                    Save &amp; Unlock
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
