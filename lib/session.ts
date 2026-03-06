import { headers } from "next/headers";
import { auth } from "./auth";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const allowedEmail = process.env.ALLOWED_EMAIL || "christian.pojoni@gmail.com";
  if (session.user.email !== allowedEmail) {
    return null;
  }

  return session;
}
