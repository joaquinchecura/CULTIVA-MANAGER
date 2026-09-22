import { RoutineGoal, ExerciseType, Exercise, RoutineRule } from "@prisma/client";

export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type BlockType = "WARMUP" | "CORE" | "MAIN" | "COOLDOWN";
export type BlockMode = "SEQUENTIAL" | "STATIONS";

const ADVANCED_TAGS = ["avanzado", "olimpico", "halterofilia"];

function isCompound(ex: Exercise): boolean {
  return ex.tags.includes("compound");
}

// --- Mapeo objetivo → tipos de ejercicio elegibles (punto 8) ---

export const GOAL_EXERCISE_TYPES: Record<RoutineGoal, ExerciseType[]> = {
  HYPERTROPHY: ["STRENGTH"],
  STRENGTH: ["STRENGTH"],
  ENDURANCE: ["FUNCTIONAL", "CARDIO", "PLYOMETRIC"],
  WEIGHT_LOSS: ["STRENGTH", "FUNCTIONAL", "CARDIO"],
  MAINTENANCE: ["STRENGTH", "FUNCTIONAL", "CARDIO"],
  REHABILITATION: ["REHABILITATION", "MOBILITY", "BALANCE"],
};

export const GENERIC_BLOCK_TYPES: Record<"WARMUP" | "COOLDOWN" | "STRETCH", ExerciseType[]> = {
  WARMUP: ["WARMUP", "MOBILITY"],
  COOLDOWN: ["COOLDOWN", "MOBILITY"],
  STRETCH: ["STRETCHING"],
};

export interface SessionBlockConfig {
  id: string;
  type: BlockType;
  label?: string;
  mode: BlockMode;
  muscleGroups?: string[];
  exerciseTypes: ExerciseType[]; // editable por el profesional — subconjunto de GOAL_EXERCISE_TYPES[goal] en bloques MAIN
  tagsRequired?: string[];
  tagsPreferred?: string[];
  count: number; // 0 = bloque desactivado, no se consulta
  pinnedExerciseIds?: string[];
  excludeExerciseIds?: string[];
}

export interface SplitDay {
  name: string;
  muscleGroups: string[];
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

// Cada bloque siempre aparece en el resultado, aunque count=0 y exercises=[] (punto 4/6)
export interface GeneratedBlockResult {
  blockId: string;
  label: string;
  type: BlockType;
  mode: BlockMode;
  exercises: GeneratedExercise[];
}

export interface GeneratedDay {
  sessionNumber: number;
  weekNumber: number;
  dayOfWeek: number;
  dayName: string;
  order: number;
  blocks: GeneratedBlockResult[];
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
// evitando tramos ridículamente cortos si piden demasiada cantidad.
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
  if (block.count === 0) return [];

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
): GeneratedBlockResult {
  const label = block.label ?? block.type;

  if (block.count === 0) {
    return { blockId: block.id, label, type: block.type, mode: block.mode, exercises: [] };
  }

  const chosen = pickForBlock(exercises, block, equipment, avoidMuscleGroups, experienceLevel, prioritizeCompound, exclude);
  const exercisesOut: GeneratedExercise[] = [];

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
        exercisesOut.push({
          exerciseId: ex.id, name: ex.name, type: ex.type, muscleGroup: ex.muscleGroup,
          sets: 1, reps: `${durations[i]}s`, rest: block.mode === "STATIONS" ? "15s" : "-",
          order: orderRef.order++, blockId: block.id, blockType: block.type,
        });
      });
    } else {
      exList.forEach((ex) => {
        exercisesOut.push({
          exerciseId: ex.id, name: ex.name, type: ex.type, muscleGroup: ex.muscleGroup,
          sets: rule?.sets ?? 3, reps: formatReps(rule), rest: formatRest(rule),
          order: orderRef.order++, blockId: block.id, blockType: block.type,
        });
      });
    }
  }

  return { blockId: block.id, label, type: block.type, mode: block.mode, exercises: exercisesOut };
}

// buildDayExercises vuelve a recibir "goal" como parámetro global, no desde splitDay
function buildDayExercises(
  goal: RoutineGoal,
  splitDay: SplitDay,
  exercises: Exercise[],
  rules: RoutineRule[],
  equipment: string[] | null,
  avoidMuscleGroups: string[],
  experienceLevel: ExperienceLevel,
  prioritizeCompound: boolean,
  weeklyExclude: Set<string>
): GeneratedBlockResult[] {
  const orderRef = { order: 1 };
  const usedInDay = new Set<string>();
  const results: GeneratedBlockResult[] = [];

  for (const block of splitDay.blocks) {
    const exclude = block.type === "MAIN" ? new Set([...weeklyExclude, ...usedInDay]) : new Set(usedInDay);
    const blockResult = buildBlockExercises(
      block, goal, exercises, rules, equipment, avoidMuscleGroups, experienceLevel, prioritizeCompound, exclude, orderRef
    );
    blockResult.exercises.forEach((e) => usedInDay.add(e.exerciseId));
    results.push(blockResult);
  }

  return results;
}

// generateRoutinePreview: goal vuelve a usarse global, sin GeneratedDay.goal
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

  const fixedWeekBlocks: GeneratedBlockResult[][] | null = sameEachWeek
    ? splitDays.map((sd) =>
        buildDayExercises(goal, sd, exercises, rules, availableEquipment, avoidMuscleGroups, experienceLevel, prioritizeCompound, new Set())
      )
    : null;

  let previousWeekMainIds: Set<string>[] = splitDays.map(() => new Set());

  for (let week = 1; week <= totalWeeks; week++) {
    for (let dayOfWeek = 1; dayOfWeek <= frequencyPerWeek; dayOfWeek++) {
      const splitDay = splitDays[dayOfWeek - 1];

      let dayBlocks: GeneratedBlockResult[];
      if (fixedWeekBlocks) {
        dayBlocks = fixedWeekBlocks[dayOfWeek - 1];
      } else {
        dayBlocks = buildDayExercises(
          goal, splitDay, exercises, rules, availableEquipment,
          avoidMuscleGroups, experienceLevel, prioritizeCompound, previousWeekMainIds[dayOfWeek - 1]
        );
        const mainIds = dayBlocks.filter((b) => b.type === "MAIN").flatMap((b) => b.exercises.map((e) => e.exerciseId));
        previousWeekMainIds[dayOfWeek - 1] = new Set(mainIds);
      }

      days.push({
        sessionNumber: sessionNumber++,
        weekNumber: week,
        dayOfWeek,
        dayName: splitDay.name,
        order: dayOfWeek,
        blocks: dayBlocks,
      });
    }
  }

  return { days };
}

// --- Presets de bloques por objetivo ---

interface GoalBlockDefaults {
  mainCount: number;
  mainMode: BlockMode;
  warmupCount: number;
  coreCount: number;
  cooldownCount: number;
  stretchCount: number | "auto"; // "auto" = 1 por grupo muscular del día, tope 4
}

const GOAL_BLOCK_DEFAULTS: Record<RoutineGoal, GoalBlockDefaults> = {
  HYPERTROPHY:    { mainCount: 6, mainMode: "SEQUENTIAL", warmupCount: 3, coreCount: 1, cooldownCount: 1, stretchCount: "auto" },
  STRENGTH:       { mainCount: 5, mainMode: "SEQUENTIAL", warmupCount: 3, coreCount: 1, cooldownCount: 0, stretchCount: 2 },
  ENDURANCE:      { mainCount: 4, mainMode: "STATIONS",   warmupCount: 3, coreCount: 1, cooldownCount: 1, stretchCount: "auto" },
  WEIGHT_LOSS:    { mainCount: 4, mainMode: "STATIONS",   warmupCount: 3, coreCount: 1, cooldownCount: 1, stretchCount: "auto" },
  MAINTENANCE:    { mainCount: 5, mainMode: "SEQUENTIAL", warmupCount: 3, coreCount: 1, cooldownCount: 1, stretchCount: "auto" },
  REHABILITATION: { mainCount: 5, mainMode: "SEQUENTIAL", warmupCount: 2, coreCount: 0, cooldownCount: 0, stretchCount: 0 },
};

// Por default el bloque principal arranca con TODOS los tipos elegibles del objetivo (punto 8);
// el profesional destilda desde la UI los que no quiere usar ese día.
export function buildDefaultBlocks(goal: RoutineGoal, muscleGroups: string[]): SessionBlockConfig[] {
  const d = GOAL_BLOCK_DEFAULTS[goal];
  const blocks: SessionBlockConfig[] = [];

  blocks.push({
    id: "warmup", type: "WARMUP", label: "Entrada en calor", mode: "SEQUENTIAL",
    muscleGroups, exerciseTypes: [...GENERIC_BLOCK_TYPES.WARMUP], count: d.warmupCount,
  });

  blocks.push({
    id: "core", type: "CORE", label: "Zona media", mode: "SEQUENTIAL",
    muscleGroups: ["Core", "Abdominales", "Zona media"], exerciseTypes: ["STRENGTH", "FUNCTIONAL"],
    count: d.coreCount, tagsPreferred: ["core"],
  });

  blocks.push({
    id: "main", type: "MAIN", label: "Bloque principal", mode: d.mainMode,
    muscleGroups, exerciseTypes: [...GOAL_EXERCISE_TYPES[goal]], count: d.mainCount,
  });

  blocks.push({
    id: "cooldown", type: "COOLDOWN", label: "Vuelta a la calma", mode: "SEQUENTIAL",
    muscleGroups: [], exerciseTypes: [...GENERIC_BLOCK_TYPES.COOLDOWN], count: d.cooldownCount,
  });

  const stretchCount = d.stretchCount === "auto" ? Math.min(Math.max(muscleGroups.length, 1), 4) : d.stretchCount;
  blocks.push({
    id: "stretch", type: "COOLDOWN", label: "Elongación", mode: "SEQUENTIAL",
    muscleGroups, exerciseTypes: [...GENERIC_BLOCK_TYPES.STRETCH], count: stretchCount,
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

// resolveSplitDays: SplitDay ya no lleva "goal" (goal solo se usa para armar los defaults de bloques)
export function resolveSplitDays(presetKey: string, frequencyPerWeek: number, goal: RoutineGoal): SplitDay[] {
  const preset = SPLIT_PRESETS[presetKey];
  if (!preset) throw new Error(`Preset desconocido: ${presetKey}`);
  const result: SplitDay[] = [];
  for (let i = 0; i < frequencyPerWeek; i++) {
    const d = preset.days[i % preset.days.length];
    result.push({ name: d.name, muscleGroups: d.muscleGroups, blocks: buildDefaultBlocks(goal, d.muscleGroups) });
  }
  return result;
}

// Helper para agregar un bloque de estación adicional a un día ya armado (punto 7)
export function addStationBlock(day: SplitDay, exerciseTypes: ExerciseType[] = ["FUNCTIONAL"], count = 4): SplitDay {
  const stationNumber = day.blocks.filter((b) => b.type === "MAIN").length + 1;
  const newBlock: SessionBlockConfig = {
    id: `main-station-${Date.now()}`,
    type: "MAIN",
    label: `Bloque ${stationNumber} (estación)`,
    mode: "STATIONS",
    muscleGroups: day.muscleGroups,
    exerciseTypes,
    count,
  };
  // se inserta antes del cooldown para respetar warmup → core → main(s) → cooldown
  const cooldownIndex = day.blocks.findIndex((b) => b.type === "COOLDOWN");
  const blocks = [...day.blocks];
  if (cooldownIndex === -1) blocks.push(newBlock);
  else blocks.splice(cooldownIndex, 0, newBlock);
  return { ...day, blocks };
}