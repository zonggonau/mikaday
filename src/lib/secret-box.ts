import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "./env";

// AES-256-GCM for secrets stored in the database (e.g. the SMTP password).
// The key is derived from AUTH_SECRET: rotating AUTH_SECRET means re-entering those secrets.

const VERSION = "v1";

function key() {
  return createHash("sha256").update(`mikaday:secret-box:${env.authSecret}`).digest();
}

export function seal(plaintext: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `${VERSION}:${Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64")}`;
}

export function open(sealed: string) {
  const [version, payload] = sealed.split(":");
  if (version !== VERSION || !payload) throw new Error("Unknown secret format.");
  const raw = Buffer.from(payload, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
}
