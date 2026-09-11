"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  SPLIT_PRESETS,
  resolveSplitDays,
  type SplitDay,
  type GeneratedDay,
} from "@/lib/routine-generator";
import { RoutineGoal } from "@prisma/client";

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
  "Barra",
  "Mancuernas",
  "Mancuerna",
  "Polea",
  "Máquina",
  "Kettlebell",
  "Banda",
  "TRX",
  "Peso corporal",
  "Cajón pliométrico",
  "Fitball",
  "Bosu",
];

export default function GenerarRutinaPage() {
  const router = useRouter();

  // --- Datos base ---
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // --- Config del formulario ---
  const [memberId, setMemberId] = useState<string>("");
  const [routineName, setRoutineName] = useState("");
  const [goal, setGoal] = useState<RoutineGoal>("HYPERTROPHY");
  const [frequencyPerWeek, setFrequencyPerWeek] = useState(3);
  const [totalWeeks, setTotalWeeks] = useState(4);
  const [sameEachWeek, setSameEachWeek] = useState(true);
  const [splitPreset, setSplitPreset] = useState<string>("FULL_BODY");
  const [customSplitDays, setCustomSplitDays] = useState<SplitDay[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [useEquipmentFilter, setUseEquipmentFilter] = useState(false);

  // --- Estado de generación ---
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

  // Split efectivo: preset resuelto o el manual editado por el coach
  const splitDays: SplitDay[] = useMemo(() => {
    if (splitPreset === "CUSTOM") {
      return customSplitDays;
    }
    try {
      return resolveSplitDays(splitPreset, frequencyPerWeek);
    } catch {
      return [];
    }
  }, [splitPreset, frequencyPerWeek, customSplitDays]);

  // Si cambia la frecuencia y estamos en CUSTOM, ajustamos el array de días
  useEffect(() => {
    if (splitPreset !== "CUSTOM") return;
    setCustomSplitDays((prev) => {
      const next = [...prev];
      while (next.length < frequencyPerWeek) {
        next.push({ name: `Día ${next.length + 1}`, muscleGroups: [] });
      }
      return next.slice(0, frequencyPerWeek);
    });
  }, [frequencyPerWeek, splitPreset]);

  function updateCustomDay(index: number, field: keyof SplitDay, value: string) {
    setCustomSplitDays((prev) => {
      const next = [...prev];
      if (field === "name") {
        next[index] = { ...next[index], name: value };
      } else {
        next[index] = {
          ...next[index],
          muscleGroups: value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        };
      }
      return next;
    });
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
          goal,
          frequencyPerWeek,
          totalWeeks,
          sameEachWeek,
          splitDays,
          availableEquipment: useEquipmentFilter ? selectedEquipment : null,
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

  function removeExercise(dayIndex: number, exerciseIndex: number) {
    setPreview((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const day = { ...next[dayIndex] };
      day.exercises = day.exercises.filter((_, i) => i !== exerciseIndex);
      next[dayIndex] = day;
      return next;
    });
  }

  function updateExerciseField(
    dayIndex: number,
    exerciseIndex: number,
    field: "sets" | "reps" | "rest",
    value: string
  ) {
    setPreview((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const day = { ...next[dayIndex] };
      const exercises = [...day.exercises];
      exercises[exerciseIndex] = {
        ...exercises[exerciseIndex],
        [field]: field === "sets" ? Number(value) || 0 : value,
      };
      day.exercises = exercises;
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
          goal,
          frequencyPerWeek,
          totalWeeks,
          days: preview,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar la rutina");
      router.push(`/admin/members/${memberId}/rutinas/${data.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // Solo los días de la semana seleccionada, con su índice real dentro de `preview`
  // (los handlers de edición necesitan ese índice real, no la posición dentro del filtro)
  const currentWeekEntries = preview
    ? preview
        .map((day, index) => ({ day, index }))
        .filter(({ day }) => day.weekNumber === selectedWeek)
    : [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Generador de rutinas</h1>

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

          {splitPreset === "CUSTOM" ? (
            <div className="space-y-2">
              {customSplitDays.map((day, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="border rounded-lg px-2 py-1.5 text-sm w-32"
                    placeholder="Nombre del día"
                    value={day.name}
                    onChange={(e) => updateCustomDay(i, "name", e.target.value)}
                  />
                  <input
                    className="border rounded-lg px-2 py-1.5 text-sm flex-1"
                    placeholder="Grupos musculares separados por coma (ej: Pecho, Hombros, Tríceps)"
                    value={day.muscleGroups.join(", ")}
                    onChange={(e) => updateCustomDay(i, "muscleGroups", e.target.value)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {splitDays.map((d) => d.name).join(" → ")}
            </div>
          )}
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
              <div className="space-y-2">
                {day.exercises.map((ex, exIndex) => (
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
                        updateExerciseField(dayIndex, exIndex, "sets", e.target.value)
                      }
                    />
                    <span className="text-gray-400">×</span>
                    <input
                      className="w-16 border rounded px-1.5 py-1 text-center"
                      value={ex.reps}
                      onChange={(e) =>
                        updateExerciseField(dayIndex, exIndex, "reps", e.target.value)
                      }
                    />
                    <input
                      className="w-16 border rounded px-1.5 py-1 text-center"
                      value={ex.rest}
                      onChange={(e) =>
                        updateExerciseField(dayIndex, exIndex, "rest", e.target.value)
                      }
                    />
                    <button
                      onClick={() => removeExercise(dayIndex, exIndex)}
                      className="text-red-500 text-xs px-2"
                    >
                      Quitar
                    </button>
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