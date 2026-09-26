export const dynamic = 'force-dynamic'

interface Herramienta {
  name: string
  tag: string
  color: string
  desc: string
  link: string
}

const herramientas: Herramienta[] = [
  { name: 'RECKON', tag: 'WELLNESS', color: '#fbbf24', desc: 'Evaluaciones de salud y programas personalizados de acondicionamiento.', link: 'https://reckon.cultivafitness.app' },
  { name: 'SUPPLY', tag: 'NUTRICIÓN', color: '#60A5FA', desc: 'Registro de macros, plan personalizado y recetas con IA.', link: 'https://supply.cultivafitness.app' },
  { name: 'NEURA', tag: 'NEUROCIENCIA', color: '#2DD4BF', desc: 'Regulación del sistema nervioso y hábitos emocionales.', link: 'https://neura.cultivafitness.app' },
  { name: 'BODYMIND', tag: 'FITNESS', color: '#4ADE80', desc: 'Entrenamiento, nutrición y neurociencia combinados.', link: 'https://bodymind.cultivafitness.app' },
  { name: 'MICROFIT', tag: 'EFICIENCIA', color: '#FB923C', desc: 'Rutinas de 5, 10 o 15 minutos según tiempo disponible.', link: 'https://microfit.cultivafitness.app' },
  { name: 'DESKOUT', tag: 'PRODUCTIVIDAD', color: '#818CF8', desc: 'Microrutinas de 2-5 min para la jornada laboral.', link: 'https://deskout.cultivafitness.app' },
  { name: 'SILVER', tag: 'LONGEVIDAD', color: '#94A3B8', desc: 'Rutinas accesibles para adultos mayores.', link: 'https://silver.cultivafitness.app' },
  { name: 'JUNIOR', tag: 'EDUCACIÓN', color: '#A3E635', desc: 'Educación física gamificada para niños y jóvenes.', link: 'https://junior.cultivafitness.app' },
  { name: 'PRENATAL', tag: 'MATERNIDAD', color: '#F472B6', desc: 'Rutinas validadas médicamente por trimestre.', link: 'https://prenatal.cultivafitness.app' },
  { name: 'RUNNING', tag: 'RUNNING', color: '#EF4444', desc: 'Plan de running personalizado con análisis de pie.', link: 'https://running.cultivafitness.app' },
  { name: 'BIOMATCH', tag: 'BIOMECÁNICA', color: '#C084FC', desc: 'Análisis biomecánico 3D y riesgos de ejecución.', link: 'https://biomatch.cultivafitness.app' },
  { name: 'TIMER', tag: 'UTILIDAD', color: '#f472b6', desc: 'Temporizador de entrenamiento con presets.', link: 'https://timer.cultivafitness.app' },
]

export default function HerramientasPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Herramientas para tus clientes</h2>
        <p className="text-slate-500 mt-1">
          Apps del ecosistema Cultiva Fitness — usalas como recurso en tus sesiones. No comparten datos con Manager.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {herramientas.map(function (app) {
          return (
            <a
              key={app.name}
              href={app.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shrink-0"
                  style={{ backgroundColor: app.color }}
                >
                  {app.name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{app.name}</h3>
                  <span
                    className="text-[10px] font-mono tracking-wider uppercase"
                    style={{ color: app.color }}
                  >
                    {app.tag}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{app.desc}</p>
            </a>
          )
        })}
      </div>
    </div>
  )
}