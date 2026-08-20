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
  memberId?: string | null    // ← ahora opcional
  isTemplate?: boolean        // ← nuevo
  name: string
  description?: string | null
  goal?: string | null
  frequencyPerWeek: number
  totalWeeks: number
  weekTemplate: WeekTemplateSession[]
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

async function archiveActiveRoutines(memberId: string, excludeId?: string) {
  await prisma.routine.updateMany({
    where: {
      memberId,
      isActive: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    data: { isActive: false },
  })
}

export async function createRoutine(data: CreateRoutineInput) {
  await getCurrentTrainer()

  if (!data.isTemplate && data.memberId) {
    await archiveActiveRoutines(data.memberId)
  }

  const days: any[] = []
  let sessionNumber = 1
  for (let week = 1; week <= data.totalWeeks; week++) {
    for (const session of data.weekTemplate) {
      const overrides = data.weightOverrides[sessionNumber] || {}
      days.push({
        sessionNumber, weekNumber: week, dayOfWeek: session.dayOfWeek,
        dayName: buildSessionName(sessionNumber), order: sessionNumber - 1,
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
      memberId: data.isTemplate ? null : data.memberId,
      isTemplate: !!data.isTemplate,
      name: data.name,
      description: data.description,
      goal: data.goal as any,
      frequencyPerWeek: data.frequencyPerWeek,
      totalWeeks: data.totalWeeks,
      isActive: true,
      days: {
        create: days.map((day) => ({
          sessionNumber: day.sessionNumber, weekNumber: day.weekNumber,
          dayOfWeek: day.dayOfWeek, dayName: day.dayName, order: day.order,
          exercises: {
            create: day.exercises.map((ex: any) => ({
              exerciseId: ex.exerciseId, sets: ex.sets, reps: ex.reps,
              targetWeight: ex.targetWeight ?? null, rest: ex.rest ?? null,
              order: ex.order, notes: ex.notes ?? null,
            })),
          },
        })),
      },
    },
  })

  revalidatePath('/admin/rutinas')
  if (data.memberId) revalidatePath(`/admin/clientes/${data.memberId}`)
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
  return prisma.routine.findMany({
    where: {
      isTemplate: false,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { member: { firstName: { contains: search, mode: 'insensitive' } } },
          { member: { lastName: { contains: search, mode: 'insensitive' } } },
        ],
      } : {}),
    },
    include: {
      member: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
      days: { include: { exercises: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
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

export async function getTemplates() {
  return prisma.routine.findMany({
    where: { isTemplate: true },
    include: { days: { include: { exercises: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function assignTemplateToMember(templateId: string, memberId: string) {
  await getCurrentTrainer()

  const template = await prisma.routine.findUnique({
    where: { id: templateId },
    include: { days: { orderBy: { sessionNumber: 'asc' }, include: { exercises: true } } },
  })
  if (!template) throw new Error('Template no encontrado')

  await archiveActiveRoutines(memberId)

  const routine = await prisma.routine.create({
    data: {
      memberId,
      isTemplate: false,
      name: template.name,
      description: template.description,
      goal: template.goal,
      frequencyPerWeek: template.frequencyPerWeek,
      totalWeeks: template.totalWeeks,
      isActive: true,
      days: {
        create: template.days.map((day) => ({
          sessionNumber: day.sessionNumber, weekNumber: day.weekNumber,
          dayOfWeek: day.dayOfWeek, dayName: day.dayName, order: day.order,
          exercises: {
            create: day.exercises.map((ex) => ({
              exerciseId: ex.exerciseId, sets: ex.sets, reps: ex.reps,
              targetWeight: ex.targetWeight, rest: ex.rest,
              order: ex.order, notes: ex.notes,
            })),
          },
        })),
      },
    },
  })

  revalidatePath('/admin/rutinas')
  revalidatePath(`/admin/clientes/${memberId}`)
  return routine
}

export async function getActiveRoutineForMember(memberId: string) {
  return prisma.routine.findFirst({
    where: { memberId, isActive: true, isTemplate: false },
    include: { days: { include: { exercises: true } } },
  })
}