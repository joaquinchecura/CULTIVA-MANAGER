// Normaliza un tag: minúsculas, sin tildes, separadores unificados a "_".
// Absorbe variantes como "Relajación" / "relajacion" / "relajación " → "relajacion"
// y "movilidad articular" / "movilidad_articular" → "movilidad_articular".
export function normalizeTag(tag: string): string {
    return tag
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita acentos
      .replace(/[\s_]+/g, "_");
  }
  
  // Categorías construidas a partir de los tags reales que aparecen en la DB (audit de 797 ejercicios).
  // Cada entrada ya está normalizada — no hace falta escribir tildes ni elegir _ vs espacio.
  export const TAG_CATEGORIES = {
    compound: ["compound"],
  
    core: [
      "core", "abdominales", "oblicuos", "recto_abdominal", "transverso",
      "abdominales_inferiores", "abdomen", "plancha", "dead_bug", "bicho_muerto",
      "bird_dog", "perro_ave", "gato_vaca", "vacio_abdominal", "russian_twist",
      "crunch",
    ],
  
    advanced: [
      "avanzado", "olimpico", "olímpico", "halterofilia", "levantamiento_olimpico",
      "snatch", "clean", "jerk", "power_clean", "clean_pull", "snatch_pull",
      "snatch_balance", "crossfit", "muscle_up", "pistol", "turkish_get_up",
    ],
  
    // Para dar boost/prioridad en bloques MAIN en modo STATIONS (funcional/circuitos)
    stationFriendly: [
      "funcional", "hiit", "metabolico", "condicionamiento", "alta_intensidad",
      "intervalos", "circuito", "crossfit", "potencia",
    ],
  
    warmup: [
      "calentamiento", "movilidad", "movilidad_articular", "dinamico", "activacion",
    ],
  
    cooldownStretch: [
      "estiramiento", "flexibilidad", "relajacion", "vuelta_a_la_calma", "respiracion",
      "yoga", "pilates", "foam_roller", "automasaje", "mindfulness", "estiramiento_pasivo",
    ],
  } as const;
  
  export type TagCategory = keyof typeof TAG_CATEGORIES;
  
  // true si algún tag del ejercicio matchea (exacto o como substring) alguna keyword de la categoría.
  // El substring cubre casos como "zona_lumbar" conteniendo "lumbar", o "levantamiento_olimpico" conteniendo "olimpico".
  export function exerciseHasCategory(tags: string[], category: TagCategory): boolean {
    const normalizedTags = tags.map(normalizeTag);
    const keywords = TAG_CATEGORIES[category];
    return normalizedTags.some((t) => keywords.some((k) => t === k || t.includes(k)));
  }