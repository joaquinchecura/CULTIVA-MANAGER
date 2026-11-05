// app/api/webhooks/clerk/route.ts
//
// Webhook de Clerk: mantiene la tabla `organizations` sincronizada con las
// organizaciones de Clerk, para no tener que insertar la fila a mano al dar de
// alta a un profesional.
//
//   organization.created -> crea la fila (status ACTIVE por defecto)
//   organization.updated -> actualiza el nombre (NUNCA toca el status)
//   organization.deleted -> marca la fila como CANCELLED (NO la borra)
//
// Por qué no se borra: las claves foráneas a `organizations` son ON DELETE SET NULL,
// así que borrar la fila dejaría los datos del profesional con organizationId nulo
// (en `exercises` pasarían a la biblioteca global; en `members`, a clientes liberados).
//
// Seguridad: la ruta es pública en middleware.ts (Clerk no manda sesión), pero cada
// request se verifica con la firma de Svix usando CLERK_WEBHOOK_SIGNING_SECRET.

import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  let evt
  try {
    evt = await verifyWebhook(req)
  } catch (err) {
    console.error('[clerk-webhook] firma inválida', err)
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  try {
    switch (evt.type) {
      case 'organization.created':
      case 'organization.updated': {
        const { id, name } = evt.data
        await prisma.organization.upsert({
          where: { id },
          create: { id, name }, // status: ACTIVE por defecto del schema
          update: { name },
        })
        break
      }

      case 'organization.deleted': {
        const id = evt.data.id
        if (id) {
          await prisma.organization.updateMany({
            where: { id },
            data: { status: 'CANCELLED' },
          })
        }
        break
      }

      default:
        // Otros eventos: se ignoran (respondemos 200 para que Clerk no reintente)
        break
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[clerk-webhook] error procesando', evt.type, err)
    // 500 => Clerk reintenta (el upsert es idempotente)
    return NextResponse.json({ error: 'Error procesando el evento' }, { status: 500 })
  }
}
