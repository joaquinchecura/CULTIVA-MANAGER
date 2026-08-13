import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ExerciseType } from "@prisma/client";

// GET /api/exercises - Listar ejercicios con filtros
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");
  const isPublic = searchParams.get("isPublic");
  const muscleGroup = searchParams.get("muscleGroup");
  const equipment = searchParams.get("equipment");

  const where: any = {};
  
  if (type && type !== "all") where.type = type as ExerciseType;
  if (isPublic !== null) where.isPublic = isPublic === "true";
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

  const exercises = await prisma.exercise.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(exercises);
}

// POST /api/exercises - Crear ejercicio
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
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
      tags 
    } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Nombre y tipo son obligatorios" }, { status: 400 });
    }

    const exercise = await prisma.exercise.create({
      data: {
        name,
        type: type as ExerciseType,
        description,
        clientDescription,
        muscleGroup,
        equipment,
        videoUrl,
        imageUrl,
        gifUrl,
        tags: tags || [],
        isPublic: true,
      },
    });

    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    console.error("Error creando ejercicio:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}