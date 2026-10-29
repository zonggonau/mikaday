import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "./env";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSessionToken,
  verifySessionToken,
} from "./session-token";

/** Constant-time string comparison (hashing first equalizes the lengths). */
export function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkAdminCredentials(email: string, password: string) {
  const emailOk = safeEqual(email.trim().toLowerCase(), env.adminEmail.trim().toLowerCase());
  const passwordOk = safeEqual(password, env.adminPassword);
  return emailOk && passwordOk;
}

export async function createAdminSession() {
  const token = await signSessionToken(env.adminEmail);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroyAdminSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getAdminEmail() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Call at the top of every admin page and Server Action. */
export async function requireAdmin() {
  const email = await getAdminEmail();
  if (!email) redirect("/admin/login");
  return email;
}
