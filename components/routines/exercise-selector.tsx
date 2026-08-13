"use client";

import { useState, useEffect } from "react";
import { getExercises } from "@/app/actions/routines";
import { Search, Plus, Dumbbell, X } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Exercise {
  id: string;
  name: string;
  type: string;
  muscleGroup?: string;
  equipment?: string;
  tags: string[];
  description?: string;
  clientDescription?: string;
  imageUrl?: string;
  gifUrl?: string;
  videoUrl?: string;
}

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void;
  selectedIds?: string[];
}

const exerciseTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
  STRENGTH: { label: "Fuerza", color: "text-blue-700", bg: "bg-blue-100" },
  CARDIO: { label: "Cardio", color: "text-red-700", bg: "bg-red-100" },
  FUNCTIONAL: { label: "Funcional", color: "text-amber-700", bg: "bg-amber-100" },
  MOBILITY: { label: "Movilidad", color: "text-emerald-700", bg: "bg-emerald-100" },
  STRETCHING: { label: "Estiramiento", color: "text-teal-700", bg: "bg-teal-100" },
  PLYOMETRIC: { label: "Pliometría", color: "text-orange-700", bg: "bg-orange-100" },
  BALANCE: { label: "Equilibrio", color: "text-violet-700", bg: "bg-violet-100" },
  TECHNIQUE: { label: "Técnica", color: "text-slate-700", bg: "bg-slate-100" },
  WARMUP: { label: "Calentamiento", color: "text-rose-700", bg: "bg-rose-100" },
  COOLDOWN: { label: "Vuelta a la calma", color: "text-cyan-700", bg: "bg-cyan-100" },
  OTHER: { label: "Otro", color: "text-gray-700", bg: "bg-gray-100" },
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
    try {
      const data = await getExercises(search || undefined, typeFilter || undefined);
      setExercises(data.map((ex: any) => ({
          ...ex,
          muscleGroup: ex.muscleGroup || undefined,
          equipment: ex.equipment || undefined,
          description: ex.description || undefined,
          clientDescription: ex.clientDescription || undefined,
          imageUrl: ex.imageUrl || undefined,
          gifUrl: ex.gifUrl || undefined,
          videoUrl: ex.videoUrl || undefined,
        })));
    } catch (err) {
      console.error("Error cargando ejercicios:", err);
    } finally {
      setLoading(false);
    }
  }

  const types = Object.keys(exerciseTypeConfig);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm" className="gap-2 w-full">
          <Plus size={14} /> Agregar ejercicio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col bg-white border-slate-200 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Dumbbell size={18} /> Biblioteca de ejercicios
          </DialogTitle>
        </DialogHeader>

        {/* Search & filters */}
        <div className="px-6 py-2 flex gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input
              placeholder="Buscar ejercicio..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={typeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los tipos</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {exerciseTypeConfig[t]?.label || t}
              </option>
            ))}
          </select>
        </div>

        {/* Type chips */}
        <div className="px-6 pb-2 flex flex-wrap gap-1.5 shrink-0">
          <button
            onClick={() => setTypeFilter("")}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              typeFilter === ""
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos
          </button>
          {types.map((t) => {
            const config = exerciseTypeConfig[t];
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? "" : t)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  typeFilter === t
                    ? `${config.bg} ${config.color} ring-1 ring-offset-1 ring-current`
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-hidden px-6 pb-6">
          <ScrollArea className="h-full">
            <div className="space-y-2 py-2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-slate-300 border-t-slate-900 rounded-full mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Cargando ejercicios...</p>
                </div>
              ) : exercises.length === 0 ? (
                <div className="text-center py-8">
                  <Dumbbell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-slate-500 text-sm">No se encontraron ejercicios</p>
                  <p className="text-slate-400 text-xs mt-1">Probá con otros filtros</p>
                </div>
              ) : (
                exercises.map((ex) => {
                  const isSelected = selectedIds.includes(ex.id);
                  const config = exerciseTypeConfig[ex.type] || exerciseTypeConfig["OTHER"];

                  return (
                    <TooltipProvider key={ex.id} >
                      <Tooltip>
                        <TooltipTrigger>
                          <button
                            onClick={() => {
                              if (!isSelected) {
                                onSelect(ex);
                                setOpen(false);
                              }
                            }}
                            disabled={isSelected}
                            className={`w-full text-left rounded-lg border transition-all ${
                              isSelected
                                ? "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
                                : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm hover:bg-blue-50/30"
                            }`}
                          >
                            <div className="flex items-start gap-3 p-3">
                              {/* Thumbnail */}
                              <div className="w-14 h-14 rounded-md bg-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
                                {ex.imageUrl || ex.gifUrl ? (
                                  <img
                                    src={ex.imageUrl || ex.gifUrl}
                                    alt={ex.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <Dumbbell className="h-5 w-5 text-slate-300" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-slate-900 text-sm truncate">
                                    {ex.name}
                                  </h4>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}>
                                    {config.label}
                                  </span>
                                </div>

                                {ex.clientDescription && (
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                    {ex.clientDescription}
                                  </p>
                                )}

                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  {ex.muscleGroup && (
                                    <span className="text-[10px] text-slate-500">{ex.muscleGroup}</span>
                                  )}
                                  {ex.equipment && (
                                    <span className="text-[10px] text-slate-400">· {ex.equipment}</span>
                                  )}
                                </div>

                                {ex.tags.length > 0 && (
                                  <div className="flex gap-1 mt-1.5 flex-wrap">
                                    {ex.tags.slice(0, 3).map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {ex.tags.length > 3 && (
                                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-400">
                                        +{ex.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="shrink-0 self-center">
                                {isSelected ? (
                                  <span className="text-[10px] text-slate-400 font-medium">Agregado</span>
                                ) : (
                                  <div className="bg-blue-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus size={14} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        </TooltipTrigger>

                        {ex.clientDescription && (
                          <TooltipContent side="right" className="max-w-xs bg-slate-900 text-white border-slate-800">
                            <p className="text-xs leading-relaxed">{ex.clientDescription}</p>
                            {ex.gifUrl && (
                              <p className="text-[10px] text-slate-400 mt-1">🎬 Tiene GIF de demostración</p>
                            )}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}