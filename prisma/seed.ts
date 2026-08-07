import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const exercises = [
  // ============================================
  // STRENGTH - Fuerza
  // ============================================
  // Pecho
  { name: "Press de banca plano", type: "STRENGTH", muscleGroup: "Pecho", equipment: "Barra", tags: ["press", "pecho", "compound"] },
  { name: "Press de banca inclinado", type: "STRENGTH", muscleGroup: "Pecho", equipment: "Barra", tags: ["press", "pecho", "inclinado"] },
  { name: "Press de banca declinado", type: "STRENGTH", muscleGroup: "Pecho", equipment: "Barra", tags: ["press", "pecho", "declinado"] },
  { name: "Aperturas con mancuernas", type: "STRENGTH", muscleGroup: "Pecho", equipment: "Mancuernas", tags: ["aperturas", "pecho", "aislado"] },
  { name: "Cruces en polea", type: "STRENGTH", muscleGroup: "Pecho", equipment: "Polea", tags: ["cruces", "pecho", "aislado"] },
  { name: "Fondos en paralelas", type: "STRENGTH", muscleGroup: "Pecho", equipment: "Paralelas", tags: ["fondos", "pecho", "compound"] },
  { name: "Pull-over", type: "STRENGTH", muscleGroup: "Pecho", equipment: "Mancuerna", tags: ["pullover", "pecho", "aislado"] },

  // Espalda
  { name: "Dominadas", type: "STRENGTH", muscleGroup: "Espalda", equipment: "Barra", tags: ["dominadas", "espalda", "compound"] },
  { name: "Jalón al pecho", type: "STRENGTH", muscleGroup: "Espalda", equipment: "Polea", tags: ["jalon", "espalda", "compound"] },
  { name: "Remo con barra", type: "STRENGTH", muscleGroup: "Espalda", equipment: "Barra", tags: ["remo", "espalda", "compound"] },
  { name: "Remo con mancuerna", type: "STRENGTH", muscleGroup: "Espalda", equipment: "Mancuerna", tags: ["remo", "espalda", "unilateral"] },
  { name: "Remo en máquina", type: "STRENGTH", muscleGroup: "Espalda", equipment: "Máquina", tags: ["remo", "espalda", "maquina"] },
  { name: "Peso muerto", type: "STRENGTH", muscleGroup: "Espalda", equipment: "Barra", tags: ["peso muerto", "espalda", "compound"] },
  { name: "Hiperextensiones", type: "STRENGTH", muscleGroup: "Espalda", equipment: "Banco", tags: ["hiperextensiones", "espalda baja", "aislado"] },

  // Hombros
  { name: "Press militar", type: "STRENGTH", muscleGroup: "Hombros", equipment: "Barra", tags: ["press", "hombros", "compound"] },
  { name: "Press con mancuernas", type: "STRENGTH", muscleGroup: "Hombros", equipment: "Mancuernas", tags: ["press", "hombros", "compound"] },
  { name: "Elevaciones laterales", type: "STRENGTH", muscleGroup: "Hombros", equipment: "Mancuernas", tags: ["elevaciones", "hombros", "aislado"] },
  { name: "Elevaciones frontales", type: "STRENGTH", muscleGroup: "Hombros", equipment: "Mancuernas", tags: ["elevaciones", "hombros", "aislado"] },
  { name: "Pájaro", type: "STRENGTH", muscleGroup: "Hombros", equipment: "Mancuernas", tags: ["pajaro", "hombros", "posterior"] },
  { name: "Face pull", type: "STRENGTH", muscleGroup: "Hombros", equipment: "Polea", tags: ["face pull", "hombros", "posterior"] },

  // Bíceps
  { name: "Curl con barra", type: "STRENGTH", muscleGroup: "Bíceps", equipment: "Barra", tags: ["curl", "biceps", "aislado"] },
  { name: "Curl con mancuernas", type: "STRENGTH", muscleGroup: "Bíceps", equipment: "Mancuernas", tags: ["curl", "biceps", "aislado"] },
  { name: "Curl martillo", type: "STRENGTH", muscleGroup: "Bíceps", equipment: "Mancuernas", tags: ["curl", "biceps", "martillo"] },
  { name: "Curl en predicador", type: "STRENGTH", muscleGroup: "Bíceps", equipment: "Barra", tags: ["curl", "biceps", "predicador"] },
  { name: "Curl concentrado", type: "STRENGTH", muscleGroup: "Bíceps", equipment: "Mancuerna", tags: ["curl", "biceps", "concentrado"] },

  // Tríceps
  { name: "Press francés", type: "STRENGTH", muscleGroup: "Tríceps", equipment: "Barra", tags: ["press frances", "triceps", "aislado"] },
  { name: "Extensiones en polea", type: "STRENGTH", muscleGroup: "Tríceps", equipment: "Polea", tags: ["extensiones", "triceps", "aislado"] },
  { name: "Fondos", type: "STRENGTH", muscleGroup: "Tríceps", equipment: "Paralelas", tags: ["fondos", "triceps", "compound"] },
  { name: "Patada de tríceps", type: "STRENGTH", muscleGroup: "Tríceps", equipment: "Mancuerna", tags: ["patada", "triceps", "aislado"] },

  // Piernas
  { name: "Sentadilla", type: "STRENGTH", muscleGroup: "Cuádriceps", equipment: "Barra", tags: ["sentadilla", "piernas", "compound"] },
  { name: "Sentadilla frontal", type: "STRENGTH", muscleGroup: "Cuádriceps", equipment: "Barra", tags: ["sentadilla", "piernas", "frontal"] },
  { name: "Prensa", type: "STRENGTH", muscleGroup: "Cuádriceps", equipment: "Máquina", tags: ["prensa", "piernas", "compound"] },
  { name: "Extensión de cuádriceps", type: "STRENGTH", muscleGroup: "Cuádriceps", equipment: "Máquina", tags: ["extensiones", "cuadriceps", "aislado"] },
  { name: "Curl femoral", type: "STRENGTH", muscleGroup: "Femoral", equipment: "Máquina", tags: ["curl", "femoral", "aislado"] },
  { name: "Peso muerto rumano", type: "STRENGTH", muscleGroup: "Femoral", equipment: "Barra", tags: ["peso muerto", "femoral", "rumano"] },
  { name: "Hip thrust", type: "STRENGTH", muscleGroup: "Glúteos", equipment: "Barra", tags: ["hip thrust", "gluteos", "compound"] },
  { name: "Elevación de talones", type: "STRENGTH", muscleGroup: "Pantorrilla", equipment: "Máquina", tags: ["elevacion", "pantorrilla", "aislado"] },

  // Core
  { name: "Plancha", type: "STRENGTH", muscleGroup: "Core", equipment: "Peso corporal", tags: ["plancha", "core", "isometrico"] },
  { name: "Crunch", type: "STRENGTH", muscleGroup: "Core", equipment: "Peso corporal", tags: ["crunch", "abdominales", "aislado"] },
  { name: "Elevación de piernas", type: "STRENGTH", muscleGroup: "Core", equipment: "Banco", tags: ["elevacion", "abdominales", "aislado"] },
  { name: "Russian twist", type: "STRENGTH", muscleGroup: "Core", equipment: "Peso corporal", tags: ["russian twist", "oblicuos", "aislado"] },

  // ============================================
  // CARDIO
  // ============================================
  { name: "Caminata en cinta", type: "CARDIO", muscleGroup: "Full body", equipment: "Cinta", tags: ["cardio", "cinta", "bajo impacto"] },
  { name: "Carrera en cinta", type: "CARDIO", muscleGroup: "Full body", equipment: "Cinta", tags: ["cardio", "cinta", "running"] },
  { name: "Elíptica", type: "CARDIO", muscleGroup: "Full body", equipment: "Elíptica", tags: ["cardio", "eliptica", "bajo impacto"] },
  { name: "Bicicleta estática", type: "CARDIO", muscleGroup: "Piernas", equipment: "Bicicleta", tags: ["cardio", "bicicleta", "bajo impacto"] },
  { name: "Remo", type: "CARDIO", muscleGroup: "Full body", equipment: "Remo", tags: ["cardio", "remo", "full body"] },
  { name: "Saltar la soga", type: "CARDIO", muscleGroup: "Full body", equipment: "Soga", tags: ["cardio", "soga", "plyometrico"] },
  { name: "Burpees", type: "CARDIO", muscleGroup: "Full body", equipment: "Peso corporal", tags: ["cardio", "burpees", "hiit"] },
  { name: "Escaladores", type: "CARDIO", muscleGroup: "Full body", equipment: "Peso corporal", tags: ["cardio", "escaladores", "hiit"] },
  { name: "Sprint", type: "CARDIO", muscleGroup: "Piernas", equipment: "Pista", tags: ["cardio", "sprint", "running"] },
  { name: "Zancadas dinámicas", type: "CARDIO", muscleGroup: "Piernas", equipment: "Peso corporal", tags: ["cardio", "zancadas", "dinamico"] },

  // ============================================
  // FUNCTIONAL - Funcional
  // ============================================
  { name: "Kettlebell swing", type: "FUNCTIONAL", muscleGroup: "Full body", equipment: "Kettlebell", tags: ["kettlebell", "swing", "posterior"] },
  { name: "Turkish get-up", type: "FUNCTIONAL", muscleGroup: "Full body", equipment: "Kettlebell", tags: ["kettlebell", "get up", "movilidad"] },
  { name: "Lunges con rotación", type: "FUNCTIONAL", muscleGroup: "Core", equipment: "Mancuerna", tags: ["lunge", "rotacion", "funcional"] },
  { name: "Desplantes laterales", type: "FUNCTIONAL", muscleGroup: "Piernas", equipment: "Peso corporal", tags: ["desplante", "lateral", "funcional"] },
  { name: "Thrusters", type: "FUNCTIONAL", muscleGroup: "Full body", equipment: "Barra", tags: ["thrusters", "full body", "crossfit"] },
  { name: "Clean and press", type: "FUNCTIONAL", muscleGroup: "Full body", equipment: "Barra", tags: ["clean", "press", "olimpico"] },
  { name: "Snatch", type: "FUNCTIONAL", muscleGroup: "Full body", equipment: "Barra", tags: ["snatch", "olimpico", "potencia"] },
  { name: "Wall ball", type: "FUNCTIONAL", muscleGroup: "Full body", equipment: "Balón", tags: ["wall ball", "crossfit", "full body"] },
  { name: "Box jump", type: "FUNCTIONAL", muscleGroup: "Piernas", equipment: "Cajón", tags: ["box jump", "plyometrico", "piernas"] },
  { name: "Farmer walk", type: "FUNCTIONAL", muscleGroup: "Full body", equipment: "Mancuernas", tags: ["farmer walk", "agarre", "core"] },
  { name: "Sled push", type: "FUNCTIONAL", muscleGroup: "Piernas", equipment: "Trineo", tags: ["sled", "empuje", "piernas"] },
  { name: "Battle ropes", type: "FUNCTIONAL", muscleGroup: "Core", equipment: "Cuerdas", tags: ["battle ropes", "core", "cardio"] },

  // ============================================
  // MOBILITY - Movilidad
  // ============================================
  { name: "Puentes", type: "MOBILITY", muscleGroup: "Core", equipment: "Peso corporal", tags: ["puente", "movilidad", "core"] },
  { name: "Gato-vaca", type: "MOBILITY", muscleGroup: "Espalda", equipment: "Peso corporal", tags: ["gato vaca", "movilidad", "espalda"] },
  { name: "Rotación de cadera", type: "MOBILITY", muscleGroup: "Cadera", equipment: "Peso corporal", tags: ["rotacion", "cadera", "movilidad"] },
  { name: "Foam rolling", type: "MOBILITY", muscleGroup: "Full body", equipment: "Foam roller", tags: ["foam roller", "movilidad", "recuperacion"] },
  { name: "Dislocaciones con palo", type: "MOBILITY", muscleGroup: "Hombros", equipment: "Palo", tags: ["dislocaciones", "hombros", "movilidad"] },
  { name: "Movilidad de tobillos", type: "MOBILITY", muscleGroup: "Tobillos", equipment: "Peso corporal", tags: ["tobillos", "movilidad", "calentamiento"] },
  { name: "Thoracic rotation", type: "MOBILITY", muscleGroup: "Espalda", equipment: "Peso corporal", tags: ["toracica", "rotacion", "movilidad"] },
  { name: "90/90 stretch", type: "MOBILITY", muscleGroup: "Cadera", equipment: "Peso corporal", tags: ["90 90", "cadera", "movilidad"] },

  // ============================================
  // STRETCHING - Estiramiento
  // ============================================
  { name: "Estiramiento de isquiotibiales", type: "STRETCHING", muscleGroup: "Femoral", equipment: "Peso corporal", tags: ["estiramiento", "isquiotibiales", "flexibilidad"] },
  { name: "Estiramiento de pectorales", type: "STRETCHING", muscleGroup: "Pecho", equipment: "Peso corporal", tags: ["estiramiento", "pectorales", "flexibilidad"] },
  { name: "Estiramiento de cuádriceps", type: "STRETCHING", muscleGroup: "Cuádriceps", equipment: "Peso corporal", tags: ["estiramiento", "cuadriceps", "flexibilidad"] },
  { name: "Estiramiento de hombros", type: "STRETCHING", muscleGroup: "Hombros", equipment: "Peso corporal", tags: ["estiramiento", "hombros", "flexibilidad"] },
  { name: "Estiramiento de pantorrilla", type: "STRETCHING", muscleGroup: "Pantorrilla", equipment: "Peso corporal", tags: ["estiramiento", "pantorrilla", "flexibilidad"] },
  { name: "Estiramiento de cadera", type: "STRETCHING", muscleGroup: "Cadera", equipment: "Peso corporal", tags: ["estiramiento", "cadera", "flexibilidad"] },
  { name: "Estiramiento de espalda", type: "STRETCHING", muscleGroup: "Espalda", equipment: "Peso corporal", tags: ["estiramiento", "espalda", "flexibilidad"] },
  { name: "Mariposa", type: "STRETCHING", muscleGroup: "Cadera", equipment: "Peso corporal", tags: ["mariposa", "aductores", "flexibilidad"] },
  { name: "Postura del niño", type: "STRETCHING", muscleGroup: "Espalda", equipment: "Peso corporal", tags: ["yoga", "espalda", "relajacion"] },
  { name: "Cobra", type: "STRETCHING", muscleGroup: "Espalda", equipment: "Peso corporal", tags: ["yoga", "cobra", "espalda"] },

  // ============================================
  // PLYOMETRIC - Pliometría
  // ============================================
  { name: "Salto al cajón", type: "PLYOMETRIC", muscleGroup: "Piernas", equipment: "Cajón", tags: ["box jump", "plyometrico", "potencia"] },
  { name: "Salto con peso corporal", type: "PLYOMETRIC", muscleGroup: "Piernas", equipment: "Peso corporal", tags: ["salto", "plyometrico", "piernas"] },
  { name: "Lunges saltados", type: "PLYOMETRIC", muscleGroup: "Piernas", equipment: "Peso corporal", tags: ["lunge", "saltado", "plyometrico"] },
  { name: "Clapping push-ups", type: "PLYOMETRIC", muscleGroup: "Pecho", equipment: "Peso corporal", tags: ["push up", "aplauso", "plyometrico"] },
  { name: "Broad jump", type: "PLYOMETRIC", muscleGroup: "Piernas", equipment: "Peso corporal", tags: ["salto", "longitud", "plyometrico"] },
  { name: "Tuck jump", type: "PLYOMETRIC", muscleGroup: "Piernas", equipment: "Peso corporal", tags: ["tuck jump", "plyometrico", "piernas"] },
  { name: "Depth jump", type: "PLYOMETRIC", muscleGroup: "Piernas", equipment: "Cajón", tags: ["depth jump", "plyometrico", "potencia"] },
  { name: "Skater jumps", type: "PLYOMETRIC", muscleGroup: "Piernas", equipment: "Peso corporal", tags: ["skater", "lateral", "plyometrico"] },

  // ============================================
  // BALANCE - Equilibrio
  // ============================================
  { name: "Sentadilla en bosu", type: "BALANCE", muscleGroup: "Piernas", equipment: "Bosu", tags: ["sentadilla", "bosu", "equilibrio"] },
  { name: "Plancha en bosu", type: "BALANCE", muscleGroup: "Core", equipment: "Bosu", tags: ["plancha", "bosu", "equilibrio"] },
  { name: "Pájaro en bosu", type: "BALANCE", muscleGroup: "Hombros", equipment: "Bosu", tags: ["pajaro", "bosu", "equilibrio"] },
  { name: "Single leg deadlift", type: "BALANCE", muscleGroup: "Femoral", equipment: "Mancuerna", tags: ["single leg", "deadlift", "equilibrio"] },
  { name: "Equilibrio en una pierna", type: "BALANCE", muscleGroup: "Piernas", equipment: "Peso corporal", tags: ["equilibrio", "una pierna", "propiocepcion"] },
  { name: "Plancha con fitball", type: "BALANCE", muscleGroup: "Core", equipment: "Fitball", tags: ["plancha", "fitball", "equilibrio"] },
  { name: "Puente en fitball", type: "BALANCE", muscleGroup: "Glúteos", equipment: "Fitball", tags: ["puente", "fitball", "equilibrio"] },

  // ============================================
  // TECHNIQUE - Técnica
  // ============================================
  { name: "Sentadilla con palo", type: "TECHNIQUE", muscleGroup: "Piernas", equipment: "Palo", tags: ["sentadilla", "tecnica", "movilidad"] },
  { name: "Press con palo", type: "TECHNIQUE", muscleGroup: "Hombros", equipment: "Palo", tags: ["press", "tecnica", "hombros"] },
  { name: "Peso muerto con palo", type: "TECHNIQUE", muscleGroup: "Espalda", equipment: "Palo", tags: ["peso muerto", "tecnica", "movilidad"] },
  { name: "Front squat con palo", type: "TECHNIQUE", muscleGroup: "Piernas", equipment: "Palo", tags: ["front squat", "tecnica", "rack"] },
  { name: "Overhead squat con palo", type: "TECHNIQUE", muscleGroup: "Full body", equipment: "Palo", tags: ["overhead squat", "tecnica", "movilidad"] },
  { name: "Snatch balance con palo", type: "TECHNIQUE", muscleGroup: "Full body", equipment: "Palo", tags: ["snatch balance", "tecnica", "olimpico"] },
  { name: "Clean pull", type: "TECHNIQUE", muscleGroup: "Full body", equipment: "Barra", tags: ["clean pull", "tecnica", "olimpico"] },
  { name: "Snatch pull", type: "TECHNIQUE", muscleGroup: "Full body", equipment: "Barra", tags: ["snatch pull", "tecnica", "olimpico"] },

  // ============================================
  // WARMUP - Calentamiento
  // ============================================
  { name: "Jumping jacks", type: "WARMUP", muscleGroup: "Full body", equipment: "Peso corporal", tags: ["jumping jacks", "calentamiento", "cardio"] },
  { name: "Skipping", type: "WARMUP", muscleGroup: "Piernas", equipment: "Peso corporal", tags: ["skipping", "calentamiento", "pies"] },
  { name: "Arm circles", type: "WARMUP", muscleGroup: "Hombros", equipment: "Peso corporal", tags: ["arm circles", "calentamiento", "hombros"] },
  { name: "Leg swings", type: "WARMUP", muscleGroup: "Piernas", equipment: "Peso corporal", tags: ["leg swings", "calentamiento", "cadera"] },
  { name: "Trotar en el lugar", type: "WARMUP", muscleGroup: "Piernas", equipment: "Peso corporal", tags: ["trotar", "calentamiento", "cardio"] },
  { name: "Rotaciones de cuello", type: "WARMUP", muscleGroup: "Cuello", equipment: "Peso corporal", tags: ["cuello", "calentamiento", "movilidad"] },
  { name: "Rotaciones de muñecas", type: "WARMUP", muscleGroup: "Antebrazos", equipment: "Peso corporal", tags: ["munecas", "calentamiento", "movilidad"] },
  { name: "Caminata de oso", type: "WARMUP", muscleGroup: "Full body", equipment: "Peso corporal", tags: ["oso", "caminata", "calentamiento"] },
  { name: "Inchworm", type: "WARMUP", muscleGroup: "Full body", equipment: "Peso corporal", tags: ["inchworm", "calentamiento", "flexibilidad"] },
  { name: "High knees", type: "WARMUP", muscleGroup: "Piernas", equipment: "Peso corporal", tags: ["high knees", "calentamiento", "cardio"] },

  // ============================================
  // COOLDOWN - Vuelta a la calma
  // ============================================
  { name: "Caminata lenta", type: "COOLDOWN", muscleGroup: "Full body", equipment: "Peso corporal", tags: ["caminata", "vuelta a la calma", "cardio"] },
  { name: "Respiración diafragmática", type: "COOLDOWN", muscleGroup: "Core", equipment: "Peso corporal", tags: ["respiracion", "relajacion", "vuelta a la calma"] },
  { name: "Estiramiento de espalda", type: "COOLDOWN", muscleGroup: "Espalda", equipment: "Peso corporal", tags: ["estiramiento", "espalda", "vuelta a la calma"] },
  { name: "Estiramiento de hombros", type: "COOLDOWN", muscleGroup: "Hombros", equipment: "Peso corporal", tags: ["estiramiento", "hombros", "vuelta a la calma"] },
  { name: "Estiramiento de piernas", type: "COOLDOWN", muscleGroup: "Piernas", equipment: "Peso corporal", tags: ["estiramiento", "piernas", "vuelta a la calma"] },
  { name: "Foam roller de espalda", type: "COOLDOWN", muscleGroup: "Espalda", equipment: "Foam roller", tags: ["foam roller", "espalda", "recuperacion"] },
  { name: "Shavasana", type: "COOLDOWN", muscleGroup: "Full body", equipment: "Peso corporal", tags: ["shavasana", "relajacion", "vuelta a la calma"] },
  { name: "Meditación", type: "COOLDOWN", muscleGroup: "Mental", equipment: "Peso corporal", tags: ["meditacion", "relajacion", "vuelta a la calma"] },

  // ============================================
  // OTHER - Otro
  // ============================================
  { name: "Vacío abdominal", type: "OTHER", muscleGroup: "Core", equipment: "Peso corporal", tags: ["vacio abdominal", "core", "transverso"] },
  { name: "Kegel", type: "OTHER", muscleGroup: "Piso pélvico", equipment: "Peso corporal", tags: ["kegel", "piso pelvico", "rehabilitacion"] },
  { name: "Respiración costal", type: "OTHER", muscleGroup: "Core", equipment: "Peso corporal", tags: ["respiracion", "costal", "core"] },
  { name: "Activación glútea", type: "OTHER", muscleGroup: "Glúteos", equipment: "Banda", tags: ["activacion", "gluteos", "prehab"] },
  { name: "Activación de escápulas", type: "OTHER", muscleGroup: "Espalda", equipment: "Peso corporal", tags: ["activacion", "escapulas", "postura"] },
  { name: "Masaje con pelota", type: "OTHER", muscleGroup: "Full body", equipment: "Pelota", tags: ["masaje", "automasaje", "recuperacion"] },
]

async function main() {
  console.log(`🌱 Iniciando seed de ejercicios...`)
  console.log(`📊 Total de ejercicios a cargar: ${exercises.length}`)

  let created = 0
  let skipped = 0

  for (const exercise of exercises) {
    const existing = await prisma.exercise.findFirst({
      where: { name: exercise.name }
    })

    if (!existing) {
        await prisma.exercise.create({
            data: {
              name: exercise.name,
              type: exercise.type as any, // ← FIX
              muscleGroup: exercise.muscleGroup,
              equipment: exercise.equipment,
              tags: exercise.tags,
              isPublic: true,
            }
          })
      created++
      console.log(`✅ Creado: ${exercise.name} (${exercise.type})`)
    } else {
      skipped++
      console.log(`⏭️  Ya existe: ${exercise.name}`)
    }
  }

  console.log(`\n🎉 Seed completado!`)
  console.log(`   Creados: ${created}`)
  console.log(`   Omitidos (ya existían): ${skipped}`)
  console.log(`   Total en base: ${created + skipped}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })