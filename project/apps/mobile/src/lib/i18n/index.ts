import { en } from './locales/en';

type LocaleKey = keyof typeof SUPPORTED_LOCALES;

type TranslationParams = Record<string, string | number | boolean>;

type TranslationDictionary = Record<string, unknown>;

const SUPPORTED_LOCALES = {
  en,
} as const;

const DEFAULT_LOCALE: LocaleKey = 'en';

const isRecord = (value: unknown): value is TranslationDictionary =>
  typeof value === 'object' && value !== null;

const resolveTranslationValue = (key: string, locale: LocaleKey): string | undefined => {
  const segments = key.split('.');
  let current: unknown = SUPPORTED_LOCALES[locale];

  for (const segment of segments) {
    if (!isRecord(current) || !(segment in current)) {
      return undefined;
    }

    current = current[segment];
  }

  return typeof current === 'string' ? current : undefined;
};

const interpolate = (template: string, params?: TranslationParams): string => {
  if (!params) {
    return template;
  }

  return template.replace(/{{(\w+)}}/g, (_match, token) => {
    const value = params[token];

    if (value === undefined || value === null) {
      return '';
    }

    return String(value);
  });
};

export const t = (key: string, params?: TranslationParams): string => {
  const translation = resolveTranslationValue(key, DEFAULT_LOCALE) ?? key;
  return interpolate(translation, params);
};

export const formatDate = (
  date: Date,
  options?: Intl.DateTimeFormatOptions,
  locale: LocaleKey = DEFAULT_LOCALE,
): string => {
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[i18n] Failed to format date', error);
    }
    return date.toDateString();
  }
};
