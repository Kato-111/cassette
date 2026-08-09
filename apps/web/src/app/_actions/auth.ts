"use server";

import { cookies } from "next/headers";
import {
  AUTH_COOKIE,
  REMEMBER_MAX_AGE,
  expectedToken,
  hashToken,
  isAuthConfigured,
  safeEqual,
} from "@/lib/auth";

type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export const loginAction = async (
  password: string,
  remember: boolean,
): Promise<ActionResult> => {
  const expected = expectedToken();
  // Auth disabled — nothing to do.
  if (!expected || !isAuthConfigured()) return { ok: true };

  if (!safeEqual(hashToken(password), expected)) {
    return { ok: false, error: "Incorrect password" };
  }

  (await cookies()).set(AUTH_COOKIE, expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge: REMEMBER_MAX_AGE } : {}),
  });

  return { ok: true };
};

export const logoutAction = async (): Promise<ActionResult> => {
  (await cookies()).delete(AUTH_COOKIE);
  return { ok: true };
};
