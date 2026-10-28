'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, UserCheck, CreditCard, Activity, Calendar, Dumbbell, Weight, History } from 'lucide-react'

const ICONS = {
  UserCheck,
  CreditCard,
  Activity,
  Calendar,
  Dumbbell,
  Weight,
  History,
}

type IconName = keyof typeof ICONS

interface AccordionProps {
  title: string
  iconName: IconName // Ahora recibe el nombre del ícono como string
  iconColor: string
  summary: string
  href: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function ClientAccordion({ title, iconName, iconColor, summary, href, children, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  // Buscamos el ícono en el diccionario
  const Icon = ICONS[iconName] || Activity

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-200">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-opacity-10", iconColor.replace('text-', 'bg-').replace('600', '100'))}>
            <Icon size={18} className={iconColor} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {!isOpen && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{summary}</p>
            )}
          </div>
        </div>
        <ChevronDown
          size={16}
          className={cn('text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </div>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-slate-50 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <Link
              href={href}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Ver historial completo <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}