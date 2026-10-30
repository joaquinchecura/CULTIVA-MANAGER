"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Save, Check, Zap, Target, Calendar,
  Dumbbell, Settings, LayoutGrid, TrendingUp, Info, X, Plus,
  ShieldAlert, Dumbbell as DumbbellIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  SPLIT_PRESETS,
  resolveSplitDays,
  buildDefaultBlocks,
  GOAL_EXERCISE_TYPES,
  type SplitDay,
  type SessionBlockConfig,
  type GeneratedDay,
  type GeneratedExercise,
  type ExperienceLevel,
} from "@/lib/routine-generator";
import { RoutineGoal, ExerciseType } from "@prisma/client";

const GOAL_LABELS: Record<RoutineGoal, string> = {
  HYPERTROPHY: "Hipertrofia",
  STRENGTH: "Fuerza",
  ENDURANCE: "Resistencia",
  WEIGHT_LOSS: "Pérdida de grasa",
  MAINTENANCE: "Mantenimiento",
  REHABILITATION: "Rehabilitación",
};

const GOAL_COLORS: Record<RoutineGoal, string> = {
  HYPERTROPHY: "bg-blue-50 text-blue-700 border-blue-200",
  STRENGTH: "bg-red-50 text-red-700 border-red-200",
  ENDURANCE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  WEIGHT_LOSS: "bg-orange-50 text-orange-700 border-orange-200",
  MAINTENANCE: "bg-violet-50 text-violet-700 border-violet-200",
  REHABILITATION: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

const EQUIPMENT_OPTIONS = [
  "Barra", "Mancuernas", "Mancuerna", "Polea", "Máquina", "Kettlebell",
  "Banda", "TRX", "Peso corporal", "Cajón pliométrico", "Fitball", "Bosu",
].sort();

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzado",
};

const AVOID_MUSCLE_OPTIONS = [
  "Columna Lumbar", "Columna torácica", "Cuello", "Hombros",
  "Rodillas", "Tobillos", "Cadera", "Muñecas",
].sort();

const BLOCK_TYPE_LABELS: Record<string, string> = {
  WARMUP: "Entrada en calor",
  CORE: "Zona media",
  MAIN: "Bloque principal",
  COOLDOWN: "Vuelta a la calma",
};

const EXERCISE_TYPE_LABELS: Partial<Record<ExerciseType, string>> = {
  STRENGTH: "Fuerza",
  FUNCTIONAL: "Funcional",
  CARDIO: "Cardio",
  PLYOMETRIC: "Pliometría",
  REHABILITATION: "Rehabilitación",
  MOBILITY: "Movilidad",
  BALANCE: "Equilibrio",
};

const STEPS = [
  { id: 1, label: "Configuración" },
  { id: 2, label: "Split y bloques" },
  { id: 3, label: "Preview" },
];

const TOTAL_WEEKS_OPTIONS = [4, 6, 8, 10, 12];

export default function GenerarRutinaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Configuración
  const [routineName, setRoutineName] = useState("");
  const [goal, setGoal] = useState<RoutineGoal>("HYPERTROPHY");
  const [description, setDescription] = useState("");
  const [frequencyPerWeek, setFrequencyPerWeek] = useState(3);
  const [totalWeeks, setTotalWeeks] = useState(4);
  const [sameEachWeek, setSameEachWeek] = useState(true);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("INTERMEDIATE");
  const [avoidMuscleGroups, setAvoidMuscleGroups] = useState<string[]>([]);
  const [prioritizeCompound, setPrioritizeCompound] = useState(true);
  const [useEquipmentFilter, setUseEquipmentFilter] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  // Split
  const [splitPreset, setSplitPreset] = useState<string>("FULL_BODY");
  const [customSplitDaysRaw, setCustomSplitDaysRaw] = useState<{ name: string; muscleGroups: string[] }[]>([]);
  const [blockCountOverrides, setBlockCountOverrides] = useState<Record<string, number>>({});
  const [blockTypeOverrides, setBlockTypeOverrides] = useState<Record<string, ExerciseType[]>>({});
  const [extraBlocksByDay, setExtraBlocksByDay] = useState<Record<number, SessionBlockConfig[]>>({});

  // Preview
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<GeneratedDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);

  const baseSplitDays: SplitDay[] = useMemo(() => {
    if (splitPreset === "CUSTOM") {
      return customSplitDaysRaw.map((d) => ({
        name: d.name,
        muscleGroups: d.muscleGroups,
        blocks: buildDefaultBlocks(goal, d.muscleGroups),
      }));
    }
    try {
      return resolveSplitDays(splitPreset, frequencyPerWeek, goal);
    } catch {
      return [];
    }
  }, [splitPreset, frequencyPerWeek, goal, customSplitDaysRaw]);

  const splitDays: SplitDay[] = useMemo(() => {
    return baseSplitDays.map((day, dayIndex) => {
      const extra = extraBlocksByDay[dayIndex] ?? [];
      let blocks = day.blocks;
      if (extra.length) {
        const cooldownIndex = blocks.findIndex((b) => b.type === "COOLDOWN");
        blocks = cooldownIndex === -1
          ? [...blocks, ...extra]
          : [...blocks.slice(0, cooldownIndex), ...extra, ...blocks.slice(cooldownIndex)];
      }

      blocks = blocks.map((block) => {
        const key = `${dayIndex}-${block.id}`;
        let updated = block;
        if (blockCountOverrides[key] != null) {
          updated = { ...updated, count: blockCountOverrides[key] };
        }
        if (updated.type === "MAIN" && blockTypeOverrides[key] != null) {
          updated = { ...updated, exerciseTypes: blockTypeOverrides[key] };
        }
        return updated;
      });

      return { ...day, blocks };
    });
  }, [baseSplitDays, blockCountOverrides, blockTypeOverrides, extraBlocksByDay]);

  useEffect(() => {
    if (splitPreset !== "CUSTOM") return;
    setCustomSplitDaysRaw((prev) => {
      const next = [...prev];
      while (next.length < frequencyPerWeek) {
        next.push({ name: `Día ${next.length + 1}`, muscleGroups: [] });
      }
      return next.slice(0, frequencyPerWeek);
    });
  }, [frequencyPerWeek, splitPreset]);

  useEffect(() => {
    setBlockCountOverrides({});
    setBlockTypeOverrides({});
    setExtraBlocksByDay({});
  }, [splitPreset, frequencyPerWeek, goal]);

  function updateCustomDay(index: number, field: "name" | "muscleGroups", value: string) {
    setCustomSplitDaysRaw((prev) => {
      const next = [...prev];
      if (field === "name") {
        next[index] = { ...next[index], name: value };
      } else {
        next[index] = { ...next[index], muscleGroups: value.split(",").map((s) => s.trim()).filter(Boolean) };
      }
      return next;
    });
  }

  function updateBlockCount(dayIndex: number, blockId: string, count: number) {
    setBlockCountOverrides((prev) => ({ ...prev, [`${dayIndex}-${blockId}`]: Math.max(0, count) }));
  }

  function toggleBlockExerciseType(dayIndex: number, block: SessionBlockConfig, type: ExerciseType) {
    const key = `${dayIndex}-${block.id}`;
    setBlockTypeOverrides((prev) => {
      const current = prev[key] ?? block.exerciseTypes;
      const next = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
      if (next.length === 0) return prev;
      return { ...prev, [key]: next };
    });
  }

  function addStationBlockToDay(dayIndex: number) {
    setExtraBlocksByDay((prev) => {
      const current = prev[dayIndex] ?? [];
      const day = splitDays[dayIndex];
      const stationNumber = day.blocks.filter((b) => b.type === "MAIN").length + 1;
      const newBlock: SessionBlockConfig = {
        id: `main-station-${Date.now()}`,
        type: "MAIN",
        label: `Bloque ${stationNumber} (estación)`,
        mode: "STATIONS",
        muscleGroups: day.muscleGroups,
        exerciseTypes: [...GOAL_EXERCISE_TYPES[goal]],
        count: 4,
      };
      return { ...prev, [dayIndex]: [...current, newBlock] };
    });
  }

  function removeExtraBlock(dayIndex: number, blockId: string) {
    setExtraBlocksByDay((prev) => ({
      ...prev,
      [dayIndex]: (prev[dayIndex] ?? []).filter((b) => b.id !== blockId),
    }));
  }

  async function handleGenerate() {
    setError(null);
    if (splitDays.length !== frequencyPerWeek) {
      setError("La cantidad de días del split no coincide con la frecuencia semanal.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/routines/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal, frequencyPerWeek, totalWeeks, sameEachWeek, splitDays,
          availableEquipment: useEquipmentFilter ? selectedEquipment : null,
          experienceLevel, avoidMuscleGroups, prioritizeCompound,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar la rutina");
      setPreview(data.days);
      setSelectedWeek(1);
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  function removeExercise(dayIndex: number, blockIndex: number, exerciseIndex: number) {
    setPreview((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const day = { ...next[dayIndex] };
      const blocks = [...day.blocks];
      const block = { ...blocks[blockIndex] };
      block.exercises = block.exercises.filter((_: GeneratedExercise, i: number) => i !== exerciseIndex);
      blocks[blockIndex] = block;
      day.blocks = blocks;
      next[dayIndex] = day;
      return next;
    });
  }

  function updateExerciseField(dayIndex: number, blockIndex: number, exerciseIndex: number, field: "sets" | "reps" | "rest", value: string) {
    setPreview((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const day = { ...next[dayIndex] };
      const blocks = [...day.blocks];
      const block = { ...blocks[blockIndex] };
      const exercises = [...block.exercises];
      exercises[exerciseIndex] = {
        ...exercises[exerciseIndex],
        [field]: field === "sets" ? Number(value) || 0 : value,
      };
      block.exercises = exercises;
      blocks[blockIndex] = block;
      day.blocks = blocks;
      next[dayIndex] = day;
      return next;
    });
  }

  async function handleSave() {
    if (!preview) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/routines/from-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: routineName || `Rutina ${GOAL_LABELS[goal]}`,
          description, goal, frequencyPerWeek, totalWeeks,
          days: preview,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar la rutina");
      router.push(`/admin/rutinas/${data.id}/editar`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const currentWeekEntries = preview
    ? preview.map((day, index) => ({ day, index })).filter(({ day }) => day.weekNumber === selectedWeek)
    : [];

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Generador de rutinas</h1>
          <p className="text-sm text-slate-500">Creá una rutina automática con IA</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => step > s.id && setStep(s.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                step === s.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : step > s.id
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "bg-slate-50 text-slate-400 cursor-default"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold",
                step === s.id ? "bg-white/20" : step > s.id ? "bg-blue-100" : ""
              )}>
                {step > s.id ? <Check size={10} /> : s.id}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px w-6", step > s.id ? "bg-blue-300" : "bg-slate-200")} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* STEP 1: Configuración */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          {/* Básico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Nombre de la rutina</Label>
              <Input
                placeholder={`Rutina ${GOAL_LABELS[goal]}`}
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm">Objetivo</Label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1.5 text-sm"
                value={goal}
                onChange={(e) => setGoal(e.target.value as RoutineGoal)}
              >
                {Object.entries(GOAL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm">Descripción / notas</Label>
              <Textarea
                className="mt-1.5"
                rows={2}
                placeholder="Notas para esta rutina..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Frecuencia y semanas (botones) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm">Sesiones por semana *</Label>
              <div className="flex gap-1.5 flex-wrap">
                {[1,2,3,4,5,6,7].map(n => (
                  <button
                    key={n}
                    onClick={() => setFrequencyPerWeek(n)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-sm font-bold border transition-all",
                      frequencyPerWeek === n
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Duración (semanas) *</Label>
              <div className="flex gap-1.5 flex-wrap">
                {TOTAL_WEEKS_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => setTotalWeeks(n)}
                    className={cn(
                      "px-2.5 h-9 rounded-lg text-xs font-bold border transition-all",
                      totalWeeks === n
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                    )}
                  >
                    {n} sem
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="sameEachWeek"
                checked={sameEachWeek}
                onChange={(e) => setSameEachWeek(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="sameEachWeek" className="text-sm text-slate-700">
                Misma rutina todas las semanas
              </label>
            </div>
          </div>

          {/* Nivel */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-emerald-600" />
              Nivel y preferencias
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Nivel de experiencia</Label>
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1.5 text-sm"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                >
                  {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-7">
                <input
                  type="checkbox"
                  id="prioritizeCompound"
                  checked={prioritizeCompound}
                  onChange={(e) => setPrioritizeCompound(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="prioritizeCompound" className="text-sm text-slate-700">
                  Priorizar ejercicios compuestos
                </label>
              </div>
            </div>
          </div>

          {/* Evitar zonas */}
          <div>
            <Label className="text-sm mb-2 block">Evitar zonas (lesiones)</Label>
            <div className="flex flex-wrap gap-1.5">
              {AVOID_MUSCLE_OPTIONS.map((muscle) => {
                const active = avoidMuscleGroups.includes(muscle);
                return (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => setAvoidMuscleGroups((prev) =>
                      active ? prev.filter((m) => m !== muscle) : [...prev, muscle]
                    )}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                      active
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {muscle}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Equipamiento */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="useEquipment"
                checked={useEquipmentFilter}
                onChange={(e) => setUseEquipmentFilter(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="useEquipment" className="text-sm text-slate-700 font-medium">
                Filtrar por equipamiento disponible
              </label>
            </div>
            {useEquipmentFilter && (
              <div className="flex flex-wrap gap-1.5">
                {EQUIPMENT_OPTIONS.map((eq) => {
                  const active = selectedEquipment.includes(eq);
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => setSelectedEquipment((prev) =>
                        active ? prev.filter((e) => e !== eq) : [...prev, eq]
                      )}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                        active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      {eq}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Split y bloques */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid size={16} className="text-violet-600" />
              Split
            </h2>

            <div className="flex flex-wrap gap-1.5">
              {Object.entries(SPLIT_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSplitPreset(key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    splitPreset === key
                      ? "bg-violet-50 text-violet-700 border-violet-200 ring-1 ring-violet-200"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSplitPreset("CUSTOM")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  splitPreset === "CUSTOM"
                    ? "bg-violet-50 text-violet-700 border-violet-200 ring-1 ring-violet-200"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                )}
              >
                Personalizado
              </button>
            </div>

            {splitPreset === "CUSTOM" && (
              <div className="space-y-2 pt-2">
                {customSplitDaysRaw.map((day, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      className="w-32 h-9 text-sm"
                      placeholder="Nombre del día"
                      value={day.name}
                      onChange={(e) => updateCustomDay(i, "name", e.target.value)}
                    />
                    <Input
                      className="flex-1 h-9 text-sm"
                      placeholder="Grupos musculares separados por coma"
                      value={day.muscleGroups.join(", ")}
                      onChange={(e) => updateCustomDay(i, "muscleGroups", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {splitDays.map((day, dayIndex) => {
              const extraIds = new Set((extraBlocksByDay[dayIndex] ?? []).map((b) => b.id));
              return (
                <div key={dayIndex} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{day.name}</p>
                  </div>

                  <div className="p-3 space-y-2">
                    {day.blocks.map((block) => {
                      const key = `${dayIndex}-${block.id}`;
                      const activeTypes = blockTypeOverrides[key] ?? block.exerciseTypes;
                      const showTypeToggle = block.type === "MAIN" && GOAL_EXERCISE_TYPES[goal].length > 1;

                      return (
                        <div key={block.id} className="border border-slate-200 rounded-lg p-3 bg-white">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 truncate">
                                {block.label || BLOCK_TYPE_LABELS[block.type]}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {BLOCK_TYPE_LABELS[block.type]}{block.mode === "STATIONS" ? " · estaciones" : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Input
                                type="number"
                                min={0}
                                max={12}
                                className="w-14 h-8 text-center text-sm"
                                value={block.count}
                                onChange={(e) => updateBlockCount(dayIndex, block.id, Number(e.target.value) || 0)}
                              />
                              {extraIds.has(block.id) && (
                                <button
                                  type="button"
                                  onClick={() => removeExtraBlock(dayIndex, block.id)}
                                  className="p-1 text-red-400 hover:text-red-600"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          {showTypeToggle && (
                            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-100">
                              {GOAL_EXERCISE_TYPES[goal].map((type) => {
                                const active = activeTypes.includes(type);
                                return (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => toggleBlockExerciseType(dayIndex, block, type)}
                                    className={cn(
                                      "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all",
                                      active
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : "bg-white text-slate-500 border-slate-200"
                                    )}
                                  >
                                    {EXERCISE_TYPE_LABELS[type] ?? type}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => addStationBlockToDay(dayIndex)}
                      className="flex items-center gap-1 text-[11px] text-blue-600 font-medium hover:text-blue-700 pt-1"
                    >
                      <Plus size={12} /> Agregar bloque (estación)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full h-11 gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Zap size={16} />
            {generating ? "Generando..." : "Generar preview"}
          </Button>
        </div>
      )}

      {/* STEP 3: Preview */}
      {step === 3 && preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Preview de la rutina</h2>
            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Save size={16} />
              {saving ? "Guardando..." : "Guardar rutina"}
            </Button>
          </div>

          {!sameEachWeek && totalWeeks > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
                <button
                  key={week}
                  type="button"
                  onClick={() => setSelectedWeek(week)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    selectedWeek === week
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  )}
                >
                  Semana {week}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {currentWeekEntries.map(({ day, index: dayIndex }) => (
              <div key={dayIndex} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">
                    {day.dayName}
                    {!sameEachWeek && ` — Semana ${day.weekNumber}`}
                  </p>
                  <span className="text-xs text-slate-500">{day.blocks.reduce((s, b) => s + b.exercises.length, 0)} ejercicios</span>
                </div>

                <div className="p-3 space-y-4">
                  {day.blocks.map((block, blockIndex) => (
                    <div key={block.blockId}>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        {block.label}
                      </p>
                      {block.exercises.length === 0 ? (
                        <p className="text-xs text-slate-300 italic pb-2">— sin ejercicios —</p>
                      ) : (
                        <div className="space-y-1.5">
                          {block.exercises.map((ex, exIndex) => (
                            <div key={exIndex} className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-2 py-1.5">
                              <span className="flex-1 truncate text-xs font-medium text-slate-700">{ex.name}</span>
                              <Input
                                type="number"
                                className="w-14 h-7 text-xs text-center"
                                value={ex.sets}
                                onChange={(e) => updateExerciseField(dayIndex, blockIndex, exIndex, "sets", e.target.value)}
                              />
                              <span className="text-slate-400 text-xs">×</span>
                              <Input
                                className="w-16 h-7 text-xs text-center"
                                value={ex.reps}
                                onChange={(e) => updateExerciseField(dayIndex, blockIndex, exIndex, "reps", e.target.value)}
                              />
                              <Input
                                className="w-16 h-7 text-xs text-center"
                                value={ex.rest}
                                onChange={(e) => updateExerciseField(dayIndex, blockIndex, exIndex, "rest", e.target.value)}
                              />
                              <button
                                onClick={() => removeExercise(dayIndex, blockIndex, exIndex)}
                                className="p-1 text-slate-300 hover:text-red-500"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <Button
          variant="outline"
          onClick={() => step === 1 ? router.back() : setStep(s => s - 1)}
        >
          <ArrowLeft size={15} className="mr-1.5" />
          {step === 1 ? "Cancelar" : "Atrás"}
        </Button>

        {step < 2 && (
          <Button onClick={() => setStep(s => s + 1)}>
            Siguiente <ArrowRight size={15} className="ml-1.5" />
          </Button>
        )}
        {step === 2 && !preview && (
          <span className="text-xs text-slate-400">Generá el preview para continuar</span>
        )}
        {step === 3 && (
          <Button onClick={() => setStep(2)} variant="outline">
            <ArrowLeft size={15} className="mr-1.5" />
            Volver a ajustar
          </Button>
        )}
      </div>
    </div>
  );
}