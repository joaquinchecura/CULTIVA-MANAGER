/**
 * Seed de datos DEMO para capturas de pantalla / demos comerciales.
 * Todos los datos son inventados (nombres, DNIs 9xxxxxxx, emails @demo.cultivafitness.app).
 *
 * Uso (contra una base de STAGING, nunca producción):
 *   1. Creá una organización en Clerk (ej. "Gimnasio Demo") y copiá su id (org_xxx)
 *   2. DEMO_ORG_ID=org_xxx npx tsx prisma/seed-demo.ts
 *
 * Seguridad:
 *   - Solo toca filas con organizationId = DEMO_ORG_ID
 *   - Aborta si el nombre de la organización no contiene "demo" (salvo FORCE=1)
 *   - Es re-ejecutable: borra los datos previos de esa org y los regenera
 */
import { PrismaClient, Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()
const ORG = process.env.DEMO_ORG_ID

// ── PRNG determinístico (mismos datos en cada corrida) ──────────
let seed = 20261011
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
const int = (a: number, b: number) => Math.floor(rnd() * (b - a + 1)) + a
const pick = <T,>(arr: T[]): T => arr[int(0, arr.length - 1)]
const chance = (p: number) => rnd() < p
const uid = () => randomUUID()
const daysAgo = (n: number, h = 12, m = 0) => {
  const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, m, 0, 0); return d
}
const dateOnly = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

const FIRST_F = ['Sofía','Valentina','Camila','Martina','Lucía','Julieta','Agustina','Florencia','Micaela','Carolina','Paula','Romina','Daniela','Antonella','Milagros','Belén','Rocío','Candela','Natalia','Mariana']
const FIRST_M = ['Mateo','Santiago','Lucas','Nicolás','Facundo','Tomás','Franco','Joaquín','Matías','Federico','Ignacio','Gonzalo','Agustín','Bruno','Emiliano','Leandro','Maximiliano','Diego','Pablo','Sebastián']
const LAST = ['González','Rodríguez','Fernández','López','Martínez','Pérez','Gómez','Sánchez','Romero','Díaz','Álvarez','Torres','Ruiz','Ramírez','Flores','Acosta','Benítez','Medina','Herrera','Suárez','Castro','Ortiz','Silva','Molina','Rojas','Vega','Giménez','Cabrera','Ledesma','Aguirre']
const CITIES = ['Buenos Aires','Rosario','Córdoba','Mendoza','La Plata','Mar del Plata']

async function reset(orgId: string) {
  // Orden: hijos → padres
  const w = { organizationId: orgId }
  await prisma.progressLog.deleteMany({ where: w })
  await prisma.sessionLog.deleteMany({ where: w })
  await prisma.routineExercise.deleteMany({ where: w })
  await prisma.routineDay.deleteMany({ where: w })
  await prisma.routine.deleteMany({ where: w })
  await prisma.bodyComposition.deleteMany({ where: w })
  await prisma.booking.deleteMany({ where: w })
  await prisma.schedule.deleteMany({ where: w })
  await prisma.activity.deleteMany({ where: w })
  await prisma.attendance.deleteMany({ where: w })
  await prisma.payment.deleteMany({ where: w })
  await prisma.cashMovement.deleteMany({ where: w })
  await prisma.cashRegister.deleteMany({ where: w })
  await prisma.membership.deleteMany({ where: w })
  await prisma.plan.deleteMany({ where: w })
  await prisma.member.deleteMany({ where: w })
  await prisma.news.deleteMany({ where: w })
  await prisma.holiday.deleteMany({ where: w })
  await prisma.gymConfig.deleteMany({ where: w })
  // Ejercicios propios de la org (los globales con organizationId null no se tocan)
  await prisma.exercise.deleteMany({ where: w })
}

async function main() {
  if (!ORG) throw new Error('Falta DEMO_ORG_ID (id de la organización de Clerk, ej. org_xxx)')
  const org = await prisma.organization.findUnique({ where: { id: ORG } })
  if (!org) throw new Error(`No existe la organización ${ORG} en la base. Creala/sincronizala primero.`)
  if (!/demo/i.test(org.name) && process.env.FORCE !== '1') {
    throw new Error(`La organización se llama "${org.name}". Por seguridad solo corre si el nombre contiene "demo" (o usá FORCE=1).`)
  }
  console.log(`→ Sembrando datos demo en "${org.name}" (${ORG})`)

  await reset(ORG)
  const organizationId = ORG

  // ── Config ────────────────────────────────────────────────
  await prisma.gymConfig.create({
    data: {
      organizationId, name: 'Gimnasio Demo', address: 'Av. Siempreviva 742, Buenos Aires',
      phone: '+54 11 5555-0101', email: 'hola@demo.cultivafitness.app', theme: 'blue',
      openingTime: '07:00', closingTime: '22:00',
    },
  })

  // ── Planes ────────────────────────────────────────────────
  const planDefs = [
    { name: 'Musculación Mensual', type: 'MONTHLY', pack: 'GYM_ONLY', price: 28000, durationDays: 30, classesIncluded: 0, w: 30 },
    { name: 'Funcional + Clases', type: 'MONTHLY', pack: 'GYM_CLASSES', price: 36000, durationDays: 30, classesIncluded: 0, w: 28 },
    { name: 'Solo Clases (12)', type: 'MONTHLY', pack: 'CLASSES_ONLY', price: 24000, durationDays: 30, classesIncluded: 12, w: 14 },
    { name: 'Personal Trainer', type: 'MONTHLY', pack: 'PERSONAL_TRAINER', price: 62000, durationDays: 30, classesIncluded: 8, w: 8 },
    { name: 'Full Trimestral', type: 'QUARTERLY', pack: 'FULL', price: 95000, durationDays: 90, classesIncluded: 0, w: 12 },
    { name: 'Anual Full', type: 'ANNUAL', pack: 'FULL', price: 340000, durationDays: 365, classesIncluded: 0, w: 8 },
  ] as const
  const plans = planDefs.map((p) => ({ ...p, id: uid() }))
  await prisma.plan.createMany({
    data: plans.map((p) => ({
      id: p.id, organizationId, name: p.name, type: p.type, pack: p.pack,
      price: p.price, durationDays: p.durationDays, classesIncluded: p.classesIncluded,
      description: `Plan ${p.name} · datos de demostración`,
    })),
  })
  const weightedPlan = () => {
    const total = plans.reduce((a, p) => a + p.w, 0)
    let r = rnd() * total
    for (const p of plans) { if ((r -= p.w) <= 0) return p }
    return plans[0]
  }

  // ── Clientes ──────────────────────────────────────────────
  const N_MEMBERS = 140
  type M = { id: string; first: string; last: string; status: Prisma.MemberCreateManyInput['status']; joinedDaysAgo: number }
  const members: M[] = []
  const memberRows: Prisma.MemberCreateManyInput[] = []
  for (let i = 0; i < N_MEMBERS; i++) {
    const female = chance(0.55)
    const first = pick(female ? FIRST_F : FIRST_M)
    const last = pick(LAST)
    const joinedDaysAgo = i < 18 ? int(0, 29) : int(30, 330)   // ~18 altas en el último mes
    const r = rnd()
    const status = i < 6 ? 'PENDING' : r < 0.78 ? 'ACTIVE' : r < 0.86 ? 'OVERDUE' : r < 0.92 ? 'FROZEN' : 'INACTIVE'
    const id = uid()
    members.push({ id, first, last, status, joinedDaysAgo })
    const birth = new Date(Date.UTC(int(1965, 2005), int(0, 11), int(1, 28)))
    memberRows.push({
      id, organizationId, firstName: first, lastName: last,
      dni: String(90000000 + i),
      email: `${first}.${last}.${i}@demo.cultivafitness.app`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s/g, ''),
      phone: `+54 9 11 ${int(3000, 6999)}-${int(1000, 9999)}`,
      birthDate: birth, city: pick(CITIES), address: `Calle Demo ${int(100, 4999)}`,
      emergencyContactName: `${pick(FIRST_F)} ${pick(LAST)}`, emergencyContactPhone: `+54 9 11 ${int(3000, 6999)}-${int(1000, 9999)}`,
      status, createdAt: daysAgo(joinedDaysAgo), createdBy: 'demo-seed',
    })
  }
  await prisma.member.createMany({ data: memberRows })

  // ── Membresías + pagos mensuales ──────────────────────────
  const membershipRows: Prisma.MembershipCreateManyInput[] = []
  const paymentRows: Prisma.PaymentCreateManyInput[] = []
  const methodPick = () => { const r = rnd(); return r < 0.34 ? 'TRANSFER' : r < 0.62 ? 'MERCADOPAGO' : r < 0.84 ? 'CASH' : 'CARD' } // eslint-disable-line
  for (const m of members) {
    if (m.status === 'PENDING') continue
    const plan = weightedPlan()
    // Historial: renovaciones consecutivas desde el alta
    const cycles = Math.max(1, Math.floor(m.joinedDaysAgo / plan.durationDays) + 1)
    for (let c = 0; c < cycles; c++) {
      const startAgo = m.joinedDaysAgo - c * plan.durationDays
      if (startAgo < 0) break
      const start = daysAgo(startAgo)
      const end = addDays(start, plan.durationDays)
      const isLast = c === cycles - 1 || startAgo - plan.durationDays < 0
      let status: Prisma.MembershipCreateManyInput['status'] = 'EXPIRED'
      if (isLast) {
        status = m.status === 'FROZEN' ? 'FROZEN' : m.status === 'INACTIVE' ? 'CANCELLED' : m.status === 'OVERDUE' ? 'EXPIRED' : 'ACTIVE'
      }
      membershipRows.push({
        id: uid(), organizationId, memberId: m.id, planId: plan.id, startDate: start, endDate: end, status,
        autoRenew: chance(0.3), classesRemaining: plan.classesIncluded ? int(0, plan.classesIncluded) : null,
      })
      const paid = !(isLast && m.status === 'OVERDUE')
      if (paid) {
        paymentRows.push({
          id: uid(), organizationId, memberId: m.id, amount: plan.price, method: methodPick() as any,
          status: 'COMPLETED', concept: `Membresía ${plan.name}`, createdAt: start,
        })
      }
    }
  }
  // Ajuste: asegurar vencimientos próximos (7 días) para el dashboard
  const active = membershipRows.filter((r) => r.status === 'ACTIVE')
  active.slice(0, 9).forEach((r, i) => { r.endDate = addDays(new Date(), i % 7) })
  await prisma.membership.createMany({ data: membershipRows })

  // Pagos sueltos (clases sueltas, indumentaria, etc.)
  const extras = ['Clase suelta', 'Seguro anual', 'Remera Demo Gym', 'Suplemento proteico', 'Matrícula de inscripción']
  const extraAmounts: Record<string, number> = { 'Clase suelta': 5000, 'Seguro anual': 8000, 'Remera Demo Gym': 15000, 'Suplemento proteico': 32000, 'Matrícula de inscripción': 10000 }
  for (let i = 0; i < 70; i++) {
    const concept = pick(extras)
    paymentRows.push({
      id: uid(), organizationId, memberId: pick(members).id, amount: extraAmounts[concept], method: methodPick() as any,
      status: chance(0.04) ? 'REFUNDED' : 'COMPLETED', concept, createdAt: daysAgo(int(0, 150), int(9, 20), int(0, 59)),
    })
  }
  await prisma.payment.createMany({ data: paymentRows })

  // ── Asistencias (90 días, picos 7-9h y 18-21h) ────────────
  const attendanceRows: Prisma.AttendanceCreateManyInput[] = []
  const regulars = members.filter((m) => m.status === 'ACTIVE' || m.status === 'OVERDUE')
  const devices = [
    { brand: 'Samsung', model: 'Galaxy A54', os: 'Android 14' }, { brand: 'Apple', model: 'iPhone 13', os: 'iOS 17' },
    { brand: 'Motorola', model: 'Moto G84', os: 'Android 14' }, { brand: 'Apple', model: 'iPhone 15', os: 'iOS 18' },
    { brand: 'Xiaomi', model: 'Redmi Note 12', os: 'Android 13' },
  ]
  const peakHour = () => { const r = rnd(); return r < 0.35 ? int(7, 9) : r < 0.75 ? int(18, 21) : r < 0.9 ? int(12, 14) : int(10, 17) }
  for (let d = 0; d < 90; d++) {
    const day = daysAgo(d)
    const dow = day.getDay()
    const base = dow === 0 ? 0.08 : dow === 6 ? 0.22 : 0.42
    for (const m of regulars) {
      if (d > m.joinedDaysAgo) continue
      if (!chance(base)) continue
      const dev = pick(devices)
      attendanceRows.push({
        id: uid(), organizationId, memberId: m.id, entryTime: daysAgo(d, peakHour(), int(0, 59)),
        qrToken: uid().slice(0, 12), status: chance(0.93) ? 'ALLOWED' : chance(0.6) ? 'WARNING' : 'DENIED',
        deviceBrand: dev.brand, deviceModel: dev.model, deviceOS: dev.os,
      })
    }
  }
  await prisma.attendance.createMany({ data: attendanceRows })

  // ── Actividades, agenda y reservas ────────────────────────
  const actDefs = [
    { name: 'Funcional', color: '#2563eb', cap: 20, dur: 60, time: ['08:00', '19:00'] },
    { name: 'Spinning', color: '#ef4444', cap: 18, dur: 45, time: ['07:00', '20:00'] },
    { name: 'Yoga', color: '#10b981', cap: 15, dur: 60, time: ['09:30', '18:00'] },
    { name: 'Crossfit', color: '#f59e0b', cap: 16, dur: 60, time: ['18:00', '21:00'] },
    { name: 'Pilates', color: '#8b5cf6', cap: 12, dur: 55, time: ['10:00', '19:30'] },
    { name: 'Boxeo', color: '#ec4899', cap: 14, dur: 60, time: ['20:00'] },
    { name: 'Personal Training', color: '#0ea5e9', cap: 1, dur: 60, time: ['09:00', '11:00', '17:00'], type: 'PERSONAL' as const },
  ]
  const acts = actDefs.map((a) => ({ ...a, id: uid() }))
  await prisma.activity.createMany({
    data: acts.map((a) => ({
      id: a.id, organizationId, name: a.name, color: a.color, maxCapacity: a.cap, defaultDuration: a.dur,
      type: a.type ?? 'GROUP', description: `Clase de ${a.name} · demo`,
    })),
  })
  const endTime = (start: string, mins: number) => {
    const [h, m] = start.split(':').map(Number); const t = h * 60 + m + mins
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
  }
  const scheduleRows: Prisma.ScheduleCreateManyInput[] = []
  const bookingRows: Prisma.BookingCreateManyInput[] = []
  const trainers = ['Lucía Paredes', 'Marcos Ibarra', 'Sol Benavídez', 'Nacho Quiroga']
  for (let d = -45; d <= 14; d++) {
    const day = daysAgo(-d) // d negativo = pasado
    const real = new Date(); real.setDate(real.getDate() + d)
    const dow = real.getDay()
    if (dow === 0) continue
    for (const a of acts) {
      // lun-vie todas las actividades, sábado solo algunas
      if (dow === 6 && !['Funcional', 'Yoga', 'Spinning'].includes(a.name)) continue
      if (a.name === 'Personal Training' && dow === 6) continue
      a.time.forEach((t, idx) => {
        if (a.name === 'Yoga' && ![1, 3, 5].includes(dow)) return
        if (a.name === 'Pilates' && ![2, 4].includes(dow)) return
        if (a.name === 'Boxeo' && ![1, 3].includes(dow)) return
        const id = uid()
        const cancelled = chance(0.02)
        scheduleRows.push({
          id, organizationId, activityId: a.id, date: dateOnly(real), startTime: t, endTime: endTime(t, a.dur),
          trainerId: trainers[(idx + a.name.length) % trainers.length], room: a.name === 'Spinning' ? 'Sala Cycle' : a.cap === 1 ? 'Box PT' : 'Salón Principal',
          maxCapacity: a.cap, isCancelled: cancelled,
        })
        if (cancelled) return
        const isPast = d < 0
        const fill = a.cap === 1 ? (chance(0.7) ? 1 : 0) : Math.round(a.cap * (0.45 + rnd() * 0.5))
        const pool = regulars.filter((m) => m.status === 'ACTIVE')
        const chosen = new Set<string>()
        while (chosen.size < Math.min(fill, pool.length)) chosen.add(pick(pool).id)
        chosen.forEach((memberId) => {
          bookingRows.push({
            id: uid(), organizationId, memberId, scheduleId: id,
            status: isPast ? (chance(0.88) ? 'COMPLETED' : chance(0.6) ? 'NO_SHOW' : 'CANCELLED') : 'CONFIRMED',
            bookingDate: addDays(real, -int(1, 5)),
          })
        })
      })
    }
    void day
  }
  await prisma.schedule.createMany({ data: scheduleRows, skipDuplicates: true })
  await prisma.booking.createMany({ data: bookingRows, skipDuplicates: true })

  // ── Ejercicios (propios de la demo, mínimos) ──────────────
  const exDefs: [string, any, string, string][] = [
    ['Sentadilla con barra', 'STRENGTH', 'Piernas', 'Barra'], ['Press de banca plano', 'STRENGTH', 'Pecho', 'Barra'],
    ['Peso muerto rumano', 'STRENGTH', 'Isquiotibiales', 'Barra'], ['Remo con mancuerna', 'STRENGTH', 'Espalda', 'Mancuernas'],
    ['Press militar', 'STRENGTH', 'Hombros', 'Barra'], ['Dominadas', 'STRENGTH', 'Espalda', 'Peso corporal'],
    ['Zancadas caminando', 'FUNCTIONAL', 'Piernas', 'Mancuernas'], ['Plancha frontal', 'FUNCTIONAL', 'Core', 'Peso corporal'],
    ['Hip thrust', 'STRENGTH', 'Glúteos', 'Barra'], ['Curl de bíceps', 'STRENGTH', 'Bíceps', 'Mancuernas'],
    ['Fondos en paralelas', 'STRENGTH', 'Tríceps', 'Paralelas'], ['Remo en máquina', 'STRENGTH', 'Espalda', 'Máquina'],
    ['Trote suave', 'CARDIO', 'Cardio', 'Cinta'], ['Movilidad de cadera', 'MOBILITY', 'Cadera', 'Peso corporal'],
    ['Estiramiento global', 'STRETCHING', 'Full body', 'Peso corporal'], ['Saltos al cajón', 'PLYOMETRIC', 'Piernas', 'Cajón'],
  ]
  const exercises = exDefs.map(([name, type, muscleGroup, equipment]) => ({ id: uid(), name, type, muscleGroup, equipment }))
  await prisma.exercise.createMany({
    data: exercises.map((e) => ({
      ...e, organizationId, tags: [e.muscleGroup.toLowerCase()], isPublic: true,
      description: `${e.name}: ejercicio de ${e.muscleGroup.toLowerCase()}.`,
      clientDescription: `Realizá ${e.name.toLowerCase()} con técnica controlada.`,
    })),
  })

  // ── Rutinas (plantillas + asignadas), días y ejercicios ───
  const goals = ['HYPERTROPHY', 'STRENGTH', 'WEIGHT_LOSS', 'ENDURANCE', 'MAINTENANCE'] as const
  const routineRows: Prisma.RoutineCreateManyInput[] = []
  const dayRows: Prisma.RoutineDayCreateManyInput[] = []
  const reRows: Prisma.RoutineExerciseCreateManyInput[] = []
  const dayNames = ['Día A · Tren inferior', 'Día B · Tren superior', 'Día C · Full body', 'Día D · Core y cardio']
  const buildRoutine = (name: string, memberId: string | null, isTemplate: boolean) => {
    const id = uid(); const goal = pick([...goals]); const freq = int(3, 4)
    routineRows.push({
      id, organizationId, memberId, isTemplate, name, goal, frequencyPerWeek: freq, totalWeeks: pick([4, 6, 8]),
      description: 'Rutina de demostración', createdAt: daysAgo(int(1, 120)),
    })
    for (let s = 0; s < freq; s++) {
      const dayId = uid()
      dayRows.push({ id: dayId, organizationId, routineId: id, sessionNumber: s + 1, weekNumber: 1, dayOfWeek: [1, 3, 5, 6][s], dayName: dayNames[s], order: s, goal })
      const picked = [...exercises].sort(() => rnd() - 0.5).slice(0, 6)
      picked.forEach((ex, o) => reRows.push({
        id: uid(), organizationId, dayId, exerciseId: ex.id, sets: int(3, 4), reps: pick(['8-10', '10-12', '12-15', '6-8']),
        targetWeight: ex.equipment === 'Peso corporal' ? null : int(8, 70), rest: pick(['60s', '90s', '2min']), order: o,
        blockType: o === 0 ? 'WARMUP' : 'MAIN', blockLabel: o === 0 ? 'Entrada en calor' : 'Bloque principal',
      }))
    }
    return { id, dayIds: dayRows.filter((d) => d.routineId === id).map((d) => d.id as string) }
  }
  ;['Hipertrofia 4 días', 'Fuerza base', 'Definición 3 días', 'Resistencia general'].forEach((n) => buildRoutine(n, null, true))
  const assigned: { routineId: string; dayIds: string[]; memberId: string }[] = []
  regulars.filter((m) => m.status === 'ACTIVE').slice(0, 45).forEach((m) => {
    const r = buildRoutine(`Rutina de ${m.first}`, m.id, false)
    assigned.push({ routineId: r.id, dayIds: r.dayIds, memberId: m.id })
  })
  await prisma.routine.createMany({ data: routineRows })
  await prisma.routineDay.createMany({ data: dayRows })
  await prisma.routineExercise.createMany({ data: reRows })

  // Sesiones completadas y progreso de cargas
  const sessionRows: Prisma.SessionLogCreateManyInput[] = []
  const progressRows: Prisma.ProgressLogCreateManyInput[] = []
  for (const a of assigned) {
    const n = int(4, 18)
    for (let k = 0; k < n; k++) {
      const sid = uid(); const when = daysAgo(int(0, 60), int(7, 21), int(0, 59))
      const dayId = pick(a.dayIds)
      sessionRows.push({ id: sid, organizationId, routineId: a.routineId, routineDayId: dayId, memberId: a.memberId, startedAt: when, completedAt: new Date(when.getTime() + int(40, 75) * 60000) })
      reRows.filter((r) => r.dayId === dayId).slice(0, 4).forEach((r) => progressRows.push({
        id: uid(), organizationId, routineId: a.routineId, exerciseId: r.exerciseId, memberId: a.memberId, sessionLogId: sid,
        setsCompleted: r.sets, repsCompleted: String(r.reps).split('-')[0], weightUsed: (r.targetWeight ?? 0) + int(-2, 4), date: when,
      }))
    }
  }
  await prisma.sessionLog.createMany({ data: sessionRows })
  await prisma.progressLog.createMany({ data: progressRows })

  // ── Composición corporal (evolución mensual, 40 clientes) ─
  const bodyRows: Prisma.BodyCompositionCreateManyInput[] = []
  regulars.slice(0, 40).forEach((m) => {
    const height = int(155, 188); let weight = int(58, 98); let fat = 18 + rnd() * 14
    for (let k = 5; k >= 0; k--) {
      weight -= rnd() * 1.2; fat -= rnd() * 0.7
      bodyRows.push({
        id: uid(), organizationId, memberId: m.id, weight: weight.toFixed(1), height, bmi: (weight / ((height / 100) ** 2)).toFixed(1),
        bodyFatPercent: fat.toFixed(1), musclePercent: (34 + rnd() * 8).toFixed(1), waterPercent: (50 + rnd() * 8).toFixed(1),
        waist: int(66, 98), hip: int(90, 112), arm: int(26, 36), chest: int(88, 110), recordedBy: 'staff', createdAt: daysAgo(k * 30 + int(0, 5)),
      })
    }
  })
  await prisma.bodyComposition.createMany({ data: bodyRows })

  // ── Caja (30 días) ────────────────────────────────────────
  for (let d = 30; d >= 0; d--) {
    const date = dateOnly(daysAgo(d))
    if (date.getUTCDay() === 0) continue
    const regId = uid()
    try {
      const incomes = int(3, 8), expenses = int(0, 2)
      const movs: Prisma.CashMovementCreateManyInput[] = []
      let total = 0
      for (let i = 0; i < incomes; i++) { const amt = pick([5000, 8000, 15000, 28000, 36000]); total += amt; movs.push({ id: uid(), organizationId, cashRegisterId: regId, type: 'INCOME', amount: amt, concept: pick(['Cobro membresía', 'Clase suelta', 'Venta indumentaria']), category: 'Ventas', createdAt: daysAgo(d, int(9, 20)) }) }
      for (let i = 0; i < expenses; i++) { const amt = pick([4000, 9000, 12000]); total -= amt; movs.push({ id: uid(), organizationId, cashRegisterId: regId, type: 'EXPENSE', amount: amt, concept: pick(['Insumos de limpieza', 'Agua y bebidas', 'Mantenimiento']), category: 'Gastos', createdAt: daysAgo(d, int(9, 20)) }) }
      await prisma.cashRegister.create({
        data: { id: regId, organizationId, date, openingAmount: 20000, closingAmount: d === 0 ? null : 20000 + total, isClosed: d !== 0, closedAt: d === 0 ? null : daysAgo(d, 22) },
      })
      await prisma.cashMovement.createMany({ data: movs })
    } catch { /* fecha ya usada por otra org (date es @unique global) → se omite */ }
  }

  // ── Novedades y feriados ──────────────────────────────────
  await prisma.news.createMany({
    data: [
      { organizationId, title: '¡Nueva clase de Pilates los martes y jueves!', content: 'Sumamos Pilates reformer en el horario de las 10:00 y 19:30. Reservá tu lugar desde la app.', sentAt: daysAgo(3) },
      { organizationId, title: 'Horario especial por feriado', content: 'El próximo feriado abrimos de 9 a 14 hs. ¡Te esperamos!', sentAt: daysAgo(8) },
      { organizationId, title: 'Desafío 30 días Demo Gym', content: 'Sumate al desafío de constancia: 20 asistencias en 30 días y ganás una remera.', sentAt: daysAgo(15) },
    ],
  })
  await prisma.holiday.createMany({
    data: [
      { organizationId, date: dateOnly(addDays(new Date(), 6)), name: 'Feriado puente', description: 'Horario reducido' },
      { organizationId, date: dateOnly(addDays(new Date(), 21)), name: 'Día no laborable' },
    ],
    skipDuplicates: true,
  })

  console.log(`✅ Listo: ${members.length} clientes, ${membershipRows.length} membresías, ${paymentRows.length} pagos, ${attendanceRows.length} asistencias, ${scheduleRows.length} clases, ${bookingRows.length} reservas, ${routineRows.length} rutinas, ${bodyRows.length} mediciones.`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())