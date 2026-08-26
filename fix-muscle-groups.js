#!/usr/bin/env node
/**
 * fix-muscle-groups.js
 *
 * Corrige el campo `muscleGroup` de cada ejercicio en tu archivo de seed
 * basándose en el NOMBRE del ejercicio, usando reglas derivadas de los
 * ejercicios "base" (los que ya tenían muscleGroup correcto en tu archivo).
 *
 * USO:
 *   node fix-muscle-groups.js ruta/a/tu/seed.ts > seed.corregido.ts
 *
 * El script:
 *  1. Lee el archivo completo como texto.
 *  2. Encuentra cada bloque `{ name: "...", ... muscleGroup: "...", ... }`.
 *  3. Calcula el muscleGroup correcto según el nombre (reglas por prioridad).
 *  4. Si difiere del actual, lo reemplaza y ajusta `description` /
 *     `clientDescription` para que mencionen el grupo muscular correcto.
 *  5. Imprime un reporte a stderr con todos los cambios hechos.
 *
 * Las reglas están para el español rioplatense de tu naming (remo, sentadilla,
 * hip thrust, etc). Revisá el reporte al final: cualquier ejercicio que no
 * matchee ninguna regla queda "SIN CAMBIOS" y lo lista aparte para que lo
 * repases a mano.
 */

const fs = require("fs");

const filePath = process.argv[2];
if (!filePath) {
  console.error("Uso: node fix-muscle-groups.js <archivo.ts>");
  process.exit(1);
}

const src = fs.readFileSync(filePath, "utf8");

// ---------------------------------------------------------------------
// Reglas de clasificación: [regex sobre el nombre en minúsculas, muscleGroup]
// Se evalúan en orden; la primera que matchea gana. Ordenadas de más
// específica a más genérica.
// ---------------------------------------------------------------------
const RULES = [
  // Glúteos
  [/hip thrust/, "Glúteos"],
  [/puente.*glute|glute.*puente/, "Glúteos"],

  // Femoral (isquiotibiales)
  [/peso muerto rumano/, "Femoral"],
  [/curl femoral/, "Femoral"],
  [/curl.*(femoral|isquio)/, "Femoral"],

  // Espalda (dominadas, remo, jalón, peso muerto genérico, hiperextensiones)
  [/dominada/, "Espalda"],
  [/remo(?!.*hiit)/, "Espalda"], // "remo" como ejercicio (no "remo hiit" cardio)
  [/jal[oó]n/, "Espalda"],
  [/hiperextensi[oó]n/, "Espalda"],
  [/peso muerto/, "Espalda"], // catch-all peso muerto que no sea rumano
  [/pull-?over/, "Pecho"], // pull-over es pecho, se resuelve antes si no matcheó "peso muerto"

  // Bíceps
  [/curl(?!.*(femoral|isquio))/, "Bíceps"],

  // Tríceps
  [/patada de tr[ií]ceps/, "Tríceps"],
  [/extensi[oó]n.*tr[ií]ceps|tr[ií]ceps.*extensi[oó]n/, "Tríceps"],
  [/fondos(?!.*paralelas)/, "Tríceps"],
  [/press franc[eé]s/, "Tríceps"],

  // Pecho
  [/press de banca/, "Pecho"],
  [/apertura/, "Pecho"],
  [/cruces?/, "Pecho"],
  [/fondos.*paralelas/, "Pecho"],
  [/pull-?over/, "Pecho"],

  // Hombros
  [/press militar|press.*hombr|hombr.*press/, "Hombros"],
  [/press arnold/, "Hombros"],
  [/press landmine/, "Hombros"],
  [/elevaci[oó]n (lateral|frontal)/, "Hombros"],
  [/p[aá]jaro/, "Hombros"],
  [/face pull/, "Hombros"],
  [/plancha con pica/, "Hombros"],

  // Cuádriceps
  [/sentadilla(?!.*(sissy))/, "Cuádriceps"],
  [/prensa/, "Cuádriceps"],
  [/extensi[oó]n.*cu[aá]driceps|cu[aá]driceps.*extensi[oó]n/, "Cuádriceps"],
  [/sentadilla sissy/, "Cuádriceps"],

  // Pantorrilla
  [/elevaci[oó]n de tal[oó]n/, "Pantorrilla"],

  // Core / abdominales
  [/^plancha$|plancha (lateral|con)/, "Core"],
  [/crunch/, "Core"],
  [/elevaci[oó]n de piernas/, "Core"],
  [/russian twist/, "Core"],

  // Cardio genérico (mantiene lo que ya tenga sentido; no forzamos)
];

function classify(name) {
  const n = name.toLowerCase();
  for (const [re, group] of RULES) {
    if (re.test(n)) return group;
  }
  return null; // sin match -> no tocar
}

// ---------------------------------------------------------------------
// Parseo de bloques de ejercicio. Cada objeto empieza con `name:` y
// contiene muscleGroup, equipment, description, clientDescription.
// ---------------------------------------------------------------------
const blockRegex = /\{\s*name:\s*"((?:[^"\\]|\\.)*)"[\s\S]*?isPublic:\s*(?:true|false),\s*\}/g;

let changed = 0;
let unmatched = [];
let report = [];

const result = src.replace(blockRegex, (block) => {
  const nameMatch = block.match(/name:\s*"((?:[^"\\]|\\.)*)"/);
  const groupMatch = block.match(/muscleGroup:\s*"((?:[^"\\]|\\.)*)"/);
  if (!nameMatch || !groupMatch) return block;

  const name = nameMatch[1];
  const currentGroup = groupMatch[1];
  const correctGroup = classify(name);

  if (!correctGroup) {
    unmatched.push(name);
    return block;
  }

  if (correctGroup === currentGroup) {
    return block; // ya estaba bien
  }

  changed++;
  report.push(`  "${name}": ${currentGroup} -> ${correctGroup}`);

  let newBlock = block.replace(
    /muscleGroup:\s*"(?:[^"\\]|\\.)*"/,
    `muscleGroup: "${correctGroup}"`
  );

  // Actualiza tags: reemplaza el tag del grupo muscular viejo (si estaba en minúscula/slug) por el nuevo
  const oldSlug = currentGroup.toLowerCase().replace(/\s+/g, "_");
  const newSlug = correctGroup.toLowerCase().replace(/\s+/g, "_");
  newBlock = newBlock.replace(new RegExp(`"${oldSlug}"`, "g"), `"${newSlug}"`);

  // Actualiza description / clientDescription: reemplaza menciones sueltas
  // del grupo muscular viejo (en minúsculas, tal como aparecen en las
  // plantillas: "enfocándote en X", "trabajar X", "de X con", etc.)
  const oldLower = currentGroup.toLowerCase();
  const newLower = correctGroup.toLowerCase();
  newBlock = newBlock.replace(
    new RegExp(`\\b${oldLower}\\b`, "g"),
    newLower
  );

  return newBlock;
});

fs.writeFileSync(filePath.replace(/\.ts$/, ".corregido.ts"), result);

console.error(`\n=== REPORTE DE CORRECCIÓN ===`);
console.error(`Ejercicios corregidos: ${changed}`);
console.error(`Ejercicios sin regla aplicable (revisar a mano): ${unmatched.length}\n`);
console.error(`--- Cambios aplicados ---`);
report.forEach((l) => console.error(l));
console.error(`\n--- Sin match (no se tocaron) ---`);
unmatched.forEach((n) => console.error(`  "${n}"`));
console.error(`\nArchivo corregido escrito en: ${filePath.replace(/\.ts$/, ".corregido.ts")}`);