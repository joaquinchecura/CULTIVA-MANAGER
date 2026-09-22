"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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

interface Member {
  id: string;
  firstName: string;
  lastName: string;
}

const GOAL_LABELS: Record<RoutineGoal, string> = {
  HYPERTROPHY: "Hipertrofia",
  STRENGTH: "Fuerza",
  ENDURANCE: "Resistencia",
  WEIGHT_LOSS: "Pérdida de grasa",
  MAINTENANCE: "Mantenimiento",
  REHABILITATION: "Rehabilitación",
};

const EQUIPMENT_OPTIONS = [
  "Barra", "Mancuernas", "Mancuerna", "Polea", "Máquina", "Kettlebell",
  "Banda", "TRX", "Peso corporal", "Cajón pliométrico", "Fitball", "Bosu",
];

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzado",
};

const AVOID_MUSCLE_OPTIONS = [
  "Columna Lumbar", "Columna torácica", "Cuello", "Hombros",
  "Rodillas", "Tobillos", "Cadera", "Muñecas",
];

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

export default function GenerarRutinaPage() {
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [memberId, setMemberId] = useState<string>("");
  const [routineName, setRoutineName] = useState("");
  const [goal, setGoal] = useState<RoutineGoal>("HYPERTROPHY");
  const [description, setDescription] = useState("");
  const [frequencyPerWeek, setFrequencyPerWeek] = useState(3);
  const [totalWeeks, setTotalWeeks] = useState(4);
  const [sameEachWeek, setSameEachWeek] = useState(true);
  const [splitPreset, setSplitPreset] = useState<string>("FULL_BODY");
  const [customSplitDaysRaw, setCustomSplitDaysRaw] = useState<{ name: string; muscleGroups: string[] }[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [useEquipmentFilter, setUseEquipmentFilter] = useState(false);

  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("INTERMEDIATE");
  const [avoidMuscleGroups, setAvoidMuscleGroups] = useState<string[]>([]);
  const [prioritizeCompound, setPrioritizeCompound] = useState(true);

  // overrides de count por bloque — clave: `${dayIndex}-${blockId}`
  const [blockCountOverrides, setBlockCountOverrides] = useState<Record<string, number>>({});
  // overrides de exerciseTypes en bloques MAIN — clave: `${dayIndex}-${blockId}`
  const [blockTypeOverrides, setBlockTypeOverrides] = useState<Record<string, ExerciseType[]>>({});
  // bloques de estación agregados manualmente por día — clave: dayIndex
  const [extraBlocksByDay, setExtraBlocksByDay] = useState<Record<number, SessionBlockConfig[]>>({});

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<GeneratedDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);

  useEffect(() => {
    fetch("/api/members")
      .then((res) => res.json())
      .then((data) => setMembers(Array.isArray(data) ? data : data.members ?? []))
      .catch(() => setError("No se pudo cargar la lista de clientes"))
      .finally(() => setLoadingMembers(false));
  }, []);

  // Split base: preset resuelto o el manual del coach — siempre con el mismo goal (global)
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

  // Aplica overrides de count/exerciseTypes sobre los bloques base, y agrega los
  // bloques de estación manuales (insertados antes del primer bloque de vuelta a la calma).
  const splitDays: SplitDay[] = useMemo(() => {
    return baseSplitDays.map((day, dayIndex) => {
      let blocks = day.blocks.map((block) => {
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

      const extra = extraBlocksByDay[dayIndex] ?? [];
      if (extra.length) {
        const cooldownIndex = blocks.findIndex((b) => b.type === "COOLDOWN");
        blocks = cooldownIndex === -1
          ? [...blocks, ...extra]
          : [...blocks.slice(0, cooldownIndex), ...extra, ...blocks.slice(cooldownIndex)];
      }

      return { ...day, blocks };
    });
  }, [baseSplitDays, blockCountOverrides, blockTypeOverrides, extraBlocksByDay]);

  // Si cambia la frecuencia y estamos en CUSTOM, ajustamos el array de días
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

  // Cambio estructural (preset, frecuencia u objetivo) invalida los overrides/bloques manuales previos
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
        next[index] = {
          ...next[index],
          muscleGroups: value.split(",").map((s) => s.trim()).filter(Boolean),
        };
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
      if (next.length === 0) return prev; // no dejar el bloque sin ningún tipo elegido
      return { ...prev, [key]: next };
    });
  }

  function addStationBlockToDay(dayIndex: number) {
    setExtraBlocksByDay((prev) => {
      const current = prev[dayIndex] ?? [];
      const day = splitDays[dayIndex];
      const stationNumber = day.blocks.filter((b) => b.type === "MAIN").length + current.length + 1;
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
    if (!memberId) {
      setError("Elegí un cliente antes de generar la rutina.");
      return;
    }
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

  function updateExerciseField(
    dayIndex: number,
    blockIndex: number,
    exerciseIndex: number,
    field: "sets" | "reps" | "rest",
    value: string
  ) {
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
    if (!preview || !memberId) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/routines/from-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          name: routineName || `Rutina ${GOAL_LABELS[goal]}`,
          description,
          goal,
          frequencyPerWeek,
          totalWeeks,
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
    ? preview
        .map((day, index) => ({ day, index }))
        .filter(({ day }) => day.weekNumber === selectedWeek)
    : [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Generador de rutinas automático</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {/* CONFIGURACIÓN */}
      <section className="bg-white border rounded-xl p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cliente</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              disabled={loadingMembers}
            >
              <option value="">Seleccioná un cliente</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre de la rutina</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder={`Rutina ${GOAL_LABELS[goal]}`}
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Objetivo</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={goal}
              onChange={(e) => setGoal(e.target.value as RoutineGoal)}
            >
              {Object.entries(GOAL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Es el objetivo de toda la rutina. Lo que podés variar por día es qué tipo de ejercicio usar (más abajo).
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Descripción / notas</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={2}
              placeholder="Notas para esta rutina (ej: dolor lumbar reciente, prioriza técnica antes de cargar peso)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Frecuencia semanal: {frequencyPerWeek} días
            </label>
            <input
              type="range"
              min={1}
              max={6}
              value={frequencyPerWeek}
              onChange={(e) => setFrequencyPerWeek(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Duración (semanas)</label>
            <input
              type="number"
              min={1}
              max={16}
              className="w-full border rounded-lg px-3 py-2"
              value={totalWeeks}
              onChange={(e) => setTotalWeeks(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="sameEachWeek"
              checked={sameEachWeek}
              onChange={(e) => setSameEachWeek(e.target.checked)}
            />
            <label htmlFor="sameEachWeek" className="text-sm">
              Misma rutina todas las semanas (si no, varía cada semana)
            </label>
          </div>
        </div>

        {/* SPLIT */}
        <div>
          <label className="block text-sm font-medium mb-2">Split</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(SPLIT_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSplitPreset(key)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  splitPreset === key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSplitPreset("CUSTOM")}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                splitPreset === "CUSTOM"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Personalizado
            </button>
          </div>

          {splitPreset === "CUSTOM" && (
            <div className="space-y-2 mb-3">
              {customSplitDaysRaw.map((day, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="border rounded-lg px-2 py-1.5 text-sm w-32"
                    placeholder="Nombre del día"
                    value={day.name}
                    onChange={(e) => updateCustomDay(i, "name", e.target.value)}
                  />
                  <input
                    className="border rounded-lg px-2 py-1.5 text-sm flex-1"
                    placeholder="Grupos musculares separados por coma (dejar vacío en días de cardio/rehab)"
                    value={day.muscleGroups.join(", ")}
                    onChange={(e) => updateCustomDay(i, "muscleGroups", e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* EDITOR DE BLOQUES POR DÍA */}
          <div className="space-y-3">
            {splitDays.map((day, dayIndex) => {
              const extraIds = new Set((extraBlocksByDay[dayIndex] ?? []).map((b) => b.id));
              return (
                <div key={dayIndex} className="border rounded-lg p-3 bg-gray-50">
                  <div className="text-sm font-semibold mb-2">{day.name}</div>

                  <div className="space-y-2">
                    {day.blocks.map((block) => {
                      const key = `${dayIndex}-${block.id}`;
                      const activeTypes = blockTypeOverrides[key] ?? block.exerciseTypes;
                      const showTypeToggle = block.type === "MAIN" && GOAL_EXERCISE_TYPES[goal].length > 1;

                      return (
                        <div key={block.id} className="bg-white border rounded-lg px-3 py-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs">
                              <div className="font-medium">{block.label || BLOCK_TYPE_LABELS[block.type]}</div>
                              <div className="text-gray-400">
                                {BLOCK_TYPE_LABELS[block.type]}{block.mode === "STATIONS" ? " · estaciones" : ""}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                max={12}
                                className="w-14 border rounded px-1.5 py-1 text-center text-sm"
                                value={block.count}
                                onChange={(e) => updateBlockCount(dayIndex, block.id, Number(e.target.value) || 0)}
                              />
                              {extraIds.has(block.id) && (
                                <button
                                  type="button"
                                  onClick={() => removeExtraBlock(dayIndex, block.id)}
                                  className="text-red-500 text-xs"
                                >
                                  Quitar
                                </button>
                              )}
                            </div>
                          </div>

                          {showTypeToggle && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {GOAL_EXERCISE_TYPES[goal].map((type) => {
                                const active = activeTypes.includes(type);
                                return (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => toggleBlockExerciseType(dayIndex, block, type)}
                                    className={`px-2 py-0.5 rounded-full text-[11px] border ${
                                      active
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-600 border-gray-300"
                                    }`}
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
                  </div>

                  <button
                    type="button"
                    onClick={() => addStationBlockToDay(dayIndex)}
                    className="mt-2 text-xs text-blue-600 font-medium"
                  >
                    + Agregar bloque (estación)
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* NIVEL Y PREFERENCIAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nivel de experiencia</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
            >
              {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="prioritizeCompound"
              checked={prioritizeCompound}
              onChange={(e) => setPrioritizeCompound(e.target.checked)}
            />
            <label htmlFor="prioritizeCompound" className="text-sm">
              Priorizar ejercicios compuestos
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Evitar zonas (lesiones, contraindicaciones)</label>
          <div className="flex flex-wrap gap-2">
            {AVOID_MUSCLE_OPTIONS.map((muscle) => {
              const active = avoidMuscleGroups.includes(muscle);
              return (
                <button
                  key={muscle}
                  type="button"
                  onClick={() =>
                    setAvoidMuscleGroups((prev) =>
                      active ? prev.filter((m) => m !== muscle) : [...prev, muscle]
                    )
                  }
                  className={`px-3 py-1 rounded-full text-xs border ${
                    active
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  {muscle}
                </button>
              );
            })}
          </div>
        </div>

        {/* EQUIPAMIENTO */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="useEquipment"
              checked={useEquipmentFilter}
              onChange={(e) => setUseEquipmentFilter(e.target.checked)}
            />
            <label htmlFor="useEquipment" className="text-sm font-medium">
              Filtrar por equipamiento disponible
            </label>
          </div>
          {useEquipmentFilter && (
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => {
                const active = selectedEquipment.includes(eq);
                return (
                  <button
                    key={eq}
                    type="button"
                    onClick={() =>
                      setSelectedEquipment((prev) =>
                        active ? prev.filter((e) => e !== eq) : [...prev, eq]
                      )
                    }
                    className={`px-3 py-1 rounded-full text-xs border ${
                      active
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-700 border-gray-300"
                    }`}
                  >
                    {eq}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium disabled:opacity-50"
        >
          {generating ? "Generando..." : "Generar preview"}
        </button>
      </section>

      {/* PREVIEW */}
      {preview && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Preview de la rutina</h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar rutina"}
            </button>
          </div>

          {!sameEachWeek && totalWeeks > 1 && (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
                <button
                  key={week}
                  type="button"
                  onClick={() => setSelectedWeek(week)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    selectedWeek === week
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  Semana {week}
                </button>
              ))}
            </div>
          )}

          {currentWeekEntries.map(({ day, index: dayIndex }) => (
            <div key={dayIndex} className="bg-white border rounded-xl p-4">
              <h3 className="font-semibold mb-3">
                {day.dayName}
                {!sameEachWeek && ` — Semana ${day.weekNumber}`}
              </h3>

              <div className="space-y-4">
                {day.blocks.map((block, blockIndex) => (
                  <div key={block.blockId}>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1.5">
                      {block.label}
                    </div>
                    {block.exercises.length === 0 ? (
                      <p className="text-xs text-gray-300 italic pb-2">— sin ejercicios en este bloque —</p>
                    ) : (
                      <div className="space-y-2">
                        {block.exercises.map((ex, exIndex) => (
                          <div
                            key={exIndex}
                            className="flex items-center gap-2 text-sm border-b pb-2 last:border-0"
                          >
                            <span className="flex-1">{ex.name}</span>
                            <input
                              type="number"
                              className="w-14 border rounded px-1.5 py-1 text-center"
                              value={ex.sets}
                              onChange={(e) =>
                                updateExerciseField(dayIndex, blockIndex, exIndex, "sets", e.target.value)
                              }
                            />
                            <span className="text-gray-400">×</span>
                            <input
                              className="w-16 border rounded px-1.5 py-1 text-center"
                              value={ex.reps}
                              onChange={(e) =>
                                updateExerciseField(dayIndex, blockIndex, exIndex, "reps", e.target.value)
                              }
                            />
                            <input
                              className="w-16 border rounded px-1.5 py-1 text-center"
                              value={ex.rest}
                              onChange={(e) =>
                                updateExerciseField(dayIndex, blockIndex, exIndex, "rest", e.target.value)
                              }
                            />
                            <button
                              onClick={() => removeExercise(dayIndex, blockIndex, exIndex)}
                              className="text-red-500 text-xs px-2"
                            >
                              Quitar
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
        </section>
      )}
    </div>
  );
}