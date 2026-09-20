import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { redirect } from "next/navigation";

export async function requireOrgForPage() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) redirect("/login");

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { status: true } });
  if (!org || org.status !== "ACTIVE") redirect("/login");

  return orgId;
}

export async function requireOrgForAction() {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("No autorizado");
  if (!orgId) throw new Error("No hay organización activa");

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { status: true } });
  if (!org || org.status !== "ACTIVE") throw new Error("Tu cuenta está suspendida. Contactá al administrador.");

  return orgId;
}

export async function requireOrg() {
  const { userId, orgId } = await auth();

  if (!userId) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  if (!orgId) {
    return { error: NextResponse.json({ error: "No hay organización activa" }, { status: 400 }) };
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { status: true } });
  if (!org || org.status !== "ACTIVE") {
    return { error: NextResponse.json({ error: "Tu cuenta está suspendida. Contactá al administrador." }, { status: 402 }) };
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

export async function getSessionContext() {
  const { userId, orgId, sessionClaims } = await auth();

  if (!userId) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  const metadata = sessionClaims?.publicMetadata as { platformAdmin?: boolean } | undefined;
  const isPlatformAdmin = metadata?.platformAdmin === true;

  return { userId, orgId: orgId ?? null, isPlatformAdmin, error: null };
}