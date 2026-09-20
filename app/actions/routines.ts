// app/actions/routines.ts

'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { requireOrgForAction } from '@/lib/get-org'
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
  dayOfWeek: number
  exercises: RoutineExerciseInput[]
}

export interface CreateRoutineInput {
  memberId?: string | null
  isTemplate?: boolean
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

async function archiveActiveRoutines(memberId: string, orgId: string, excludeId?: string) {
  await prisma.routine.updateMany({
    where: {
      memberId,
      organizationId: orgId,
      isActive: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    data: { isActive: false },
  })
}

export async function createRoutine(data: CreateRoutineInput) {
  const orgId = await requireOrgForAction()

  // Si es para un cliente puntual (no template), verificar que sea de esta organización
  if (!data.isTemplate && data.memberId) {
    const member = await prisma.member.findFirst({
      where: { id: data.memberId, organizationId: orgId },
      select: { id: true },
    })
    if (!member) throw new Error('Cliente no encontrado')
    await archiveActiveRoutines(data.memberId, orgId)
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
      memberId: data.isTemplate ? null : (data.memberId ?? null),
      isTemplate: !!data.isTemplate,
      name: data.name,
      description: data.description,
      goal: data.goal as any,
      frequencyPerWeek: data.frequencyPerWeek,
      totalWeeks: data.totalWeeks,
      isActive: true,
      organizationId: orgId,
      days: {
        create: days.map((day) => ({
          sessionNumber: day.sessionNumber, weekNumber: day.weekNumber,
          dayOfWeek: day.dayOfWeek, dayName: day.dayName, order: day.order,
          organizationId: orgId,
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
  const orgId = await requireOrgForAction()

  // Verificar que la rutina sea de esta organización antes de tocar nada
  const existing = await prisma.routine.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true },
  })
  if (!existing) throw new Error('Rutina no encontrada')

  const newDays: {
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
      newDays.push({
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

  const existingDays = await prisma.routineDay.findMany({
    where: { routineId: id },
    select: { id: true, sessionNumber: true },
  })
  const existingBySession = new Map(existingDays.map(d => [d.sessionNumber, d.id]))
  const newSessionNumbers = new Set(newDays.map(d => d.sessionNumber))

  for (const day of newDays) {
    const existingId = existingBySession.get(day.sessionNumber)

    if (existingId) {
      await prisma.routineDay.update({
        where: { id: existingId },
        data: {
          weekNumber: day.weekNumber,
          dayOfWeek: day.dayOfWeek,
          dayName: day.dayName,
          order: day.order,
        },
      })
      await prisma.routineExercise.deleteMany({ where: { dayId: existingId } })
      await prisma.routineExercise.createMany({
        data: day.exercises.map((ex, idx) => ({
          dayId: existingId,
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          targetWeight: ex.targetWeight ?? null,
          rest: ex.rest ?? null,
          order: idx,
          notes: ex.notes ?? null,
        })),
      })
    } else {
      await prisma.routineDay.create({
        data: {
          routineId: id,
          sessionNumber: day.sessionNumber,
          weekNumber: day.weekNumber,
          dayOfWeek: day.dayOfWeek,
          dayName: day.dayName,
          order: day.order,
          organizationId: orgId,
          exercises: {
            create: day.exercises.map((ex, idx) => ({
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              targetWeight: ex.targetWeight ?? null,
              rest: ex.rest ?? null,
              order: idx,
              notes: ex.notes ?? null,
            })),
          },
        },
      })
    }
  }

  const staleDayIds = existingDays
    .filter(d => !newSessionNumbers.has(d.sessionNumber))
    .map(d => d.id)

  for (const dayId of staleDayIds) {
    try {
      await prisma.routineDay.delete({ where: { id: dayId } })
    } catch {
      // tiene SessionLog asociado — se preserva intacto
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
      memberId: data.memberId ?? null,
    },
  })

  revalidatePath('/admin/rutinas')
  revalidatePath(`/admin/rutinas/${id}/editar`)
  if (data.memberId) revalidatePath(`/admin/clientes/${data.memberId}`)
  return routine
}

// ============================================
// READ
// ============================================

export async function getRoutines(search?: string) {
  const orgId = await requireOrgForAction()
  return prisma.routine.findMany({
    where: {
      organizationId: orgId,
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
  const orgId = await requireOrgForAction()
  return prisma.routine.findFirst({
    where: { id, organizationId: orgId },
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
  const orgId = await requireOrgForAction()
  const result = await prisma.routine.deleteMany({ where: { id, organizationId: orgId } })
  if (result.count === 0) throw new Error('Rutina no encontrada')
  revalidatePath('/admin/rutinas')
}

export async function toggleRoutineActive(id: string, isActive: boolean) {
  const orgId = await requireOrgForAction()
  const result = await prisma.routine.updateMany({
    where: { id, organizationId: orgId },
    data: { isActive },
  })
  if (result.count === 0) throw new Error('Rutina no encontrada')
  revalidatePath('/admin/rutinas')
}

// ============================================
// EXERCISES
// ============================================

export async function getExercises(search?: string, type?: string, muscleGroup?: string) {
  const orgId = await requireOrgForAction()

  const where: any = {
    OR: [{ organizationId: orgId }, { organizationId: null }],
  }
  if (search) {
    where.AND = [
      {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { clientDescription: { contains: search, mode: 'insensitive' } },
        ],
      },
    ]
  }
  if (type) where.type = type
  if (muscleGroup) where.muscleGroup = muscleGroup

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
  const orgId = await requireOrgForAction()
  const exercise = await prisma.exercise.create({
    data: {
      name: data.name,
      type: data.type as any,
      description: data.description,
      muscleGroup: data.muscleGroup,
      equipment: data.equipment,
      tags: data.tags || [],
      isPublic: true,
      organizationId: orgId,
    },
  })
  revalidatePath('/exercises')
  return exercise
}

// ============================================
// SESSION TRACKING (cliente) — sin cambios, ya seguro por clerkUserId
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

// ============================================
// TEMPLATES
// ============================================

export async function getTemplates() {
  const orgId = await requireOrgForAction()
  return prisma.routine.findMany({
    where: { isTemplate: true, organizationId: orgId },
    include: { days: { include: { exercises: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function assignTemplateToMember(templateId: string, memberId: string) {
  const orgId = await requireOrgForAction()

  const template = await prisma.routine.findFirst({
    where: { id: templateId, organizationId: orgId },
    include: { days: { orderBy: { sessionNumber: 'asc' }, include: { exercises: true } } },
  })
  if (!template) throw new Error('Template no encontrado')

  const member = await prisma.member.findFirst({
    where: { id: memberId, organizationId: orgId },
    select: { id: true },
  })
  if (!member) throw new Error('Cliente no encontrado')

  await archiveActiveRoutines(memberId, orgId)

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
      organizationId: orgId,
      days: {
        create: template.days.map((day) => ({
          sessionNumber: day.sessionNumber, weekNumber: day.weekNumber,
          dayOfWeek: day.dayOfWeek, dayName: day.dayName, order: day.order,
          organizationId: orgId,
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
  const orgId = await requireOrgForAction()
  return prisma.routine.findFirst({
    where: { memberId, organizationId: orgId, isActive: true, isTemplate: false },
    include: { days: { include: { exercises: true } } },
  })
}

export async function getRoutineHistoryForMember(memberId: string) {
  const orgId = await requireOrgForAction()
  return prisma.routine.findMany({
    where: { memberId, organizationId: orgId, isTemplate: false },
    include: {
      days: {
        include: {
          sessionLogs: {
            where: { memberId },
            select: { completedAt: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}