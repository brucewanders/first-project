import { ExchangeRatesData, CurrencyConfig } from '../types';

export const FALLBACK_RATES: Record<string, number> = {
  UGX: 1,
  USD: 0.0002688, // ~3,720 USh per USD
  EUR: 0.0002469, // ~4,050 USh per EUR
  GBP: 0.0002105, // ~4,750 USh per GBP
  KES: 0.03472,   // ~28.8 USh per KES
  NGN: 0.4082,    // ~2.45 USh per NGN
  CAD: 0.000371,
  INR: 0.0228,
  ZAR: 0.00485,
};

const CACHE_KEY = 'centra_live_exchange_rates_v1';
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function fetchLiveExchangeRates(): Promise<ExchangeRatesData> {
  // Check local cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: ExchangeRatesData = JSON.parse(cached);
      const age = Date.now() - new Date(parsed.lastUpdated).getTime();
      if (age < CACHE_DURATION_MS && Object.keys(parsed.rates).length > 0) {
        return parsed;
      }
    }
  } catch {}

  // Fetch free live rates with UGX base
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/UGX');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && data.result === 'success') {
        const ratesData: ExchangeRatesData = {
          base: 'UGX',
          rates: { ...FALLBACK_RATES, ...data.rates },
          lastUpdated: new Date().toISOString(),
          source: 'open.er-api.com (Live)',
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(ratesData));
        return ratesData;
      }
    }
  } catch (err) {
    console.warn('Live exchange rates API unreachable, falling back to local cached rates:', err);
  }

  // Fallback default
  const defaultData: ExchangeRatesData = {
    base: 'UGX',
    rates: FALLBACK_RATES,
    lastUpdated: new Date().toISOString(),
    source: 'Local Central Bank Benchmark',
  };
  return defaultData;
}

/**
 * Converts an amount stored in base UGX to the target display currency
 */
export function convertFromBaseUGX(
  amountInUGX: number,
  targetCode: string,
  ratesData?: ExchangeRatesData | null
): number {
  if (targetCode === 'UGX') return amountInUGX;
  const rates = ratesData?.rates || FALLBACK_RATES;
  const rate = rates[targetCode] || FALLBACK_RATES[targetCode] || 1;
  return amountInUGX * rate;
}

/**
 * Converts an amount entered in target currency back to base UGX for persistent ledger storage
 */
export function convertToBaseUGX(
  amountInTarget: number,
  sourceCode: string,
  ratesData?: ExchangeRatesData | null
): number {
  if (sourceCode === 'UGX') return amountInTarget;
  const rates = ratesData?.rates || FALLBACK_RATES;
  const rate = rates[sourceCode] || FALLBACK_RATES[sourceCode] || 1;
  if (rate <= 0) return amountInTarget;
  return Math.round(amountInTarget / rate);
}

/**
 * Get human readable rate ratio (e.g., "1 USD = 3,720 USh")
 */
export function getExchangeRateLabel(
  targetCode: string,
  ratesData?: ExchangeRatesData | null
): string {
  if (targetCode === 'UGX') return '1 USh = 1 USh (Base)';
  const rates = ratesData?.rates || FALLBACK_RATES;
  const rate = rates[targetCode] || FALLBACK_RATES[targetCode];
  if (!rate || rate <= 0) return '';
  const ugxPerUnit = Math.round(1 / rate);
  return `1 ${targetCode} ≈ ${ugxPerUnit.toLocaleString()} USh`;
}
