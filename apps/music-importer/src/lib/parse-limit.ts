const MAX_LIMIT = 500;

export const parseLimit = (raw: string | undefined): number | null => {
  if (raw === undefined || raw.trim() === "") return null;

  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error("limit must be a positive integer");
  }
  if (n > MAX_LIMIT) {
    throw new Error(`limit cannot exceed ${MAX_LIMIT}`);
  }

  return n;
};
