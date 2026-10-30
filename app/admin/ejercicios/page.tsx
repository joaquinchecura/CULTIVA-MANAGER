"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { 
  Search, Plus, Filter, Dumbbell, Heart, Zap, Wind, X, ChevronDown, 
  Flame, StretchHorizontal, Target, Timer, Snowflake, Wrench, Scale, HeartPulse 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExerciseType } from "@prisma/client";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";

interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  description?: string;
  clientDescription?: string;
  muscleGroup?: string;
  equipment?: string;
  videoUrl?: string;
  imageUrl?: string;
  gifUrl?: string;
  tags: string[];
}

const EXERCISE_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  STRENGTH: { label: "Fuerza", icon: <Dumbbell className="h-3.5 w-3.5" />, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  CARDIO: { label: "Cardio", icon: <Heart className="h-3.5 w-3.5" />, color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  FUNCTIONAL: { label: "Funcional", icon: <Zap className="h-3.5 w-3.5" />, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  MOBILITY: { label: "Movilidad", icon: <StretchHorizontal className="h-3.5 w-3.5" />, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  STRETCHING: { label: "Estiramiento", icon: <Wind className="h-3.5 w-3.5" />, color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" },
  PLYOMETRIC: { label: "Pliometría", icon: <Flame className="h-3.5 w-3.5" />, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  BALANCE: { label: "Equilibrio", icon: <Scale className="h-3.5 w-3.5" />, color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
  TECHNIQUE: { label: "Técnica", icon: <Wrench className="h-3.5 w-3.5" />, color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
  WARMUP: { label: "Calentamiento", icon: <Timer className="h-3.5 w-3.5" />, color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
  COOLDOWN: { label: "Vuelta a la calma", icon: <Snowflake className="h-3.5 w-3.5" />, color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200" },
  REHABILITATION: { label: "Rehabilitación", icon: <HeartPulse className="h-3.5 w-3.5" />, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
  OTHER: { label: "Otro", icon: <Target className="h-3.5 w-3.5" />, color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200" },
};

const EXERCISE_TYPES = Object.keys(EXERCISE_TYPE_CONFIG);

const ALL_KNOWN_MUSCLE_GROUPS = [
  "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Femoral",
  "Glúteos", "Pantorrilla", "Core", "Full body", "Piernas", "Cadera", "Tobillos",
  "Cuello", "Antebrazos", "Piso pélvico", "Mental", "Trapecio", "Eternocleidomastoideo",
  "Isquiotibiales", "Columna Torácica", "Columna Lumbar", "Muñecas",
].sort();

const ALL_KNOWN_EQUIPMENT = [
  "Barra", "Mancuernas", "Polea", "Paralelas", "Mancuerna", "Máquina", "Banco",
  "Cinta", "Elíptica", "Bicicleta", "Remo", "Soga", "Kettlebell", "Balón", "Cajón", "Cajón pliométrico",
  "Trineo", "Cuerdas", "Foam roller", "Palo", "Bosu", "Fitball", "Banda", "Pelota",
  "Peso corporal", "Pista", "TRX", "Sandbag", "Pared", "Balón medicinal",
].sort();

// ExerciseMedia component (sin cambios)
function ExerciseMedia({ imageUrl, gifUrl, videoUrl, name, className }: { 
  imageUrl?: string | null; gifUrl?: string | null; videoUrl?: string | null; name: string; className?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const hasMedia = imageUrl || gifUrl || videoUrl;

  if (!hasMedia || mediaError) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className || ""}`}>
        <Dumbbell className="h-8 w-8 text-muted-foreground/50" />
      </div>
    );
  }

  if (gifUrl) {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-muted ${className || ""}`}
        onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <img src={optimizeCloudinaryUrl(isHovered ? gifUrl : (imageUrl || gifUrl), 400)} alt={name}
          className="h-full w-full object-cover transition-all duration-300" onError={() => setMediaError(true)} />
        {!isHovered && <div className="absolute bottom-2 right-2">
          <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">GIF</span>
        </div>}
      </div>
    );
  }

  if (videoUrl) {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-muted group ${className || ""}`}>
        <img src={optimizeCloudinaryUrl(imageUrl, 400) || ""} alt={name} className="h-full w-full object-cover" onError={() => setMediaError(true)} />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/90 rounded-full p-2">
            <svg className="h-5 w-5 text-primary fill-primary" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg bg-muted ${className || ""}`}>
      <img src={optimizeCloudinaryUrl(imageUrl, 400)!} alt={name} className="h-full w-full object-cover" onError={() => setMediaError(true)} />
    </div>
  );
}

function ExercisesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get("search") ?? "";
  const selectedType = searchParams.get("type") ?? "all";
  const selectedMuscle = searchParams.get("muscleGroup") ?? "all";
  const selectedEquipment = searchParams.get("equipment") ?? "all";
  const selectedTags = searchParams.getAll("tag");
  const tagsKey = selectedTags.join(",");

  const updateParams = useCallback((updates: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      params.delete(key);
      if (value === null) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else if (value && value !== "all") {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  const setSearch = (v: string) => updateParams({ search: v || null });
  const setSelectedType = (v: string) => updateParams({ type: v === "all" ? null : v });
  const setSelectedMuscle = (v: string) => updateParams({ muscleGroup: v === "all" ? null : v });
  const setSelectedEquipment = (v: string) => updateParams({ equipment: v === "all" ? null : v });

  const toggleTag = (tag: string) => {
    const next = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag];
    updateParams({ tag: next.length ? next : null });
  };

  const clearFilters = () => router.replace(pathname, { scroll: false });

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== "all") params.append("type", selectedType);
      if (selectedMuscle !== "all") params.append("muscleGroup", selectedMuscle);
      if (selectedEquipment !== "all") params.append("equipment", selectedEquipment);
      if (search) params.append("search", search);
      if (selectedTags.length > 0) params.append("tag", selectedTags[0]);

      const res = await fetch(`/api/exercises?${params.toString()}`);
      if (!res.ok) throw new Error("Error cargando ejercicios");
      const data = await res.json();
      setExercises(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedMuscle, selectedEquipment, search, tagsKey]);

  useEffect(() => { fetchExercises(); }, [fetchExercises]);

  const activeFiltersCount =
    (selectedType !== "all" ? 1 : 0) + selectedTags.length +
    (selectedMuscle !== "all" ? 1 : 0) + (selectedEquipment !== "all" ? 1 : 0);

  const filteredExercises = exercises.filter((ex) => {
    if (selectedTags.length === 0) return true;
    return selectedTags.every((tag) => ex.tags.includes(tag));
  });

  const allTags = Array.from(new Set(exercises.flatMap((ex) => ex.tags))).sort();

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header compacto */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ejercicios</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {exercises.length} ejercicios en la biblioteca
          </p>
        </div>
        <Button onClick={() => router.push("/admin/ejercicios/nuevo")} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Nuevo ejercicio
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-slate-200 rounded-xl p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar ejercicios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="relative h-9 gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filtros expandidos */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Tipo de ejercicio</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedType("all")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Todos
              </button>
              {EXERCISE_TYPES.map((type) => {
                const config = EXERCISE_TYPE_CONFIG[type];
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selectedType === type
                        ? `${config.bg} ${config.color} ${config.border}`
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {config.icon}
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Grupo muscular</label>
              <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
              <Button variant="outline" className="w-full justify-between h-9 text-sm">
                    {selectedMuscle === "all" ? "Todos los grupos" : selectedMuscle}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-h-64 overflow-auto">
                  <DropdownMenuCheckboxItem checked={selectedMuscle === "all"} onCheckedChange={() => setSelectedMuscle("all")}>Todos</DropdownMenuCheckboxItem>
                  {ALL_KNOWN_MUSCLE_GROUPS.map(mg => (
                    <DropdownMenuCheckboxItem key={mg} checked={selectedMuscle === mg} onCheckedChange={() => setSelectedMuscle(mg)}>{mg}</DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Equipamiento</label>
              <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                 <Button variant="outline" className="w-full justify-between h-9 text-sm">
                    {selectedEquipment === "all" ? "Todo el equipamiento" : selectedEquipment}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-h-64 overflow-auto">
                  <DropdownMenuCheckboxItem checked={selectedEquipment === "all"} onCheckedChange={() => setSelectedEquipment("all")}>Todos</DropdownMenuCheckboxItem>
                  {ALL_KNOWN_EQUIPMENT.map(eq => (
                    <DropdownMenuCheckboxItem key={eq} checked={selectedEquipment === eq} onCheckedChange={() => setSelectedEquipment(eq)}>{eq}</DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {allTags.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      selectedTags.includes(tag) ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}>{tag}</button>
                ))}
              </div>
            </div>
          )}

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
              <X className="h-3 w-3 mr-1" /> Limpiar filtros
            </Button>
          )}
        </div>
      )}

      {/* Tags activos */}
      {activeFiltersCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500 font-medium">Filtros:</span>
          {selectedType !== "all" && (
            <Badge variant="secondary" className="cursor-pointer text-xs" onClick={() => setSelectedType("all")}>
              {EXERCISE_TYPE_CONFIG[selectedType]?.label}<X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {selectedMuscle !== "all" && (
            <Badge variant="secondary" className="cursor-pointer text-xs" onClick={() => setSelectedMuscle("all")}>
              {selectedMuscle}<X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {selectedEquipment !== "all" && (
            <Badge variant="secondary" className="cursor-pointer text-xs" onClick={() => setSelectedEquipment("all")}>
              {selectedEquipment}<X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {selectedTags.map(tag => (
            <Badge key={tag} variant="secondary" className="cursor-pointer text-xs" onClick={() => toggleTag(tag)}>
              {tag}<X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      {/* Grid de ejercicios */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
              <div className="h-40 bg-slate-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <Dumbbell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No se encontraron ejercicios</h3>
          <p className="text-sm text-slate-500 mt-1">Probá con otros filtros o creá uno nuevo.</p>
          <Button className="mt-4 gap-2" onClick={() => router.push("/admin/ejercicios/nuevo")}>
            <Plus className="h-4 w-4" /> Crear ejercicio
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredExercises.map((exercise) => {
            const typeConfig = EXERCISE_TYPE_CONFIG[exercise.type] || EXERCISE_TYPE_CONFIG["OTHER"];
            return (
              <div
                key={exercise.id}
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                onClick={() => router.push(`/admin/ejercicios/${exercise.id}`)}
              >
                <div className="aspect-video relative bg-slate-100">
                  <ExerciseMedia
                    imageUrl={exercise.imageUrl}
                    gifUrl={exercise.gifUrl}
                    videoUrl={exercise.videoUrl}
                    name={exercise.name}
                    className="h-full w-full"
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border}`}>
                      {typeConfig.icon}
                      {typeConfig.label}
                    </span>
                  </div>
                  {exercise.equipment && (
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
                        {exercise.equipment}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-sm text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                    {exercise.name}
                  </h3>
                  {exercise.muscleGroup && (
                    <p className="text-xs text-slate-500 mt-0.5">{exercise.muscleGroup}</p>
                  )}
                  {exercise.clientDescription && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {exercise.clientDescription}
                    </p>
                  )}
                  {exercise.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {exercise.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{tag}</span>
                      ))}
                      {exercise.tags.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">+{exercise.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ExercisesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Cargando...</div>}>
      <ExercisesPageContent />
    </Suspense>
  );
}