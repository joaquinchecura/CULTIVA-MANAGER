import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ExerciseType } from "@prisma/client";

// GET /api/exercises - Listar ejercicios con filtros
export async function GET(req: NextRequest) {
  console.log("🔍 [API] GET /api/exercises called");

  try {
    const { userId } = await auth();
    console.log("👤 [API] userId:", userId || "NO AUTH");

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const muscleGroup = searchParams.get("muscleGroup");
    const equipment = searchParams.get("equipment");

    console.log("🔍 [API] Filtros:", { type, tag, search, muscleGroup, equipment });

    const where: any = {};

    if (type && type !== "all") where.type = type as ExerciseType;
    if (muscleGroup && muscleGroup !== "all") where.muscleGroup = muscleGroup;
    if (equipment && equipment !== "all") where.equipment = equipment;

    if (tag && tag !== "all") {
      where.tags = { has: tag };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { clientDescription: { contains: search, mode: "insensitive" } },
      ];
    }

    console.log("🔍 [API] Query where:", JSON.stringify(where));

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: { name: "asc" },
    });

    console.log("✅ [API] Ejercicios encontrados:", exercises.length);
    return NextResponse.json(exercises);

  } catch (error: any) {
    console.error("❌ [API] Error en GET:", error.message, error.stack);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/exercises - Crear ejercicio
export async function POST(req: NextRequest) {
  console.log("🔍 [API] POST /api/exercises called");

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📦 [API] Body:", JSON.stringify(body, null, 2));

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
      tags 
    } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Nombre y tipo son obligatorios" }, { status: 400 });
    }

    const exercise = await prisma.exercise.create({
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
        isPublic: true,
      },
    });

    console.log("✅ [API] Creado:", exercise.name);
    return NextResponse.json(exercise, { status: 201 });

  } catch (error: any) {
    console.error("❌ [API] Error en POST:", error.message, error.stack);
    return NextResponse.json(
      { error: "Error interno", details: error.message },
      { status: 500 }
    );
  }
}