"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, X, Dumbbell, Heart, Zap, Wind, ImageIcon, Video, FileText,
  Flame, StretchHorizontal, Target, Timer, Snowflake, Wrench, Scale, HeartPulse,
  Sparkles, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ExerciseType } from "@prisma/client";
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

const ALL_KNOWN_TAGS = [
  "press", "pecho", "compound", "inclinado", "aperturas", "dominadas", "espalda",
  "remo", "jalon", "hombros", "biceps", "curl", "martillo", "triceps", "extensiones",
  "sentadilla", "piernas", "prensa", "cuadriceps", "femoral", "rumano", "hip thrust",
  "gluteos", "pantorrilla", "plancha", "core", "isometrico", "crunch", "abdominales",
  "cinta", "running", "hiit", "kettlebell", "funcional", "crossfit", "burpees",
  "salto", "box jump", "bosu", "equilibrio", "tecnica", "movilidad", "estiramiento",
  "calentamiento", "recuperacion", "foam roller", "respiracion", "yoga", "meditacion"
].sort();

const ALL_EQUIPMENT = [
  "Barra", "Mancuernas", "Polea", "Paralelas", "Máquina", "Banco",
  "Cinta", "Elíptica", "Bicicleta", "Kettlebell", "Cajón",
  "Trineo", "Soga", "Foam roller", "Bosu", "Fitball", "Banda",
  "Peso corporal", "TRX", "Sandbag", "Balón medicinal"
].sort();

const ALL_MUSCLE_GROUPS = [
  "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Femoral",
  "Glúteos", "Pantorrilla", "Core", "Full body", "Piernas", "Cadera", "Tobillos",
  "Cuello", "Antebrazos", "Piso pélvico", "Mental"
].sort();

export default function NewExercisePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    type: "" as ExerciseType | "",
    description: "",
    clientDescription: "",
    muscleGroup: "" as string | null,
    equipment: "" as string | null,
    videoUrl: "",
    imageUrl: "",
    gifUrl: "",
    tags: [] as string[],
    newTag: "",
  });

  const addTag = () => {
    if (form.newTag && !form.tags.includes(form.newTag)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, prev.newTag], newTag: "" }));
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
  const previewMedia = form.gifUrl || form.imageUrl;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo ejercicio</h1>
          <p className="text-sm text-slate-500">Creá un ejercicio para tu biblioteca</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Columna izquierda: Formulario */}
          <div className="lg:col-span-2 space-y-4">
            {/* Info básica */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Información básica</h2>
              
              <div>
                <Label className="text-sm">Nombre del ejercicio *</Label>
                <Input
                  placeholder="Ej: Press de banca plano"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm mb-2 block">Tipo de ejercicio *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {EXERCISE_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, type: type.value }))}
                      className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all ${
                        form.type === type.value
                          ? `${type.bg} ${type.color} ${type.border} ring-1 ring-current`
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {type.icon}
                      <span className="truncate">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Grupo muscular</Label>
                  <Select value={form.muscleGroup || undefined} onValueChange={v => setForm(prev => ({ ...prev, muscleGroup: v }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>{ALL_MUSCLE_GROUPS.map(mg => <SelectItem key={mg} value={mg}>{mg}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Equipamiento</Label>
                  <Select value={form.equipment || undefined} onValueChange={v => setForm(prev => ({ ...prev, equipment: v }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>{ALL_EQUIPMENT.map(eq => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Descripciones */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Descripciones</h2>
              
              <div>
                <Label className="text-sm flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-500" /> Descripción para el alumno
                </Label>
                <Textarea
                  placeholder="Explicá el ejercicio en palabras simples..."
                  value={form.clientDescription}
                  onChange={e => setForm(prev => ({ ...prev, clientDescription: e.target.value }))}
                  rows={2}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Descripción técnica (coaches)
                </Label>
                <Textarea
                  placeholder="Detalles técnicos, puntos de atención..."
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Multimedia */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Multimedia</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs flex items-center gap-1.5 mb-1.5"><ImageIcon className="h-3 w-3" /> Imagen</Label>
                  <Input placeholder="https://..." value={form.imageUrl} onChange={e => setForm(prev => ({ ...prev, imageUrl: e.target.value }))} className="text-xs h-9" />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1.5 mb-1.5"><ImageIcon className="h-3 w-3 text-green-500" /> GIF</Label>
                  <Input placeholder="https://..." value={form.gifUrl} onChange={e => setForm(prev => ({ ...prev, gifUrl: e.target.value }))} className="text-xs h-9" />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1.5 mb-1.5"><Video className="h-3 w-3" /> Video</Label>
                  <Input placeholder="https://..." value={form.videoUrl} onChange={e => setForm(prev => ({ ...prev, videoUrl: e.target.value }))} className="text-xs h-9" />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Tags</h2>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Agregar tag..."
                  value={form.newTag}
                  onChange={e => setForm(prev => ({ ...prev, newTag: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                  list="known-tags"
                  className="h-9 text-sm"
                />
                <datalist id="known-tags">{ALL_KNOWN_TAGS.map(tag => <option key={tag} value={tag} />)}</datalist>
                <Button type="button" variant="outline" size="sm" onClick={addTag} className="h-9"><Plus className="h-4 w-4" /></Button>
              </div>

              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer text-xs" onClick={() => removeTag(tag)}>
                      {tag}<X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-500 uppercase mb-1.5">Sugeridos</p>
                <div className="flex flex-wrap gap-1">
                  {ALL_KNOWN_TAGS.filter(t => !form.tags.includes(t)).slice(0, 12).map(tag => (
                    <button key={tag} type="button" onClick={() => setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }))}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha: Preview sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Vista previa
                  </h3>
                </div>
                
                <div className="aspect-video bg-slate-100 relative">
                  {previewMedia ? (
                 <img src={optimizeCloudinaryUrl(previewMedia, 400)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Dumbbell className="h-10 w-10 text-slate-300" />
                    </div>
                  )}
                  {typeConfig && (
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border}`}>
                        {typeConfig.icon}{typeConfig.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-slate-900">
                    {form.name || "Nombre del ejercicio"}
                  </h4>
                  {form.muscleGroup && (
                    <p className="text-xs text-slate-500">{form.muscleGroup}{form.equipment && ` · ${form.equipment}`}</p>
                  )}
                  {form.clientDescription && (
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{form.clientDescription}</p>
                  )}
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {form.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  "Guardando..."
                ) : (
                  <><Check className="h-4 w-4" /> Crear ejercicio</>
                )}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}