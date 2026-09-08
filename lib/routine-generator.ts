import { RoutineGoal, ExerciseType, Exercise, RoutineRule } from "@prisma/client";

export interface SplitDay {
  name: string;          // "Push", "Full Body", "Día 1", lo que el coach quiera
  muscleGroups: string[]; // grupos musculares que se buscan ese día
}

export interface GeneratorInput {
  goal: RoutineGoal;
  frequencyPerWeek: number;
  totalWeeks: number;
  sameEachWeek: boolean;
  splitDays: SplitDay[];        // longitud debe ser igual a frequencyPerWeek
  availableEquipment: string[] | null; // null = sin filtro de equipamiento
  exercises: Exercise[];        // pool completo, ya traído de la DB
  rules: RoutineRule[];         // reglas ya traídas de la DB
}

export interface GeneratedExercise {
  exerciseId: string;
  name: string;
  type: ExerciseType;
  muscleGroup: string | null;
  sets: number;
  reps: string;   // "8-12" o "45s"
  rest: string;   // "90s"
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

// Configuración de cuántos ejercicios "principales" entran por día y de
// qué tipos, según el objetivo. Editable acá si querés ajustar la mezcla.
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
  equipment: string[] | null
): Exercise[] {
  return exercises.filter((ex) => {
    if (!ex.isPublic) return false;
    if (!types.includes(ex.type)) return false;
    if (muscleGroups.length && !(ex.muscleGroup && muscleGroups.includes(ex.muscleGroup))) return false;
    if (equipment && ex.equipment && !equipment.includes(ex.equipment)) return false;
    return true;
  });
}

// Elige `count` ejercicios repartiendo lo más parejo posible entre los
// muscleGroups del día (round-robin), excluyendo los ya usados si se pide.
function pickExercises(
  exercises: Exercise[],
  muscleGroups: string[],
  types: ExerciseType[],
  equipment: string[] | null,
  count: number,
  exclude: Set<string>
): Exercise[] {
  const pool = shuffle(filterPool(exercises, muscleGroups, types, equipment));
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
      const candidates = (byMuscle.get(g) || []).filter((e) => !exclude.has(e.id) && !picked.some((p) => p.id === e.id));
      if (candidates.length) picked.push(candidates[0]);
    }
    round++;
    // si después de una vuelta completa no sumó nada nuevo, cortamos para no loopear infinito
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
    const wu = pickExercises(exercises, [], ["WARMUP"], equipment, 1, new Set());
    wu.forEach(pushExercise);
  }

  const main = pickExercises(exercises, splitDay.muscleGroups, config.mainTypes, equipment, config.mainCount, exclude);
  main.forEach(pushExercise);

  for (const extra of config.extra) {
    const ex = pickExercises(exercises, splitDay.muscleGroups, [extra.type], equipment, extra.count, exclude);
    ex.forEach(pushExercise);
  }

  if (config.cooldown) {
    const cd = pickExercises(exercises, splitDay.muscleGroups, ["STRETCHING", "COOLDOWN"], equipment, 2, new Set());
    cd.forEach(pushExercise);
  }

  return result;
}

export function generateRoutinePreview(input: GeneratorInput): GeneratedRoutinePreview {
  const { goal, frequencyPerWeek, totalWeeks, sameEachWeek, splitDays, availableEquipment, exercises, rules } = input;

  if (splitDays.length !== frequencyPerWeek) {
    throw new Error(`splitDays debe tener ${frequencyPerWeek} elementos (uno por día de la semana), recibió ${splitDays.length}`);
  }

  const days: GeneratedDay[] = [];
  let sessionNumber = 1;

  // Si la rutina es igual todas las semanas, generamos una sola vez el
  // contenido de cada día y lo reusamos. Si varía, regeneramos por semana
  // excluyendo lo usado en la semana inmediatamente anterior para dar variedad.
  const fixedWeekExercises: GeneratedExercise[][] | null = sameEachWeek
    ? splitDays.map((sd) => buildDayExercises(goal, sd, exercises, rules, availableEquipment, new Set()))
    : null;

  let previousWeekIds: Set<string>[] = splitDays.map(() => new Set());

  for (let week = 1; week <= totalWeeks; week++) {
    for (let dayOfWeek = 1; dayOfWeek <= frequencyPerWeek; dayOfWeek++) {
      const splitDay = splitDays[dayOfWeek - 1];

      let dayExercises: GeneratedExercise[];
      if (fixedWeekExercises) {
        dayExercises = fixedWeekExercises[dayOfWeek - 1];
      } else {
        dayExercises = buildDayExercises(goal, splitDay, exercises, rules, availableEquipment, previousWeekIds[dayOfWeek - 1]);
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

// Plantillas de split predefinidas — el coach elige una o arma "Personalizado" a mano
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

// Dado un preset y la cantidad de días/semana, repite el ciclo hasta
// completar frequencyPerWeek (ej. PPL con 6 días → Push,Pull,Legs,Push,Pull,Legs)
export function resolveSplitDays(presetKey: string, frequencyPerWeek: number): SplitDay[] {
  const preset = SPLIT_PRESETS[presetKey];
  if (!preset) throw new Error(`Preset desconocido: ${presetKey}`);
  const result: SplitDay[] = [];
  for (let i = 0; i < frequencyPerWeek; i++) {
    result.push(preset.days[i % preset.days.length]);
  }
  return result;
}