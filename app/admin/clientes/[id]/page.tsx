export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Dumbbell, ArrowLeft, DollarSign, TrendingUp,
  UserCheck, Calendar, Phone, Mail, MapPin,
  AlertCircle, Copy, Plus, ChevronRight,
  CheckCircle2, Clock, History, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getRoutineHistoryForMember, getTemplates } from '@/app/actions/routines'
import AssignTemplateButton from '@/components/clientes/AssignTemplateButton'

const TZ = 'America/Argentina/Buenos_Aires'

function fmtFecha(d: Date | string) {
  return new Date(d).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ,
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
  const { id } = await params

  const [member, routineHistory, templates] = await Promise.all([
    prisma.member.findUnique({
      where: { id },
      include: {
        memberships: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
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

  // Calcular progreso de la rutina activa
  function routineProgress(routine: typeof activeRoutine) {
    if (!routine) return { total: 0, completed: 0, pct: 0 }
    const total = routine.days.length
    const completed = routine.days.filter(d => d.sessionLogs.some(l => l.completedAt)).length
    return { total, completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const progress = routineProgress(activeRoutine)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/clientes">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft size={18} />
            </Button>
          </Link>

          {/* Avatar chico para reconocimiento rápido en el header */}
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={`${member.firstName} ${member.lastName}`}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-sm shrink-0">
              {initials(member.firstName, member.lastName)}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {member.firstName} {member.lastName}
            </h1>
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

        {/* Acciones rápidas */}
        <div className="flex gap-2 flex-wrap justify-end">
          {[
            { href: `/admin/clientes/${id}/asistencias`, label: 'Asistencias', icon: UserCheck, color: 'bg-indigo-600 hover:bg-indigo-700' },
            { href: `/admin/clientes/${id}/pagos`,       label: 'Pagos',       icon: DollarSign, color: 'bg-emerald-600 hover:bg-emerald-700' },
            { href: `/admin/clientes/${id}/progreso`,    label: 'Progreso',    icon: TrendingUp, color: 'bg-orange-600 hover:bg-orange-700' },
            { href: `/admin/clientes/${id}/membresia`,   label: 'Membresía',   icon: Calendar,   color: 'bg-blue-600 hover:bg-blue-700' },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href}>
              <Button size="sm" className={`gap-1.5 text-white ${color}`}>
                <Icon size={15} /> {label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Columna izquierda: foto + datos */}
        <div className="lg:col-span-1 space-y-5">

          {/* Foto de perfil — tarjeta destacada */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={`${member.firstName} ${member.lastName}`}
                className="w-full aspect-square max-w-[320px] mx-auto rounded-2xl object-cover border border-slate-100"
              />
            ) : (
              <div className="w-full aspect-square max-w-[320px] mx-auto rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                <User size={40} className="text-slate-300" />
                <p className="text-xs text-slate-400 text-center px-6">
                  Sin foto de perfil todavía
                </p>
              </div>
            )}
          </div>

          {/* Datos personales */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">
              Datos personales
            </h3>
            <div className="space-y-3 text-sm">
              {[
                { icon: Mail,    label: member.email },
                { icon: Phone,   label: member.phone },
                { icon: MapPin,  label: [member.address, member.city].filter(Boolean).join(', ') || '—' },
                { icon: Calendar, label: fmtFecha(member.birthDate) },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-start gap-2.5 text-slate-600">
                  <Icon size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <span className="break-all">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contacto de emergencia */}
          {(member.emergencyContactName || member.medicalNotes) && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">
                Emergencia
              </h3>
              <div className="space-y-2 text-sm text-slate-600">
                {member.emergencyContactName && (
                  <p><span className="font-medium text-slate-700">Contacto:</span> {member.emergencyContactName}</p>
                )}
                {member.emergencyContactPhone && (
                  <p><span className="font-medium text-slate-700">Tel:</span> {member.emergencyContactPhone}</p>
                )}
              </div>
              {member.medicalNotes && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  {member.medicalNotes}
                </div>
              )}
            </div>
          )}

          {/* Membresías */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">
              Membresías
            </h3>
            {member.memberships.length > 0 ? (
              <div className="space-y-2">
                {member.memberships.slice(0, 3).map(mem => (
                  <div key={mem.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{mem.plan.name}</p>
                      <p className="text-xs text-slate-500">
                        hasta {new Date(mem.endDate).toLocaleDateString('es-AR', { timeZone: TZ })}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      mem.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {mem.status === 'ACTIVE' ? 'Activa' : 'Vencida'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Sin membresías</p>
            )}
          </div>
        </div>

        {/* Columna derecha: rutinas */}
        <div className="lg:col-span-2 space-y-5">

          {/* Rutina activa */}
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
                {/* Asignar desde template */}
                {templates.length > 0 && (
                  <AssignTemplateButton memberId={id} templates={templates} />
                )}
              </div>
            </div>

            {activeRoutine ? (
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{activeRoutine.name}</h4>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {activeRoutine.goal && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {activeRoutine.goal}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {activeRoutine.frequencyPerWeek} ses/sem · {activeRoutine.totalWeeks} semanas
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/admin/rutinas/${activeRoutine.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs">Ver</Button>
                    </Link>
                    <Link href={`/admin/rutinas/${activeRoutine.id}/editar`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs">Editar</Button>
                    </Link>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{progress.completed} de {progress.total} sesiones completadas</span>
                    <span className="font-semibold text-slate-900">{progress.pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${progress.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Dumbbell size={22} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">Sin rutina activa</p>
                <p className="text-xs text-slate-400">
                  Creá una rutina nueva o asigná un template existente
                </p>
              </div>
            )}
          </div>

          {/* Historial de rutinas */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <History size={15} className="text-slate-400" />
                Historial de rutinas
              </h3>
              {archivedRoutines.length > 3 && (
                <Link href={`/admin/clientes/${id}/rutinas`} className="text-xs text-blue-600 hover:underline">
                  Ver todas ({archivedRoutines.length})
                </Link>
              )}
            </div>

            {archivedRoutines.length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-slate-400">
                Aún no hay rutinas archivadas
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {archivedRoutines.slice(0, 4).map(routine => {
                  const p = routineProgress(routine)
                  return (
                    <Link
                      key={routine.id}
                      href={`/admin/rutinas/${routine.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
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
          </div>
        </div>
      </div>
    </div>
  )
}