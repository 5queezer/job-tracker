import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const application = await prisma.application.findUnique({
    where: { id: Number(id) },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(application);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { company, role, status, appliedAt, lastContact, followUpAt, notes } = body;

  const application = await prisma.application.update({
    where: { id: Number(id) },
    data: {
      ...(company !== undefined && { company }),
      ...(role !== undefined && { role }),
      ...(status !== undefined && { status }),
      ...(appliedAt !== undefined && {
        appliedAt: appliedAt ? new Date(appliedAt) : null,
      }),
      ...(lastContact !== undefined && {
        lastContact: lastContact ? new Date(lastContact) : null,
      }),
      ...(followUpAt !== undefined && {
        followUpAt: followUpAt ? new Date(followUpAt) : null,
      }),
      ...(notes !== undefined && { notes }),
    },
  });

  return NextResponse.json(application);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.application.delete({
    where: { id: Number(id) },
  });

  return NextResponse.json({ success: true });
}
