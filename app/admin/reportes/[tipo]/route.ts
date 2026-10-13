import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOrg } from '@/lib/get-org'

export const dynamic = 'force-dynamic'

const TZ = 'America/Argentina/Buenos_Aires'
const fecha = (d: Date | null | undefined) => (d ? d.toLocaleDateString('es-AR', { timeZone: TZ }) : '')
const fechaHora = (d: Date | null | undefined) =>
  d ? d.toLocaleString('es-AR', { timeZone: TZ, hour12: false }) : ''

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v)
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  // BOM + separador ';' para que Excel en español lo abra bien
  return '﻿' + [headers, ...rows].map((r) => r.map(esc).join(';')).join('\r\n')
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ tipo: string }> }) {
  const auth = await requireOrg()
  if (auth.error) return auth.error
  const orgId = auth.orgId
  const { tipo } = await params

  const sp = req.nextUrl.searchParams
  const hoy = new Date().toISOString().slice(0, 10)
  const desdeStr = sp.get('desde') || hoy
  const hastaStr = sp.get('hasta') || hoy
  const desde = new Date(`${desdeStr}T00:00:00-03:00`)
  const hasta = new Date(`${hastaStr}T23:59:59.999-03:00`)
  if (isNaN(desde.getTime()) || isNaN(hasta.getTime()) || desde > hasta) {
    return NextResponse.json({ error: 'Rango de fechas inválido' }, { status: 400 })
  }
  const org = { organizationId: orgId }
  let csv = ''

  switch (tipo) {
    case 'clientes': {
      const members = await prisma.member.findMany({
        where: { ...org, status: 'ACTIVE' },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: { memberships: { where: { status: 'ACTIVE' }, orderBy: { endDate: 'desc' }, take: 1, include: { plan: true } } },
      })
      csv = toCsv(
        ['Apellido', 'Nombre', 'DNI', 'Email', 'Teléfono', 'Estado', 'Plan', 'Vencimiento', 'Alta'],
        members.map((m) => {
          const ms = m.memberships[0]
          return [m.lastName, m.firstName, m.dni, m.email, m.phone, m.status, ms?.plan.name, fecha(ms?.endDate), fecha(m.createdAt)]
        }),
      )
      break
    }
    case 'pagos': {
      const pagos = await prisma.payment.findMany({
        where: { ...org, createdAt: { gte: desde, lte: hasta } },
        orderBy: { createdAt: 'desc' },
        include: { member: { select: { firstName: true, lastName: true, dni: true } } },
      })
      csv = toCsv(
        ['Fecha', 'Cliente', 'DNI', 'Concepto', 'Método', 'Estado', 'Monto', 'Referencia'],
        pagos.map((p) => [fechaHora(p.createdAt), `${p.member.lastName}, ${p.member.firstName}`, p.member.dni,
          p.concept, p.method, p.status, Number(p.amount).toFixed(2).replace('.', ','), p.reference]),
      )
      break
    }
    case 'asistencias': {
      const asis = await prisma.attendance.findMany({
        where: { ...org, entryTime: { gte: desde, lte: hasta } },
        orderBy: { entryTime: 'desc' },
        include: { member: { select: { firstName: true, lastName: true, dni: true } } },
      })
      csv = toCsv(
        ['Fecha y hora', 'Cliente', 'DNI', 'Estado'],
        asis.map((a) => [fechaHora(a.entryTime), `${a.member.lastName}, ${a.member.firstName}`, a.member.dni, a.status]),
      )
      break
    }
    case 'actividades': {
      const schedules = await prisma.schedule.findMany({
        where: { ...org, isCancelled: false, date: { gte: desde, lte: hasta } },
        include: { activity: true, bookings: { where: { status: 'CONFIRMED' }, select: { id: true } } },
      })
      const map = new Map<string, { clases: number; reservas: number; cupo: number }>()
      for (const s of schedules) {
        const k = s.activity.name
        const cur = map.get(k) ?? { clases: 0, reservas: 0, cupo: 0 }
        cur.clases += 1
        cur.reservas += s.bookings.length
        cur.cupo += s.maxCapacity
        map.set(k, cur)
      }
      const rows = [...map.entries()].sort((a, b) => b[1].reservas - a[1].reservas)
      csv = toCsv(
        ['Actividad', 'Clases dictadas', 'Reservas confirmadas', 'Cupo total', 'Ocupación %'],
        rows.map(([name, v]) => [name, v.clases, v.reservas, v.cupo, v.cupo ? Math.round((v.reservas / v.cupo) * 100) : 0]),
      )
      break
    }
    case 'por-vencer': {
      const ahora = new Date()
      const limite = new Date(ahora.getTime() + 15 * 86400000)
      const ms = await prisma.membership.findMany({
        where: { ...org, status: 'ACTIVE', endDate: { gte: ahora, lte: limite } },
        orderBy: { endDate: 'asc' },
        include: { plan: true, member: { select: { firstName: true, lastName: true, phone: true, email: true } } },
      })
      csv = toCsv(
        ['Vence', 'Días restantes', 'Cliente', 'Teléfono', 'Email', 'Plan'],
        ms.map((m) => [fecha(m.endDate), Math.ceil((m.endDate.getTime() - ahora.getTime()) / 86400000),
          `${m.member.lastName}, ${m.member.firstName}`, m.member.phone, m.member.email, m.plan.name]),
      )
      break
    }
    case 'crecimiento': {
      const rows: (string | number)[][] = []
      const base = new Date()
      for (let i = 5; i >= 0; i--) {
        // límites de mes en hora Argentina
        const y = new Date(base.getTime() - 3 * 3600000)
        const ini = new Date(Date.UTC(y.getUTCFullYear(), y.getUTCMonth() - i, 1, 3))
        const fin = new Date(Date.UTC(y.getUTCFullYear(), y.getUTCMonth() - i + 1, 1, 3))
        const rango = { gte: ini, lt: fin }
        const [altas, ingresos, entradas] = await Promise.all([
          prisma.member.count({ where: { ...org, createdAt: rango } }),
          prisma.payment.aggregate({ where: { ...org, status: 'COMPLETED', createdAt: rango }, _sum: { amount: true } }),
          prisma.attendance.count({ where: { ...org, entryTime: rango } }),
        ])
        const label = new Date(ini.getTime() - 3 * 3600000).toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
        rows.push([label, altas, Number(ingresos._sum?.amount ?? 0).toFixed(2).replace('.', ','), entradas])
      }
      csv = toCsv(['Mes', 'Clientes nuevos', 'Ingresos', 'Asistencias'], rows)
      break
    }
    default:
      return NextResponse.json({ error: 'Reporte inexistente' }, { status: 404 })
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="reporte-${tipo}-${hoy}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}