import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthOrToken } from "@/lib/session";
import { unlink } from "fs/promises";
import path from "path";

function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuthOrToken(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const docId = parseInt(id, 10);
  if (isNaN(docId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const document = await prisma.document.findUnique({ where: { id: docId } });
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Remove file from disk (best-effort)
  try {
    await unlink(path.join(getUploadDir(), document.filename));
  } catch {
    // file might already be gone — that's fine
  }

  await prisma.document.delete({ where: { id: docId } });

  return new NextResponse(null, { status: 204 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuthOrToken(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const docId = parseInt(id, 10);
  if (isNaN(docId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json();
  const { applicationIds } = body as { applicationIds?: number[] };

  if (!Array.isArray(applicationIds)) {
    return NextResponse.json({ error: "applicationIds must be an array" }, { status: 400 });
  }

  const document = await prisma.document.update({
    where: { id: docId },
    data: {
      applications: {
        set: applicationIds.map((aid) => ({ id: aid })),
      },
    },
    include: { applications: { select: { id: true, company: true, role: true } } },
  });

  return NextResponse.json(document);
}
