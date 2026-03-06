import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthOrToken } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const session = await requireAuthOrToken(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, contactId } = await params;
  const applicationId = Number(id);
  const numericContactId = Number(contactId);

  if (
    !Number.isInteger(applicationId) || applicationId <= 0 ||
    !Number.isInteger(numericContactId) || numericContactId <= 0
  ) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json();
  const { name, email, phone, role, linkedIn } = body;

  const contact = await prisma.contact.update({
    where: { id: numericContactId, applicationId },
    data: {
      ...(name !== undefined && { name: String(name).slice(0, 255) }),
      ...(email !== undefined && { email: email ? String(email).slice(0, 255) : null }),
      ...(phone !== undefined && { phone: phone ? String(phone).slice(0, 50) : null }),
      ...(role !== undefined && { role: role ? String(role).slice(0, 100) : null }),
      ...(linkedIn !== undefined && { linkedIn: linkedIn ? String(linkedIn).slice(0, 500) : null }),
    },
  });

  return NextResponse.json(contact);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const session = await requireAuthOrToken(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, contactId } = await params;
  const applicationId = Number(id);
  const numericContactId = Number(contactId);

  if (
    !Number.isInteger(applicationId) || applicationId <= 0 ||
    !Number.isInteger(numericContactId) || numericContactId <= 0
  ) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await prisma.contact.delete({
    where: { id: numericContactId, applicationId },
  });

  return NextResponse.json({ success: true });
}
