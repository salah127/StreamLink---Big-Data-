export const sanitizeName = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  return value
    .replace(/\s+/g, ' ')
    .trim();
};

export const hasContent = (value?: string | null): boolean => {
  return sanitizeName(value).length > 0;
};
