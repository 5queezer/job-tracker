import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { deleteFile } from "@/lib/storage";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const document = await getDb().deleteDocument(id, auth.userId);
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteFile(document.filename);

  return new NextResponse(null, { status: 204 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { applicationIds, originalName } = body as { applicationIds?: string[]; originalName?: string };

  // Rename
  if (typeof originalName === "string") {
    const trimmed = originalName.trim();
    if (trimmed.length === 0 || trimmed.length > 255) {
      return NextResponse.json({ error: "originalName must be 1-255 characters" }, { status: 400 });
    }
    const document = await getDb().renameDocument(id, auth.userId, trimmed);
    if (!document) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(document);
  }

  // Update application links
  if (!Array.isArray(applicationIds)) {
    return NextResponse.json({ error: "applicationIds must be an array or originalName must be a string" }, { status: 400 });
  }

  const document = await getDb().updateDocumentLinks(id, auth.userId, applicationIds);
  return NextResponse.json(document);
}
