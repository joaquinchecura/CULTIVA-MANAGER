import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ExerciseType } from "@prisma/client";

// GET /api/exercises/[id] - Obtener un ejercicio
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const exercise = await prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      return NextResponse.json({ error: "Ejercicio no encontrado" }, { status: 404 });
    }

    return NextResponse.json(exercise);
  } catch (error: any) {
    console.error("❌ [API] Error en GET [id]:", error.message);
    return NextResponse.json(
      { error: "Error interno", details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/exercises/[id] - Actualizar ejercicio
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
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
    return NextResponse.json(
      { error: "Error interno", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/exercises/[id] - Eliminar ejercicio
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.exercise.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ [API] Error en DELETE [id]:", error.message);
    return NextResponse.json(
      { error: "Error interno", details: error.message },
      { status: 500 }
    );
  }
}