// src/lib/db/schema/currency.ts

// ============================================
// ALL AFRICAN CURRENCIES
// ============================================

export const FiatCurrencyEnum = {
  // ============================================
  // EAST AFRICA
  // ============================================
  RWF: 'RWF', // Rwanda Franc
  UGX: 'UGX', // Uganda Shilling
  TZS: 'TZS', // Tanzania Shilling
  KES: 'KES', // Kenya Shilling
  BIF: 'BIF', // Burundi Franc
  SOS: 'SOS', // Somalia Shilling
  ETB: 'ETB', // Ethiopia Birr
  DJF: 'DJF', // Djibouti Franc
  ERN: 'ERN', // Eritrea Nakfa
  SSP: 'SSP', // South Sudan Pound

  // ============================================
  // WEST AFRICA
  // ============================================
  NGN: 'NGN', // Nigeria Naira
  GHS: 'GHS', // Ghana Cedi
  XOF: 'XOF', // West African CFA Franc
  GNF: 'GNF', // Guinea Franc
  SLE: 'SLE', // Sierra Leone Leone
  LRD: 'LRD', // Liberia Dollar
  GMD: 'GMD', // Gambia Dalasi
  MRU: 'MRU', // Mauritania Ouguiya (West Africa)
  CVE: 'CVE', // Cape Verde Escudo
  STN: 'STN', // São Tomé and Príncipe Dobra

  // ============================================
  // CENTRAL AFRICA
  // ============================================
  XAF: 'XAF', // Central African CFA Franc
  CDF: 'CDF', // Democratic Republic of Congo Franc
  AOA: 'AOA', // Angola Kwanza

  // ============================================
  // SOUTHERN AFRICA
  // ============================================
  ZAR: 'ZAR', // South African Rand
  ZMW: 'ZMW', // Zambia Kwacha
  MWK: 'MWK', // Malawi Kwacha
  BWP: 'BWP', // Botswana Pula
  NAD: 'NAD', // Namibia Dollar
  SZL: 'SZL', // Eswatini Lilangeni
  LSL: 'LSL', // Lesotho Loti
  MZN: 'MZN', // Mozambique Metical
  ZWL: 'ZWL', // Zimbabwe Dollar
  MGA: 'MGA', // Madagascar Ariary

  // ============================================
  // NORTH AFRICA
  // ============================================
  EGP: 'EGP', // Egypt Pound
  DZD: 'DZD', // Algeria Dinar
  MAD: 'MAD', // Morocco Dirham
  TND: 'TND', // Tunisia Dinar
  LYD: 'LYD', // Libya Dinar
  SDG: 'SDG', // Sudan Pound
  // MRU removed from North Africa (it's in West Africa)

  // ============================================
  // INDIAN OCEAN
  // ============================================
  MUR: 'MUR', // Mauritius Rupee
  SCR: 'SCR', // Seychelles Rupee
  KMF: 'KMF', // Comoros Franc

  // ============================================
  // MAJOR GLOBAL CURRENCIES
  // ============================================
  USD: 'USD', // US Dollar
  EUR: 'EUR', // Euro
  GBP: 'GBP', // British Pound
  CHF: 'CHF', // Swiss Franc
  CAD: 'CAD', // Canadian Dollar
  AUD: 'AUD', // Australian Dollar
  JPY: 'JPY', // Japanese Yen
  CNY: 'CNY', // Chinese Yuan
  INR: 'INR', // Indian Rupee
  BRL: 'BRL', // Brazilian Real

  // ============================================
  // MIDDLE EAST
  // ============================================
  SAR: 'SAR', // Saudi Riyal
  AED: 'AED', // UAE Dirham
  QAR: 'QAR', // Qatari Riyal
  KWD: 'KWD', // Kuwaiti Dinar
  BHD: 'BHD', // Bahraini Dinar
  OMR: 'OMR', // Omani Rial
  ILS: 'ILS', // Israeli Shekel

  // ============================================
  // ASIA
  // ============================================
  PKR: 'PKR', // Pakistani Rupee
  BDT: 'BDT', // Bangladeshi Taka
  LKR: 'LKR', // Sri Lankan Rupee
  NPR: 'NPR', // Nepalese Rupee
  IDR: 'IDR', // Indonesian Rupiah
  MYR: 'MYR', // Malaysian Ringgit
  PHP: 'PHP', // Philippine Peso
  SGD: 'SGD', // Singapore Dollar
  THB: 'THB', // Thai Baht
  VND: 'VND', // Vietnamese Dong
} as const;

export type FiatCurrencyType =
  (typeof FiatCurrencyEnum)[keyof typeof FiatCurrencyEnum];
export const FIAT_CURRENCY_LIST = Object.values(FiatCurrencyEnum);

// ============================================
// CURRENCY INFO WITH SYMBOLS, NAMES, COUNTRIES
// ============================================

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  country: string;
  region:
    | 'East Africa'
    | 'West Africa'
    | 'Central Africa'
    | 'Southern Africa'
    | 'North Africa'
    | 'Indian Ocean'
    | 'Global'
    | 'Middle East'
    | 'Asia';
  decimalPlaces: number;
}

export const FIAT_CURRENCY_INFO: Record<FiatCurrencyType, CurrencyInfo> = {
  // ============================================
  // EAST AFRICA
  // ============================================
  RWF: {
    code: 'RWF',
    symbol: 'FRw',
    name: 'Rwandan Franc',
    country: 'Rwanda',
    region: 'East Africa',
    decimalPlaces: 0,
  },
  UGX: {
    code: 'UGX',
    symbol: 'USh',
    name: 'Ugandan Shilling',
    country: 'Uganda',
    region: 'East Africa',
    decimalPlaces: 0,
  },
  TZS: {
    code: 'TZS',
    symbol: 'TSh',
    name: 'Tanzanian Shilling',
    country: 'Tanzania',
    region: 'East Africa',
    decimalPlaces: 0,
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    country: 'Kenya',
    region: 'East Africa',
    decimalPlaces: 2,
  },
  BIF: {
    code: 'BIF',
    symbol: 'FBu',
    name: 'Burundi Franc',
    country: 'Burundi',
    region: 'East Africa',
    decimalPlaces: 0,
  },
  SOS: {
    code: 'SOS',
    symbol: 'SSh',
    name: 'Somali Shilling',
    country: 'Somalia',
    region: 'East Africa',
    decimalPlaces: 2,
  },
  ETB: {
    code: 'ETB',
    symbol: 'Br',
    name: 'Ethiopian Birr',
    country: 'Ethiopia',
    region: 'East Africa',
    decimalPlaces: 2,
  },
  DJF: {
    code: 'DJF',
    symbol: 'Fdj',
    name: 'Djibouti Franc',
    country: 'Djibouti',
    region: 'East Africa',
    decimalPlaces: 0,
  },
  ERN: {
    code: 'ERN',
    symbol: 'Nfk',
    name: 'Eritrean Nakfa',
    country: 'Eritrea',
    region: 'East Africa',
    decimalPlaces: 2,
  },
  SSP: {
    code: 'SSP',
    symbol: '£',
    name: 'South Sudanese Pound',
    country: 'South Sudan',
    region: 'East Africa',
    decimalPlaces: 2,
  },

  // ============================================
  // WEST AFRICA
  // ============================================
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    country: 'Nigeria',
    region: 'West Africa',
    decimalPlaces: 2,
  },
  GHS: {
    code: 'GHS',
    symbol: '₵',
    name: 'Ghanaian Cedi',
    country: 'Ghana',
    region: 'West Africa',
    decimalPlaces: 2,
  },
  XOF: {
    code: 'XOF',
    symbol: 'CFA',
    name: 'West African CFA Franc',
    country:
      "Benin, Burkina Faso, Côte d'Ivoire, Guinea-Bissau, Mali, Niger, Senegal, Togo",
    region: 'West Africa',
    decimalPlaces: 0,
  },
  GNF: {
    code: 'GNF',
    symbol: 'FG',
    name: 'Guinean Franc',
    country: 'Guinea',
    region: 'West Africa',
    decimalPlaces: 0,
  },
  SLE: {
    code: 'SLE',
    symbol: 'Le',
    name: 'Sierra Leonean Leone',
    country: 'Sierra Leone',
    region: 'West Africa',
    decimalPlaces: 2,
  },
  LRD: {
    code: 'LRD',
    symbol: '$',
    name: 'Liberian Dollar',
    country: 'Liberia',
    region: 'West Africa',
    decimalPlaces: 2,
  },
  GMD: {
    code: 'GMD',
    symbol: 'D',
    name: 'Gambian Dalasi',
    country: 'Gambia',
    region: 'West Africa',
    decimalPlaces: 2,
  },
  MRU: {
    code: 'MRU',
    symbol: 'UM',
    name: 'Mauritanian Ouguiya',
    country: 'Mauritania',
    region: 'West Africa',
    decimalPlaces: 2,
  },
  CVE: {
    code: 'CVE',
    symbol: '$',
    name: 'Cape Verdean Escudo',
    country: 'Cape Verde',
    region: 'West Africa',
    decimalPlaces: 2,
  },
  STN: {
    code: 'STN',
    symbol: 'Db',
    name: 'São Tomé and Príncipe Dobra',
    country: 'São Tomé and Príncipe',
    region: 'West Africa',
    decimalPlaces: 2,
  },

  // ============================================
  // CENTRAL AFRICA
  // ============================================
  XAF: {
    code: 'XAF',
    symbol: 'CFA',
    name: 'Central African CFA Franc',
    country: 'Cameroon, CAR, Chad, Congo, Equatorial Guinea, Gabon',
    region: 'Central Africa',
    decimalPlaces: 0,
  },
  CDF: {
    code: 'CDF',
    symbol: 'FC',
    name: 'Congolese Franc',
    country: 'DR Congo',
    region: 'Central Africa',
    decimalPlaces: 2,
  },
  AOA: {
    code: 'AOA',
    symbol: 'Kz',
    name: 'Angolan Kwanza',
    country: 'Angola',
    region: 'Central Africa',
    decimalPlaces: 2,
  },

  // ============================================
  // SOUTHERN AFRICA
  // ============================================
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    country: 'South Africa',
    region: 'Southern Africa',
    decimalPlaces: 2,
  },
  ZMW: {
    code: 'ZMW',
    symbol: 'ZK',
    name: 'Zambian Kwacha',
    country: 'Zambia',
    region: 'Southern Africa',
    decimalPlaces: 2,
  },
  MWK: {
    code: 'MWK',
    symbol: 'MK',
    name: 'Malawian Kwacha',
    country: 'Malawi',
    region: 'Southern Africa',
    decimalPlaces: 2,
  },
  BWP: {
    code: 'BWP',
    symbol: 'P',
    name: 'Botswana Pula',
    country: 'Botswana',
    region: 'Southern Africa',
    decimalPlaces: 2,
  },
  NAD: {
    code: 'NAD',
    symbol: '$',
    name: 'Namibian Dollar',
    country: 'Namibia',
    region: 'Southern Africa',
    decimalPlaces: 2,
  },
  SZL: {
    code: 'SZL',
    symbol: 'E',
    name: 'Eswatini Lilangeni',
    country: 'Eswatini',
    region: 'Southern Africa',
    decimalPlaces: 2,
  },
  LSL: {
    code: 'LSL',
    symbol: 'L',
    name: 'Lesotho Loti',
    country: 'Lesotho',
    region: 'Southern Africa',
    decimalPlaces: 2,
  },
  MZN: {
    code: 'MZN',
    symbol: 'MT',
    name: 'Mozambican Metical',
    country: 'Mozambique',
    region: 'Southern Africa',
    decimalPlaces: 2,
  },
  ZWL: {
    code: 'ZWL',
    symbol: '$',
    name: 'Zimbabwean Dollar',
    country: 'Zimbabwe',
    region: 'Southern Africa',
    decimalPlaces: 2,
  },
  MGA: {
    code: 'MGA',
    symbol: 'Ar',
    name: 'Malagasy Ariary',
    country: 'Madagascar',
    region: 'Southern Africa',
    decimalPlaces: 2,
  },

  // ============================================
  // NORTH AFRICA
  // ============================================
  EGP: {
    code: 'EGP',
    symbol: 'E£',
    name: 'Egyptian Pound',
    country: 'Egypt',
    region: 'North Africa',
    decimalPlaces: 2,
  },
  DZD: {
    code: 'DZD',
    symbol: 'DA',
    name: 'Algerian Dinar',
    country: 'Algeria',
    region: 'North Africa',
    decimalPlaces: 2,
  },
  MAD: {
    code: 'MAD',
    symbol: 'DH',
    name: 'Moroccan Dirham',
    country: 'Morocco',
    region: 'North Africa',
    decimalPlaces: 2,
  },
  TND: {
    code: 'TND',
    symbol: 'DT',
    name: 'Tunisian Dinar',
    country: 'Tunisia',
    region: 'North Africa',
    decimalPlaces: 3,
  },
  LYD: {
    code: 'LYD',
    symbol: 'LD',
    name: 'Libyan Dinar',
    country: 'Libya',
    region: 'North Africa',
    decimalPlaces: 3,
  },
  SDG: {
    code: 'SDG',
    symbol: '£',
    name: 'Sudanese Pound',
    country: 'Sudan',
    region: 'North Africa',
    decimalPlaces: 2,
  },

  // ============================================
  // INDIAN OCEAN
  // ============================================
  MUR: {
    code: 'MUR',
    symbol: 'Rs',
    name: 'Mauritian Rupee',
    country: 'Mauritius',
    region: 'Indian Ocean',
    decimalPlaces: 2,
  },
  SCR: {
    code: 'SCR',
    symbol: 'SR',
    name: 'Seychellois Rupee',
    country: 'Seychelles',
    region: 'Indian Ocean',
    decimalPlaces: 2,
  },
  KMF: {
    code: 'KMF',
    symbol: 'CF',
    name: 'Comorian Franc',
    country: 'Comoros',
    region: 'Indian Ocean',
    decimalPlaces: 0,
  },

  // ============================================
  // MAJOR GLOBAL CURRENCIES
  // ============================================
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    country: 'United States',
    region: 'Global',
    decimalPlaces: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    country: 'European Union',
    region: 'Global',
    decimalPlaces: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    country: 'United Kingdom',
    region: 'Global',
    decimalPlaces: 2,
  },
  CHF: {
    code: 'CHF',
    symbol: 'Fr',
    name: 'Swiss Franc',
    country: 'Switzerland',
    region: 'Global',
    decimalPlaces: 2,
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    country: 'Canada',
    region: 'Global',
    decimalPlaces: 2,
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    country: 'Australia',
    region: 'Global',
    decimalPlaces: 2,
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    country: 'Japan',
    region: 'Global',
    decimalPlaces: 0,
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    country: 'China',
    region: 'Global',
    decimalPlaces: 2,
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    country: 'India',
    region: 'Global',
    decimalPlaces: 2,
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    country: 'Brazil',
    region: 'Global',
    decimalPlaces: 2,
  },

  // ============================================
  // MIDDLE EAST
  // ============================================
  SAR: {
    code: 'SAR',
    symbol: '﷼',
    name: 'Saudi Riyal',
    country: 'Saudi Arabia',
    region: 'Middle East',
    decimalPlaces: 2,
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    country: 'United Arab Emirates',
    region: 'Middle East',
    decimalPlaces: 2,
  },
  QAR: {
    code: 'QAR',
    symbol: '﷼',
    name: 'Qatari Riyal',
    country: 'Qatar',
    region: 'Middle East',
    decimalPlaces: 2,
  },
  KWD: {
    code: 'KWD',
    symbol: 'KD',
    name: 'Kuwaiti Dinar',
    country: 'Kuwait',
    region: 'Middle East',
    decimalPlaces: 3,
  },
  BHD: {
    code: 'BHD',
    symbol: 'BD',
    name: 'Bahraini Dinar',
    country: 'Bahrain',
    region: 'Middle East',
    decimalPlaces: 3,
  },
  OMR: {
    code: 'OMR',
    symbol: '﷼',
    name: 'Omani Rial',
    country: 'Oman',
    region: 'Middle East',
    decimalPlaces: 3,
  },
  ILS: {
    code: 'ILS',
    symbol: '₪',
    name: 'Israeli Shekel',
    country: 'Israel',
    region: 'Middle East',
    decimalPlaces: 2,
  },

  // ============================================
  // ASIA
  // ============================================
  PKR: {
    code: 'PKR',
    symbol: 'Rs',
    name: 'Pakistani Rupee',
    country: 'Pakistan',
    region: 'Asia',
    decimalPlaces: 2,
  },
  BDT: {
    code: 'BDT',
    symbol: '৳',
    name: 'Bangladeshi Taka',
    country: 'Bangladesh',
    region: 'Asia',
    decimalPlaces: 2,
  },
  LKR: {
    code: 'LKR',
    symbol: 'Rs',
    name: 'Sri Lankan Rupee',
    country: 'Sri Lanka',
    region: 'Asia',
    decimalPlaces: 2,
  },
  NPR: {
    code: 'NPR',
    symbol: 'Rs',
    name: 'Nepalese Rupee',
    country: 'Nepal',
    region: 'Asia',
    decimalPlaces: 2,
  },
  IDR: {
    code: 'IDR',
    symbol: 'Rp',
    name: 'Indonesian Rupiah',
    country: 'Indonesia',
    region: 'Asia',
    decimalPlaces: 0,
  },
  MYR: {
    code: 'MYR',
    symbol: 'RM',
    name: 'Malaysian Ringgit',
    country: 'Malaysia',
    region: 'Asia',
    decimalPlaces: 2,
  },
  PHP: {
    code: 'PHP',
    symbol: '₱',
    name: 'Philippine Peso',
    country: 'Philippines',
    region: 'Asia',
    decimalPlaces: 2,
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    country: 'Singapore',
    region: 'Asia',
    decimalPlaces: 2,
  },
  THB: {
    code: 'THB',
    symbol: '฿',
    name: 'Thai Baht',
    country: 'Thailand',
    region: 'Asia',
    decimalPlaces: 2,
  },
  VND: {
    code: 'VND',
    symbol: '₫',
    name: 'Vietnamese Dong',
    country: 'Vietnam',
    region: 'Asia',
    decimalPlaces: 0,
  },
} as const;

// ============================================
// CURRENCY TYPE
// ============================================
export const CurrencyTypeEnum = {
  FIAT: 'FIAT',
  CRYPTO: 'CRYPTO',
} as const;

export type CurrencyType =
  (typeof CurrencyTypeEnum)[keyof typeof CurrencyTypeEnum];

// ============================================
// HELPERS
// ============================================

/**
 * Get all currencies by region
 */
export function getCurrenciesByRegion(region: string): FiatCurrencyType[] {
  return Object.entries(FIAT_CURRENCY_INFO)
    .filter(([, info]) => info.region === region)
    .map(([code]) => code as FiatCurrencyType);
}

/**
 * Get all African currencies
 */
export function getAfricanCurrencies(): FiatCurrencyType[] {
  const africanRegions = [
    'East Africa',
    'West Africa',
    'Central Africa',
    'Southern Africa',
    'North Africa',
    'Indian Ocean',
  ];
  return Object.entries(FIAT_CURRENCY_INFO)
    .filter(([, info]) => africanRegions.includes(info.region))
    .map(([code]) => code as FiatCurrencyType);
}

/**
 * Get all East African currencies
 */
export function getEastAfricanCurrencies(): FiatCurrencyType[] {
  return getCurrenciesByRegion('East Africa');
}

/**
 * Get all West African currencies
 */
export function getWestAfricanCurrencies(): FiatCurrencyType[] {
  return getCurrenciesByRegion('West Africa');
}

/**
 * Get all Central African currencies
 */
export function getCentralAfricanCurrencies(): FiatCurrencyType[] {
  return getCurrenciesByRegion('Central Africa');
}

/**
 * Get all Southern African currencies
 */
export function getSouthernAfricanCurrencies(): FiatCurrencyType[] {
  return getCurrenciesByRegion('Southern Africa');
}

/**
 * Get all North African currencies
 */
export function getNorthAfricanCurrencies(): FiatCurrencyType[] {
  return getCurrenciesByRegion('North Africa');
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  return (
    FIAT_CURRENCY_INFO[currencyCode as keyof typeof FIAT_CURRENCY_INFO]
      ?.symbol || currencyCode
  );
}

/**
 * Get currency name
 */
export function getCurrencyName(currencyCode: string): string {
  return (
    FIAT_CURRENCY_INFO[currencyCode as keyof typeof FIAT_CURRENCY_INFO]?.name ||
    currencyCode
  );
}

/**
 * Get currency info
 */
export function getCurrencyInfo(
  currencyCode: string,
): CurrencyInfo | undefined {
  return FIAT_CURRENCY_INFO[currencyCode as keyof typeof FIAT_CURRENCY_INFO];
}

/**
 * Check if currency is African
 */
export function isAfricanCurrency(currencyCode: string): boolean {
  const africanRegions = [
    'East Africa',
    'West Africa',
    'Central Africa',
    'Southern Africa',
    'North Africa',
    'Indian Ocean',
  ];
  const info = getCurrencyInfo(currencyCode);
  return info ? africanRegions.includes(info.region) : false;
}

/**
 * Get currency decimal places
 */
export function getCurrencyDecimalPlaces(currencyCode: string): number {
  return (
    FIAT_CURRENCY_INFO[currencyCode as keyof typeof FIAT_CURRENCY_INFO]
      ?.decimalPlaces || 2
  );
}

/**
 * Format currency amount with proper decimal places
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: string,
  options: { locale?: string; includeSymbol?: boolean } = {},
): string {
  const info = getCurrencyInfo(currencyCode);
  const decimalPlaces = info?.decimalPlaces || 2;
  const symbol = info?.symbol || currencyCode;
  const locale = options.locale || 'en-US';
  const includeSymbol = options.includeSymbol !== false;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  const formattedAmount = formatter.format(amount);
  return includeSymbol ? `${symbol}${formattedAmount}` : formattedAmount;
}

// ============================================
// STATISTICS
// ============================================

export const AFRICAN_CURRENCY_COUNT = getAfricanCurrencies().length;
export const TOTAL_CURRENCY_COUNT = FIAT_CURRENCY_LIST.length;
