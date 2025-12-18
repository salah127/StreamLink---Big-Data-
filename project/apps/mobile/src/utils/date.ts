const TIME_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: 'day', ms: 1000 * 60 * 60 * 24 },
  { unit: 'hour', ms: 1000 * 60 * 60 },
  { unit: 'minute', ms: 1000 * 60 },
  { unit: 'second', ms: 1000 },
];

export const formatRelativeTimeFromNow = (value?: string | Date | null): string => {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diff = date.getTime() - Date.now();
  const absDiff = Math.abs(diff);

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  for (const { unit, ms } of TIME_UNITS) {
    if (absDiff >= ms || unit === 'second') {
      const valueRounded = Math.round(diff / ms);
      return formatter.format(valueRounded, unit);
    }
  }

  return '';
};
