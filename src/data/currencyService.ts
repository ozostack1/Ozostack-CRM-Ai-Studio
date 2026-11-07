import { useState, useEffect, useCallback } from 'react';

export interface CurrencyItem {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyItem[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)', locale: 'en-GB' },
  { code: 'AED', symbol: 'AED ', name: 'UAE Dirham (AED)', locale: 'ar-AE' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (C$)', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (A$)', locale: 'en-AU' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (S$)', locale: 'en-SG' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)', locale: 'ja-JP' },
  { code: 'CHF', symbol: 'CHF ', name: 'Swiss Franc (CHF)', locale: 'de-CH' },
];

const STORAGE_KEY = 'ozostack_system_currency_v2';
const EVENT_NAME = 'ozostack-currency-changed';

export function getSystemCurrency(): CurrencyItem {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const match = SUPPORTED_CURRENCIES.find((c) => c.code === parsed.code);
      if (match) return match;
    }
  } catch {
    /* fallback */
  }
  return SUPPORTED_CURRENCIES[0]; // INR
}

export function saveSystemCurrency(code: string): CurrencyItem {
  const match =
    SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase()) ||
    SUPPORTED_CURRENCIES[0];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(match));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: match }));
  } catch {
    /* storage quota fallback */
  }
  return match;
}

export function resolveCurrencySymbol(custom?: string | CurrencyItem | { symbol: string } | null): string {
  if (!custom) return getSystemCurrency().symbol;
  if (typeof custom === 'string') return custom;
  if (typeof custom === 'object' && 'symbol' in custom && custom.symbol) return custom.symbol;
  return getSystemCurrency().symbol;
}

export function formatCurrencyAmount(val: number, customSymbol?: string | CurrencyItem | { symbol: string }): string {
  const sym = resolveCurrencySymbol(customSymbol);
  return sym + Math.round(val).toLocaleString('en-US');
}

export function formatCompactAmount(val: number, customSymbol?: string | CurrencyItem | { symbol: string }): string {
  const sym = resolveCurrencySymbol(customSymbol);
  if (val >= 1000000) {
    const m = val / 1000000;
    return sym + (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + 'M';
  }
  if (val >= 1000) {
    const k = val / 1000;
    return sym + (k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)) + 'k';
  }
  return sym + Math.round(val).toLocaleString('en-US');
}

/**
 * Universal monetary converter:
 * If number: formats as "₹7,540" (or active currency).
 * If string with '$': replaces all '$' with active currency symbol (e.g. "$215,420" -> "₹215,420").
 */
export function formatMoney(
  val: number | string | undefined | null,
  customSymbol?: string | CurrencyItem | { symbol: string }
): string {
  if (val === undefined || val === null) return '';
  const sym = resolveCurrencySymbol(customSymbol);
  if (typeof val === 'number') {
    return sym + Math.round(val).toLocaleString('en-US');
  }
  return String(val).replace(/\$/g, sym);
}

/**
 * Reactive React hook to access and update the system currency across the application.
 */
export function useSystemCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyItem>(() => getSystemCurrency());

  const refresh = useCallback(() => {
    setCurrencyState(getSystemCurrency());
  }, []);

  useEffect(() => {
    refresh();
    const handleEvent = () => refresh();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };

    window.addEventListener(EVENT_NAME, handleEvent);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, handleEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refresh]);

  const setCurrency = useCallback((code: string) => {
    const updated = saveSystemCurrency(code);
    setCurrencyState(updated);
    return updated;
  }, []);

  return {
    currency,
    code: currency.code,
    symbol: currency.symbol,
    name: currency.name,
    locale: currency.locale,
    setCurrency,
    availableCurrencies: SUPPORTED_CURRENCIES,
    formatCurrency: (val: number) => formatCurrencyAmount(val, currency.symbol),
    formatCompact: (val: number) => formatCompactAmount(val, currency.symbol),
    formatMoney: (val: number | string | undefined | null) => formatMoney(val, currency.symbol),
  };
}
