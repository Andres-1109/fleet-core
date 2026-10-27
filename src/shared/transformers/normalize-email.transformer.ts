/** class-transformer helper: trims and lowercases emails so lookups are case-insensitive. */
export const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
