"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Save,
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
  Scale,
  Plus,
  Tag,
  AlertTriangle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExerciseType } from "@prisma/client";
// ✅ IMPORTAMOS EL TIPO COMPARTIDO
import { Exercise, mapPrismaExercise, mapExerciseToPrisma } from "@/types/exercise";

const EXERCISE_TYPES: { value: ExerciseType; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { value: "STRENGTH", label: "Fuerza", icon: <Dumbbell className="h-4 w-4" />, color: "text-blue-700", bg: "bg-blue-100" },
  { value: "CARDIO", label: "Cardio", icon: <Heart className="h-4 w-4" />, color: "text-red-700", bg: "bg-red-100" },
  { value: "FUNCTIONAL", label: "Funcional", icon: <Zap className="h-4 w-4" />, color: "text-amber-700", bg: "bg-amber-100" },
  { value: "MOBILITY", label: "Movilidad", icon: <StretchHorizontal className="h-4 w-4" />, color: "text-emerald-700", bg: "bg-emerald-100" },
  { value: "STRETCHING", label: "Estiramiento", icon: <Wind className="h-4 w-4" />, color: "text-teal-700", bg: "bg-teal-100" },
  { value: "PLYOMETRIC", label: "Pliometría", icon: <Flame className="h-4 w-4" />, color: "text-orange-700", bg: "bg-orange-100" },
  { value: "BALANCE", label: "Equilibrio", icon: <Scale className="h-4 w-4" />, color: "text-violet-700", bg: "bg-violet-100" },
  { value: "TECHNIQUE", label: "Técnica", icon: <Wrench className="h-4 w-4" />, color: "text-slate-700", bg: "bg-slate-100" },
  { value: "WARMUP", label: "Calentamiento", icon: <Timer className="h-4 w-4" />, color: "text-rose-700", bg: "bg-rose-100" },
  { value: "COOLDOWN", label: "Vuelta a la calma", icon: <Snowflake className="h-4 w-4" />, color: "text-cyan-700", bg: "bg-cyan-100" },
  { value: "OTHER", label: "Otro", icon: <Target className="h-4 w-4" />, color: "text-gray-700", bg: "bg-gray-100" },
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

// ✅ YA NO DEFINIMOS Exercise LOCALMENTE — usamos el importado

export default function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newTag, setNewTag] = useState("");

  const [form, setForm] = useState<Partial<Exercise>>({});

  const fetchExercise = useCallback(async () => {
    try {
      const { id } = await params;
      const res = await fetch(`/api/exercises/${id}`);
      if (!res.ok) throw new Error("No se pudo cargar el ejercicio");
      const data = await res.json();
      // ✅ USAMOS EL HELPER
      const mappedData = mapPrismaExercise(data);
      setExercise(mappedData);
      setForm(mappedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchExercise();
  }, [fetchExercise]);

  const handleSave = async () => {
    if (!exercise) return;
    setIsSaving(true);
    try {
      const { id } = await params;
      // ✅ USAMOS EL HELPER para mapear undefined → null
      const payload = mapExerciseToPrisma(form);
      const res = await fetch(`/api/exercises/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error guardando");
      const updated = await res.json();
      setExercise(mapPrismaExercise(updated));
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!exercise) return;
    try {
      const { id } = await params;
      const res = await fetch(`/api/exercises/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error eliminando");
      router.push("/admin/ejercicios");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addTag = () => {
    if (newTag && !form.tags?.includes(newTag)) {
      setForm(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags?.filter(t => t !== tag) || [] }));
  };

  const typeConfig = EXERCISE_TYPES.find(t => t.value === exercise?.type) || EXERCISE_TYPES[10];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando ejercicio...</div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">{error || "Ejercicio no encontrado"}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/ejercicios")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {isEditing ? "Editar ejercicio" : exercise.name}
                  </h1>
                  {!isEditing && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${typeConfig.bg} ${typeConfig.color}`}>
                      {typeConfig.icon}
                      {typeConfig.label}
                    </span>
                  )}
                </div>
                {!isEditing && (
                  <p className="text-sm text-muted-foreground">
                    {exercise.muscleGroup} · {exercise.equipment}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => { setIsEditing(false); setForm(exercise); }}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Guardando..." : "Guardar"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-destructive/10 text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Multimedia */}
            {(exercise.imageUrl || exercise.gifUrl || exercise.videoUrl) && !isEditing && (
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
                    {exercise.gifUrl ? (
                      <img
                        src={exercise.gifUrl}
                        alt={exercise.name}
                        className="h-full w-full object-cover"
                      />
                    ) : exercise.imageUrl ? (
                      <img
                        src={exercise.imageUrl}
                        alt={exercise.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Video className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Descripción para el usuario */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Descripción para el usuario
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={form.clientDescription || ""}
                    onChange={e => setForm(prev => ({ ...prev, clientDescription: e.target.value }))}
                    rows={4}
                    placeholder="Explicá el ejercicio en palabras simples..."
                  />
                ) : (
                  <p className="text-sm leading-relaxed">
                    {exercise.clientDescription || "Sin descripción para el usuario."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Descripción técnica */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Descripción técnica
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={form.description || ""}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    placeholder="Detalles técnicos para coaches..."
                  />
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {exercise.description || "Sin descripción técnica."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Agregar tag..."
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" variant="outline" onClick={addTag}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.tags?.map(tag => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                          {tag}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {exercise.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info básica */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input
                        value={form.name || ""}
                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={form.type || undefined}
                        onValueChange={v => setForm(prev => ({ ...prev, type: v as ExerciseType }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXERCISE_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Grupo muscular</Label>
                      <Select
                        value={form.muscleGroup || undefined}
                        onValueChange={v => setForm(prev => ({ ...prev, muscleGroup: v ?? undefined }))}
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
                        onValueChange={v => setForm(prev => ({ ...prev, equipment: v ?? undefined }))}
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
                  </>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo</span>
                      <span className="font-medium">{typeConfig.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Grupo muscular</span>
                      <span className="font-medium">{exercise.muscleGroup || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Equipamiento</span>
                      <span className="font-medium">{exercise.equipment || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creado</span>
                      <span className="font-medium">
                        {exercise.createdAt ? new Date(exercise.createdAt).toLocaleDateString("es-AR") : "—"}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Multimedia URLs (solo en edición) */}
            {isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Multimedia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      URL de imagen
                    </Label>
                    <Input
                      value={form.imageUrl || ""}
                      onChange={e => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-green-500" />
                      URL del GIF
                    </Label>
                    <Input
                      value={form.gifUrl || ""}
                      onChange={e => setForm(prev => ({ ...prev, gifUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      URL del video
                    </Label>
                    <Input
                      value={form.videoUrl || ""}
                      onChange={e => setForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preview de URLs (solo lectura) */}
            {!isEditing && (exercise.imageUrl || exercise.gifUrl || exercise.videoUrl) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recursos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {exercise.imageUrl && (
                    <a href={exercise.imageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                      <ImageIcon className="h-4 w-4" />
                      Ver imagen
                    </a>
                  )}
                  {exercise.gifUrl && (
                    <a href={exercise.gifUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                      <ImageIcon className="h-4 w-4 text-green-500" />
                      Ver GIF
                    </a>
                  )}
                  {exercise.videoUrl && (
                    <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                      <Video className="h-4 w-4" />
                      Ver video
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar ejercicio?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El ejercicio <strong>{exercise.name}</strong> se eliminará permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}