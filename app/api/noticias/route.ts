import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireOrg } from '@/lib/get-org'

const newsSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET() {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const news = await prisma.news.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(news)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const body = await request.json()
    const validatedData = newsSchema.parse(body)

    const news = await prisma.news.create({
      data: {
        ...validatedData,
        isActive: true,
        organizationId: orgId,
      },
    })

    return NextResponse.json(news, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const existing = await prisma.news.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = newsSchema.partial().parse(body)

    const news = await prisma.news.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const result = await prisma.news.deleteMany({ where: { id, organizationId: orgId } })
    if (result.count === 0) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}