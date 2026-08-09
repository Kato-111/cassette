export const DEFAULT_SEARCH_LIMIT = 10;
export const MAX_SEARCH_LIMIT = 50;

/** Parse the bounded number of YouTube results requested by the client. */
export const parseSearchLimit = (value: string | undefined): number => {
  const trimmed = value?.trim();
  if (!trimmed) return DEFAULT_SEARCH_LIMIT;

  if (!/^\d+$/.test(trimmed)) {
    throw new Error("limit must be a positive integer");
  }

  const limit = Number.parseInt(trimmed, 10);
  if (limit < 1) {
    throw new Error("limit must be a positive integer");
  }
  if (limit > MAX_SEARCH_LIMIT) {
    throw new Error(`limit cannot exceed ${MAX_SEARCH_LIMIT}`);
  }

  return limit;
};
