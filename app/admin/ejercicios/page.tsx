"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Plus, Filter, Dumbbell, Heart, Zap, Wind, X, ChevronDown, Flame, StretchHorizontal, Target, Timer, Snowflake, Wrench, Scale, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExerciseType } from "@prisma/client";

// ─── Tipos ─────────────────────────────────────────────
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

// ─── Configuración de tipos ────────────────────────────
const EXERCISE_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  STRENGTH: { label: "Fuerza", icon: <Dumbbell className="h-3.5 w-3.5" />, color: "text-blue-700", bg: "bg-blue-100" },
  CARDIO: { label: "Cardio", icon: <Heart className="h-3.5 w-3.5" />, color: "text-red-700", bg: "bg-red-100" },
  FUNCTIONAL: { label: "Funcional", icon: <Zap className="h-3.5 w-3.5" />, color: "text-amber-700", bg: "bg-amber-100" },
  MOBILITY: { label: "Movilidad", icon: <StretchHorizontal className="h-3.5 w-3.5" />, color: "text-emerald-700", bg: "bg-emerald-100" },
  STRETCHING: { label: "Estiramiento", icon: <Wind className="h-3.5 w-3.5" />, color: "text-teal-700", bg: "bg-teal-100" },
  PLYOMETRIC: { label: "Pliometría", icon: <Flame className="h-3.5 w-3.5" />, color: "text-orange-700", bg: "bg-orange-100" },
  BALANCE: { label: "Equilibrio", icon: <Scale className="h-3.5 w-3.5" />, color: "text-violet-700", bg: "bg-violet-100" },
  TECHNIQUE: { label: "Técnica", icon: <Wrench className="h-3.5 w-3.5" />, color: "text-slate-700", bg: "bg-slate-100" },
  WARMUP: { label: "Calentamiento", icon: <Timer className="h-3.5 w-3.5" />, color: "text-rose-700", bg: "bg-rose-100" },
  COOLDOWN: { label: "Vuelta a la calma", icon: <Snowflake className="h-3.5 w-3.5" />, color: "text-cyan-700", bg: "bg-cyan-100" },
  REHABILITATION: {label: "Rehabilitación",icon: <HeartPulse className="h-3.5 w-3.5" />,color: "text-indigo-700",bg: "bg-indigo-100"},
  OTHER: { label: "Otro", icon: <Target className="h-3.5 w-3.5" />, color: "text-gray-700", bg: "bg-gray-100" },
};

const EXERCISE_TYPES = Object.keys(EXERCISE_TYPE_CONFIG);

const ALL_KNOWN_MUSCLE_GROUPS = [
  "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Femoral",
  "Glúteos", "Pantorrilla", "Core", "Full body", "Piernas", "Cadera", "Tobillos",
  "Cuello", "Antebrazos", "Piso pélvico", "Mental", "Trapecio", "Eternocleidomastoideo", "Isquiotibiales", "Columna Torácica", "Columna Lumbar", 
];

const ALL_KNOWN_EQUIPMENT = [
  "Barra", "Mancuernas", "Polea", "Paralelas", "Mancuerna", "Máquina", "Banco",
  "Cinta", "Elíptica", "Bicicleta", "Remo", "Soga", "Kettlebell", "Balón", "Cajón", "Cajón pliométrico",
  "Trineo", "Cuerdas", "Foam roller", "Palo", "Bosu", "Fitball", "Banda", "Pelota",
  "Peso corporal", "Pista"
];

// ─── ExerciseMedia inline (no necesita archivo separado) ──
function ExerciseMedia({ 
  imageUrl, 
  gifUrl, 
  videoUrl, 
  name, 
  className 
}: { 
  imageUrl?: string | null; 
  gifUrl?: string | null; 
  videoUrl?: string | null; 
  name: string; 
  className?: string;
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
      <div 
        className={`relative overflow-hidden rounded-lg bg-muted ${className || ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={isHovered ? gifUrl : (imageUrl || gifUrl)}
          alt={name}
          className="h-full w-full object-cover transition-all duration-300"
          onError={() => setMediaError(true)}
        />
        {!isHovered && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
              GIF
            </span>
          </div>
        )}
      </div>
    );
  }

  if (videoUrl) {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-muted group ${className || ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl || ""}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setMediaError(true)}
        />
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl!}
        alt={name}
        className="h-full w-full object-cover"
        onError={() => setMediaError(true)}
      />
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

  // ── Filtros derivados de la URL (fuente única de verdad) ──
  const search = searchParams.get("search") ?? "";
  const selectedType = searchParams.get("type") ?? "all";
  const selectedMuscle = searchParams.get("muscleGroup") ?? "all";
  const selectedEquipment = searchParams.get("equipment") ?? "all";
  const selectedTags = searchParams.getAll("tag");
  const tagsKey = selectedTags.join(","); // para dependencias estables

  const updateParams = useCallback(
    (updates: Record<string, string | string[] | null>) => {
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
    },
    [searchParams, router, pathname]
  );

  const setSearch = (v: string) => updateParams({ search: v || null });
  const setSelectedType = (v: string) => updateParams({ type: v === "all" ? null : v });
  const setSelectedMuscle = (v: string) => updateParams({ muscleGroup: v === "all" ? null : v });
  const setSelectedEquipment = (v: string) => updateParams({ equipment: v === "all" ? null : v });

  const toggleTag = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    updateParams({ tag: next.length ? next : null });
  };

  const clearFilters = () => {
    router.replace(pathname, { scroll: false });
  };

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
  }, [selectedType, selectedMuscle, selectedEquipment, search, tagsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const activeFiltersCount =
    (selectedType !== "all" ? 1 : 0) +
    selectedTags.length +
    (selectedMuscle !== "all" ? 1 : 0) +
    (selectedEquipment !== "all" ? 1 : 0);

  const filteredExercises = exercises.filter((ex) => {
    if (selectedTags.length === 0) return true;
    return selectedTags.every((tag) => ex.tags.includes(tag));
  });

  const allTags = Array.from(new Set(exercises.flatMap((ex) => ex.tags))).sort();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Ejercicios</h1>
              <p className="text-muted-foreground mt-1">
                {exercises.length} ejercicios en la biblioteca
              </p>
            </div>
            <Button onClick={() => router.push("/admin/ejercicios/nuevo")}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo ejercicio
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Barra de búsqueda y filtros */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ejercicios por nombre, descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <Button 
              variant={showFilters ? "default" : "outline"} 
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>

          {/* Filtros expandidos */}
          {showFilters && (
            <div className="bg-card border rounded-lg p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de ejercicio</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedType("all")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedType === "all"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Dumbbell className="h-3.5 w-3.5" />
                    Todos
                  </button>
                  {EXERCISE_TYPES.map((type) => {
                    const config = EXERCISE_TYPE_CONFIG[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedType === type
                            ? `${config.bg} ${config.color} ring-2 ring-offset-1 ring-current`
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
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
                  <label className="text-sm font-medium mb-2 block">Grupo muscular</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedMuscle === "all" ? "Todos los grupos" : selectedMuscle}
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 max-h-64 overflow-auto">
                      <DropdownMenuCheckboxItem
                        checked={selectedMuscle === "all"}
                        onCheckedChange={() => setSelectedMuscle("all")}
                      >
                        Todos
                      </DropdownMenuCheckboxItem>
                      {ALL_KNOWN_MUSCLE_GROUPS.map(mg => (
                        <DropdownMenuCheckboxItem
                          key={mg}
                          checked={selectedMuscle === mg}
                          onCheckedChange={() => setSelectedMuscle(mg)}
                        >
                          {mg}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Equipamiento</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedEquipment === "all" ? "Todo el equipamiento" : selectedEquipment}
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 max-h-64 overflow-auto">
                      <DropdownMenuCheckboxItem
                        checked={selectedEquipment === "all"}
                        onCheckedChange={() => setSelectedEquipment("all")}
                      >
                        Todos
                      </DropdownMenuCheckboxItem>
                      {ALL_KNOWN_EQUIPMENT.map(eq => (
                        <DropdownMenuCheckboxItem
                          key={eq}
                          checked={selectedEquipment === eq}
                          onCheckedChange={() => setSelectedEquipment(eq)}
                        >
                          {eq}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {allTags.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                          selectedTags.includes(tag)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  <X className="h-3 w-3 mr-1" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}

          {/* Tags activos */}
          {activeFiltersCount > 0 && !showFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Filtros:</span>
              {selectedType !== "all" && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedType("all")}>
                  {EXERCISE_TYPE_CONFIG[selectedType]?.label}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {selectedMuscle !== "all" && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedMuscle("all")}>
                  {selectedMuscle}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {selectedEquipment !== "all" && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedEquipment("all")}>
                  {selectedEquipment}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => toggleTag(tag)}>
                  {tag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

                {/* Grid */}
                {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-40 bg-muted rounded-t-lg" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-16">
            <Dumbbell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No se encontraron ejercicios</h3>
            <p className="text-muted-foreground mt-1">
              Probá con otros filtros o creá uno nuevo.
            </p>
            <Button className="mt-4" onClick={() => router.push("/admin/ejercicios/nuevo")}>
              <Plus className="h-4 w-4 mr-2" />
              Crear ejercicio
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredExercises.map((exercise) => {
              const typeConfig = EXERCISE_TYPE_CONFIG[exercise.type] || EXERCISE_TYPE_CONFIG["OTHER"];

              return (
                <Card
                  key={exercise.id}
                  className="group overflow-hidden hover:shadow-md transition-all cursor-pointer border-border/60"
                  onClick={() => router.push(`/admin/ejercicios/${exercise.id}`)}
                >
                  <div className="aspect-video relative">
                    <ExerciseMedia
                      imageUrl={exercise.imageUrl}
                      gifUrl={exercise.gifUrl}
                      videoUrl={exercise.videoUrl}
                      name={exercise.name}
                      className="h-full w-full"
                    />
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${typeConfig.bg} ${typeConfig.color}`}>
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

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                      {exercise.name}
                    </h3>

                    {exercise.muscleGroup && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {exercise.muscleGroup}
                      </p>
                    )}

                    {exercise.clientDescription && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {exercise.clientDescription}
                      </p>
                    )}

                    {exercise.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {exercise.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                        {exercise.tags.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            +{exercise.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExercisesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Cargando...</div>}>
      <ExercisesPageContent />
    </Suspense>
  );
}