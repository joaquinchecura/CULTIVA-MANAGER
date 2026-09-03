#!/usr/bin/env node
/**
 * find-filter-mismatches.js
 *
 * Recorre tu archivo de seed y detecta qué ejercicios tienen `muscleGroup`
 * o `equipment` con valores que NO están en las listas fijas que usa el
 * frontend (ALL_KNOWN_MUSCLE_GROUPS / ALL_KNOWN_EQUIPMENT en page.tsx).
 * Esos ejercicios quedan "invisibles" para el filtro correspondiente aunque
 * sí aparezcan en el listado general.
 *
 * USO:
 *   node find-filter-mismatches.js prisma/seed.ts
 *
 * Salida:
 *   - Un resumen por consola.
 *   - mismatches-report.json con el detalle completo (para revisar en VSCode
 *     o pegarlo en otra conversación).
 *
 * Si cambiás las listas del frontend, actualizá las constantes
 * KNOWN_MUSCLE_GROUPS / KNOWN_EQUIPMENT de abajo para que coincidan
 * exactamente con las de page.tsx.
 */

const fs = require("fs");

const filePath = process.argv[2];
if (!filePath) {
  console.error("Uso: node find-filter-mismatches.js <archivo-seed.ts>");
  process.exit(1);
}

// ⚠️ Mantené esto sincronizado con ALL_KNOWN_MUSCLE_GROUPS / ALL_KNOWN_EQUIPMENT
// en app/admin/ejercicios/page.tsx y [id]/page.tsx
const KNOWN_MUSCLE_GROUPS = [
  "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Femoral",
  "Glúteos", "Pantorrilla", "Core", "Full body", "Piernas", "Cadera", "Tobillos",
  "Cuello", "Antebrazos", "Piso pélvico", "Mental", "Trapecio",
  "Eternocleidomastoideo", "Isquiotibiales", "Columna Torácica", "Columna Lumbar",
];

const KNOWN_EQUIPMENT = [
  "Barra", "Mancuernas", "Polea", "Paralelas", "Mancuerna", "Máquina", "Banco",
  "Cinta", "Elíptica", "Bicicleta", "Remo", "Soga", "Kettlebell", "Balón", "Cajón",
  "Cajón pliométrico", "Trineo", "Cuerdas", "Foam roller", "Palo", "Bosu",
  "Fitball", "Banda", "Pelota", "Peso corporal", "Pista",
];

const knownMuscleSet = new Set(KNOWN_MUSCLE_GROUPS);
const knownEquipmentSet = new Set(KNOWN_EQUIPMENT);

const src = fs.readFileSync(filePath, "utf8");

// Parseo por bloque de ejercicio (mismo patrón que los scripts anteriores)
const blockRegex = /\{\s*name:\s*"((?:[^"\\]|\\.)*)"[\s\S]*?isPublic:\s*(?:true|false),\s*\}/g;

const muscleMismatches = new Map(); // valor no reconocido -> [nombres de ejercicios]
const equipmentMismatches = new Map();
let totalExercises = 0;
let exercisesWithAnyMismatch = 0;

let match;
while ((match = blockRegex.exec(src)) !== null) {
  const block = match[0];
  const name = match[1];

  const muscleMatch = block.match(/muscleGroup:\s*"((?:[^"\\]|\\.)*)"/);
  const equipmentMatch = block.match(/equipment:\s*"((?:[^"\\]|\\.)*)"/);

  if (!muscleMatch && !equipmentMatch) continue;
  totalExercises++;

  let hasMismatch = false;

  if (muscleMatch) {
    const value = muscleMatch[1];
    if (!knownMuscleSet.has(value)) {
      hasMismatch = true;
      if (!muscleMismatches.has(value)) muscleMismatches.set(value, []);
      muscleMismatches.get(value).push(name);
    }
  }

  if (equipmentMatch) {
    const value = equipmentMatch[1];
    if (!knownEquipmentSet.has(value)) {
      hasMismatch = true;
      if (!equipmentMismatches.has(value)) equipmentMismatches.set(value, []);
      equipmentMismatches.get(value).push(name);
    }
  }

  if (hasMismatch) exercisesWithAnyMismatch++;
}

function printSection(title, map) {
  const sorted = Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  console.log(`\n=== ${title} (${sorted.length} valores distintos, ${sorted.reduce((s, [, v]) => s + v.length, 0)} ejercicios) ===`);
  for (const [value, names] of sorted) {
    console.log(`\n  "${value}"  →  ${names.length} ejercicio(s)`);
    names.slice(0, 5).forEach((n) => console.log(`    - ${n}`));
    if (names.length > 5) console.log(`    ... y ${names.length - 5} más`);
  }
}

console.log(`Total de ejercicios parseados: ${totalExercises}`);
console.log(`Ejercicios con al menos un valor fuera de las listas: ${exercisesWithAnyMismatch}`);

printSection("muscleGroup fuera de la lista conocida", muscleMismatches);
printSection("equipment fuera de la lista conocida", equipmentMismatches);

// Reporte completo en JSON para revisar con calma
const report = {
  totalExercises,
  exercisesWithAnyMismatch,
  muscleGroup: Object.fromEntries(muscleMismatches),
  equipment: Object.fromEntries(equipmentMismatches),
};
fs.writeFileSync("mismatches-report.json", JSON.stringify(report, null, 2));
console.log(`\n📄 Detalle completo guardado en mismatches-report.json`);