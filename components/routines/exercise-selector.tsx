"use client";

import { useState, useEffect } from "react";
import { getExercises } from "@/app/actions/routines";
import { Search, Plus, Dumbbell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Exercise {
  id: string;
  name: string;
  type: string;
  muscleGroup: string | null;
  equipment: string | null;
  tags: string[];
}

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void;
  selectedIds?: string[];
}

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

export function ExerciseSelector({ onSelect, selectedIds = [] }: ExerciseSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) loadExercises();
  }, [open, search, typeFilter]);

  async function loadExercises() {
    setLoading(true);
    const data = await getExercises(search || undefined, typeFilter || undefined);
    setExercises(data);
    setLoading(false);
  }

  const types = Object.keys(exerciseTypeLabels);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
  <Button variant="outline" size="sm" className="gap-2">
    <Plus size={14} /> Agregar ejercicio
  </Button>
</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell size={18} /> Biblioteca de ejercicios
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <Input
              placeholder="Buscar ejercicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-md px-3 text-sm text-zinc-300"
          >
            <option value="">Todos</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {exerciseTypeLabels[t]}
              </option>
            ))}
          </select>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-2 py-2">
            {loading ? (
              <p className="text-zinc-500 text-center py-8">Cargando...</p>
            ) : exercises.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">No se encontraron ejercicios</p>
            ) : (
              exercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    onSelect(ex);
                    setOpen(false);
                  }}
                  disabled={selectedIds.includes(ex.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedIds.includes(ex.id)
                      ? "border-zinc-700 bg-zinc-900/50 opacity-50 cursor-not-allowed"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white text-sm">{ex.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {exerciseTypeLabels[ex.type] || ex.type}
                        </Badge>
                        {ex.muscleGroup && (
                          <span className="text-xs text-zinc-500">{ex.muscleGroup}</span>
                        )}
                        {ex.equipment && (
                          <span className="text-xs text-zinc-500">• {ex.equipment}</span>
                        )}
                      </div>
                    </div>
                    {!selectedIds.includes(ex.id) && <Plus size={16} className="text-zinc-400" />}
                  </div>
                  {ex.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {ex.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}