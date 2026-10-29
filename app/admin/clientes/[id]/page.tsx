export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { requireOrgForPage } from '@/lib/get-org'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Dumbbell, ArrowLeft, DollarSign, TrendingUp,
  UserCheck, Calendar, Phone, Mail, MapPin,
  AlertCircle, Plus, ChevronRight, CheckCircle2, Clock, History, User, Edit2, Activity, Weight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getRoutineHistoryForMember, getTemplates } from '@/app/actions/routines'
import AssignTemplateButton from '@/components/clientes/AssignTemplateButton'
import LiberarClienteButton from '@/components/clientes/LiberarClienteButton'
import { ClientAccordion } from '@/components/clientes/ClientAccordion'
import { ClientProgressChart } from '@/components/clientes/ClientProgressChart'

const TZ = 'America/Argentina/Buenos_Aires'

function fmtFecha(d: Date | string) {
  return new Date(d).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ,
  })
}

function fmtFechaHora(d: Date | string) {
  return new Date(d).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: TZ,
  })
}

function initials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
}

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE:   { label: 'Activo',     color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PENDING:  { label: 'Pendiente',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
  INACTIVE: { label: 'Inactivo',   color: 'bg-slate-100 text-slate-600 border-slate-200' },
  FROZEN:   { label: 'Congelado',  color: 'bg-blue-50 text-blue-700 border-blue-200' },
  OVERDUE:  { label: 'Atrasado',   color: 'bg-red-50 text-red-700 border-red-200' },
}

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const orgId = await requireOrgForPage()
  const { id } = await params

  const [member, routineHistory, templates] = await Promise.all([
    prisma.member.findFirst({
      where: { id, organizationId: orgId },
      include: {
        memberships: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        attendances: {
          orderBy: { entryTime: 'desc' },
          take: 5,
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        progressLogs: {
          orderBy: { date: 'desc' },
          take: 30, // 👈 Aumentamos para que el gráfico tenga más datos
          include: { exercise: { select: { name: true, type: true } } } // 👈 Agregamos type
        },
        bodyCompositions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    }),
    getRoutineHistoryForMember(id),
    getTemplates(),
  ])

  if (!member) return notFound()

  const activeRoutine  = routineHistory.find(r => r.isActive) ?? null
  const archivedRoutines = routineHistory.filter(r => !r.isActive)
  const activeMembership = member.memberships.find(m => m.status === 'ACTIVE')
  const st = statusConfig[member.status] || statusConfig.INACTIVE

  function routineProgress(routine: typeof activeRoutine) {
    if (!routine) return { total: 0, completed: 0, pct: 0 }
    const total = routine.days.length
    const completed = routine.days.filter(d => d.sessionLogs.some(l => l.completedAt)).length
    return { total, completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const progress = routineProgress(activeRoutine)

  // Summaries para las cards
  const lastAttendance = member.attendances[0]
  const lastPayment = member.payments[0]
  const lastProgress = member.progressLogs[0]
  const lastBodyComp = member.bodyCompositions[0]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/clientes">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          {member.photoUrl ? (
            <img src={member.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-sm shrink-0">
              {initials(member.firstName, member.lastName)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{member.firstName} {member.lastName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-500">DNI {member.dni}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${st.color}`}>
                {st.label}
              </span>
              {activeMembership && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {activeMembership.plan.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LiberarClienteButton memberId={id} />
          <Link href={`/admin/clientes/${id}/editar`}>
            <Button variant="outline" size="sm" className="gap-1.5 h-9">
              <Edit2 size={14} /> Editar datos
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA IZQUIERDA: Datos y Foto */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            {member.photoUrl ? (
              <img src={member.photoUrl} alt="" className="w-full aspect-square max-w-[320px] mx-auto rounded-2xl object-cover border border-slate-100" />
            ) : (
              <div className="w-full aspect-square max-w-[320px] mx-auto rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                <User size={40} className="text-slate-300" />
                <p className="text-xs text-slate-400 text-center px-6">Sin foto de perfil</p>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 relative group">
            <Link href={`/admin/clientes/${id}/editar`} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Edit2 size={14} />
            </Link>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Datos personales</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5 text-slate-600">
                <User size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <span><strong>DNI:</strong> {member.dni}</span>
              </div>
              <div className="flex items-start gap-2.5 text-slate-600">
                <Mail size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <span className="break-all">{member.email}</span>
              </div>
              <div className="flex items-start gap-2.5 text-slate-600">
                <Phone size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <span>{member.phone}</span>
              </div>
              <div className="flex items-start gap-2.5 text-slate-600">
                <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <span>{[member.address, member.city].filter(Boolean).join(', ') || '—'}</span>
              </div>
              <div className="flex items-start gap-2.5 text-slate-600">
                <Calendar size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <span>{fmtFecha(member.birthDate)}</span>
              </div>
            </div>

            {/* Info de emergencia y notas */}
            {(member.emergencyContactName || member.emergencyContactPhone || member.medicalNotes || member.internalNotes) && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Información adicional</h4>
                {member.emergencyContactName && (
                  <div className="flex items-start gap-2.5 text-sm text-slate-600">
                    <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <span>
                      <strong>Emergencia:</strong> {member.emergencyContactName}
                      {member.emergencyContactPhone && ` (${member.emergencyContactPhone})`}
                    </span>
                  </div>
                )}
                {member.medicalNotes && (
                  <div className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Activity size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <span><strong>Notas médicas:</strong> {member.medicalNotes}</span>
                  </div>
                )}
                {member.internalNotes && (
                  <div className="flex items-start gap-2.5 text-sm text-slate-600">
                    <User size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <span><strong>Notas internas:</strong> {member.internalNotes}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Acordeones */}
        <div className="lg:col-span-2 space-y-4">

          {/* 1. Membresía */}
          <ClientAccordion
            title="Detalle de Membresía"
            iconName="Calendar"
            iconColor="text-blue-600"
            summary={activeMembership ? `Plan ${activeMembership.plan.name} activo` : 'Sin membresía activa'}
            href={`/admin/clientes/${id}/membresia`}
          >
            {member.memberships.length > 0 ? (
              <div className="space-y-3 py-2">
                 {member.memberships.slice(0, 3).map(mem => (
                  <div key={mem.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{mem.plan.name}</p>
                      <p className="text-xs text-slate-500">Vence: {fmtFecha(mem.endDate)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${mem.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {mem.status === 'ACTIVE' ? 'Activa' : 'Vencida'}
                    </span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400 py-2">No hay membresías registradas.</p>}
          </ClientAccordion>

          {/* 2. Pagos */}
          <ClientAccordion
            title="Pagos"
            iconName="CreditCard"
            iconColor="text-emerald-600"
            summary={lastPayment ? `Último pago: $${Number(lastPayment.amount).toLocaleString('es-AR')} (${fmtFecha(lastPayment.createdAt)})` : 'Sin pagos registrados'}
            href={`/admin/clientes/${id}/pagos`}
          >
            {member.payments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {member.payments.map(p => (
                  <div key={p.id} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-slate-900">${Number(p.amount).toLocaleString('es-AR')}</p>
                      <p className="text-xs text-slate-500">{p.concept}</p>
                    </div>
                    <span className="text-xs text-slate-400">{fmtFecha(p.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400 py-2">No hay pagos recientes.</p>}
          </ClientAccordion>

          {/* 3. Asistencias */}
          <ClientAccordion
            title="Asistencias"
            iconName="UserCheck"
            iconColor="text-indigo-600"
            summary={lastAttendance ? `Última: ${fmtFechaHora(lastAttendance.entryTime)}` : 'Sin asistencias registradas'}
            href={`/admin/clientes/${id}/asistencias`}
          >
            {member.attendances.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {member.attendances.map(a => (
                  <div key={a.id} className="py-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{fmtFechaHora(a.entryTime)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'ALLOWED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {a.status === 'ALLOWED' ? 'Permitido' : 'Denegado'}
                    </span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400 py-2">No hay registros recientes.</p>}
          </ClientAccordion>

          {/* 4. Rutina Activa (fija) */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Dumbbell size={15} className="text-blue-600" />
                Rutina activa
              </h3>
              <div className="flex gap-2">
                <Link href={`/admin/rutinas/nueva?memberId=${id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                    <Plus size={13} /> Nueva rutina
                  </Button>
                </Link>
                {templates.length > 0 && <AssignTemplateButton memberId={id} templates={templates} />}
              </div>
            </div>
            {activeRoutine ? (
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{activeRoutine.name}</h4>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {activeRoutine.goal && <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{activeRoutine.goal}</span>}
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{activeRoutine.frequencyPerWeek} ses/sem · {activeRoutine.totalWeeks} semanas</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/admin/rutinas/${activeRoutine.id}?memberId=${id}`}><Button variant="outline" size="sm" className="h-8 text-xs">Ver</Button></Link>
                    <Link href={`/admin/rutinas/${activeRoutine.id}/editar?memberId=${id}`}><Button variant="outline" size="sm" className="h-8 text-xs">Editar</Button></Link>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{progress.completed} de {progress.total} sesiones completadas</span>
                    <span className="font-semibold text-slate-900">{progress.pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress.pct}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-slate-700 mb-1">Sin rutina activa</p>
                <p className="text-xs text-slate-400">Creá una rutina nueva o asigná un template existente</p>
              </div>
            )}
          </div>

                            {/* 5. Progreso de Rutina (Activa) */}
                            <ClientAccordion
            title="Progreso de Rutina (Activa)"
            iconName="Activity"
            iconColor="text-violet-600"
            summary={lastProgress ? `Último: ${Number(lastProgress.weightUsed)}kg en ${lastProgress.exercise.name}` : 'Sin registros de series/reps'}
            href={`/admin/clientes/${id}/progreso-rutina`} // 👈 CAMBIO ACÁ
          >
            {member.progressLogs.length > 0 ? (
              <div className="space-y-4 py-2">
                {/* Gráfico de barras (idéntico al de MIPLAN) */}
                <ClientProgressChart
                  data={member.progressLogs.map(log => ({
                    exerciseName: log.exercise.name,
                    exerciseType: log.exercise.type || 'STRENGTH', // Asumiendo que el include trae el type
                    date: log.date.toISOString(),
                    weightUsed: Number(log.weightUsed),
                    setsCompleted: log.setsCompleted,
                    repsCompleted: log.repsCompleted,
                  }))}
                />

                {/* Lista de últimos registros */}
                <div className="divide-y divide-slate-100 pt-2 border-t border-slate-100">
                  {member.progressLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="py-2 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-slate-900">{log.exercise.name}</p>
                        <p className="text-xs text-slate-500">{log.setsCompleted} series x {log.repsCompleted} reps</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-700">{log.weightUsed} kg</p>
                        <p className="text-xs text-slate-400">{fmtFecha(log.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-sm text-slate-400 py-2">No hay registros de series.</p>}
          </ClientAccordion>

          {/* 6. Historial de Rutinas (desplegable) */}
          <ClientAccordion
            title="Historial de Rutinas"
            iconName="History"
            iconColor="text-slate-500"
            summary={archivedRoutines.length > 0 ? `Tenés ${archivedRoutines.length} rutinas archivadas` : 'Sin rutinas archivadas'}
            href={`/admin/clientes/${id}/rutinas`}
          >
            {archivedRoutines.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-slate-400">
                Aún no hay rutinas archivadas
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {archivedRoutines.slice(0, 4).map(routine => {
                  const p = routineProgress(routine)
                  return (
                    <Link
                      key={routine.id}
                      href={`/admin/rutinas/${routine.id}?memberId=${id}`}
                      className="flex items-center gap-4 py-3 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        {p.pct === 100
                          ? <CheckCircle2 size={16} className="text-emerald-500" />
                          : <Clock size={15} className="text-slate-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{routine.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {p.completed}/{p.total} sesiones
                          {routine.totalWeeks && ` · ${routine.totalWeeks} semanas`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-700">{p.pct}%</p>
                          {p.pct === 100 && (
                            <p className="text-[10px] text-emerald-500 font-medium">Completada</p>
                          )}
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </ClientAccordion>

          {/* 7. Progreso Físico (al final) */}
          <ClientAccordion
            title="Progreso Físico"
            iconName="Weight"
            iconColor="text-orange-600"
            summary={lastBodyComp ? `Último peso: ${Number(lastBodyComp.weight)}kg (${fmtFecha(lastBodyComp.createdAt)})` : 'Sin registros de composición corporal'}
            href={`/admin/clientes/${id}/progreso`}
          >
            {member.bodyCompositions.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {member.bodyCompositions.map(log => (
                  <div key={log.id} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{Number(log.weight)} kg</p>
                      <p className="text-xs text-slate-500">IMC: {log.bmi ? Number(log.bmi).toFixed(1) : '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Grasa: {log.bodyFatPercent ? `${Number(log.bodyFatPercent)}%` : '—'}</p>
                      <p className="text-xs text-slate-400">{fmtFecha(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400 py-2">No hay registros de composición corporal.</p>}
          </ClientAccordion>

        </div>
      </div>
    </div>
  )
}