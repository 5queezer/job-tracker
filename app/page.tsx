import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { Dashboard } from "@/components/dashboard";

export default async function Home() {
  const session = await requireAuth();

  if (!session) {
    redirect("/login");
  }

  return <Dashboard user={session.user} />;
}
