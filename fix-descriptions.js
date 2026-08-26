#!/usr/bin/env node
/**
 * fix-descriptions.js
 *
 * Corre DESPUÉS de haber corregido `muscleGroup` (ese ya lo arreglaste).
 * Este script regenera, para cada ejercicio:
 *   - equipment    -> solo si el NOMBRE menciona un equipo explícito
 *                      (ej. "Remo T-bar" no lo especifica -> se deja como está;
 *                       "Curl con TRX" sí -> se fuerza a "TRX")
 *   - tags         -> [slug(muscleGroup), slug(equipment), ...palabras de
 *                      movimiento detectadas en el nombre], sin duplicados
 *                      y sin restos de grupos musculares viejos
 *   - description  -> plantilla fija por `type`, usando muscleGroup+equipment
 *                      ya corregidos (nunca mezcla texto viejo)
 *   - clientDescription -> ídem, plantilla fija por `type`
 *
 * Esto prioriza consistencia y corrección sobre variedad de redacción: todas
 * las descripciones del mismo `type` van a sonar parecidas entre sí, pero
 * NINGUNA va a mencionar un músculo o equipo que no sea el real del ejercicio.
 *
 * USO:
 *   node fix-descriptions.js ruta/a/tu/seed.corregido.ts > (o revisa el output)
 *
 * Genera <archivo>.final.ts y un reporte por stderr.
 */

const fs = require("fs");

const filePath = process.argv[2];
if (!filePath) {
  console.error("Uso: node fix-descriptions.js <archivo.ts>");
  process.exit(1);
}

const src = fs.readFileSync(filePath, "utf8");

// ---------------------------------------------------------------------
// 1) Inferencia de equipment a partir del NOMBRE (solo si es explícito)
//    Orden: de más específico a más genérico.
// ---------------------------------------------------------------------
const EQUIPMENT_FROM_NAME = [
  [/m[aá]quina smith/, "Máquina Smith"],
  [/barra vac[ií]a/, "Barra"],
  [/kettlebell/, "Kettlebell"],
  [/mancuernas?/, "Mancuernas"],
  [/\btrx\b/, "TRX"],
  [/landmine/, "Landmine"],
  [/sandbag/, "Sandbag"],
  [/bal[oó]n/, "Balón"],
  [/\bbosu\b/, "Bosu"],
  [/fitball/, "Fitball"],
  [/pelota/, "Pelota"],
  [/foam roller/, "Foam roller"],
  [/trineo/, "Trineo"],
  [/cuerdas/, "Cuerdas"],
  [/el[ií]ptica/, "Elíptica"],
  [/bicicleta/, "Bicicleta"],
  [/\bcinta\b/, "Cinta"],
  [/\bpista\b/, "Pista"],
  [/\bcaj[oó]n\b/, "Cajón"],
  [/\bpolea\b/, "Polea"],
  [/\bbanda\b/, "Banda"],
  [/\bbanco\b/, "Banco"],
  [/\bpalo\b/, "Palo"],
  [/\bbarra\b/, "Barra"],
  [/\bsoga\b/, "Soga"],
  [/peso corporal/, "Peso corporal"],
];

function inferEquipment(name, currentEquipment) {
  const n = name.toLowerCase();
  for (const [re, eq] of EQUIPMENT_FROM_NAME) {
    if (re.test(n)) return eq;
  }
  return currentEquipment; // el nombre no lo especifica -> conservamos lo que había
}

// ---------------------------------------------------------------------
// 2) Palabras de movimiento para tags (no determinan muscleGroup, solo
//    aportan un tag descriptivo adicional si aparecen en el nombre)
// ---------------------------------------------------------------------
const MOVEMENT_TAGS = [
  [/hip thrust/, "hip_thrust"],
  [/peso muerto/, "peso_muerto"],
  [/curl/, "curl"],
  [/dominada/, "dominada"],
  [/remo/, "remo"],
  [/jal[oó]n/, "jalon"],
  [/hiperextensi[oó]n/, "hiperextension"],
  [/pull-?over/, "pullover"],
  [/patada/, "patada"],
  [/extensi[oó]n/, "extension"],
  [/fondos/, "fondos"],
  [/apertura/, "apertura"],
  [/cruces?/, "cruces"],
  [/press/, "press"],
  [/elevaci[oó]n/, "elevacion"],
  [/p[aá]jaro/, "pajaro"],
  [/face pull/, "face_pull"],
  [/sentadilla/, "sentadilla"],
  [/prensa/, "prensa"],
  [/plancha/, "plancha"],
  [/crunch/, "crunch"],
  [/russian twist/, "russian_twist"],
  [/burpee/, "burpee"],
  [/sprint/, "sprint"],
  [/\bjump\b|salto/, "jump"],
  [/snatch/, "snatch"],
  [/\bclean\b/, "clean"],
  [/thruster/, "thruster"],
  [/box/, "box"],
  [/plyo/, "plyometrico"],
];

function slug(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // saca tildes para el slug de tags
    .replace(/\s+/g, "_");
}

// mantenemos tildes para los textos en prosa (description/clientDescription);
// bajamos a minúscula salvo que sea una sigla conocida (TRX, etc.)
const ACRONYMS = new Set(["TRX"]);
function lower(s) {
  if (ACRONYMS.has(s)) return s;
  return s.toLowerCase();
}

// ---------------------------------------------------------------------
// 3) Plantillas de description / clientDescription por `type`
// ---------------------------------------------------------------------
const TEMPLATES = {
  STRENGTH: {
    description: (g, e) => `Ejercicio de ${lower(g)} tipo strength. Requiere ${lower(e)}.`,
    client: (g, e) =>
      `Con ${lower(e)}, ejecutá el movimiento de forma controlada enfocándote en ${lower(g)}. Mantené la técnica correcta y controlá tanto la fase concéntrica como la excéntrica.`,
  },
  CARDIO: {
    description: (g, e) => `Ejercicio cardiovascular de ${lower(g)} tipo cardio. Requiere ${lower(e)}.`,
    client: (g, e) =>
      `Con ${lower(e)}, mantené una intensidad moderada-alta trabajando ${lower(g)} de forma continua. Controlá la respiración durante todo el ejercicio.`,
  },
  FUNCTIONAL: {
    description: (g, e) => `Ejercicio funcional de ${lower(g)} tipo functional. Requiere ${lower(e)}.`,
    client: (g, e) =>
      `Con ${lower(e)}, ejecutá el patrón de movimiento completo manteniendo el core activado y la estabilidad de ${lower(g)}.`,
  },
  MOBILITY: {
    description: (g, e) => `Ejercicio de movilidad de ${lower(g)} tipo mobility. Requiere ${lower(e)}.`,
    client: (g, e) =>
      `Con ${lower(e)}, movete lentamente explorando el rango de movimiento de ${lower(g)}. Mantené la respiración fluida y no fuerces la posición.`,
  },
  STRETCHING: {
    description: (g, e) => `Ejercicio de estiramiento de ${lower(g)} tipo stretching. Requiere ${lower(e)}.`,
    client: (g, e) =>
      `Con ${lower(e)}, mantené el estiramiento en ${lower(g)} durante 20-30 segundos sin rebotar. Respirá profundamente y relajá la zona.`,
  },
  PLYOMETRIC: {
    description: (g, e) => `Ejercicio pliométrico de ${lower(g)} tipo plyometric. Requiere ${lower(e)}.`,
    client: (g, e) =>
      `Con ${lower(e)}, ejecutá el movimiento explosivamente trabajando ${lower(g)} y aterrizá suavemente con las rodillas flexionadas.`,
  },
  BALANCE: {
    description: (g, e) => `Ejercicio de equilibrio de ${lower(g)} tipo balance. Requiere ${lower(e)}.`,
    client: (g, e) =>
      `Con ${lower(e)}, mantené la posición estable trabajando ${lower(g)}. Enfocate en un punto fijo y controlá la postura.`,
  },
  TECHNIQUE: {
    description: (g, e) => `Ejercicio de técnica de ${lower(g)} tipo technique. Requiere ${lower(e)}.`,
    client: (g, e) =>
      `Con ${lower(e)}, practicá el movimiento lentamente enfocándote en la técnica correcta de ${lower(g)}. Calidad sobre cantidad.`,
  },
  WARMUP: {
    description: (g, e) => `Ejercicio de calentamiento de ${lower(g)} tipo warmup. Requiere ${lower(e)}.`,
    client: (g, e) =>
      `Con ${lower(e)}, ejecutá el movimiento de forma dinámica activando ${lower(g)}. Aumentá progresivamente la intensidad, sin llegar al fallo.`,
  },
  COOLDOWN: {
    description: (g, e) => `Ejercicio de vuelta a la calma de ${lower(g)} tipo cooldown. Requiere ${lower(e)}.`,
    client: (g, e) =>
      `Con ${lower(e)}, realizá el movimiento de forma pausada enfocándote en la sensación de ${lower(g)} relajándose. Respirá profundo.`,
  },
  OTHER: {
    description: (g, e) => `Ejercicio complementario de ${lower(g)} tipo other. Requiere ${lower(e)}.`,
    client: (g, e) =>
      `Con ${lower(e)}, realizá el ejercicio con atención plena, conectando con ${lower(g)}. La calidad del movimiento es lo importante.`,
  },
};

// ---------------------------------------------------------------------
// 4) Parseo y reconstrucción de cada bloque
// ---------------------------------------------------------------------
const blockRegex = /\{\s*name:\s*"((?:[^"\\]|\\.)*)"[\s\S]*?isPublic:\s*(?:true|false),\s*\}/g;

let fixed = 0;
const equipmentChanges = [];

const result = src.replace(blockRegex, (block) => {
  const get = (field) => {
    const m = block.match(new RegExp(`${field}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
    return m ? m[1] : null;
  };

  const name = get("name");
  const type = get("type") || (block.match(/type:\s*"([^"]+)"/) || [])[1];
  const muscleGroup = get("muscleGroup");
  const currentEquipment = get("equipment");

  if (!name || !type || !muscleGroup || !currentEquipment) return block;

  const nameLower = name.toLowerCase();

  // -- equipment --
  const newEquipment = inferEquipment(name, currentEquipment);
  if (newEquipment !== currentEquipment) {
    equipmentChanges.push(`  "${name}": ${currentEquipment} -> ${newEquipment}`);
  }

  // -- tags --
  const tagSet = new Set([slug(muscleGroup), slug(newEquipment)]);
  for (const [re, tag] of MOVEMENT_TAGS) {
    if (re.test(nameLower)) tagSet.add(tag);
  }
  const newTags = Array.from(tagSet);
  const tagsLiteral = `[${newTags.map((t) => `"${t}"`).join(", ")}]`;

  // -- description / clientDescription --
  const tpl = TEMPLATES[type] || TEMPLATES.OTHER;
  const newDescription = tpl.description(muscleGroup, newEquipment);
  const newClientDescription = tpl.client(muscleGroup, newEquipment);

  let newBlock = block;
  newBlock = newBlock.replace(
    /equipment:\s*"(?:[^"\\]|\\.)*"/,
    `equipment: "${newEquipment}"`
  );
  newBlock = newBlock.replace(/tags:\s*\[[^\]]*\]/, `tags: ${tagsLiteral}`);
  newBlock = newBlock.replace(
    /description:\s*"(?:[^"\\]|\\.)*"/,
    `description: "${newDescription}"`
  );
  newBlock = newBlock.replace(
    /clientDescription:\s*"(?:[^"\\]|\\.)*"/,
    `clientDescription: "${newClientDescription}"`
  );

  fixed++;
  return newBlock;
});

const outPath = filePath.replace(/\.ts$/, ".final.ts");
fs.writeFileSync(outPath, result);

console.error(`\n=== REPORTE ===`);
console.error(`Ejercicios regenerados (tags/description/clientDescription): ${fixed}`);
console.error(`Cambios de equipment (inferidos del nombre): ${equipmentChanges.length}\n`);
equipmentChanges.forEach((l) => console.error(l));
console.error(`\nArchivo final escrito en: ${outPath}`);