import { jwtVerify, SignJWT } from "jose";

// Kept free of next/headers so proxy.ts can import it.

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing required environment variable: AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(email: string) {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

/** Returns the admin email for a valid token, otherwise null. */
export async function verifySessionToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    // Changing ADMIN_EMAIL invalidates existing sessions.
    if (payload.role !== "admin" || payload.sub !== process.env.ADMIN_EMAIL) return null;
    return payload.sub;
  } catch {
    return null;
  }
}
