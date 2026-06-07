import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const member = await prisma.member.findFirst({
      where: { clerkUserId: userId },
      include: {
        routines: {
          where: { isActive: true },
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!member || member.routines.length === 0) {
      return NextResponse.json(null)
    }

    // Por ahora, devolvemos la primera rutina activa
    // TODO: Filtrar por día de la semana
    const routine = member.routines[0]

    return NextResponse.json({
      id: routine.id,
      name: routine.name,
      goal: routine.goal,
      estimatedDuration: routine.estimatedDuration,
      exercises: routine.exercises.map(e => ({
        id: e.id,
        exercise: e.exercise,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight,
        restSeconds: e.restSeconds,
        notes: e.notes,
      })),
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}