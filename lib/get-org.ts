import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function requireOrg() {
  const { userId, orgId } = await auth();

  if (!userId) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  if (!orgId) {
    return { error: NextResponse.json({ error: "No hay organización activa" }, { status: 400 }) };
  }
  return { userId, orgId, error: null };
}

export async function requirePlatformAdmin() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  const metadata = sessionClaims?.publicMetadata as { platformAdmin?: boolean } | undefined;
  const isPlatformAdmin = metadata?.platformAdmin === true;

  if (!isPlatformAdmin) {
    return { error: NextResponse.json({ error: "Acceso restringido" }, { status: 403 }) };
  }

  return { userId, error: null };
}