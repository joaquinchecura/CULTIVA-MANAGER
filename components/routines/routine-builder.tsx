"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoutine, updateRoutine } from "@/app/actions/routines";
import { ExerciseSelector } from "./exercise-selector";
import { ExerciseCard } from "./ExerciseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dumbbell,
  Trash2,
  GripVertical,
  Plus,
  Save,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { ExerciseType } from "@prisma/client";

interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  muscleGroup: string | null;
  equipment: string | null;
  tags: string[];
  description?: string;
  clientDescription?: string;
  imageUrl?: string;
  gifUrl?: string;
  videoUrl?: string;
}

interface RoutineExercise {
  id?: string;
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  reps: string;
  rest: string;
  order: number;
  notes: string;
}

interface RoutineDay {
  id?: string;
  dayName: string;
  order: number;
  exercises: RoutineExercise[];
}

interface RoutineBuilderProps {
  members: { id: string; firstName: string; lastName: string }[];
  initialData?: {
    id: string;
    memberId: string;
    name: string;
    description: string | null;
    goal: string | null;
    frequencyPerWeek: number | null;
    days: {
      id: string;
      dayName: string;
      order: number;
      exercises: {
        id: string;
        exerciseId: string;
        exercise: Exercise;
        sets: number;
        reps: string;
        rest: string | null;
        order: number;
        notes: string | null;
      }[];
    }[];
  };
}

const goals = [
  { value: "HYPERTROPHY", label: "Hipertrofia" },
  { value: "STRENGTH", label: "Fuerza" },
  { value: "ENDURANCE", label: "Resistencia" },
  { value: "WEIGHT_LOSS", label: "Pérdida de peso" },
  { value: "MAINTENANCE", label: "Mantenimiento" },
  { value: "REHABILITATION", label: "Rehabilitación" },
];

const dayNames = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export function RoutineBuilder({ members, initialData }: RoutineBuilderProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [memberId, setMemberId] = useState(initialData?.memberId || "");
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [goal, setGoal] = useState(initialData?.goal || "");
  const [frequency, setFrequency] = useState(initialData?.frequencyPerWeek?.toString() || "");
  const [days, setDays] = useState<RoutineDay[]>(
    initialData?.days.map((d) => ({
      id: d.id,
      dayName: d.dayName,
      order: d.order,
      exercises: d.exercises.map((ex) => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        exercise: ex.exercise,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest || "",
        order: ex.order,
        notes: ex.notes || "",
      })),
    })) || []
  );
  const [saving, setSaving] = useState(false);

  function addDay() {
    const usedNames = days.map((d) => d.dayName);
    const nextName = dayNames.find((n) => !usedNames.includes(n)) || `Día ${days.length + 1}`;
    setDays([
      ...days,
      {
        dayName: nextName,
        order: days.length,
        exercises: [],
      },
    ]);
  }

  function removeDay(index: number) {
    const newDays = days.filter((_, i) => i !== index);
    setDays(newDays.map((d, i) => ({ ...d, order: i })));
  }

  function moveDay(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === days.length - 1) return;
    const newDays = [...days];
    const temp = newDays[index];
    newDays[index] = newDays[direction === "up" ? index - 1 : index + 1];
    newDays[direction === "up" ? index - 1 : index + 1] = temp;
    setDays(newDays.map((d, i) => ({ ...d, order: i })));
  }

  function updateDayName(index: number, name: string) {
    const newDays = [...days];
    newDays[index].dayName = name;
    setDays(newDays);
  }

  function addExercise(dayIndex: number, exercise: Exercise) {
    const newDays = [...days];
    newDays[dayIndex].exercises.push({
      exerciseId: exercise.id,
      exercise,
      sets: 3,
      reps: "10",
      rest: "60s",
      order: newDays[dayIndex].exercises.length,
      notes: "",
    });
    setDays(newDays);
  }

  function removeExercise(dayIndex: number, exIndex: number) {
    const newDays = [...days];
    newDays[dayIndex].exercises = newDays[dayIndex].exercises
      .filter((_, i) => i !== exIndex)
      .map((ex, i) => ({ ...ex, order: i }));
    setDays(newDays);
  }

  function moveExercise(dayIndex: number, exIndex: number, direction: "up" | "down") {
    const exs = days[dayIndex].exercises;
    if (direction === "up" && exIndex === 0) return;
    if (direction === "down" && exIndex === exs.length - 1) return;
    const newDays = [...days];
    const temp = newDays[dayIndex].exercises[exIndex];
    newDays[dayIndex].exercises[exIndex] =
      newDays[dayIndex].exercises[direction === "up" ? exIndex - 1 : exIndex + 1];
    newDays[dayIndex].exercises[direction === "up" ? exIndex - 1 : exIndex + 1] = temp;
    newDays[dayIndex].exercises = newDays[dayIndex].exercises.map((ex, i) => ({
      ...ex,
      order: i,
    }));
    setDays(newDays);
  }

  function updateExercise(dayIndex: number, exIndex: number, field: string, value: any) {
    const newDays = [...days];
    (newDays[dayIndex].exercises[exIndex] as any)[field] = value;
    setDays(newDays);
  }

  async function handleSave() {
    if (!memberId || !name || days.length === 0) {
      alert("Completá al menos: cliente, nombre y un día con ejercicios.");
      return;
    }

    setSaving(true);

    const payload = {
      memberId,
      name,
      description: description || null,
      goal: goal || null,
      frequencyPerWeek: frequency ? parseInt(frequency) : null,
      days: days.map((day) => ({
        dayName: day.dayName,
        order: day.order,
        exercises: day.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest || null,
          order: ex.order,
          notes: ex.notes || null,
        })),
      })),
    };

    try {
      if (isEditing && initialData) {
        await updateRoutine(initialData.id, payload);
      } else {
        await createRoutine(payload);
      }
      router.push("/admin/rutinas");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la rutina");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {isEditing ? "✏️ Editar rutina" : "🎯 Nueva rutina"}
        </h1>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save size={16} />
          {saving ? "Guardando..." : "Guardar rutina"}
        </Button>
      </div>

      {/* Basic Info */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Información básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Cliente</Label>
              <Select value={memberId} onValueChange={(value) => setMemberId(value || "")}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Nombre de la rutina</Label>
              <Input
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="Ej: Rutina de fuerza - Upper/Lower"
                className="bg-white border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Objetivo</Label>
              <Select value={goal} onValueChange={(value) => setGoal(value || "")}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Objetivo..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {goals.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Frecuencia (días/semana)</Label>
              <Input
                type="number"
                min={1}
                max={7}
                value={frequency}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrequency(e.target.value)}
                placeholder="3"
                className="bg-white border-slate-200"
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <Label className="text-slate-700">Descripción</Label>
              <Textarea
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Notas generales sobre la rutina..."
                className="bg-white border-slate-200 min-h-[60px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Days */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Días de entrenamiento</h2>
          <Button onClick={addDay} variant="outline" size="sm" className="gap-2">
            <Plus size={14} /> Agregar día
          </Button>
        </div>

        {days.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <Dumbbell className="mx-auto text-slate-400 mb-3" size={32} />
            <p className="text-slate-500">Agregá el primer día de entrenamiento</p>
          </div>
        )}

        {days.map((day, dayIndex) => (
          <Card key={dayIndex} className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical size={18} className="text-slate-400 cursor-grab" />
                  <div>
                    <Input
                      value={day.dayName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDayName(dayIndex, e.target.value)}
                      className="bg-white border-slate-200 w-48 font-medium text-slate-900"
                    />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                    {day.exercises.length} ejercicios
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveDay(dayIndex, "up")}
                    disabled={dayIndex === 0}
                    className="h-8 w-8 text-slate-600 hover:text-slate-900"
                  >
                    <ChevronUp size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveDay(dayIndex, "down")}
                    disabled={dayIndex === days.length - 1}
                    className="h-8 w-8 text-slate-600 hover:text-slate-900"
                  >
                    <ChevronDown size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDay(dayIndex)}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {day.exercises.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">
                  Este día no tiene ejercicios
                </p>
              ) : (
                <div className="space-y-2">
                  {day.exercises.map((ex, exIndex) => (
                    <ExerciseCard
                      key={exIndex}
                      exercise={ex.exercise}
                      showDragHandle={true}
                    >
                      {/* Configuración de sets/reps/rest */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Series</Label>
                          <Input
                            type="number"
                            min={1}
                            value={ex.sets}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateExercise(dayIndex, exIndex, "sets", parseInt(e.target.value) || 1)
                            }
                            className="w-14 h-7 bg-background border text-center text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Reps</Label>
                          <Input
                            value={ex.reps}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateExercise(dayIndex, exIndex, "reps", e.target.value)
                            }
                            className="w-16 h-7 bg-background border text-center text-xs"
                            placeholder="10"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Desc</Label>
                          <Input
                            value={ex.rest}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateExercise(dayIndex, exIndex, "rest", e.target.value)
                            }
                            className="w-16 h-7 bg-background border text-center text-xs"
                            placeholder="60s"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        <Input
                          value={ex.notes}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateExercise(dayIndex, exIndex, "notes", e.target.value)
                          }
                          className="w-40 h-7 bg-background border text-xs hidden md:block"
                          placeholder="Notas..."
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div className="flex items-center gap-0.5 ml-auto">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); moveExercise(dayIndex, exIndex, "up"); }}
                            disabled={exIndex === 0}
                            className="h-7 w-7"
                          >
                            <ChevronUp size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); moveExercise(dayIndex, exIndex, "down"); }}
                            disabled={exIndex === day.exercises.length - 1}
                            className="h-7 w-7"
                          >
                            <ChevronDown size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); removeExercise(dayIndex, exIndex); }}
                            className="h-7 w-7 text-destructive hover:text-destructive"
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      </div>
                    </ExerciseCard>
                  ))}
                </div>
              )}

              <ExerciseSelector
                onSelect={(exercise: Exercise) => addExercise(dayIndex, exercise)}
                selectedIds={day.exercises.map((ex) => ex.exerciseId)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}