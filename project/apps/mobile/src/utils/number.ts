export const formatCompactNumber = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '0';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return value.toString();
  }
};
