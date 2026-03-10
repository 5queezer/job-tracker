import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const auth = await requireAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: applicationId, contactId } = await params;
  const body = await request.json();
  const { name, email, phone, role, linkedIn } = body;

  const contact = await getDb().updateContact(contactId, applicationId, auth.userId, {
    ...(name !== undefined && { name: String(name).slice(0, 255) }),
    ...(email !== undefined && { email: email ? String(email).slice(0, 255) : null }),
    ...(phone !== undefined && { phone: phone ? String(phone).slice(0, 50) : null }),
    ...(role !== undefined && { role: role ? String(role).slice(0, 100) : null }),
    ...(linkedIn !== undefined && { linkedIn: linkedIn ? String(linkedIn).slice(0, 500) : null }),
  });

  return NextResponse.json(contact);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const auth = await requireAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: applicationId, contactId } = await params;
  await getDb().deleteContact(contactId, applicationId, auth.userId);

  return NextResponse.json({ success: true });
}
