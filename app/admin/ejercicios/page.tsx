"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Plus, 
  Filter, 
  Dumbbell, 
  Heart, 
  Zap, 
  Wind, 
  Activity,
  Tag,
  X,
  ChevronDown,
  Flame,
  StretchHorizontal,
  Target,
  Timer,
  Snowflake,
  Wrench,
  Scale
} from "lucide-react";
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
import { ExerciseMedia } from "@/app/components/ExerciseMedia";
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

// ─── Configuración de tipos (alineado con enum Prisma) ──
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
  OTHER: { label: "Otro", icon: <Target className="h-3.5 w-3.5" />, color: "text-gray-700", bg: "bg-gray-100" },
};

const EXERCISE_TYPES = Object.keys(EXERCISE_TYPE_CONFIG);

// Tags y equipamiento únicos extraídos del seed
const ALL_KNOWN_TAGS = [
  "press", "pecho", "compound", "inclinado", "declinado", "aperturas", "aislado", "cruces", "fondos", "pullover",
  "dominadas", "espalda", "jalon", "remo", "unilateral", "maquina", "peso muerto", "hiperextensiones", "espalda baja",
  "hombros", "posterior", "elevaciones", "pajaro", "face pull", "biceps", "curl", "martillo", "predicador", "concentrado",
  "triceps", "press frances", "extensiones", "patada", "sentadilla", "piernas", "frontal", "prensa", "extensiones", "cuadriceps",
  "curl", "femoral", "rumano", "hip thrust", "gluteos", "elevacion", "pantorrilla", "plancha", "core", "isometrico", "crunch",
  "abdominales", "oblicuos", "russian twist", "cinta", "bajo impacto", "running", "eliptica", "bicicleta", "soga", "burpees",
  "hiit", "escaladores", "sprint", "zancadas", "dinamico", "kettlebell", "swing", "get up", "movilidad", "lunge", "rotacion",
  "funcional", "desplante", "lateral", "thrusters", "crossfit", "clean", "olimpico", "snatch", "potencia", "wall ball", "box jump",
  "plyometrico", "farmer walk", "agarre", "sled", "empuje", "battle ropes", "puente", "gato vaca", "cadera", "foam roller",
  "recuperacion", "dislocaciones", "tobillos", "calentamiento", "toracica", "90 90", "estiramiento", "isquiotibiales", "flexibilidad",
  "pectorales", "mariposa", "aductores", "yoga", "relajacion", "cobra", "salto", "longitud", "tuck jump", "depth jump", "skater",
  "bosu", "equilibrio", "single leg", "deadlift", "propiocepcion", "fitball", "tecnica", "rack", "overhead squat", "snatch balance",
  "clean pull", "snatch pull", "jumping jacks", "skipping", "pies", "arm circles", "leg swings", "trotar", "cuello", "munecas",
  "oso", "caminata", "inchworm", "high knees", "caminata", "vuelta a la calma", "respiracion", "shavasana", "meditacion", "mental",
  "vacio abdominal", "transverso", "kegel", "piso pelvico", "rehabilitacion", "costal", "activacion", "prehab", "escapulas", "postura",
  "masaje", "automasaje"
];

const ALL_KNOWN_EQUIPMENT = [
  "Barra", "Mancuernas", "Polea", "Paralelas", "Mancuerna", "Máquina", "Banco",
  "Cinta", "Elíptica", "Bicicleta", "Remo", "Soga", "Kettlebell", "Balón", "Cajón",
  "Trineo", "Cuerdas", "Foam roller", "Palo", "Bosu", "Fitball", "Banda", "Pelota",
  "Peso corporal", "Pista"
];

const ALL_KNOWN_MUSCLE_GROUPS = [
  "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Femoral",
  "Glúteos", "Pantorrilla", "Core", "Full body", "Piernas", "Cadera", "Tobillos",
  "Cuello", "Antebrazos", "Piso pélvico", "Mental"
];

export default function ExercisesPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState<string>("all");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

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
  }, [selectedType, selectedMuscle, selectedEquipment, search, selectedTags]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedType("all");
    setSelectedTags([]);
    setSelectedMuscle("all");
    setSelectedEquipment("all");
    setSearch("");
  };

  const activeFiltersCount = 
    (selectedType !== "all" ? 1 : 0) +
    selectedTags.length +
    (selectedMuscle !== "all" ? 1 : 0) +
    (selectedEquipment !== "all" ? 1 : 0);

  // Filtrado local por múltiples tags
  const filteredExercises = exercises.filter(ex => {
    if (selectedTags.length === 0) return true;
    return selectedTags.every(tag => ex.tags.includes(tag));
  });

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
              {/* Tipo */}
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

              {/* Grupo muscular */}
              <div>
                <label className="text-sm font-medium mb-2 block">Grupo muscular</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto justify-between">
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

              {/* Equipamiento */}
              <div>
                <label className="text-sm font-medium mb-2 block">Equipamiento</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto justify-between">
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

              {/* Tags */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_KNOWN_TAGS.slice(0, 30).map(tag => (
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
                  {ALL_KNOWN_TAGS.length > 30 && (
                    <span className="text-xs text-muted-foreground self-center">+{ALL_KNOWN_TAGS.length - 30} más</span>
                  )}
                </div>
              </div>

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