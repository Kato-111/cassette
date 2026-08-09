import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "cassette_auth";

/** Cookie lifetime when "remember me" is enabled (~10 years, in seconds). */
export const REMEMBER_MAX_AGE = 60 * 60 * 24 * 365 * 10;

/** The shared secret. Auth is fully disabled when this is unset/empty. */
const getSecret = (): string | undefined => process.env.AUTH_PASSWORD || undefined;

export const isAuthConfigured = (): boolean => Boolean(getSecret());

/** SHA-256 hex digest of a value. */
export const hashToken = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

/** The token a valid session cookie must hold, or null when auth is disabled. */
export const expectedToken = (): string | null => {
  const secret = getSecret();
  return secret ? hashToken(secret) : null;
};

/** Constant-time equality for two hex token strings. */
export const safeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};

/**
 * Whether the current request is authenticated. Always true when auth is not
 * configured (no AUTH_PASSWORD), so the app stays fully open by default.
 */
export const isAuthed = async (): Promise<boolean> => {
  const expected = expectedToken();
  if (!expected) return true;
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  return Boolean(token) && safeEqual(token as string, expected);
};
