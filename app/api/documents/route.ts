import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthOrToken } from "@/lib/session";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
}

export async function GET(request: NextRequest) {
  const session = await requireAuthOrToken(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await prisma.document.findMany({
    orderBy: { uploadedAt: "desc" },
    include: { applications: { select: { id: true, company: true, role: true } } },
  });

  return NextResponse.json(documents);
}

export async function POST(request: NextRequest) {
  const session = await requireAuthOrToken(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const applicationIdsRaw = formData.get("applicationIds") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: PDF, JPEG, PNG, WEBP" },
      { status: 415 }
    );
  }

  const uploadDir = getUploadDir();
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const ext = path.extname(file.name) || ".pdf";
  const storedFilename = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(uploadDir, storedFilename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Parse optional application IDs to link
  const applicationIds: number[] = [];
  if (applicationIdsRaw) {
    try {
      const parsed = JSON.parse(applicationIdsRaw);
      if (Array.isArray(parsed)) {
        applicationIds.push(...parsed.map(Number).filter(Boolean));
      }
    } catch {
      // ignore malformed input
    }
  }

  const document = await prisma.document.create({
    data: {
      filename: storedFilename,
      originalName: file.name.slice(0, 255),
      size: file.size,
      mimeType: file.type,
      applications: applicationIds.length
        ? { connect: applicationIds.map((id) => ({ id })) }
        : undefined,
    },
    include: { applications: { select: { id: true, company: true, role: true } } },
  });

  return NextResponse.json(document, { status: 201 });
}
