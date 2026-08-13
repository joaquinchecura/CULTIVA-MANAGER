"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Dumbbell, 
  Heart, 
  Zap, 
  Wind, 
  ImageIcon,
  Video,
  FileText,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExerciseType } from "@prisma/client";

const EXERCISE_TYPES: { value: ExerciseType; label: string; icon: React.ReactNode }[] = [
  { value: "STRENGTH", label: "Fuerza", icon: <Dumbbell className="h-4 w-4" /> },
  { value: "CARDIO", label: "Cardio", icon: <Heart className="h-4 w-4" /> },
  { value: "FUNCTIONAL", label: "Funcional", icon: <Zap className="h-4 w-4" /> },
  { value: "MOBILITY", label: "Movilidad", icon: <StretchHorizontal className="h-4 w-4" /> },
  { value: "STRETCHING", label: "Estiramiento", icon: <Wind className="h-4 w-4" /> },
  { value: "PLYOMETRIC", label: "Pliometría", icon: <Flame className="h-4 w-4" /> },
  { value: "BALANCE", label: "Equilibrio", icon: <Scale className="h-4 w-4" /> },
  { value: "TECHNIQUE", label: "Técnica", icon: <Wrench className="h-4 w-4" /> },
  { value: "WARMUP", label: "Calentamiento", icon: <Timer className="h-4 w-4" /> },
  { value: "COOLDOWN", label: "Vuelta a la calma", icon: <Snowflake className="h-4 w-4" /> },
  { value: "OTHER", label: "Otro", icon: <Target className="h-4 w-4" /> },
];

const ALL_KNOWN_TAGS = [
  "press", "pecho", "compound", "inclinado", "declinado", "aperturas", "aislado", "cruces", "fondos", "pullover",
  "dominadas", "espalda", "jalon", "remo", "unilateral", "maquina", "peso muerto", "hiperextensiones",
  "hombros", "posterior", "elevaciones", "pajaro", "face pull", "biceps", "curl", "martillo", "predicador",
  "triceps", "press frances", "extensiones", "patada", "sentadilla", "piernas", "frontal", "prensa", "cuadriceps",
  "femoral", "rumano", "hip thrust", "gluteos", "elevacion", "pantorrilla", "plancha", "core", "isometrico", "crunch",
  "abdominales", "oblicuos", "cinta", "bajo impacto", "running", "eliptica", "bicicleta", "soga", "burpees",
  "hiit", "escaladores", "sprint", "zancadas", "kettlebell", "swing", "lunge", "rotacion", "funcional",
  "thrusters", "crossfit", "clean", "olimpico", "snatch", "potencia", "wall ball", "box jump", "plyometrico",
  "farmer walk", "sled", "battle ropes", "puente", "gato vaca", "cadera", "foam roller", "recuperacion",
  "dislocaciones", "tobillos", "calentamiento", "toracica", "estiramiento", "isquiotibiales", "flexibilidad",
  "pectorales", "mariposa", "aductores", "yoga", "relajacion", "cobra", "salto", "tuck jump", "depth jump", "skater",
  "bosu", "equilibrio", "single leg", "deadlift", "propiocepcion", "fitball", "tecnica", "rack", "overhead squat",
  "jumping jacks", "skipping", "arm circles", "leg swings", "trotar", "cuello", "munecas", "oso", "caminata",
  "inchworm", "high knees", "vuelta a la calma", "respiracion", "shavasana", "meditacion", "mental",
  "vacio abdominal", "transverso", "kegel", "piso pelvico", "rehabilitacion", "costal", "activacion", "prehab",
  "escapulas", "postura", "masaje", "automasaje"
];

const ALL_EQUIPMENT = [
  "Barra", "Mancuernas", "Polea", "Paralelas", "Mancuerna", "Máquina", "Banco",
  "Cinta", "Elíptica", "Bicicleta", "Remo", "Soga", "Kettlebell", "Balón", "Cajón",
  "Trineo", "Cuerdas", "Foam roller", "Palo", "Bosu", "Fitball", "Banda", "Pelota",
  "Peso corporal", "Pista"
];

const ALL_MUSCLE_GROUPS = [
  "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Femoral",
  "Glúteos", "Pantorrilla", "Core", "Full body", "Piernas", "Cadera", "Tobillos",
  "Cuello", "Antebrazos", "Piso pélvico", "Mental"
];

export default function NewExercisePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    type: "" as ExerciseType | "",
    description: "",
    clientDescription: "",
    muscleGroup: "",
    equipment: "",
    videoUrl: "",
    imageUrl: "",
    gifUrl: "",
    tags: [] as string[],
    newTag: "",
  });

  const addTag = () => {
    if (form.newTag && !form.tags.includes(form.newTag)) {
      setForm(prev => ({ 
        ...prev, 
        tags: [...prev.tags, prev.newTag],
        newTag: "" 
      }));
    }
  };

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.type) {
      setError("Nombre y tipo son obligatorios");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          description: form.description || undefined,
          clientDescription: form.clientDescription || undefined,
          muscleGroup: form.muscleGroup || undefined,
          equipment: form.equipment || undefined,
          videoUrl: form.videoUrl || undefined,
          imageUrl: form.imageUrl || undefined,
          gifUrl: form.gifUrl || undefined,
          tags: form.tags,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error creando ejercicio");
      }

      router.push("/admin/ejercicios");
    } catch (err: any) {
      setError(err.message || "Error al crear el ejercicio");
    } finally {
      setLoading(false);
    }
  };

  const typeConfig = form.type ? EXERCISE_TYPES.find(t => t.value === form.type) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Nuevo ejercicio</h1>
              <p className="text-sm text-muted-foreground">Crea un ejercicio para tu biblioteca</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Info básica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del ejercicio *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Press de banca plano"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de ejercicio *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EXERCISE_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, type: type.value }))}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                        form.type === type.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {type.icon}
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grupo muscular</Label>
                  <Select 
                    value={form.muscleGroup || undefined} 
                    onValueChange={v => setForm(prev => ({ ...prev, muscleGroup: v || "" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_MUSCLE_GROUPS.map(mg => (
                        <SelectItem key={mg} value={mg}>{mg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Equipamiento</Label>
                  <Select 
                    value={form.equipment || undefined} 
                    onValueChange={v => setForm(prev => ({ ...prev, equipment: v || "" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_EQUIPMENT.map(eq => (
                        <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Descripciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Descripciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Descripción técnica (para coaches)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Detalles técnicos, puntos de atención, variaciones..."
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientDescription" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Descripción para el usuario
                </Label>
                <Textarea
                  id="clientDescription"
                  placeholder="Explicá el ejercicio en palabras simples para que tu cliente entienda cómo hacerlo..."
                  value={form.clientDescription}
                  onChange={e => setForm(prev => ({ ...prev, clientDescription: e.target.value }))}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Esta descripción es la que verá tu cliente en la app. Sé claro y conciso.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Multimedia */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Multimedia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  URL de imagen
                </Label>
                <Input
                  id="imageUrl"
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={e => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gifUrl" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-green-500" />
                  URL del GIF de demostración
                </Label>
                <Input
                  id="gifUrl"
                  placeholder="https://media.giphy.com/... o https://i.imgur.com/..."
                  value={form.gifUrl}
                  onChange={e => setForm(prev => ({ ...prev, gifUrl: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Pegá la URL de un GIF que muestre el ejercicio en movimiento. Se mostrará al pasar el mouse sobre la card.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  URL del video
                </Label>
                <Input
                  id="videoUrl"
                  placeholder="https://youtube.com/... o https://vimeo.com/..."
                  value={form.videoUrl}
                  onChange={e => setForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Agregar tag..."
                  value={form.newTag}
                  onChange={e => setForm(prev => ({ ...prev, newTag: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                  list="known-tags"
                />
                <datalist id="known-tags">
                  {ALL_KNOWN_TAGS.map(tag => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-2">Tags sugeridos:</p>
                <div className="flex flex-wrap gap-1">
                  {ALL_KNOWN_TAGS.filter(t => !form.tags.includes(t)).slice(0, 16).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }))}
                      className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {form.name && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Vista previa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt="" className="h-full w-full object-cover rounded-lg" />
                    ) : (
                      <Dumbbell className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{form.name}</h4>
                      {typeConfig && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          {typeConfig.icon}
                          {typeConfig.label}
                        </span>
                      )}
                    </div>
                    {form.clientDescription && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {form.clientDescription}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {form.muscleGroup && (
                        <Badge variant="outline" className="text-xs">
                          {form.muscleGroup}
                        </Badge>
                      )}
                      {form.tags.slice(0, 4).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Guardando..." : "Crear ejercicio"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}