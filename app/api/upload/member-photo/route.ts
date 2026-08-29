import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'
import { z } from 'zod'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const bodySchema = z.object({
  memberId: z.string(),
  imageBase64: z.string().startsWith('data:image/'), // ej: "data:image/jpeg;base64,....."
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { memberId, imageBase64 } = bodySchema.parse(body)

    const member = await prisma.member.findUnique({ where: { id: memberId } })
    if (!member) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const uploadResult = await cloudinary.uploader.upload(imageBase64, {
      folder: 'members/profile-photos',
      public_id: memberId, // pisa la foto anterior del mismo socio si ya existía
      overwrite: true,
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      ],
    })

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: { photoUrl: uploadResult.secure_url },
    })

    return NextResponse.json({ photoUrl: updated.photoUrl })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error subiendo foto de perfil:', error)
    return NextResponse.json({ error: 'No se pudo subir la foto' }, { status: 500 })
  }
}