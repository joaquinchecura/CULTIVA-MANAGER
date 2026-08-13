"use client";

import { useState } from "react";
import { Play, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseMediaProps {
  imageUrl?: string | null;
  gifUrl?: string | null;
  videoUrl?: string | null;
  name: string;
  className?: string;
}

export function ExerciseMedia({ 
  imageUrl, 
  gifUrl, 
  videoUrl, 
  name, 
  className 
}: ExerciseMediaProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const hasMedia = imageUrl || gifUrl || videoUrl;

  if (!hasMedia || mediaError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted rounded-lg",
        className
      )}>
        <Dumbbell className="h-8 w-8 text-muted-foreground/50" />
      </div>
    );
  }

  // Si hay GIF → imagen estática por defecto, GIF al hover
  if (gifUrl) {
    return (
      <div 
        className={cn("relative overflow-hidden rounded-lg bg-muted", className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
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

  // Si hay video pero no GIF
  if (videoUrl) {
    return (
      <div className={cn("relative overflow-hidden rounded-lg bg-muted group", className)}>
        <img
          src={imageUrl || ""}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setMediaError(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/90 rounded-full p-2">
            <Play className="h-5 w-5 text-primary fill-primary" />
          </div>
        </div>
      </div>
    );
  }

  // Solo imagen
  return (
    <div className={cn("overflow-hidden rounded-lg bg-muted", className)}>
      <img
        src={imageUrl!}
        alt={name}
        className="h-full w-full object-cover"
        onError={() => setMediaError(true)}
      />
    </div>
  );
}