import { RoutineGoal, ExerciseType, Exercise, RoutineRule } from "@prisma/client";

export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type BlockType = "WARMUP" | "CORE" | "MAIN" | "COOLDOWN";
export type BlockMode = "SEQUENTIAL" | "STATIONS";

const ADVANCED_TAGS = ["avanzado", "olimpico", "halterofilia"];

function isCompound(ex: Exercise): boolean {
  return ex.tags.includes("compound");
}

export interface SessionBlockConfig {
  id: string;
  type: BlockType;
  label?: string;
  mode: BlockMode;
  muscleGroups?: string[];
  exerciseTypes: ExerciseType[];
  tagsRequired?: string[];
  tagsPreferred?: string[];
  count: number;
  pinnedExerciseIds?: string[];
  excludeExerciseIds?: string[];
}

export interface SplitDay {
  name: string;
  blocks: SessionBlockConfig[];
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
  blockId: string;
  blockType: BlockType;
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

export interface GeneratorInput {
  goal: RoutineGoal;
  frequencyPerWeek: number;
  totalWeeks: number;
  sameEachWeek: boolean;
  splitDays: SplitDay[];
  availableEquipment: string[] | null;
  exercises: Exercise[];
  rules: RoutineRule[];
  experienceLevel?: ExperienceLevel;
  avoidMuscleGroups?: string[];
  prioritizeCompound?: boolean;
}

function ruleFor(rules: RoutineRule[], goal: RoutineGoal, type: ExerciseType) {
  return rules.find((r) => r.goal === goal && r.exerciseType === type);
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

// Reparte un presupuesto total (ej: 300s de warmup) entre N ejercicios,
// evitando tramos ridículamente cortos (< minPerExerciseSec) si piden demasiada cantidad.
function splitBlockDuration(totalSec: number, count: number, minPerExerciseSec = 20, roundTo = 5): number[] {
  const requested = Math.max(1, count);
  const maxCountByMin = Math.max(1, Math.floor(totalSec / minPerExerciseSec));
  const effectiveCount = Math.min(requested, maxCountByMin);
  const perExercise = Math.max(roundTo, Math.round(totalSec / effectiveCount / roundTo) * roundTo);
  return Array(effectiveCount).fill(perExercise);
}

function filterPool(
  exercises: Exercise[],
  block: SessionBlockConfig,
  equipment: string[] | null,
  avoidMuscleGroups: string[],
  experienceLevel: ExperienceLevel
): Exercise[] {
  const muscleGroups = block.muscleGroups ?? [];
  const excludeIds = new Set(block.excludeExerciseIds ?? []);

  return exercises.filter((ex) => {
    if (!ex.isPublic) return false;
    if (excludeIds.has(ex.id)) return false;
    if (!block.exerciseTypes.includes(ex.type)) return false;
    if (muscleGroups.length && !(ex.muscleGroup && muscleGroups.includes(ex.muscleGroup))) return false;
    if (equipment && ex.equipment && !equipment.includes(ex.equipment)) return false;
    if (avoidMuscleGroups.length && ex.muscleGroup && avoidMuscleGroups.includes(ex.muscleGroup)) return false;
    if (block.tagsRequired?.length && !block.tagsRequired.every((t) => ex.tags.includes(t))) return false;

    if (experienceLevel === "BEGINNER") {
      if (ex.type === "TECHNIQUE") return false;
      if (ex.tags.some((t) => ADVANCED_TAGS.includes(t))) return false;
    } else if (experienceLevel === "INTERMEDIATE") {
      if (ex.tags.some((t) => ADVANCED_TAGS.includes(t))) return false;
    }
    return true;
  });
}

// Score determinístico (tags preferidos + compuestos) con una pizca de variación,
// para que el orden no sea puro azar pero tampoco siempre idéntico.
function scoreExercise(ex: Exercise, block: SessionBlockConfig, prioritizeCompound: boolean): number {
  let score = 0;
  if (block.tagsPreferred?.some((t) => ex.tags.includes(t))) score += 10;
  if (prioritizeCompound && block.mode === "SEQUENTIAL" && isCompound(ex)) score += 5;
  score += Math.random() * 2;
  return score;
}

function pickForBlock(
  exercises: Exercise[],
  block: SessionBlockConfig,
  equipment: string[] | null,
  avoidMuscleGroups: string[],
  experienceLevel: ExperienceLevel,
  prioritizeCompound: boolean,
  exclude: Set<string>
): Exercise[] {
  const pinned = (block.pinnedExerciseIds ?? [])
    .map((id) => exercises.find((e) => e.id === id))
    .filter((e): e is Exercise => !!e && !exclude.has(e.id));

  if (pinned.length >= block.count) return pinned.slice(0, block.count);

  const filtered = filterPool(exercises, block, equipment, avoidMuscleGroups, experienceLevel).filter(
    (e) => !exclude.has(e.id) && !pinned.some((p) => p.id === e.id)
  );

  const byMuscle = new Map<string, Exercise[]>();
  for (const ex of filtered) {
    const key = ex.muscleGroup || "otro";
    if (!byMuscle.has(key)) byMuscle.set(key, []);
    byMuscle.get(key)!.push(ex);
  }
  for (const list of byMuscle.values()) {
    list.sort((a, b) => scoreExercise(b, block, prioritizeCompound) - scoreExercise(a, block, prioritizeCompound));
  }

  const remaining = block.count - pinned.length;
  const groups = block.muscleGroups?.length ? block.muscleGroups : Array.from(byMuscle.keys());
  const picked: Exercise[] = [];
  let round = 0;
  while (picked.length < remaining && round < 10) {
    let addedThisRound = false;
    for (const g of groups) {
      if (picked.length >= remaining) break;
      const list = byMuscle.get(g);
      if (list && list.length) {
        picked.push(list.shift()!);
        addedThisRound = true;
      }
    }
    round++;
    if (!addedThisRound) break;
  }

  return [...pinned, ...picked];
}

function buildBlockExercises(
  block: SessionBlockConfig,
  goal: RoutineGoal,
  exercises: Exercise[],
  rules: RoutineRule[],
  equipment: string[] | null,
  avoidMuscleGroups: string[],
  experienceLevel: ExperienceLevel,
  prioritizeCompound: boolean,
  exclude: Set<string>,
  orderRef: { order: number }
): GeneratedExercise[] {
  const chosen = pickForBlock(exercises, block, equipment, avoidMuscleGroups, experienceLevel, prioritizeCompound, exclude);
  const result: GeneratedExercise[] = [];

  const byType = new Map<ExerciseType, Exercise[]>();
  for (const ex of chosen) {
    if (!byType.has(ex.type)) byType.set(ex.type, []);
    byType.get(ex.type)!.push(ex);
  }

  for (const [type, exList] of byType) {
    const rule = ruleFor(rules, goal, type);
    if (rule?.durationMode === "TOTAL_BLOCK" && rule.durationSec != null) {
      const durations = splitBlockDuration(rule.durationSec, exList.length);
      exList.forEach((ex, i) => {
        result.push({
          exerciseId: ex.id, name: ex.name, type: ex.type, muscleGroup: ex.muscleGroup,
          sets: 1, reps: `${durations[i]}s`, rest: block.mode === "STATIONS" ? "15s" : "-",
          order: orderRef.order++, blockId: block.id, blockType: block.type,
        });
      });
    } else {
      exList.forEach((ex) => {
        result.push({
          exerciseId: ex.id, name: ex.name, type: ex.type, muscleGroup: ex.muscleGroup,
          sets: rule?.sets ?? 3, reps: formatReps(rule), rest: formatRest(rule),
          order: orderRef.order++, blockId: block.id, blockType: block.type,
        });
      });
    }
  }

  return result;
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
  exclude: Set<string> // solo se aplica al bloque MAIN (rotación semanal)
): GeneratedExercise[] {
  const orderRef = { order: 1 };
  const result: GeneratedExercise[] = [];
  for (const block of splitDay.blocks) {
    const blockExclude = block.type === "MAIN" ? exclude : new Set<string>();
    result.push(
      ...buildBlockExercises(block, goal, exercises, rules, equipment, avoidMuscleGroups, experienceLevel, prioritizeCompound, blockExclude, orderRef)
    );
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
        previousWeekIds[dayOfWeek - 1] = new Set(
          dayExercises.filter((e) => e.blockType === "MAIN").map((e) => e.exerciseId)
        );
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

// --- Presets de bloques por objetivo ---

interface GoalBlockDefaults {
  mainCount: number;
  mainTypes: ExerciseType[];
  mainMode: BlockMode;
  warmupCount: number;
  coreCount: number;
  cooldownCount: number;
  extra: { type: ExerciseType; count: number; mode: BlockMode }[];
}

const GOAL_BLOCK_DEFAULTS: Record<RoutineGoal, GoalBlockDefaults> = {
  HYPERTROPHY:    { mainCount: 6, mainTypes: ["STRENGTH"],                     mainMode: "SEQUENTIAL", warmupCount: 3, coreCount: 1, cooldownCount: 1, extra: [] },
  STRENGTH:       { mainCount: 5, mainTypes: ["STRENGTH"],                     mainMode: "SEQUENTIAL", warmupCount: 3, coreCount: 1, cooldownCount: 0, extra: [] },
  ENDURANCE:      { mainCount: 4, mainTypes: ["STRENGTH", "FUNCTIONAL"],       mainMode: "SEQUENTIAL", warmupCount: 3, coreCount: 1, cooldownCount: 1, extra: [{ type: "CARDIO", count: 2, mode: "STATIONS" }] },
  WEIGHT_LOSS:    { mainCount: 4, mainTypes: ["STRENGTH", "FUNCTIONAL"],       mainMode: "STATIONS",   warmupCount: 3, coreCount: 1, cooldownCount: 1, extra: [{ type: "CARDIO", count: 2, mode: "STATIONS" }] },
  MAINTENANCE:    { mainCount: 5, mainTypes: ["STRENGTH"],                     mainMode: "SEQUENTIAL", warmupCount: 3, coreCount: 1, cooldownCount: 1, extra: [] },
  REHABILITATION: { mainCount: 5, mainTypes: ["REHABILITATION", "MOBILITY"],   mainMode: "SEQUENTIAL", warmupCount: 2, coreCount: 0, cooldownCount: 0, extra: [] },
};

export function buildDefaultBlocks(goal: RoutineGoal, muscleGroups: string[]): SessionBlockConfig[] {
  const d = GOAL_BLOCK_DEFAULTS[goal];
  const blocks: SessionBlockConfig[] = [];

  if (d.warmupCount > 0) {
    blocks.push({
      id: "warmup", type: "WARMUP", label: "Entrada en calor", mode: "SEQUENTIAL",
      muscleGroups, exerciseTypes: ["WARMUP"], count: d.warmupCount,
    });
  }
  if (d.coreCount > 0) {
    blocks.push({
      id: "core", type: "CORE", label: "Zona media", mode: "SEQUENTIAL",
      muscleGroups: ["Core", "Abdominales", "Zona media"], exerciseTypes: ["STRENGTH", "FUNCTIONAL"],
      count: d.coreCount, tagsPreferred: ["core"],
    });
  }
  blocks.push({
    id: "main", type: "MAIN", label: "Bloque principal", mode: d.mainMode,
    muscleGroups, exerciseTypes: d.mainTypes, count: d.mainCount,
  });
  d.extra.forEach((ex, i) => {
    blocks.push({
      id: `extra-${i}`, type: "MAIN", label: ex.type === "CARDIO" ? "Bloque cardio" : "Bloque extra",
      mode: ex.mode, muscleGroups, exerciseTypes: [ex.type], count: ex.count,
    });
  });
  if (d.cooldownCount > 0) {
    blocks.push({
      id: "cooldown", type: "COOLDOWN", label: "Vuelta a la calma (cardio suave)", mode: "SEQUENTIAL",
      muscleGroups: [], exerciseTypes: ["COOLDOWN"], count: d.cooldownCount,
    });
  }
  // Elongación: por default, 1 ejercicio por grupo muscular entrenado ese día (tope 4)
  const stretchCount = muscleGroups.length ? Math.min(muscleGroups.length, 4) : 2;
  blocks.push({
    id: "stretch", type: "COOLDOWN", label: "Elongación", mode: "SEQUENTIAL",
    muscleGroups, exerciseTypes: ["STRETCHING", "MOBILITY"], count: stretchCount,
  });

  return blocks;
}

export const SPLIT_PRESETS: Record<string, { label: string; days: { name: string; muscleGroups: string[] }[] }> = {
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

export function resolveSplitDays(presetKey: string, frequencyPerWeek: number, goal: RoutineGoal): SplitDay[] {
  const preset = SPLIT_PRESETS[presetKey];
  if (!preset) throw new Error(`Preset desconocido: ${presetKey}`);
  const result: SplitDay[] = [];
  for (let i = 0; i < frequencyPerWeek; i++) {
    const d = preset.days[i % preset.days.length];
    result.push({ name: d.name, blocks: buildDefaultBlocks(goal, d.muscleGroups) });
  }
  return result;
}