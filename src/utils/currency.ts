export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rateFromINR: number; // 1 INR = X units of currency
  flag: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateFromINR: 1, flag: '🇮🇳' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateFromINR: 0.012, flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateFromINR: 0.011, flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateFromINR: 0.0093, flag: '🇬🇧' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateFromINR: 0.016, flag: '🇨🇦' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateFromINR: 0.018, flag: '🇦🇺' },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rateFromINR: 0.044, flag: '🇦🇪' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rateFromINR: 0.016, flag: '🇸🇬' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateFromINR: 1.83, flag: '🇯🇵' },
};

/**
 * Detects user currency based on browser locale, timezone, or saved preference.
 */
export function detectUserCurrency(): { currency: CurrencyInfo; isInternational: boolean; detectedBy: string } {
  // 1. Saved preference
  const savedCode = localStorage.getItem('onbudget_user_currency');
  if (savedCode && SUPPORTED_CURRENCIES[savedCode]) {
    return {
      currency: SUPPORTED_CURRENCIES[savedCode],
      isInternational: savedCode !== 'INR',
      detectedBy: 'preference'
    };
  }

  // 2. Timezone detection
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('America/New_York') || tz.includes('America/Los_Angeles') || tz.includes('America/Chicago') || tz.includes('US/')) {
      return { currency: SUPPORTED_CURRENCIES.USD, isInternational: true, detectedBy: 'timezone' };
    }
    if (tz.includes('Europe/London')) {
      return { currency: SUPPORTED_CURRENCIES.GBP, isInternational: true, detectedBy: 'timezone' };
    }
    if (tz.includes('Europe/')) {
      return { currency: SUPPORTED_CURRENCIES.EUR, isInternational: true, detectedBy: 'timezone' };
    }
    if (tz.includes('America/Toronto') || tz.includes('America/Vancouver') || tz.includes('Canada/')) {
      return { currency: SUPPORTED_CURRENCIES.CAD, isInternational: true, detectedBy: 'timezone' };
    }
    if (tz.includes('Australia/')) {
      return { currency: SUPPORTED_CURRENCIES.AUD, isInternational: true, detectedBy: 'timezone' };
    }
    if (tz.includes('Asia/Dubai')) {
      return { currency: SUPPORTED_CURRENCIES.AED, isInternational: true, detectedBy: 'timezone' };
    }
    if (tz.includes('Asia/Tokyo')) {
      return { currency: SUPPORTED_CURRENCIES.JPY, isInternational: true, detectedBy: 'timezone' };
    }
    if (tz.includes('Asia/Singapore')) {
      return { currency: SUPPORTED_CURRENCIES.SGD, isInternational: true, detectedBy: 'timezone' };
    }
    if (tz.includes('Asia/Kolkata') || tz.includes('Asia/Calcutta')) {
      return { currency: SUPPORTED_CURRENCIES.INR, isInternational: false, detectedBy: 'timezone' };
    }
  } catch (e) {
    // Ignore error
  }

  // 3. Browser locale detection
  const navLocales = navigator.languages ? [...navigator.languages] : [navigator.language || ''];
  for (const locale of navLocales) {
    const loc = locale.toLowerCase();
    if (loc.endsWith('-us')) return { currency: SUPPORTED_CURRENCIES.USD, isInternational: true, detectedBy: 'locale' };
    if (loc.endsWith('-gb')) return { currency: SUPPORTED_CURRENCIES.GBP, isInternational: true, detectedBy: 'locale' };
    if (loc.endsWith('-ca')) return { currency: SUPPORTED_CURRENCIES.CAD, isInternational: true, detectedBy: 'locale' };
    if (loc.endsWith('-au')) return { currency: SUPPORTED_CURRENCIES.AUD, isInternational: true, detectedBy: 'locale' };
    if (loc.endsWith('-ae')) return { currency: SUPPORTED_CURRENCIES.AED, isInternational: true, detectedBy: 'locale' };
    if (loc.endsWith('-jp')) return { currency: SUPPORTED_CURRENCIES.JPY, isInternational: true, detectedBy: 'locale' };
    if (loc.endsWith('-sg')) return { currency: SUPPORTED_CURRENCIES.SGD, isInternational: true, detectedBy: 'locale' };
    if (loc.includes('de-') || loc.includes('fr-') || loc.includes('es-') || loc.includes('it-') || loc.includes('nl-')) {
      return { currency: SUPPORTED_CURRENCIES.EUR, isInternational: true, detectedBy: 'locale' };
    }
    if (loc.endsWith('-in')) return { currency: SUPPORTED_CURRENCIES.INR, isInternational: false, detectedBy: 'locale' };
  }

  // Default fallback
  return { currency: SUPPORTED_CURRENCIES.INR, isInternational: false, detectedBy: 'default' };
}

/**
 * Formats a price in INR into the target currency representation.
 */
export function formatCurrencyPrice(priceInINR: number, currencyCode: string = 'INR'): { formatted: string; convertedValue: number; symbol: string; code: string } {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.INR;
  const converted = priceInINR * currency.rateFromINR;

  if (currency.code === 'INR') {
    return {
      formatted: `₹${priceInINR.toLocaleString('en-IN')}`,
      convertedValue: priceInINR,
      symbol: '₹',
      code: 'INR'
    };
  }

  if (currency.code === 'JPY') {
    return {
      formatted: `¥${Math.round(converted).toLocaleString()}`,
      convertedValue: Math.round(converted),
      symbol: '¥',
      code: 'JPY'
    };
  }

  const formattedNum = converted >= 100 ? Math.round(converted).toLocaleString() : converted.toFixed(2);
  return {
    formatted: `${currency.symbol}${formattedNum}`,
    convertedValue: Number(converted.toFixed(2)),
    symbol: currency.symbol,
    code: currency.code
  };
}

/**
 * Saves user currency preference.
 */
export function setUserCurrency(currencyCode: string) {
  if (SUPPORTED_CURRENCIES[currencyCode]) {
    localStorage.setItem('onbudget_user_currency', currencyCode);
    window.dispatchEvent(new CustomEvent('onbudget_currency_changed', { detail: currencyCode }));
  }
}
