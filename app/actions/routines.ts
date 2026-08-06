"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ============================================
// TIPOS
// ============================================

export interface RoutineExerciseInput {
  exerciseId: string;
  sets: number;
  reps: string;
  rest?: string | null;
  order: number;
  notes?: string | null;
}

export interface RoutineDayInput {
  dayName: string;
  order: number;
  exercises: RoutineExerciseInput[];
}

export interface CreateRoutineInput {
  memberId: string;
  name: string;
  description?: string | null;
  goal?: string | null;
  frequencyPerWeek?: number | null;
  days: RoutineDayInput[];
}

// ============================================
// HELPERS
// ============================================

async function getCurrentTrainer() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");
  
  // Opcional: verificar que sea entrenador/admin
  return userId;
}

// ============================================
// CREATE
// ============================================

export async function createRoutine(data: CreateRoutineInput) {
  await getCurrentTrainer();

  const routine = await prisma.routine.create({
    data: {
      memberId: data.memberId,
      name: data.name,
      description: data.description,
      goal: data.goal as any,
      frequencyPerWeek: data.frequencyPerWeek,
      isActive: true,
      days: {
        create: data.days.map((day) => ({
          dayName: day.dayName,
          order: day.order,
          exercises: {
            create: day.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              rest: ex.rest,
              order: ex.order,
              notes: ex.notes,
            })),
          },
        })),
      },
    },
    include: {
      days: {
        include: {
          exercises: {
            include: { exercise: true },
          },
        },
      },
    },
  });

  revalidatePath("/routines");
  return routine;
}

// ============================================
// READ
// ============================================

export async function getRoutines(search?: string) {
  const routines = await prisma.routine.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { member: { firstName: { contains: search, mode: "insensitive" } } },
            { member: { lastName: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true },
      },
      days: {
        include: {
          exercises: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return routines;
}

export async function getRoutineById(id: string) {
  const routine = await prisma.routine.findUnique({
    where: { id },
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true, email: true },
      },
      days: {
        orderBy: { order: "asc" },
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: { exercise: true },
          },
        },
      },
    },
  });

  return routine;
}

// ============================================
// UPDATE
// ============================================

export async function updateRoutine(id: string, data: CreateRoutineInput) {
  await getCurrentTrainer();

  // Eliminar días existentes y recrear (más simple que diff)
  await prisma.routineDay.deleteMany({
    where: { routineId: id },
  });

  const routine = await prisma.routine.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      goal: data.goal as any,
      frequencyPerWeek: data.frequencyPerWeek,
      memberId: data.memberId,
      days: {
        create: data.days.map((day) => ({
          dayName: day.dayName,
          order: day.order,
          exercises: {
            create: day.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              rest: ex.rest,
              order: ex.order,
              notes: ex.notes,
            })),
          },
        })),
      },
    },
    include: {
      days: {
        include: {
          exercises: {
            include: { exercise: true },
          },
        },
      },
    },
  });

  revalidatePath("/routines");
  revalidatePath(`/routines/${id}/edit`);
  return routine;
}

// ============================================
// DELETE / TOGGLE
// ============================================

export async function deleteRoutine(id: string) {
  await getCurrentTrainer();
  
  await prisma.routine.delete({ where: { id } });
  revalidatePath("/routines");
}

export async function toggleRoutineActive(id: string, isActive: boolean) {
  await getCurrentTrainer();
  
  await prisma.routine.update({
    where: { id },
    data: { isActive },
  });
  revalidatePath("/routines");
}

// ============================================
// EXERCISES
// ============================================

export async function getExercises(search?: string, type?: string) {
  const exercises = await prisma.exercise.findMany({
    where: {
      AND: [
        search ? { name: { contains: search, mode: "insensitive" } } : {},
        type ? { type: type as any } : {},
      ],
    },
    orderBy: { name: "asc" },
  });

  return exercises;
}

export async function createExercise(data: {
  name: string;
  type: string;
  description?: string;
  muscleGroup?: string;
  equipment?: string;
  tags?: string[];
}) {
  await getCurrentTrainer();

  const exercise = await prisma.exercise.create({
    data: {
      name: data.name,
      type: data.type as any,
      description: data.description,
      muscleGroup: data.muscleGroup,
      equipment: data.equipment,
      tags: data.tags || [],
      isPublic: true,
    },
  });

  revalidatePath("/exercises");
  return exercise;
}