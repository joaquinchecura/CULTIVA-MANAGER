import { ExerciseType } from "@prisma/client";

/**
 * Tipo Exercise unificado para todo el frontend.
 * 
 * Prisma usa `null` para campos opcionales, pero en React/TypeScript
 * es más natural usar `undefined`. Este tipo refleja eso.
 * 
 * USALO en todos los componentes en vez de definir Exercise localmente.
 */
export interface Exercise {
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
  createdAt?: string;
}

/**
 * Helper para convertir datos de Prisma (con null) al tipo Exercise (con undefined).
 * Usalo siempre que recibas datos de la API.
 */
export function mapPrismaExercise(data: any): Exercise {
  return {
    id: data.id,
    name: data.name,
    type: data.type as ExerciseType,
    description: data.description ?? undefined,
    clientDescription: data.clientDescription ?? undefined,
    muscleGroup: data.muscleGroup ?? undefined,
    equipment: data.equipment ?? undefined,
    videoUrl: data.videoUrl ?? undefined,
    imageUrl: data.imageUrl ?? undefined,
    gifUrl: data.gifUrl ?? undefined,
    tags: data.tags || [],
    createdAt: data.createdAt ?? undefined,
  };
}

/**
 * Helper para convertir Exercise a payload de Prisma (undefined → null).
 * Usalo antes de enviar datos a la API.
 */
export function mapExerciseToPrisma(exercise: Partial<Exercise>): any {
  return {
    ...exercise,
    description: exercise.description ?? null,
    clientDescription: exercise.clientDescription ?? null,
    muscleGroup: exercise.muscleGroup ?? null,
    equipment: exercise.equipment ?? null,
    videoUrl: exercise.videoUrl ?? null,
    imageUrl: exercise.imageUrl ?? null,
    gifUrl: exercise.gifUrl ?? null,
  };
}