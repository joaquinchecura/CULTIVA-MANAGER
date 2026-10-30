export const dynamic = 'force-dynamic'

import { ArrowUpRight, ExternalLink } from 'lucide-react'

interface Herramienta {
  name: string
  tag: string
  color: string
  desc: string
  link: string
}

const herramientas: Herramienta[] = [
  { name: 'BIOMATCH', tag: 'BIOMECÁNICA', color: '#C084FC', desc: 'Análisis biomecánico 3D y riesgos de ejecución.', link: 'https://biomatch.cultivafitness.app' },
  { name: 'SUPPLY', tag: 'NUTRICIÓN', color: '#60A5FA', desc: 'Registro de macros, plan personalizado y recetas con IA.', link: 'https://supply.cultivafitness.app' },
  { name: 'RECKON', tag: 'WELLNESS', color: '#fbbf24', desc: 'Evaluaciones de salud y programas personalizados de acondicionamiento.', link: 'https://reckon.cultivafitness.app' },
  { name: 'NEURA', tag: 'NEUROCIENCIA', color: '#2DD4BF', desc: 'Regulación del sistema nervioso y hábitos emocionales.', link: 'https://neura.cultivafitness.app' },
  { name: 'RUNNING', tag: 'RUNNING', color: '#EF4444', desc: 'Plan de running personalizado con análisis de pie.', link: 'https://running.cultivafitness.app' },
  { name: 'MICROFIT', tag: 'EFICIENCIA', color: '#FB923C', desc: 'Rutinas de 5, 10 o 15 minutos según tiempo disponible.', link: 'https://microfit.cultivafitness.app' },
  { name: 'DESKOUT', tag: 'PRODUCTIVIDAD', color: '#818CF8', desc: 'Microrutinas de 2-5 min para la jornada laboral.', link: 'https://deskout.cultivafitness.app' },
  { name: 'SILVER', tag: 'LONGEVIDAD', color: '#94A3B8', desc: 'Rutinas accesibles para adultos mayores.', link: 'https://silver.cultivafitness.app' },
  { name: 'JUNIOR', tag: 'EDUCACIÓN', color: '#A3E635', desc: 'Educación física gamificada para niños y jóvenes.', link: 'https://junior.cultivafitness.app' },
  { name: 'PRENATAL', tag: 'MATERNIDAD', color: '#F472B6', desc: 'Rutinas validadas médicamente por trimestre.', link: 'https://prenatal.cultivafitness.app' },
  { name: 'TIMER', tag: 'UTILIDAD', color: '#f472b6', desc: 'Temporizador de entrenamiento con presets.', link: 'https://timer.cultivafitness.app' },
]

export default function HerramientasPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Herramientas para tus clientes</h2>
        <p className="text-slate-500 mt-1">
          Apps del ecosistema Cultiva Fitness.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {herramientas.map((app) => (
          <a
            key={app.name}
            href={app.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative border border-transparent rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
            style={{ 
              backgroundColor: `${app.color}10`, // 10 = 6% de opacidad, muy suave
              borderColor: `${app.color}30` // 30 = 18% de opacidad, un borde sutil del mismo color
            }}
          >
            {/* Fondo decorativo del color de la app (más intenso en hover) */}
            <div
              className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
              style={{ backgroundColor: app.color }}
            />

            {/* Header: Logo + Nombre + Tag */}
            <div className="flex items-start gap-3 mb-3 relative z-10">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm bg-white"
              >
                <img
                  src={`/images/logo${app.name.toLowerCase()}.png`}
                  alt={app.name}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-base font-bold text-slate-900 leading-tight">{app.name}</h3>
                <span
                  className="inline-block mt-1 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/60"
                  style={{ color: app.color }}
                >
                  {app.tag}
                </span>
              </div>
              <ArrowUpRight
                size={16}
                className="text-slate-400 group-hover:text-slate-700 transition-colors shrink-0 mt-1"
              />
            </div>

            {/* Descripción */}
            <p className="text-sm text-slate-600 leading-relaxed relative z-10 line-clamp-2">
              {app.desc}
            </p>

            {/* Footer: Link visual */}
            <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between relative z-10">
              <span className="text-[10px] text-slate-500 font-medium">Abrir app</span>
              <ExternalLink
                size={12}
                className="text-slate-400 group-hover:text-slate-600 transition-colors"
              />
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}