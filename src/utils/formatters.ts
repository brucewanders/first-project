import { CurrencyConfig, ExchangeRatesData } from '../types';
import { convertFromBaseUGX } from './exchangeRates';

export const CURRENCY_OPTIONS: CurrencyConfig[] = [
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling (USh)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling (KSh)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira (₦)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CA$)' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand (R)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
];

export function formatCurrency(
  amountInBaseUGX: number,
  currency: CurrencyConfig,
  ratesData?: ExchangeRatesData | null,
  skipConversion: boolean = false
): string {
  const isNegative = amountInBaseUGX < 0;
  let targetAmount = Math.abs(amountInBaseUGX);

  if (!skipConversion && currency.code !== 'UGX') {
    targetAmount = convertFromBaseUGX(targetAmount, currency.code, ratesData);
  }

  const isSmallUnitCurrency = currency.code === 'UGX' || currency.code === 'KES' || currency.code === 'NGN';
  const minDecimals = isSmallUnitCurrency ? 0 : 2;
  const maxDecimals = isSmallUnitCurrency ? 0 : 2;

  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: targetAmount % 1 === 0 ? minDecimals : 2,
    maximumFractionDigits: maxDecimals,
  }).format(targetAmount);

  const prefix = isNegative ? '-' : '';

  if (currency.symbol.length > 1) {
    return `${prefix}${currency.symbol} ${formattedNumber}`;
  }
  return `${prefix}${currency.symbol}${formattedNumber}`;
}

export function formatDate(dateString: string): string {
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return dateString;
  } catch {
    return dateString;
  }
}

export function getRelativeDateLabel(dateString: string): string {
  const today = new Date().toISOString().split('T')[0];
  if (dateString === today) return 'Today';

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateString === yesterday) return 'Yesterday';

  return formatDate(dateString);
}

// Simple fast SHA-256 for browser password hashing
export async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
