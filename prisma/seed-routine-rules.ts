import { PrismaClient, RoutineGoal, ExerciseType } from "@prisma/client";
const prisma = new PrismaClient();

// [goal, exerciseType, sets, repsMin, repsMax, durationSec, restSeconds]
const rules: [RoutineGoal, ExerciseType, number, number | null, number | null, number | null, number][] = [
  // HIPERTROFIA
  ["HYPERTROPHY", "STRENGTH", 4, 8, 12, null, 90],
  ["HYPERTROPHY", "FUNCTIONAL", 3, 10, 15, null, 60],
  ["HYPERTROPHY", "CARDIO", 3, null, null, 45, 30],

  // FUERZA
  ["STRENGTH", "STRENGTH", 5, 3, 6, null, 150],
  ["STRENGTH", "FUNCTIONAL", 3, 5, 8, null, 120],

  // RESISTENCIA
  ["ENDURANCE", "STRENGTH", 3, 15, 20, null, 45],
  ["ENDURANCE", "FUNCTIONAL", 3, 15, 20, null, 30],
  ["ENDURANCE", "CARDIO", 4, null, null, 60, 20],
  ["ENDURANCE", "PLYOMETRIC", 3, null, null, 30, 30],

  // PÉRDIDA DE GRASA
  ["WEIGHT_LOSS", "STRENGTH", 3, 12, 15, null, 45],
  ["WEIGHT_LOSS", "FUNCTIONAL", 3, 12, 15, null, 30],
  ["WEIGHT_LOSS", "CARDIO", 4, null, null, 45, 20],

  // MANTENIMIENTO
  ["MAINTENANCE", "STRENGTH", 3, 10, 12, null, 75],
  ["MAINTENANCE", "FUNCTIONAL", 3, 10, 12, null, 60],

  // REHABILITACIÓN
  ["REHABILITATION", "REHABILITATION", 3, 10, 15, null, 45],
  ["REHABILITATION", "MOBILITY", 2, null, null, 30, 20],

  // Genéricas por tipo — aplican igual sin importar el objetivo específico
  ...(["HYPERTROPHY", "STRENGTH", "ENDURANCE", "WEIGHT_LOSS", "MAINTENANCE", "REHABILITATION"] as RoutineGoal[]).flatMap(
    (goal): [RoutineGoal, ExerciseType, number, number | null, number | null, number | null, number][] => [
      [goal, "WARMUP", 1, null, null, 300, 0],
      [goal, "COOLDOWN", 1, null, null, 300, 0],
      [goal, "STRETCHING", 2, null, null, 30, 15],
      [goal, "MOBILITY", 2, null, null, 30, 15],
      [goal, "BALANCE", 2, 10, 15, null, 30],
      [goal, "TECHNIQUE", 3, 5, 8, null, 60],
      [goal, "OTHER", 2, 10, 15, null, 30],
    ]
  ),
];

async function main() {
  let created = 0, updated = 0;
  for (const [goal, exerciseType, sets, repsMin, repsMax, durationSec, restSeconds] of rules) {
    const existing = await prisma.routineRule.findUnique({ where: { goal_exerciseType: { goal, exerciseType } } });
    if (existing) {
      await prisma.routineRule.update({
        where: { id: existing.id },
        data: { sets, repsMin, repsMax, durationSec, restSeconds },
      });
      updated++;
    } else {
      await prisma.routineRule.create({ data: { goal, exerciseType, sets, repsMin, repsMax, durationSec, restSeconds } });
      created++;
    }
  }
  console.log(`✅ Reglas: ${created} creadas, ${updated} actualizadas`);
}

main().catch(console.error).finally(() => prisma.$disconnect());