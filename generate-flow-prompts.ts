import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// ============================================================
// PERSONAJES BASE — mantené estos prompts exactamente iguales
// si querés máxima consistencia visual entre imágenes de Flow.
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
    prompt: 'Athletic woman in her mid 30s, long blond hair, ponytail, wearing maroon athletic top and black leggings, strong physique, caucasian',
  },
] as const

// ============================================================
// MODIFICADORES POR TIPO
// ============================================================
const TYPE_MODIFIERS: Record<string, string> = {
  STRENGTH: 'strength training exercise, controlled force production, stable stance, focused expression, correct lifting mechanics',
  CARDIO: 'dynamic cardiovascular exercise, energetic movement, natural exertion, sweat may be visible, athletic rhythm',
  FUNCTIONAL: 'functional fitness movement, athletic stance, coordinated full-body movement, controlled power output',
  MOBILITY: 'controlled joint mobility exercise, active range of motion, slow precise movement, stable posture, not a passive stretch',
  STRETCHING: 'static or dynamic stretching position, relaxed breathing, elongated muscles, calm controlled posture',
  PLYOMETRIC: 'explosive athletic movement, powerful takeoff or landing, dynamic freeze-frame, controlled landing mechanics',
  BALANCE: 'balance exercise, stable single-leg or unstable-surface position, engaged core, focused concentration',
  TECHNIQUE: 'technical movement practice, light resistance or appropriate training aid, slow controlled execution, instructional form',
  WARMUP: 'light dynamic warm-up movement, gradual range of motion, relaxed athletic rhythm, preparing the body for exercise',
  COOLDOWN: 'gentle recovery movement, relaxed posture, slow breathing, low intensity, post-workout recovery',
  REHABILITATION: 'controlled rehabilitation exercise, precise low-intensity movement, neutral posture, therapeutic exercise setup, no explosive motion',
  OTHER: 'controlled fitness movement, precise posture, natural athletic execution',
}

// ============================================================
// EQUIPAMIENTO — búsqueda flexible para soportar variantes del seed.
// ============================================================
const EQUIPMENT_RULES: Array<[string[], string]> = [
  [['barra', 'barbell'], 'holding an Olympic barbell with appropriate weight plates'],
  [['mancuernas', 'dumbbell'], 'holding dumbbells with a secure neutral grip'],
  [['máquina', 'maquina'], 'using the specified gym machine with correct seat and body alignment'],
  [['polea', 'cable'], 'using a cable machine with the appropriate attachment'],
  [['kettlebell'], 'holding a kettlebell with a secure grip'],
  [['banda', 'band'], 'using a resistance band under visible controlled tension'],
  [['banco', 'bench'], 'using a stable weight bench for support'],
  [['cinta', 'treadmill'], 'running or walking on a treadmill'],
  [['elíptica', 'elliptical'], 'using an elliptical trainer with correct posture'],
  [['bicicleta', 'bike'], 'riding a stationary exercise bike'],
  [['remo', 'rowing'], 'using a rowing machine with correct rowing posture'],
  [['soga', 'cuerda para saltar', 'jump rope'], 'jumping rope with the rope clearly visible'],
  [['cajón', 'cajon', 'plyometric box'], 'using a stable plyometric box'],
  [['bosu'], 'standing or kneeling on a BOSU balance trainer as appropriate'],
  [['fitball', 'swiss ball', 'stability ball'], 'using a stability ball with controlled body positioning'],
  [['foam roller'], 'using a foam roller positioned correctly under the intended body area'],
  [['palo', 'bastón', 'stick', 'pvc'], 'holding a lightweight PVC pipe or mobility stick'],
  [['trineo', 'sled'], 'pushing or pulling a weighted sled with correct body alignment'],
  [['cuerdas', 'battle rope'], 'using battle ropes with controlled rhythmic movement'],
  [['balón medicinal', 'medicine ball', 'balón'], 'holding a medicine ball securely'],
  [['pelota', 'massage ball'], 'using a small therapy or massage ball positioned on the intended area'],
  [['paralelas', 'dip bars'], 'using parallel dip bars with secure hand placement'],
  [['pista', 'track'], 'performing the movement on an indoor or outdoor running track'],
  [['sandbag'], 'carrying or lifting a sandbag with controlled posture'],
  [['trx'], 'using TRX suspension straps with secure hand or foot placement'],
  [['peso corporal', 'bodyweight'], 'using bodyweight only, no external equipment'],
  [['chaleco', 'weighted vest'], 'wearing a fitted weighted vest'],
  [['step', 'plataforma'], 'using a stable aerobic step platform'],
  [['slam ball'], 'holding a slam ball securely'],
]

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getEquipmentDetail(equipment: string): string {
  const normalized = normalize(equipment)
  const match = EQUIPMENT_RULES.find(([keywords]) =>
    keywords.some((keyword) => normalized.includes(normalize(keyword)))
  )

  return match?.[1] ?? `using the specified equipment (${equipment}) exactly as intended`
}

// ============================================================
// CUES VISUALES AUTOMÁTICOS SEGÚN NOMBRE DEL EJERCICIO
// Evita depender solamente de la categoría.
// ============================================================
function getExerciseVisualCues(name: string, type: string): string {
  const n = normalize(name)

  const cues: string[] = []

  if (/(sentad|squat|zancad|lunge|split squat|step up|puente)/.test(n)) {
    cues.push('show the lower-body movement clearly with knees tracking naturally over the feet and spine neutral')
  }
  if (/(press|empuje|push|flexion|fondos|bench)/.test(n)) {
    cues.push('show the pushing pattern clearly with controlled shoulder and elbow alignment')
  }
  if (/(remo|row|tiron|pull|jalon|pulldown)/.test(n)) {
    cues.push('show the pulling pattern clearly with shoulders controlled and spine neutral')
  }
  if (/(bisagra|peso muerto|deadlift|rumano|hinge|good morning)/.test(n)) {
    cues.push('show a clear hip hinge with neutral spine and hips moving backward')
  }
  if (/(plancha|plank|dead bug|bird dog|core|abdominal)/.test(n)) {
    cues.push('make the torso and pelvis position clearly visible, with controlled core engagement')
  }
  if (/(equilibr|single leg|una pierna|monopodal)/.test(n) || type === 'BALANCE') {
    cues.push('make the support foot and balance position clearly visible')
  }
  if (type === 'MOBILITY') {
    cues.push('show the joint being mobilized clearly and keep the movement active rather than a passive stretch')
  }
  if (type === 'REHABILITATION') {
    cues.push('show the target joint and alignment clearly, with low-load therapeutic positioning')
  }
  if (type === 'STRETCHING') {
    cues.push('show the target muscle group clearly and maintain a safe controlled stretch position')
  }

  return cues.length > 0 ? cues.join(', ') : 'show the complete exercise movement and the relevant body position clearly'
}

function getFraming(type: string, name: string): string {
  const n = normalize(name)

  if (type === 'REHABILITATION' || /(muñec|munec|mano|dedo|tobillo|pie|cuello|cervical)/.test(n)) {
    return 'medium-full body framing or close enough framing to clearly show the target joint, never crop the active body part'
  }

  if (type === 'MOBILITY' || type === 'STRETCHING') {
    return 'full-body three-quarter view, enough space around the athlete to show the complete range of motion'
  }

  return 'full-body three-quarter view, entire athlete and required equipment visible'
}

// ============================================================
// ESTILO BASE
// ============================================================
const BASE_STYLE = `modern clean fitness studio, bright neutral studio lighting with defined natural shadows, professional fitness photography, realistic skin and anatomy, sharp focus on the athlete, subtly blurred background, photorealistic, high detail, 4K quality, no text, no captions, no watermark, no logos, no duplicate limbs, no extra fingers, no deformed hands, no duplicated equipment, no anatomically impossible pose`

function buildFlowPrompt(
  exercise: { name: string; type: string; equipment: string; muscleGroup: string },
  athlete: (typeof ATHLETES)[number]
): string {
  const typeModifier = TYPE_MODIFIERS[exercise.type] || TYPE_MODIFIERS.OTHER
  const equipmentDetail = getEquipmentDetail(exercise.equipment)
  const visualCues = getExerciseVisualCues(exercise.name, exercise.type)
  const framing = getFraming(exercise.type, exercise.name)
  const environment = exercise.type === 'REHABILITATION'
    ? 'clean professional physiotherapy and fitness studio, uncluttered neutral floor'
    : exercise.type === 'MOBILITY' || exercise.type === 'STRETCHING'
      ? 'clean fitness studio with open floor space and exercise mat when appropriate'
      : 'modern clean commercial gym'

  return [
    athlete.prompt,
    `performing the exercise "${exercise.name}" exactly as a real fitness coach would demonstrate it`,
    equipmentDetail,
    typeModifier,
    visualCues,
    `targeting ${exercise.muscleGroup.toLowerCase()} muscles`,
    'correct anatomical form, natural proportions, neutral spine when appropriate, realistic joint alignment',
    framing,
    environment,
    BASE_STYLE,
  ].join(', ').replace(/\s+/g, ' ').trim()
}

function csvEscape(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`
}

async function generateFlowBatches(batchSize = 25, onlyMissing = false) {
  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true, type: true, equipment: true, muscleGroup: true },
    orderBy: { id: 'asc' },
  })

  const validExercises = exercises
    .filter((ex): ex is typeof ex & { equipment: string; muscleGroup: string } =>
      ex.equipment !== null &&
      ex.muscleGroup !== null &&
      ex.equipment.trim() !== '' &&
      ex.muscleGroup.trim() !== ''
    )
    .map((ex) => ({
      id: ex.id,
      name: ex.name,
      type: String(ex.type),
      equipment: ex.equipment.trim(),
      muscleGroup: ex.muscleGroup.trim(),
    }))

  const exercisesToGenerate = onlyMissing
    ? validExercises.filter((ex) => !fs.existsSync(path.join(process.cwd(), 'public', 'exercises', `${ex.id}.png`)))
    : validExercises

  console.log(`📊 Total ejercicios en DB: ${exercises.length}`)
  console.log(`✅ Ejercicios con datos completos: ${validExercises.length}`)
  console.log(`🖼️  Ejercicios a generar: ${exercisesToGenerate.length}`)
  console.log(`❌ Ejercicios sin equipo/grupo: ${exercises.length - validExercises.length}`)

  if (exercisesToGenerate.length === 0) {
    console.log(onlyMissing
      ? '✅ No hay ejercicios pendientes: todos los IDs válidos ya tienen imagen PNG.'
      : '⚠️ No hay ejercicios válidos para generar.')
    return
  }

  const batches: { athlete: typeof ATHLETES[number]; exercises: typeof exercisesToGenerate }[] = []
  for (let i = 0; i < ATHLETES.length; i++) {
    const athleteExercises = exercisesToGenerate.filter((_, idx) => idx % ATHLETES.length === i)
    batches.push({ athlete: ATHLETES[i], exercises: athleteExercises })
  }

  const outputDir = path.join(process.cwd(), 'flow-prompts')
  fs.mkdirSync(outputDir, { recursive: true })

  for (const batch of batches) {
    const lines: string[] = [
      `=== ${batch.athlete.name} ===`,
      `Personaje: ${batch.athlete.prompt}`,
      `Total ejercicios: ${batch.exercises.length}`,
      '',
    ]

    for (let i = 0; i < batch.exercises.length; i += batchSize) {
      const subBatch = batch.exercises.slice(i, i + batchSize)
      lines.push(`--- Día ${Math.floor(i / batchSize) + 1} (ejercicios ${i + 1}-${i + subBatch.length}) ---`)

      for (const ex of subBatch) {
        lines.push('')
        lines.push(`[${ex.id}] ${ex.name} | Type: ${ex.type} | Equipment: ${ex.equipment} | Muscle group: ${ex.muscleGroup}`)
        lines.push(buildFlowPrompt(ex, batch.athlete))
      }
      lines.push('')
    }

    const filename = `prompts-${batch.athlete.id}.txt`
    fs.writeFileSync(path.join(outputDir, filename), lines.join('\n'), 'utf-8')
    console.log(`✅ ${filename} generado (${batch.exercises.length} prompts)`)
  }

  const csvLines = [
    ['exerciseId', 'exerciseName', 'type', 'equipment', 'muscleGroup', 'athlete', 'prompt', 'imageFile'].map(csvEscape).join(','),
  ]

  for (const batch of batches) {
    for (const ex of batch.exercises) {
      csvLines.push([
        ex.id,
        ex.name,
        ex.type,
        ex.equipment,
        ex.muscleGroup,
        batch.athlete.name,
        buildFlowPrompt(ex, batch.athlete),
        `${ex.id}.png`,
      ].map(csvEscape).join(','))
    }
  }

  const csvPath = path.join(outputDir, 'all-prompts.csv')
  fs.writeFileSync(csvPath, '\ufeff' + csvLines.join('\n'), 'utf-8')

  console.log(`✅ all-prompts.csv generado (${csvLines.length - 1} prompts)`)
  console.log(`📁 Archivos guardados en: ${outputDir}`)
  console.log('')
  console.log('💡 Flujo recomendado:')
  console.log('   1. Abrí Flow (Google).')
  console.log('   2. Cargá el personaje base correspondiente.')
  console.log('   3. Abrí all-prompts.csv con Excel.')
  console.log('   4. Usá las columnas Type, Equipment y Muscle group para filtrar/ordenar.')
  console.log('   5. Copiá el contenido de la columna prompt a Flow.')
  console.log('   6. Guardá cada imagen como /public/exercises/{exerciseId}.png.')
  console.log('   7. Para generar solamente las que faltan, ejecutá con --missing.')
}

const onlyMissing = process.argv.includes('--missing')
const batchArg = process.argv.find((arg) => arg.startsWith('--batch='))
const batchSize = batchArg ? Number(batchArg.split('=')[1]) : 25

if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) {
  throw new Error('El batch debe ser un entero entre 1 y 100. Ejemplo: --batch=25')
}

generateFlowBatches(batchSize, onlyMissing)
  .catch((error) => {
    console.error('❌ Error generando prompts:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
