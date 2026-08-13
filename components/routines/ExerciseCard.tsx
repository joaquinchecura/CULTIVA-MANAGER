"use client";

import { useState } from "react";
import { Dumbbell, Play, GripVertical, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
// ✅ IMPORTAMOS EL TIPO COMPARTIDO
import { Exercise } from "@/types/exercise";

const EXERCISE_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
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

// ✅ YA NO DEFINIMOS Exercise LOCALMENTE — usamos el importado

interface ExerciseCardProps {
  exercise: Exercise;
  className?: string;
  showDragHandle?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function ExerciseCard({ 
  exercise, 
  className, 
  showDragHandle = false,
  onClick,
  children 
}: ExerciseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const typeConfig = EXERCISE_TYPE_CONFIG[exercise.type] || EXERCISE_TYPE_CONFIG["OTHER"];
  const hasMedia = exercise.imageUrl || exercise.gifUrl || exercise.videoUrl;

  return (
    <Card 
      className={cn(
        "group overflow-hidden border-border/60 transition-all",
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex">
          {showDragHandle && (
            <div className="flex items-center px-2 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground">
              <GripVertical className="h-4 w-4" />
            </div>
          )}

          <div 
            className="w-24 h-24 shrink-0 bg-muted relative overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {!hasMedia || mediaError ? (
              <div className="flex items-center justify-center h-full">
                <Dumbbell className="h-8 w-8 text-muted-foreground/30" />
              </div>
            ) : exercise.gifUrl ? (
              <>
                <img
                  src={isHovered ? exercise.gifUrl : (exercise.imageUrl || exercise.gifUrl)}
                  alt={exercise.name}
                  className="h-full w-full object-cover transition-all duration-300"
                  onError={() => setMediaError(true)}
                />
                {!isHovered && (
                  <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                    GIF
                  </span>
                )}
              </>
            ) : exercise.imageUrl ? (
              <img
                src={exercise.imageUrl}
                alt={exercise.name}
                className="h-full w-full object-cover"
                onError={() => setMediaError(true)}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Play className="h-6 w-6 text-muted-foreground/30" />
              </div>
            )}
          </div>

          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {exercise.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeConfig.bg} ${typeConfig.color}`}>
                    {typeConfig.label}
                  </span>
                  {exercise.muscleGroup && (
                    <span className="text-[10px] text-muted-foreground">
                      {exercise.muscleGroup}
                    </span>
                  )}
                </div>
              </div>

              {exercise.clientDescription && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <button className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors">
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">{exercise.clientDescription}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {exercise.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {exercise.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {tag}
                  </span>
                ))}
                {exercise.tags.length > 3 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    +{exercise.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {children && (
              <div className="mt-2 pt-2 border-t border-border/50">
                {children}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}