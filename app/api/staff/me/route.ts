import { NextRequest, NextResponse } from "next/server";

function getSession(req: NextRequest) {
  const cookie = req.cookies.get("yz_staff_session")?.value;
  if (!cookie) return null;
  try { return JSON.parse(atob(cookie)); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session?.id) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  return NextResponse.json({ id: session.id, name: session.name, is_owner: session.is_owner ?? false });
}
