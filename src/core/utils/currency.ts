/**
 * Currency utility functions for formatting and conversion
 */

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale?: string;
}

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong", locale: "vi-VN" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "en-EU" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", locale: "ko-KR" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", locale: "en-NZ" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", locale: "en-HK" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", locale: "de-CH" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", locale: "sv-SE" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", locale: "nb-NO" },
  { code: "DKK", symbol: "kr", name: "Danish Krone", locale: "da-DK" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty", locale: "pl-PL" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna", locale: "cs-CZ" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint", locale: "hu-HU" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", locale: "pt-BR" },
  { code: "MXN", symbol: "$", name: "Mexican Peso", locale: "es-MX" },
  { code: "ZAR", symbol: "R", name: "South African Rand", locale: "en-ZA" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", locale: "tr-TR" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble", locale: "ru-RU" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", locale: "zh-CN" },
  { code: "THB", symbol: "฿", name: "Thai Baht", locale: "th-TH" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", locale: "ms-MY" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", locale: "id-ID" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", locale: "en-PH" },
];

/**
 * Get currency information by code
 */
export function getCurrency(code: string): Currency | undefined {
  return CURRENCIES.find(currency => currency.code === code);
}

/**
 * Format amount with currency symbol and proper locale formatting
 */
export function formatCurrency(amount: number, currencyCode: string = "USD"): string {
  const currency = getCurrency(currencyCode);
  if (!currency) {
    return `${currencyCode} ${amount.toLocaleString()}`;
  }

  try {
    // Use Intl.NumberFormat for proper locale formatting
    const formatter = new Intl.NumberFormat(currency.locale || "en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: currencyCode === "JPY" || currencyCode === "KRW" ? 0 : 2,
      maximumFractionDigits: currencyCode === "JPY" || currencyCode === "KRW" ? 0 : 2,
    });
    return formatter.format(amount);
  } catch (error) {
    // Fallback to simple formatting
    return `${currency.symbol}${amount.toLocaleString()}`;
  }
}

/**
 * Format price range with currency
 */
export function formatPriceRange(
  min: number, 
  max: number, 
  currencyCode: string = "USD",
  type: "FIXED" | "HOURLY" = "FIXED"
): string {
  const currency = getCurrency(currencyCode);
  if (!currency) {
    const suffix = type === "HOURLY" ? "/hr" : "";
    return `${currencyCode} ${min} - ${currencyCode} ${max}${suffix}`;
  }

  const minFormatted = formatCurrency(min, currencyCode);
  const maxFormatted = formatCurrency(max, currencyCode);
  const suffix = type === "HOURLY" ? "/hr" : "";
  
  return `${minFormatted} - ${maxFormatted}${suffix}`;
}

/**
 * Convert amount from one currency to another (requires exchange rate)
 */
export function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string, 
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) return amount;
  return amount * exchangeRate;
}

/**
 * Get currency symbol by code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  return currency?.symbol || currencyCode;
}

/**
 * Validate currency code
 */
export function isValidCurrency(currencyCode: string): boolean {
  return CURRENCIES.some(currency => currency.code === currencyCode);
}
