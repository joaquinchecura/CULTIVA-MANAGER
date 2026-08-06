export const dynamic = "force-dynamic";

import { getExercises, createExercise } from "@/app/actions/routines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Dumbbell, Plus, Search, Tag } from "lucide-react";

const exerciseTypeLabels: Record<string, string> = {
  STRENGTH: "Fuerza",
  CARDIO: "Cardio",
  FUNCTIONAL: "Funcional",
  MOBILITY: "Movilidad",
  STRETCHING: "Estiramiento",
  PLYOMETRIC: "Pliometría",
  BALANCE: "Equilibrio",
  TECHNIQUE: "Técnica",
  WARMUP: "Calentamiento",
  COOLDOWN: "Vuelta a la calma",
  OTHER: "Otro",
};

export default async function EjerciciosPage({
  searchParams,
}: {
  searchParams: { search?: string; type?: string };
}) {
  const params = await searchParams;
  const exercises = await getExercises(params.search, params.type);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">🏋️ Ejercicios</h2>
          <p className="text-slate-500 mt-1">Biblioteca de ejercicios disponibles</p>
        </div>
        <Dialog>
          <DialogTrigger>
            <Button className="gap-2">
              <Plus size={16} /> Nuevo ejercicio
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Crear ejercicio</DialogTitle>
            </DialogHeader>
            <form
              action={async (formData) => {
                "use server";
                await createExercise({
                  name: formData.get("name") as string,
                  type: formData.get("type") as string,
                  description: formData.get("description") as string,
                  muscleGroup: formData.get("muscleGroup") as string,
                  equipment: formData.get("equipment") as string,
                  tags: (formData.get("tags") as string)
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label className="text-slate-700">Nombre</Label>
                <Input name="name" required className="bg-white border-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Tipo</Label>
                  <select
                    name="type"
                    required
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900"
                  >
                    {Object.entries(exerciseTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Grupo muscular</Label>
                  <Input name="muscleGroup" className="bg-white border-slate-200" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Equipamiento</Label>
                <Input name="equipment" className="bg-white border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Tags (separados por coma)</Label>
                <Input name="tags" placeholder="press, pecho, compound" className="bg-white border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Descripción</Label>
                <Input name="description" className="bg-white border-slate-200" />
              </div>
              <Button type="submit" className="w-full">
                Crear ejercicio
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <form className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <Input
            name="search"
            defaultValue={searchParams.search}
            placeholder="Buscar ejercicio..."
            className="pl-9 bg-white border-slate-200"
          />
        </div>
        <select
          name="type"
          defaultValue={searchParams.type || ""}
          className="bg-white border border-slate-200 rounded-md px-3 text-sm text-slate-900"
        >
          <option value="">Todos</option>
          {Object.entries(exerciseTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filtrar
        </Button>
      </form>

      <div className="grid gap-3">
        {exercises.map((ex) => (
          <Card key={ex.id} className="bg-white border-slate-200">
            <CardContent className="p-4">
              <div>
                <h3 className="font-medium text-slate-900">{ex.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {exerciseTypeLabels[ex.type] || ex.type}
                  </Badge>
                  {ex.muscleGroup && (
                    <span className="text-xs text-slate-500">{ex.muscleGroup}</span>
                  )}
                  {ex.equipment && (
                    <span className="text-xs text-slate-500">• {ex.equipment}</span>
                  )}
                </div>
                {ex.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {ex.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 flex items-center gap-0.5"
                      >
                        <Tag size={8} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}