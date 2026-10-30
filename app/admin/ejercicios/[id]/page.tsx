"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Pencil, Trash2, Save, X, Dumbbell, Heart, Zap, Wind,
  ImageIcon, Video, FileText, Flame, StretchHorizontal, Target, Timer,
  Snowflake, Wrench, Scale, Plus, Tag, AlertTriangle, HeartPulse, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ExerciseType } from "@prisma/client";
import { Exercise, mapPrismaExercise, mapExerciseToPrisma } from "@/types/exercise";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";

const EXERCISE_TYPES: { value: ExerciseType; label: string; icon: React.ReactNode; color: string; bg: string; border: string }[] = [
  { value: "STRENGTH", label: "Fuerza", icon: <Dumbbell className="h-4 w-4" />, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  { value: "CARDIO", label: "Cardio", icon: <Heart className="h-4 w-4" />, color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  { value: "FUNCTIONAL", label: "Funcional", icon: <Zap className="h-4 w-4" />, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  { value: "MOBILITY", label: "Movilidad", icon: <StretchHorizontal className="h-4 w-4" />, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  { value: "STRETCHING", label: "Estiramiento", icon: <Wind className="h-4 w-4" />, color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" },
  { value: "PLYOMETRIC", label: "Pliometría", icon: <Flame className="h-4 w-4" />, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  { value: "BALANCE", label: "Equilibrio", icon: <Scale className="h-4 w-4" />, color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
  { value: "TECHNIQUE", label: "Técnica", icon: <Wrench className="h-4 w-4" />, color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
  { value: "WARMUP", label: "Calentamiento", icon: <Timer className="h-4 w-4" />, color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
  { value: "COOLDOWN", label: "Vuelta a la calma", icon: <Snowflake className="h-4 w-4" />, color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200" },
  { value: "REHABILITATION", label: "Rehabilitación", icon: <HeartPulse className="h-4 w-4" />, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
  { value: "OTHER", label: "Otro", icon: <Target className="h-4 w-4" />, color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200" },
];

const ALL_EQUIPMENT = [
  "Barra", "Mancuernas", "Polea", "Paralelas", "Mancuerna", "Máquina", "Banco",
  "Cinta", "Elíptica", "Bicicleta", "Remo", "Soga", "Kettlebell", "Balón", "Cajón", "Cajón pliométrico",
  "Trineo", "Cuerdas", "Foam roller", "Palo", "Bosu", "Fitball", "Banda", "Pelota",
  "Peso corporal", "Pista", "TRX", "Sandbag", "Pared", "Balón medicinal",
].sort();

const ALL_MUSCLE_GROUPS = [
  "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Femoral",
  "Glúteos", "Pantorrilla", "Core", "Full body", "Piernas", "Cadera", "Tobillos",
  "Cuello", "Antebrazos", "Piso pélvico", "Mental", "Muñecas",
].sort();

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
      const mappedData = mapPrismaExercise(data);
      setExercise(mappedData);
      setForm(mappedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetchExercise(); }, [fetchExercise]);

  const handleSave = async () => {
    if (!exercise) return;
    setIsSaving(true);
    try {
      const { id } = await params;
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error || "Ejercicio no encontrado"}</p>
        <Button variant="outline" className="mt-4 gap-2" onClick={() => router.push("/admin/ejercicios")}>
          <ArrowLeft className="h-4 w-4" /> Volver a ejercicios
        </Button>
      </div>
    );
  }

  const mediaUrl = isEditing ? (form.gifUrl || form.imageUrl) : (exercise.gifUrl || exercise.imageUrl);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header compacto */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 truncate">
              {isEditing ? "Editar ejercicio" : exercise.name}
            </h1>
            {!isEditing && (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border}`}>
                  {typeConfig.icon}
                  {typeConfig.label}
                </span>
                {exercise.muscleGroup && <span className="text-xs text-slate-500">{exercise.muscleGroup}</span>}
                {exercise.equipment && <span className="text-xs text-slate-400">· {exercise.equipment}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => { setIsEditing(false); setForm(exercise); }} className="gap-1.5">
                <X className="h-4 w-4" /> Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="gap-1.5">
                <Save className="h-4 w-4" /> {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-1.5">
                <Pencil className="h-4 w-4" /> Editar
              </Button>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="gap-1.5">
                <Trash2 className="h-4 w-4" /> Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna izquierda: Media + Descripciones */}
        <div className="lg:col-span-2 space-y-4">
          {/* Media */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="aspect-video relative bg-slate-100">
              {mediaUrl ? (
                <img src={optimizeCloudinaryUrl(mediaUrl, 800)} alt={exercise.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Dumbbell className="h-12 w-12 text-slate-300" />
                </div>
              )}
              {!isEditing && (
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border}`}>
                    {typeConfig.icon}
                    {typeConfig.label}
                  </span>
                </div>
              )}
              {!isEditing && exercise.equipment && (
                <div className="absolute bottom-3 left-3">
                  <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                    {exercise.equipment}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Descripción para el alumno */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4" /> Descripción para el alumno
            </h3>
            {isEditing ? (
              <Textarea
                value={form.clientDescription || ""}
                onChange={e => setForm(prev => ({ ...prev, clientDescription: e.target.value }))}
                rows={3}
                placeholder="Explicá el ejercicio en palabras simples..."
              />
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {exercise.clientDescription || "Sin descripción para el alumno."}
              </p>
            )}
          </div>

          {/* Descripción técnica */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4" /> Descripción técnica (coaches)
            </h3>
            {isEditing ? (
              <Textarea
                value={form.description || ""}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Detalles técnicos para coaches..."
              />
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {exercise.description || "Sin descripción técnica."}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4" /> Tags
            </h3>
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
                <div className="flex flex-wrap gap-1.5">
                  {form.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer text-xs" onClick={() => removeTag(tag)}>
                      {tag}<X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {exercise.tags.length > 0 ? exercise.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{tag}</span>
                )) : <p className="text-sm text-slate-400">Sin tags</p>}
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: Info + Multimedia (edición) + Recursos */}
        <div className="lg:col-span-1 space-y-4">
          {/* Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Información</h3>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Nombre</Label>
                  <Input value={form.name || ""} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={form.type || undefined} onValueChange={v => setForm(prev => ({ ...prev, type: v as ExerciseType }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{EXERCISE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Grupo muscular</Label>
                  <Select value={form.muscleGroup || undefined} onValueChange={v => setForm(prev => ({ ...prev, muscleGroup: v ?? undefined }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>{ALL_MUSCLE_GROUPS.map(mg => <SelectItem key={mg} value={mg}>{mg}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Equipamiento</Label>
                  <Select value={form.equipment || undefined} onValueChange={v => setForm(prev => ({ ...prev, equipment: v ?? undefined }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>{ALL_EQUIPMENT.map(eq => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipo</span>
                  <span className="font-medium text-slate-900">{typeConfig.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Grupo muscular</span>
                  <span className="font-medium text-slate-900">{exercise.muscleGroup || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Equipamiento</span>
                  <span className="font-medium text-slate-900">{exercise.equipment || "—"}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Creado</span>
                  <span className="font-medium text-slate-900">
                    {exercise.createdAt ? new Date(exercise.createdAt).toLocaleDateString("es-AR", { timeZone: 'America/Argentina/Buenos_Aires' }) : "—"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Multimedia (solo edición) */}
          {isEditing && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Multimedia</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs flex items-center gap-1.5 mb-1"><ImageIcon className="h-3 w-3" /> Imagen</Label>
                  <Input value={form.imageUrl || ""} onChange={e => setForm(prev => ({ ...prev, imageUrl: e.target.value }))} placeholder="https://..." className="text-xs h-9" />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1.5 mb-1"><ImageIcon className="h-3 w-3 text-green-500" /> GIF</Label>
                  <Input value={form.gifUrl || ""} onChange={e => setForm(prev => ({ ...prev, gifUrl: e.target.value }))} placeholder="https://..." className="text-xs h-9" />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1.5 mb-1"><Video className="h-3 w-3" /> Video</Label>
                  <Input value={form.videoUrl || ""} onChange={e => setForm(prev => ({ ...prev, videoUrl: e.target.value }))} placeholder="https://..." className="text-xs h-9" />
                </div>
              </div>
            </div>
          )}

          {/* Recursos (solo lectura) */}
          {!isEditing && (exercise.imageUrl || exercise.gifUrl || exercise.videoUrl) && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Recursos</h3>
              <div className="space-y-2 text-sm">
                {exercise.imageUrl && (
                  <a href={exercise.imageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-slate-600 hover:text-blue-600 group">
                    <span className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Imagen</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                  </a>
                )}
                {exercise.gifUrl && (
                  <a href={exercise.gifUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-slate-600 hover:text-blue-600 group">
                    <span className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-green-500" /> GIF</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                  </a>
                )}
                {exercise.videoUrl && (
                  <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-slate-600 hover:text-blue-600 group">
                    <span className="flex items-center gap-2"><Video className="h-4 w-4" /> Video</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog para eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar ejercicio?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El ejercicio <strong>{exercise.name}</strong> se eliminará permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} className="gap-2">
              <Trash2 className="h-4 w-4" /> Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}