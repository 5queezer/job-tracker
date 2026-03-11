import { randomBytes, createHash } from "crypto";

export function generateApiToken(): { raw: string; hash: string } {
  const raw = `jt_${randomBytes(32).toString("hex")}`;
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashApiToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
