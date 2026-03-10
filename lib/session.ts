import { headers } from "next/headers";
import { auth } from "./auth";
import { prisma } from "./prisma";

export type SessionUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isAdmin: boolean;
};

export type SessionAuthResult = {
  userId: string;
  /** Use for read-only list/get operations. Null means global read access. */
  readScopeUserId: string | null;
  user: SessionUser;
};

function parseAllowedEmails(): string[] {
  return (process.env.ALLOWED_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

async function maybeBootstrapFirstAdmin(userId: string, email: string): Promise<boolean> {
  const allowedEmails = parseAllowedEmails();
  if (!allowedEmails.includes(email)) {
    return false;
  }

  const adminCount = await prisma.user.count({ where: { isAdmin: true } });
  if (adminCount > 0) {
    return false;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isAdmin: true },
  });

  return true;
}

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

/**
 * Requires a valid session. If ALLOWED_EMAIL is set (comma-separated list),
 * only those emails are permitted. The first allowed user is bootstrapped as
 * admin if no admin exists yet.
 */
export async function requireAuth(): Promise<SessionAuthResult | null> {
  const session = await getSession();
  if (!session) return null;

  const allowedEmails = parseAllowedEmails();
  if (allowedEmails.length > 0 && !allowedEmails.includes(session.user.email)) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  let isAdmin = dbUser?.isAdmin ?? false;
  if (!isAdmin) {
    isAdmin = await maybeBootstrapFirstAdmin(session.user.id, session.user.email);
  }

  return {
    userId: session.user.id,
    readScopeUserId: isAdmin ? null : session.user.id,
    user: {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email,
      image: (session.user as { image?: string | null }).image ?? null,
      isAdmin,
    },
  };
}

export async function requireAdmin(): Promise<SessionAuthResult | null> {
  const session = await requireAuth();
  if (!session || !session.user.isAdmin) {
    return null;
  }

  return session;
}
