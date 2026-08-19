// app/actions/routines.ts — reemplazá las funciones existentes por estas

'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

// ============================================
// TIPOS
// ============================================

export interface RoutineExerciseInput {
  exerciseId: string
  sets: number
  reps: string
  targetWeight?: number | null
  rest?: string | null
  order: number
  notes?: string | null
}

export interface WeekTemplateSession {
  dayOfWeek: number        // 1-7, posición en la semana
  exercises: RoutineExerciseInput[]
}

export interface CreateRoutineInput {
  memberId: string
  name: string
  description?: string | null
  goal?: string | null
  frequencyPerWeek: number   // sesiones por semana (1-7)
  totalWeeks: number         // 4/6/8/10/12
  // template de la semana base — se replica totalWeeks veces
  weekTemplate: WeekTemplateSession[]
  // overrides de peso por sesión: [sessionNumber][exerciseIndex] = targetWeight
  weightOverrides: Record<number, Record<number, number | null>>
}

// ============================================
// HELPERS
// ============================================

async function getCurrentTrainer() {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')
  return userId
}

function buildSessionName(sessionNumber: number) {
  return `Sesión ${sessionNumber}`
}

// ============================================
// CREATE — genera todas las sesiones expandidas
// ============================================

export async function createRoutine(data: CreateRoutineInput) {
  await getCurrentTrainer()

  const days: {
    sessionNumber: number
    weekNumber: number
    dayOfWeek: number
    dayName: string
    order: number
    exercises: RoutineExerciseInput[]
  }[] = []

  let sessionNumber = 1

  for (let week = 1; week <= data.totalWeeks; week++) {
    for (const session of data.weekTemplate) {
      const overrides = data.weightOverrides[sessionNumber] || {}
      days.push({
        sessionNumber,
        weekNumber: week,
        dayOfWeek: session.dayOfWeek,
        dayName: buildSessionName(sessionNumber),
        order: sessionNumber - 1,
        exercises: session.exercises.map((ex, idx) => ({
          ...ex,
          targetWeight: overrides[idx] !== undefined ? overrides[idx] : ex.targetWeight,
        })),
      })
      sessionNumber++
    }
  }

  const routine = await prisma.routine.create({
    data: {
      memberId: data.memberId,
      name: data.name,
      description: data.description,
      goal: data.goal as any,
      frequencyPerWeek: data.frequencyPerWeek,
      totalWeeks: data.totalWeeks,
      isActive: true,
      days: {
        create: days.map((day) => ({
          sessionNumber: day.sessionNumber,
          weekNumber: day.weekNumber,
          dayOfWeek: day.dayOfWeek,
          dayName: day.dayName,
          order: day.order,
          exercises: {
            create: day.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              targetWeight: ex.targetWeight ?? null,
              rest: ex.rest ?? null,
              order: ex.order,
              notes: ex.notes ?? null,
            })),
          },
        })),
      },
    },
  })

  revalidatePath('/admin/rutinas')
  return routine
}

// ============================================
// UPDATE
// ============================================

export async function updateRoutine(id: string, data: CreateRoutineInput) {
  await getCurrentTrainer()

  // Borrar sesiones existentes y recrear
  await prisma.routineDay.deleteMany({ where: { routineId: id } })

  const days: Parameters<typeof createRoutine>[0]['weekTemplate'] extends any ? any[] : never[] = []
  let sessionNumber = 1

  for (let week = 1; week <= data.totalWeeks; week++) {
    for (const session of data.weekTemplate) {
      const overrides = data.weightOverrides[sessionNumber] || {}
      days.push({
        sessionNumber,
        weekNumber: week,
        dayOfWeek: session.dayOfWeek,
        dayName: buildSessionName(sessionNumber),
        order: sessionNumber - 1,
        exercises: session.exercises.map((ex: RoutineExerciseInput, idx: number) => ({
          ...ex,
          targetWeight: overrides[idx] !== undefined ? overrides[idx] : ex.targetWeight,
        })),
      })
      sessionNumber++
    }
  }

  const routine = await prisma.routine.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      goal: data.goal as any,
      frequencyPerWeek: data.frequencyPerWeek,
      totalWeeks: data.totalWeeks,
      memberId: data.memberId,
      days: {
        create: days.map((day) => ({
          sessionNumber: day.sessionNumber,
          weekNumber: day.weekNumber,
          dayOfWeek: day.dayOfWeek,
          dayName: day.dayName,
          order: day.order,
          exercises: {
            create: day.exercises.map((ex: RoutineExerciseInput) => ({
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              targetWeight: ex.targetWeight ?? null,
              rest: ex.rest ?? null,
              order: ex.order,
              notes: ex.notes ?? null,
            })),
          },
        })),
      },
    },
  })

  revalidatePath('/admin/rutinas')
  revalidatePath(`/admin/rutinas/${id}/editar`)
  return routine
}

// ============================================
// READ
// ============================================

export async function getRoutines(search?: string) {
  const routines = await prisma.routine.findMany({
    where: search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { member: { firstName: { contains: search, mode: 'insensitive' } } },
        { member: { lastName: { contains: search, mode: 'insensitive' } } },
      ],
    } : undefined,
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true },
      },
      days: {
        include: { exercises: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return routines
}

export async function getRoutineById(id: string) {
  return prisma.routine.findUnique({
    where: { id },
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true, email: true },
      },
      days: {
        orderBy: { sessionNumber: 'asc' },
        include: {
          exercises: {
            orderBy: { order: 'asc' },
            include: { exercise: true },
          },
        },
      },
    },
  })
}

// ============================================
// DELETE / TOGGLE
// ============================================

export async function deleteRoutine(id: string) {
  await getCurrentTrainer()
  await prisma.routine.delete({ where: { id } })
  revalidatePath('/admin/rutinas')
}

export async function toggleRoutineActive(id: string, isActive: boolean) {
  await getCurrentTrainer()
  await prisma.routine.update({ where: { id }, data: { isActive } })
  revalidatePath('/admin/rutinas')
}

// ============================================
// EXERCISES
// ============================================

export async function getExercises(search?: string, type?: string) {
  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { clientDescription: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (type) where.type = type

  return prisma.exercise.findMany({
    where,
    orderBy: { name: 'asc' },
    select: {
      id: true, name: true, type: true, muscleGroup: true,
      equipment: true, tags: true, description: true,
      clientDescription: true, imageUrl: true, gifUrl: true, videoUrl: true,
    },
  })
}

export async function createExercise(data: {
  name: string
  type: string
  description?: string
  muscleGroup?: string
  equipment?: string
  tags?: string[]
}) {
  await getCurrentTrainer()
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
  })
  revalidatePath('/exercises')
  return exercise
}

// ============================================
// SESSION TRACKING (cliente)
// ============================================

export async function getMyRoutines() {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')

  const member = await prisma.member.findFirst({ where: { clerkUserId: userId } })
  if (!member) throw new Error('Miembro no encontrado')

  return prisma.routine.findMany({
    where: { memberId: member.id, isActive: true },
    include: {
      days: {
        orderBy: { sessionNumber: 'asc' },
        include: {
          exercises: {
            orderBy: { order: 'asc' },
            include: { exercise: true },
          },
          sessionLogs: {
            where: { memberId: member.id },
            orderBy: { startedAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function startSession(routineId: string, routineDayId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')

  const member = await prisma.member.findFirst({ where: { clerkUserId: userId } })
  if (!member) throw new Error('Miembro no encontrado')

  // Verificar si ya hay una sesión en curso para este día
  const existing = await prisma.sessionLog.findFirst({
    where: {
      routineDayId,
      memberId: member.id,
      completedAt: null,
    },
  })
  if (existing) return existing

  return prisma.sessionLog.create({
    data: {
      routineId,
      routineDayId,
      memberId: member.id,
    },
  })
}

export async function completeSession(sessionLogId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')

  return prisma.sessionLog.update({
    where: { id: sessionLogId },
    data: { completedAt: new Date() },
  })
}

export async function getSessionProgress(routineDayId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')

  const member = await prisma.member.findFirst({ where: { clerkUserId: userId } })
  if (!member) throw new Error('Miembro no encontrado')

  // Traer el último sessionLog para este routineDay
  const sessionLog = await prisma.sessionLog.findFirst({
    where: { routineDayId, memberId: member.id },
    orderBy: { startedAt: 'desc' },
    include: {
      progressLogs: {
        include: { exercise: true },
        orderBy: { date: 'asc' },
      },
    },
  })

  return sessionLog
}

export async function logProgress(data: {
  routineId: string
  exerciseId: string
  sessionLogId?: string
  setsCompleted: number
  repsCompleted: string
  weightUsed: number
  notes?: string
}) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')

  const member = await prisma.member.findFirst({ where: { clerkUserId: userId } })
  if (!member) throw new Error('Miembro no encontrado')

  const log = await prisma.progressLog.create({
    data: {
      routineId: data.routineId,
      exerciseId: data.exerciseId,
      memberId: member.id,
      sessionLogId: data.sessionLogId ?? null,
      setsCompleted: data.setsCompleted,
      repsCompleted: data.repsCompleted,
      weightUsed: data.weightUsed,
      notes: data.notes ?? null,
    },
  })

  revalidatePath('/rutina')
  return log
}

export async function deleteProgressLog(logId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')

  await prisma.progressLog.delete({ where: { id: logId } })
  revalidatePath('/rutina')
}

export async function getProgressHistory(days = 30) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')

  const member = await prisma.member.findFirst({ where: { clerkUserId: userId } })
  if (!member) throw new Error('Miembro no encontrado')

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return prisma.progressLog.findMany({
    where: { memberId: member.id, date: { gte: startDate } },
    include: {
      exercise: { select: { id: true, name: true, type: true, muscleGroup: true } },
    },
    orderBy: { date: 'desc' },
  })
}