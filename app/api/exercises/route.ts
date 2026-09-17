import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ExerciseType } from "@prisma/client";
import { requireOrg } from "@/lib/get-org";

// GET /api/exercises - Listar ejercicios con filtros
export async function GET(req: NextRequest) {
  console.log("🔍 [API] GET /api/exercises called");

  try {
    const { orgId, error } = await requireOrg();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const muscleGroup = searchParams.get("muscleGroup");
    const equipment = searchParams.get("equipment");

    console.log("🔍 [API] Filtros:", { type, tag, search, muscleGroup, equipment });

    const where: any = {
      OR: [
        { organizationId: orgId },  // ejercicios propios del profesional
        { organizationId: null },   // librería global compartida
      ],
    };

    if (type && type !== "all") where.type = type as ExerciseType;
    if (muscleGroup && muscleGroup !== "all") where.muscleGroup = muscleGroup;
    if (equipment && equipment !== "all") where.equipment = equipment;

    if (tag && tag !== "all") {
      where.tags = { has: tag };
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            // clientDescription omitido hasta migrar la DB
          ],
        },
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
    console.error("❌ [API] Error en GET:", error.message);
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
    const { orgId, error } = await requireOrg();
    if (error) return error;

    const body = await req.json();
    console.log("📦 [API] Body:", JSON.stringify(body, null, 2));

    const {
      name,
      type,
      description,
      muscleGroup,
      equipment,
      videoUrl,
      imageUrl,
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
        muscleGroup: muscleGroup || null,
        equipment: equipment || null,
        videoUrl: videoUrl || null,
        imageUrl: imageUrl || null,
        tags: tags || [],
        isPublic: true,
        organizationId: orgId,  // ejercicio propio del profesional, no global
      },
    });

    console.log("✅ [API] Creado:", exercise.name);
    return NextResponse.json(exercise, { status: 201 });

  } catch (error: any) {
    console.error("❌ [API] Error en POST:", error.message);
    return NextResponse.json(
      { error: "Error interno", details: error.message },
      { status: 500 }
    );
  }
}