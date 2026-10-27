import {
    UserPlus, Activity, CalendarDays, CreditCard, Users, Scan,
    Dumbbell, BookOpen, Newspaper, Settings, Link2, FileText
  } from 'lucide-react'
  
  export type QuickActionKey =
    | 'clientes' | 'rutinas' | 'agenda' | 'pagos' | 'acceso'
    | 'ejercicios' | 'noticias' | 'vincular' | 'actividades'
    | 'reportes' | 'configuracion'
  
  export const QUICK_ACTIONS_CATALOG: Record<
    QuickActionKey,
    { label: string; icon: React.ElementType; href: string; className: string }
  > = {
    clientes: {
      label: 'Nuevo Cliente',
      icon: UserPlus,
      href: '/admin/clientes/nuevo',
      className: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100',
    },
    rutinas: {
      label: 'Nueva Rutina',
      icon: Activity,
      href: '/admin/rutinas/nueva',
      className: 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-100',
    },
    agenda: {
      label: 'Ver Agenda',
      icon: CalendarDays,
      href: '/admin/agenda',
      className: 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-100',
    },
    pagos: {
      label: 'Registrar Pago',
      icon: CreditCard,
      href: '/admin/pagos',
      className: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100',
    },
    acceso: {
      label: 'Abrir Scanner',
      icon: Scan,
      href: '/admin/acceso',
      className: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100',
    },
    ejercicios: {
      label: 'Nuevo Ejercicio',
      icon: BookOpen,
      href: '/admin/ejercicios/nuevo',
      className: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100',
    },
    noticias: {
      label: 'Nueva Noticia',
      icon: Newspaper,
      href: '/admin/noticias/nueva',
      className: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100',
    },
    vincular: {
      label: 'Vincular Alumno',
      icon: Link2,
      href: '/admin/clientes/vincular',
      className: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100',
    },
    actividades: {
      label: 'Nueva Actividad',
      icon: Dumbbell,
      href: '/admin/actividades/nueva',
      className: 'bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-100',
    },
    reportes: {
      label: 'Ver Reportes',
      icon: FileText,
      href: '/admin/reportes',
      className: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100',
    },
    configuracion: {
      label: 'Configuración',
      icon: Settings,
      href: '/admin/configuracion',
      className: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200',
    },
  }
  
  // Lista ordenada para mostrar en la UI de configuración
  export const QUICK_ACTIONS_LIST: QuickActionKey[] = [
    'clientes', 'rutinas', 'agenda', 'pagos', 'acceso',
    'ejercicios', 'noticias', 'vincular', 'actividades',
    'reportes', 'configuracion',
  ]