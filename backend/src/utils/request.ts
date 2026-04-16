export const getString = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[0]) : '';
  }

  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
};

export const getOptionalString = (value: unknown): string | undefined => {
  const normalized = getString(value);
  return normalized === '' ? undefined : normalized;
};

export const getInt = (value: unknown): number => {
  return parseInt(getString(value), 10);
};

export const getIntOr = (value: unknown, fallback: number): number => {
  const parsed = getInt(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const getFloat = (value: unknown): number => {
  return parseFloat(getString(value));
};

export const getFloatOr = (value: unknown, fallback: number): number => {
  const parsed = getFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};
