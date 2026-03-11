import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (typeof body?.isAdmin !== "boolean") {
    return NextResponse.json({ error: "isAdmin must be a boolean" }, { status: 400 });
  }

  const { id } = await params;
  const users = await getDb().listUsers();
  const target = users.find((user) => user.id === id);

  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const adminCount = users.filter((user) => user.isAdmin).length;
  if (target.isAdmin && !body.isAdmin && adminCount <= 1) {
    return NextResponse.json(
      { error: "At least one admin user is required" },
      { status: 400 }
    );
  }

  const updated = await getDb().updateUserAdmin(id, body.isAdmin);
  return NextResponse.json(updated);
}
