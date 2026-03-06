import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { DocumentsClient } from "@/components/documents-client";

export default async function DocumentsPage() {
  const session = await requireAuth();

  if (!session) {
    redirect("/login");
  }

  return <DocumentsClient user={session.user} />;
}
