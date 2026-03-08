import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuthOrToken } from "@/lib/session";
import { requireUserId } from "@/lib/tenant";
import { isConfigured, duplicateResume, getResumeEditUrl } from "@/lib/reactive-resume";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthOrToken(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: string;
  try {
    userId = requireUserId(auth.userId);
  } catch {
    return NextResponse.json({ error: "Session required" }, { status: 403 });
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Reactive Resume integration not configured" },
      { status: 501 }
    );
  }

  const { id } = await params;
  const db = getDb();
  const application = await db.getApplication(id, userId);

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If a resume already exists, just return it
  if (application.resumeId) {
    return NextResponse.json({
      resumeId: application.resumeId,
      editUrl: getResumeEditUrl(application.resumeId),
    });
  }

  try {
    const name = `${application.company} — ${application.role}`;
    const resumeId = await duplicateResume(name);

    // Store the resume ID on the application
    await db.updateApplication(id, userId, { resumeId });

    return NextResponse.json({
      resumeId,
      editUrl: getResumeEditUrl(resumeId),
    });
  } catch (err) {
    console.error("Failed to create tailored resume:", err);
    return NextResponse.json(
      { error: "Failed to create resume" },
      { status: 502 }
    );
  }
}
