import { RoutineGoal, ExerciseType, Exercise, RoutineRule } from "@prisma/client";

export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

const ADVANCED_TAGS = ["avanzado", "olimpico", "halterofilia"];

function isCompound(ex: Exercise): boolean {
  return ex.tags.includes("compound");
}

export interface SplitDay {
  name: string;
  muscleGroups: string[];
}

export interface GeneratorInput {
  goal: RoutineGoal;
  frequencyPerWeek: number;
  totalWeeks: number;
  sameEachWeek: boolean;
  splitDays: SplitDay[];
  availableEquipment: string[] | null;
  exercises: Exercise[];
  rules: RoutineRule[];
  experienceLevel?: ExperienceLevel;       // default: INTERMEDIATE
  avoidMuscleGroups?: string[];            // default: []
  prioritizeCompound?: boolean;            // default: true
}

export interface GeneratedExercise {
  exerciseId: string;
  name: string;
  type: ExerciseType;
  muscleGroup: string | null;
  sets: number;
  reps: string;
  rest: string;
  order: number;
}

export interface GeneratedDay {
  sessionNumber: number;
  weekNumber: number;
  dayOfWeek: number;
  dayName: string;
  order: number;
  exercises: GeneratedExercise[];
}

export interface GeneratedRoutinePreview {
  days: GeneratedDay[];
}

interface GoalConfig {
  mainCount: number;
  mainTypes: ExerciseType[];
  warmup: boolean;
  cooldown: boolean;
  extra: { type: ExerciseType; count: number }[];
}

const GOAL_CONFIG: Record<RoutineGoal, GoalConfig> = {
  HYPERTROPHY:     { mainCount: 6, mainTypes: ["STRENGTH"],               warmup: true,  cooldown: true,  extra: [] },
  STRENGTH:        { mainCount: 5, mainTypes: ["STRENGTH"],               warmup: true,  cooldown: false, extra: [] },
  ENDURANCE:       { mainCount: 4, mainTypes: ["STRENGTH", "FUNCTIONAL"], warmup: true,  cooldown: true,  extra: [{ type: "CARDIO", count: 2 }] },
  WEIGHT_LOSS:     { mainCount: 4, mainTypes: ["STRENGTH", "FUNCTIONAL"], warmup: true,  cooldown: true,  extra: [{ type: "CARDIO", count: 2 }] },
  MAINTENANCE:     { mainCount: 5, mainTypes: ["STRENGTH"],               warmup: true,  cooldown: true,  extra: [] },
  REHABILITATION:  { mainCount: 5, mainTypes: ["REHABILITATION", "MOBILITY"], warmup: false, cooldown: false, extra: [] },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatReps(rule: RoutineRule | undefined): string {
  if (!rule) return "10-12";
  if (rule.durationSec != null) return `${rule.durationSec}s`;
  if (rule.repsMin != null && rule.repsMax != null) return `${rule.repsMin}-${rule.repsMax}`;
  return "10-12";
}

function formatRest(rule: RoutineRule | undefined): string {
  if (!rule) return "60s";
  return rule.restSeconds > 0 ? `${rule.restSeconds}s` : "-";
}

function ruleFor(rules: RoutineRule[], goal: RoutineGoal, type: ExerciseType) {
  return rules.find((r) => r.goal === goal && r.exerciseType === type);
}

function filterPool(
  exercises: Exercise[],
  muscleGroups: string[],
  types: ExerciseType[],
  equipment: string[] | null,
  avoidMuscleGroups: string[],
  experienceLevel: ExperienceLevel
): Exercise[] {
  return exercises.filter((ex) => {
    if (!ex.isPublic) return false;
    if (!types.includes(ex.type)) return false;
    if (muscleGroups.length && !(ex.muscleGroup && muscleGroups.includes(ex.muscleGroup))) return false;
    if (equipment && ex.equipment && !equipment.includes(ex.equipment)) return false;
    if (avoidMuscleGroups.length && ex.muscleGroup && avoidMuscleGroups.includes(ex.muscleGroup)) return false;

    if (experienceLevel === "BEGINNER") {
      if (ex.type === "TECHNIQUE") return false;
      if (ex.tags.some((t) => ADVANCED_TAGS.includes(t))) return false;
    } else if (experienceLevel === "INTERMEDIATE") {
      if (ex.tags.some((t) => ADVANCED_TAGS.includes(t))) return false;
    }
    // ADVANCED: sin restricciones adicionales

    return true;
  });
}

// Ordena el pool priorizando ejercicios compuestos (si corresponde) antes de agrupar por músculo
function orderPool(pool: Exercise[], prioritizeCompound: boolean): Exercise[] {
  if (!prioritizeCompound) return shuffle(pool);
  const compound = shuffle(pool.filter(isCompound));
  const rest = shuffle(pool.filter((e) => !isCompound(e)));
  return [...compound, ...rest];
}

function pickExercises(
  exercises: Exercise[],
  muscleGroups: string[],
  types: ExerciseType[],
  equipment: string[] | null,
  avoidMuscleGroups: string[],
  experienceLevel: ExperienceLevel,
  prioritizeCompound: boolean,
  count: number,
  exclude: Set<string>
): Exercise[] {
  const filtered = filterPool(exercises, muscleGroups, types, equipment, avoidMuscleGroups, experienceLevel);
  const pool = orderPool(filtered, prioritizeCompound);

  const byMuscle = new Map<string, Exercise[]>();
  for (const ex of pool) {
    const key = ex.muscleGroup || "otro";
    if (!byMuscle.has(key)) byMuscle.set(key, []);
    byMuscle.get(key)!.push(ex);
  }

  const picked: Exercise[] = [];
  const groups = muscleGroups.length ? muscleGroups : Array.from(byMuscle.keys());
  let round = 0;
  while (picked.length < count && round < 10) {
    for (const g of groups) {
      if (picked.length >= count) break;
      // candidates ya vienen en orden de prioridad (compuestos primero) gracias a orderPool
      const candidates = (byMuscle.get(g) || []).filter((e) => !exclude.has(e.id) && !picked.some((p) => p.id === e.id));
      if (candidates.length) picked.push(candidates[0]);
    }
    round++;
    if (round === 1 && picked.length === 0) break;
  }
  return picked.slice(0, count);
}

function buildDayExercises(
  goal: RoutineGoal,
  splitDay: SplitDay,
  exercises: Exercise[],
  rules: RoutineRule[],
  equipment: string[] | null,
  avoidMuscleGroups: string[],
  experienceLevel: ExperienceLevel,
  prioritizeCompound: boolean,
  exclude: Set<string>
): GeneratedExercise[] {
  const config = GOAL_CONFIG[goal];
  const result: GeneratedExercise[] = [];
  let order = 1;

  const pushExercise = (ex: Exercise) => {
    const rule = ruleFor(rules, goal, ex.type);
    result.push({
      exerciseId: ex.id,
      name: ex.name,
      type: ex.type,
      muscleGroup: ex.muscleGroup,
      sets: rule?.sets ?? 3,
      reps: formatReps(rule),
      rest: formatRest(rule),
      order: order++,
    });
  };

  if (config.warmup) {
    const wu = pickExercises(exercises, [], ["WARMUP"], equipment, [], experienceLevel, false, 1, new Set());
    wu.forEach(pushExercise);
  }

  const main = pickExercises(
    exercises, splitDay.muscleGroups, config.mainTypes, equipment,
    avoidMuscleGroups, experienceLevel, prioritizeCompound, config.mainCount, exclude
  );
  main.forEach(pushExercise);

  for (const extra of config.extra) {
    const ex = pickExercises(
      exercises, splitDay.muscleGroups, [extra.type], equipment,
      avoidMuscleGroups, experienceLevel, prioritizeCompound, extra.count, exclude
    );
    ex.forEach(pushExercise);
  }

  if (config.cooldown) {
    const cd = pickExercises(exercises, [], ["STRETCHING", "COOLDOWN"], equipment, [], experienceLevel, false, 2, new Set());
    cd.forEach(pushExercise);
  }

  return result;
}

export function generateRoutinePreview(input: GeneratorInput): GeneratedRoutinePreview {
  const {
    goal, frequencyPerWeek, totalWeeks, sameEachWeek, splitDays, availableEquipment,
    exercises, rules,
    experienceLevel = "INTERMEDIATE",
    avoidMuscleGroups = [],
    prioritizeCompound = true,
  } = input;

  if (splitDays.length !== frequencyPerWeek) {
    throw new Error(`splitDays debe tener ${frequencyPerWeek} elementos (uno por día de la semana), recibió ${splitDays.length}`);
  }

  const days: GeneratedDay[] = [];
  let sessionNumber = 1;

  const fixedWeekExercises: GeneratedExercise[][] | null = sameEachWeek
    ? splitDays.map((sd) =>
        buildDayExercises(goal, sd, exercises, rules, availableEquipment, avoidMuscleGroups, experienceLevel, prioritizeCompound, new Set())
      )
    : null;

  let previousWeekIds: Set<string>[] = splitDays.map(() => new Set());

  for (let week = 1; week <= totalWeeks; week++) {
    for (let dayOfWeek = 1; dayOfWeek <= frequencyPerWeek; dayOfWeek++) {
      const splitDay = splitDays[dayOfWeek - 1];

      let dayExercises: GeneratedExercise[];
      if (fixedWeekExercises) {
        dayExercises = fixedWeekExercises[dayOfWeek - 1];
      } else {
        dayExercises = buildDayExercises(
          goal, splitDay, exercises, rules, availableEquipment,
          avoidMuscleGroups, experienceLevel, prioritizeCompound, previousWeekIds[dayOfWeek - 1]
        );
        previousWeekIds[dayOfWeek - 1] = new Set(dayExercises.map((e) => e.exerciseId));
      }

      days.push({
        sessionNumber: sessionNumber++,
        weekNumber: week,
        dayOfWeek,
        dayName: splitDay.name,
        order: dayOfWeek,
        exercises: dayExercises,
      });
    }
  }

  return { days };
}

export const SPLIT_PRESETS: Record<string, { label: string; days: SplitDay[] }> = {
  FULL_BODY: {
    label: "Full Body",
    days: [{ name: "Full Body", muscleGroups: ["Pecho", "Espalda", "Cuádriceps", "Hombros", "Core", "Glúteos"] }],
  },
  UPPER_LOWER: {
    label: "Upper / Lower",
    days: [
      { name: "Upper", muscleGroups: ["Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps"] },
      { name: "Lower", muscleGroups: ["Cuádriceps", "Femoral", "Isquiotibiales", "Glúteos", "Pantorrilla", "Core"] },
    ],
  },
  PPL: {
    label: "Push / Pull / Legs",
    days: [
      { name: "Push", muscleGroups: ["Pecho", "Hombros", "Tríceps"] },
      { name: "Pull", muscleGroups: ["Espalda", "Bíceps"] },
      { name: "Legs", muscleGroups: ["Cuádriceps", "Femoral", "Isquiotibiales", "Glúteos", "Pantorrilla"] },
    ],
  },
};

export function resolveSplitDays(presetKey: string, frequencyPerWeek: number): SplitDay[] {
  const preset = SPLIT_PRESETS[presetKey];
  if (!preset) throw new Error(`Preset desconocido: ${presetKey}`);
  const result: SplitDay[] = [];
  for (let i = 0; i < frequencyPerWeek; i++) {
    result.push(preset.days[i % preset.days.length]);
  }
  return result;
}