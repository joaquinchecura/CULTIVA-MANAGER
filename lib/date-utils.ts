import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { prisma } from '@/lib/prisma'

export const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires'

/**
 * Lee la timezone configurada para una organización.
 * Si no existe o no está configurada, cae al default (Argentina).
 */
export async function getOrgTimezone(organizationId: string): Promise<string> {
  const config = await prisma.gymConfig.findFirst({
    where: { organizationId },
    select: { timezone: true },
  })
  return config?.timezone || DEFAULT_TIMEZONE
}

/**
 * Devuelve la fecha/hora actual en la zona horaria especificada.
 */
export function nowInTZ(timezone: string): Date {
  return toZonedTime(new Date(), timezone)
}

/**
 * Devuelve el inicio del día (00:00:00) en la zona horaria especificada,
 * como objeto Date en UTC (que es lo que espera Prisma).
 */
export function startOfToday(timezone: string): Date {
  const now = new Date()
  const zoned = toZonedTime(now, timezone)
  zoned.setHours(0, 0, 0, 0)
  return fromZonedTime(zoned, timezone)
}

export function startOfTomorrow(timezone: string): Date {
  const start = startOfToday(timezone)
  const tomorrow = new Date(start)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}

export function startOfYesterday(timezone: string): Date {
  const start = startOfToday(timezone)
  const yesterday = new Date(start)
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday
}

export function startOfCurrentMonth(timezone: string): Date {
  const now = new Date()
  const zoned = toZonedTime(now, timezone)
  zoned.setDate(1)
  zoned.setHours(0, 0, 0, 0)
  return fromZonedTime(zoned, timezone)
}

export function startOfPreviousMonth(timezone: string): Date {
  const now = new Date()
  const zoned = toZonedTime(now, timezone)
  zoned.setMonth(zoned.getMonth() - 1)
  zoned.setDate(1)
  zoned.setHours(0, 0, 0, 0)
  return fromZonedTime(zoned, timezone)
}

/**
 * Formatea una fecha en la zona horaria indicada.
 */
export function formatDateTZ(date: Date | string, timezone: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('es-AR', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
export function startOfWeek(date: Date, timezone: string): Date {
  const zoned = toZonedTime(date, timezone)
  const day = zoned.getDay()
  const diff = zoned.getDate() - day + (day === 0 ? -6 : 1) // Lunes
  zoned.setDate(diff)
  zoned.setHours(0, 0, 0, 0)
  return fromZonedTime(zoned, timezone)
}

export function endOfWeek(date: Date, timezone: string): Date {
  const start = startOfWeek(date, timezone)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

export function startOfMonth(date: Date): Date {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfMonth(date: Date): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1, 0)
  d.setHours(23, 59, 59, 999)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export { format } from 'date-fns' // Exportamos format para no importarlo de dos lados