import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ExerciseType } from "@prisma/client";
import { getSessionContext } from "@/lib/get-org";

// GET /api/exercises/[id] - Obtener un ejercicio
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, isPlatformAdmin, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;

    const exercise = await prisma.exercise.findUnique({ where: { id } });

    if (!exercise) {
      return NextResponse.json({ error: "Ejercicio no encontrado" }, { status: 404 });
    }

    // Visible si es global, si es propio del profesional, o si sos platform admin
    const canView = exercise.organizationId === null || exercise.organizationId === orgId || isPlatformAdmin;
    if (!canView) {
      return NextResponse.json({ error: "Ejercicio no encontrado" }, { status: 404 });
    }

    return NextResponse.json(exercise);
  } catch (error: any) {
    console.error("❌ [API] Error en GET [id]:", error.message);
    return NextResponse.json({ error: "Error interno", details: error.message }, { status: 500 });
  }
}

// PUT /api/exercises/[id] - Actualizar ejercicio
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, isPlatformAdmin, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;

    const existing = await prisma.exercise.findUnique({ where: { id }, select: { organizationId: true } });
    if (!existing) {
      return NextResponse.json({ error: "Ejercicio no encontrado" }, { status: 404 });
    }

    // Editar un ejercicio propio: OK. Editar uno global: solo platform admin. Editar uno ajeno: nunca.
    const canEdit =
      (existing.organizationId !== null && existing.organizationId === orgId) ||
      (existing.organizationId === null && isPlatformAdmin);

    if (!canEdit) {
      return NextResponse.json({ error: "No tenés permiso para editar este ejercicio" }, { status: 403 });
    }

    const body = await req.json();

    const {
      name,
      type,
      description,
      clientDescription,
      muscleGroup,
      equipment,
      videoUrl,
      imageUrl,
      gifUrl,
      tags,
    } = body;

    const exercise = await prisma.exercise.update({
      where: { id },
      data: {
        name,
        type: type as ExerciseType,
        description: description || null,
        clientDescription: clientDescription || null,
        muscleGroup: muscleGroup || null,
        equipment: equipment || null,
        videoUrl: videoUrl || null,
        imageUrl: imageUrl || null,
        gifUrl: gifUrl || null,
        tags: tags || [],
      },
    });

    return NextResponse.json(exercise);
  } catch (error: any) {
    console.error("❌ [API] Error en PUT [id]:", error.message);
    return NextResponse.json({ error: "Error interno", details: error.message }, { status: 500 });
  }
}

// DELETE /api/exercises/[id] - Eliminar ejercicio
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, isPlatformAdmin, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;

    const existing = await prisma.exercise.findUnique({ where: { id }, select: { organizationId: true } });
    if (!existing) {
      return NextResponse.json({ error: "Ejercicio no encontrado" }, { status: 404 });
    }

    const canDelete =
      (existing.organizationId !== null && existing.organizationId === orgId) ||
      (existing.organizationId === null && isPlatformAdmin);

    if (!canDelete) {
      return NextResponse.json({ error: "No tenés permiso para eliminar este ejercicio" }, { status: 403 });
    }

    await prisma.exercise.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ [API] Error en DELETE [id]:", error.message);
    return NextResponse.json({ error: "Error interno", details: error.message }, { status: 500 });
  }
}