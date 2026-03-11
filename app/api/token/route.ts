import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { generateApiToken } from "@/lib/token";

/** Require session-based auth (no Bearer). Prevents token-based token management. */
async function requireSessionAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    return null; // reject Bearer-based access to token management
  }
  return requireAuth();
}

/** GET: return current token metadata (no raw token) */
export async function GET(request: NextRequest) {
  const auth = await requireSessionAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getDb().getApiToken(auth.userId);
  return NextResponse.json({ token });
}

/** POST: generate a new token (revokes existing). Session-only — no Bearer. */
export async function POST(request: NextRequest) {
  const auth = await requireSessionAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { raw, hash } = generateApiToken();
  const info = await getDb().createApiToken(auth.userId, hash);

  return NextResponse.json({ raw, token: info }, { status: 201 });
}

/** DELETE: revoke the user's token */
export async function DELETE(request: NextRequest) {
  const auth = await requireSessionAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await getDb().deleteApiToken(auth.userId);
  return NextResponse.json({ success: true });
}
