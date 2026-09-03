import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// ============================================================
// TUS PERSONAJES BASE (copiá exacto de lo que usaste en Flow) npx tsx generate-flow-prompts.ts
// ============================================================
const ATHLETES = [
  {
    id: 'athlete-a',
    name: 'Atleta Masculino 30s',
    prompt: 'Muscular man in his early 30s, short dark hair, clean shaven, wearing black athletic shorts and heather white tank top, athletic build, caucasian',
  },
  {
    id: 'athlete-b', 
    name: 'Atleta Femenino 25s',
    prompt: 'Athletic woman in her mid 20s, dark hair in a high ponytail, wearing navy blue high-waisted leggings and white sports bra, toned physique, latina',
  },
  {
    id: 'athlete-c',
    name: 'Atleta Masculino 40s',
    prompt: 'Fit man in his early 40s, short beard and buzz cut, wearing black shirt and matching shorts, lean muscular build, athletic',
  },
  {
    id: 'athlete-d',
    name: 'Atleta Femenino 35s',
    prompt: 'Athletic woman in her mid 30s, long blond hair, ponytail,  wearing maroon athletic top and black leggings, strong physique, caucasian',
  },
] as const

// ============================================================
// MODIFICADORES POR TIPO DE EJERCICIO
// ============================================================
const TYPE_MODIFIERS: Record<string, string> = {
  STRENGTH: 'heavy weightlifting, intense focused expression, gym equipment visible, powerful stance',
  CARDIO: 'dynamic motion, mid-movement, sweat visible, energetic expression, cardio machine or open floor',
  FUNCTIONAL: 'functional fitness movement, athletic stance, kettlebell or bodyweight, explosive power',
  MOBILITY: 'controlled stretching, relaxed focused expression, full range of motion, yoga mat or floor',
  STRETCHING: 'deep stretch pose, calm breathing, elongated muscles, floor exercise, peaceful expression',
  PLYOMETRIC: 'explosive athletic movement, mid-air capture, maximum power output, dynamic freeze frame',
  BALANCE: 'stable balanced pose, core engaged, focused concentration, unstable surface or single leg',
  TECHNIQUE: 'practicing movement pattern, light weight or PVC pipe, instructional form, slow controlled',
  WARMUP: 'light dynamic movement, warming up body, gradual motion, preparing for exercise',
  COOLDOWN: 'recovery stretching, deep breathing, relaxed posture, post-workout calm, gentle movement',
  REHABILITATION: 'controlled movement, focused espression, rehabilitation exercise, controlled activation, precise movement',
  OTHER: 'rehabilitation exercise, controlled activation, mind-muscle connection, precise small movement',
}

// ============================================================
// DETALLES ESPECÍFICOS POR EQUIPAMIENTO
// ============================================================
const EQUIPMENT_DETAILS: Record<string, string> = {
  'Barra': 'holding olympic barbell with weight plates',
  'Mancuernas': 'holding dumbbells in each hand',
  'Mancuerna': 'holding single dumbbell',
  'Máquina': 'using gym machine, seated or standing position',
  'Polea': 'using cable machine with attachment',
  'Kettlebell': 'holding kettlebell with both hands or one',
  'Banda': 'using resistance band for tension',
  'Banco': 'using weight bench for support',
  'Cinta': 'running on treadmill',
  'Elíptica': 'using elliptical machine',
  'Bicicleta': 'riding stationary bike',
  'Remo': 'using rowing machine',
  'Soga': 'jumping rope',
  'Cajón': 'using plyometric box',
  'Bosu': 'standing on bosu ball for instability',
  'Fitball': 'using stability swiss ball',
  'Foam roller': 'using foam roller on muscle',
  'Palo': 'using PVC pipe or wooden stick',
  'Trineo': 'pushing weighted sled',
  'Cuerdas': 'using battle ropes',
  'Balón': 'holding medicine ball',
  'Pelota': 'using small massage ball',
  'Paralelas': 'using dip bars',
  'Pista': 'on running track',
  'Sandbag': 'carrying sandbag',
  'TRX': 'using TRX suspension straps',
  'Peso corporal': 'no equipment, bodyweight only',
  'Chaleco': 'wearing weighted vest',
  'Step': 'using aerobic step platform',
  'Slam ball': 'holding slam ball',
}

// ============================================================
// PROMPT BASE FIJO (consistencia visual)
// ============================================================
const BASE_STYLE = `, modern clean gym environment, bright even studio lighting, 
professional fitness photography, sharp focus on subject, slightly blurred background, 
full body or major muscle groups clearly visible, photorealistic, 4K quality, 
no text, no watermarks, no logos`.replace(/\s+/g, ' ')

// ============================================================
// GENERAR PROMPT COMPLETO npx tsx generate-flow-prompts.ts
// ============================================================
function buildFlowPrompt(
  exercise: { name: string; type: string; equipment: string; muscleGroup: string },
  athlete: (typeof ATHLETES)[number]
): string {
  const typeModifier = TYPE_MODIFIERS[exercise.type] || 'fitness exercise'
  const equipmentDetail = EQUIPMENT_DETAILS[exercise.equipment] || `using ${exercise.equipment.toLowerCase()}`

  return `${athlete.prompt}, performing ${exercise.name} exercise, 
    ${equipmentDetail}, ${typeModifier}, 
    targeting ${exercise.muscleGroup.toLowerCase()} muscles,
    correct anatomical form and posture${BASE_STYLE}`.replace(/\s+/g, ' ')
}

// ============================================================
// GENERAR BATCH DE PROMPTS PARA FLOW
// ============================================================
async function generateFlowBatches(batchSize: number = 25) {
  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true, type: true, equipment: true, muscleGroup: true },
    orderBy: { id: 'asc' },
  })

  // Filtrar ejercicios con datos completos y normalizar nulls
  const validExercises = exercises
    .filter((ex): ex is typeof ex & { equipment: string; muscleGroup: string } => 
      ex.equipment !== null && ex.muscleGroup !== null && ex.equipment !== '' && ex.muscleGroup !== ''
    )
    .map((ex) => ({
      id: ex.id,
      name: ex.name,
      type: ex.type,
      equipment: ex.equipment,
      muscleGroup: ex.muscleGroup,
    }))

  console.log(`📊 Total ejercicios en DB: ${exercises.length}`)
  console.log(`✅ Ejercicios válidos: ${validExercises.length}`)
  console.log(`❌ Ejercicios sin equipo/grupo: ${exercises.length - validExercises.length}`)

  if (validExercises.length === 0) {
    console.log('⚠️  No hay ejercicios válidos. Verificá que tengan equipment y muscleGroup.')
    return
  }

  // Distribuir ejercicios entre atletas (round-robin)
  const batches: { athlete: typeof ATHLETES[number]; exercises: typeof validExercises }[] = []

  for (let i = 0; i < ATHLETES.length; i++) {
    const athleteExercises = validExercises.filter((_, idx) => idx % ATHLETES.length === i)
    batches.push({ athlete: ATHLETES[i], exercises: athleteExercises })
  }

  // Generar archivos de prompts por atleta
  const outputDir = path.join(process.cwd(), 'flow-prompts')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  for (const batch of batches) {
    const lines: string[] = [
      `=== ${batch.athlete.name} ===`,
      `Personaje: ${batch.athlete.prompt}`,
      `Total ejercicios: ${batch.exercises.length}`,
      '',
    ]

    // Dividir en sub-batches de 20-30 para Flow gratis
    const subBatches = []
    for (let i = 0; i < batch.exercises.length; i += batchSize) {
      subBatches.push(batch.exercises.slice(i, i + batchSize))
    }

    for (let sbIndex = 0; sbIndex < subBatches.length; sbIndex++) {
      lines.push(`--- Día ${sbIndex + 1} (ejercicios ${sbIndex * batchSize + 1}-${Math.min((sbIndex + 1) * batchSize, batch.exercises.length)}) ---`)

      for (const ex of subBatches[sbIndex]) {
        const prompt = buildFlowPrompt(ex, batch.athlete)
        lines.push('')
        lines.push(`[${ex.id}] ${ex.name} (${ex.type})`)
        lines.push(prompt)
      }
      lines.push('')
    }

    const filename = `prompts-${batch.athlete.id}.txt`
    fs.writeFileSync(path.join(outputDir, filename), lines.join('\n'), 'utf-8')
    console.log(`✅ ${filename} generado (${batch.exercises.length} prompts)`)
  }

  // También generar un CSV con todos los prompts para importar
  const csvLines = ['exerciseId,exerciseName,athlete,prompt']
  for (const batch of batches) {
    for (const ex of batch.exercises) {
      const prompt = buildFlowPrompt(ex, batch.athlete)
      csvLines.push(`"${ex.id}","${ex.name}","${batch.athlete.name}","${prompt.replace(/"/g, '\"')}"`)
    }
  }
  fs.writeFileSync(path.join(outputDir, 'all-prompts.csv'), csvLines.join('\n'), 'utf-8')
  console.log(`✅ all-prompts.csv generado (${csvLines.length - 1} prompts)`)

  console.log(`\n📁 Archivos guardados en: ${outputDir}`)
  console.log(`\n💡 Instrucciones:`)
  console.log(`   1. Abrí Flow (Google) con cada cuenta`)
  console.log(`   2. Cargá el personaje base correspondiente`)
  console.log(`   3. Copiá y pegá 20-30 prompts por día`)
  console.log(`   4. Descargá las imágenes y guardalas en /public/exercises/`)
  console.log(`   5. Nombralas como: {exerciseId}.png`)
}

// Ejecutar
generateFlowBatches(25)
  .catch(console.error)
  .finally(() => prisma.$disconnect())