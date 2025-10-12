export const createId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  const fallback = Math.random().toString(36).slice(2, 11);
  return `${prefix}-${fallback}`;
};
