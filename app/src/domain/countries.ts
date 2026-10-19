// Country rules used by the packing list and the document checks (ISO alpha-2 codes).

/** EU + Schengen: a Portuguese citizen card is enough. */
const CC_ENOUGH = new Set([
  'PT',
  'ES',
  'FR',
  'IT',
  'DE',
  'NL',
  'BE',
  'LU',
  'AT',
  'IE',
  'GR',
  'MT',
  'CY',
  'FI',
  'SE',
  'DK',
  'EE',
  'LV',
  'LT',
  'PL',
  'CZ',
  'SK',
  'SI',
  'HR',
  'HU',
  'RO',
  'BG',
  'CH',
  'NO',
  'IS',
  'LI',
  'AD',
  'MC',
  'SM',
  'VA',
]);

/** Places with plugs different from the Portuguese type F. */
const OTHER_PLUGS = new Set([
  'GB',
  'IE',
  'MT',
  'CY',
  'CH',
  'US',
  'CA',
  'MX',
  'BR',
  'JP',
  'CN',
  'AU',
  'NZ',
  'ZA',
  'IN',
  'AR',
  'TH',
  'SG',
  'HK',
  'AE',
]);

/** Unknown country (typed by hand): assume the citizen card is enough. */
export const needsPassport = (countryCode?: string) =>
  !!countryCode && !CC_ENOUGH.has(countryCode.toUpperCase());

export const needsPlugAdapter = (countryCode?: string) =>
  !!countryCode && OTHER_PLUGS.has(countryCode.toUpperCase());
