#!/usr/bin/env node
/**
 * normalize-filters.js
 *
 * Corrige `muscleGroup` y `equipment` en tu seed para que matcheen con las
 * listas fijas del frontend, aplicando 3 reglas en orden:
 *
 *  1. SINÓNIMO CONOCIDO → se reemplaza directo por el valor canónico
 *     (ej. "Bandas" -> "Banda", "Pectorales" -> "Pecho").
 *  2. VALOR COMPUESTO (" y ", " / ", " + ", " o ") → se separa: el primer
 *     término (mapeado si hace falta) queda como muscleGroup/equipment,
 *     el resto se agrega como tag adicional.
 *  3. LO QUE QUEDE SIN MAPEAR se reporta aparte como "categoría nueva
 *     genuina" — no se toca, para que decidas vos si la agregás al
 *     dropdown del frontend.
 *
 * USO:
 *   node normalize-filters.js prisma/seed.ts
 *
 * Genera:
 *   - prisma/seed.normalized.ts   (archivo corregido)
 *   - normalize-report.txt        (detalle de qué se tocó y qué falta decidir)
 *
 * Revisá los dos mapas de abajo (MUSCLE_SYNONYMS / EQUIPMENT_SYNONYMS) antes
 * de correrlo — son mi propuesta según el reporte que me pasaste, pero vos
 * conocés el negocio mejor que yo. Ajustá lo que no te cierre.
 */

const fs = require("fs");
const path = require("path");

const filePath = process.argv[2];
if (!filePath) {
  console.error("Uso: node normalize-filters.js <archivo-seed.ts>");
  process.exit(1);
}

// ── Listas canónicas actuales del frontend ──────────────────────────────
const CANONICAL_MUSCLE = [
  "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Femoral",
  "Glúteos", "Pantorrilla", "Core", "Full body", "Piernas", "Cadera", "Tobillos",
  "Cuello", "Antebrazos", "Piso pélvico", "Mental", "Trapecio",
  "Eternocleidomastoideo", "Isquiotibiales", "Columna Torácica", "Columna Lumbar",
];

const CANONICAL_EQUIPMENT = [
  "Barra", "Mancuernas", "Polea", "Paralelas", "Mancuerna", "Máquina", "Banco",
  "Cinta", "Elíptica", "Bicicleta", "Remo", "Soga", "Kettlebell", "Balón", "Cajón",
  "Cajón pliométrico", "Trineo", "Cuerdas", "Foam roller", "Palo", "Bosu",
  "Fitball", "Banda", "Pelota", "Peso corporal", "Pista",
];

// ── Sinónimos: valor tal cual aparece en el seed -> valor canónico ──────
// (solo para casos que son EXACTAMENTE lo mismo, sin perder información)
const MUSCLE_SYNONYMS = {
  "Espalda baja": "Columna Lumbar",
  "Zona lumbar": "Columna Lumbar",
  "columna torácica": "Columna Torácica", // fix de mayúsculas si aparece
  "Pectorales": "Pecho",
  "Dorsales": "Espalda",
  "Gemelos": "Pantorrilla",
  "Sóleo": "Pantorrilla",
  "Cuerpo completo": "Full body",
  "Rodillas": "Piernas",
  "Pie": "Tobillos",
  "Pantorrillas": "Pantorrilla",
  "Brazos": "Antebrazos",
};

const EQUIPMENT_SYNONYMS = {
  "Bandas": "Banda",
  "Banda elástica": "Banda",
  "Banda elástica de resistencia": "Banda",
  "Bandas de compresión": "Banda",
  "Cuerda": "Cuerdas",
  "Soga de batalla": "Cuerdas",
  "Palo o bastón": "Palo",
  "Bicicleta de aire": "Bicicleta",
  "Bicicleta estática": "Bicicleta",
  "Cinta de correr": "Cinta",
  "Cajones pliométricos": "Cajón pliométrico",
  "Pista o terreno inclinado": "Pista",
  "Pendiente": "Pista",
  "Barra T": "Barra",
};

// ── Categorías nuevas genuinas (no son sinónimos de nada existente).
// El script las DEJA COMO ESTÁN (no las toca) pero las junta en el reporte
// para que decidas si las agregás a las listas del frontend. ─────────────
const KNOWN_NEW_CATEGORIES_MUSCLE = new Set(["Muñecas", "Columna"]);
const KNOWN_NEW_CATEGORIES_EQUIPMENT = new Set([
  "TRX", "Sandbag", "Pared", "Balón medicinal", "Neumático",
  "Escalera de agilidad", "Vallas", "Paracaídas",
]);

function slug(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

// Separa un valor compuesto en [primero, ...resto]. Soporta " y ", " / ",
// " + ", " o " (con espacios alrededor, case-insensitive para "y"/"o").
function splitCompound(value) {
  const parts = value.split(/\s*\/\s*|\s*\+\s*|\s+y\s+|\s+o\s+/i).map((p) => p.trim()).filter(Boolean);
  return parts;
}

function resolve(value, synonyms, canonicalList, knownNew) {
  // 1. ¿Ya es canónico?
  if (canonicalList.includes(value)) {
    return { resolved: value, extraTags: [], status: "ok" };
  }
  // 2. ¿Es sinónimo directo? (renombre 1:1, no hace falta tag extra)
  if (synonyms[value]) {
    return { resolved: synonyms[value], extraTags: [], status: "synonym" };
  }
  // 3. ¿Es una categoría nueva conocida (no se toca)?
  if (knownNew.has(value)) {
    return { resolved: value, extraTags: [], status: "new-category" };
  }
  // 4. ¿Es compuesto? Separar y resolver el primer término.
  const parts = splitCompound(value);
  if (parts.length > 1) {
    const [first, ...rest] = parts;
    // el primer término puede a su vez ser canónico o sinónimo
    let resolvedFirst = first;
    let status = "compound";
    if (canonicalList.includes(first)) {
      resolvedFirst = first;
    } else if (synonyms[first]) {
      resolvedFirst = synonyms[first];
    } else {
      status = "compound-unresolved-primary"; // el primer término tampoco matchea nada conocido
    }
    const extraTags = rest.map(slug);
    return { resolved: resolvedFirst, extraTags, status };
  }
  // 5. No se pudo resolver de ninguna forma.
  return { resolved: value, extraTags: [], status: "unresolved" };
}

// ── Parseo y aplicación ──────────────────────────────────────────────────
const src = fs.readFileSync(filePath, "utf8");
const blockRegex = /\{\s*name:\s*"((?:[^"\\]|\\.)*)"[\s\S]*?isPublic:\s*(?:true|false),\s*\}/g;

const logLines = [];
const newCategoriesFound = { muscle: new Set(), equipment: new Set() };
const unresolvedFound = { muscle: new Map(), equipment: new Map() };
let changedCount = 0;

const result = src.replace(blockRegex, (block) => {
  const nameMatch = block.match(/name:\s*"((?:[^"\\]|\\.)*)"/);
  const muscleMatch = block.match(/muscleGroup:\s*"((?:[^"\\]|\\.)*)"/);
  const equipMatch = block.match(/equipment:\s*"((?:[^"\\]|\\.)*)"/);
  const tagsMatch = block.match(/tags:\s*\[([^\]]*)\]/);

  if (!nameMatch) return block;
  const name = nameMatch[1];

  let newBlock = block;
  const extraTagsAll = [];
  let touched = false;

  if (muscleMatch) {
    const { resolved, extraTags, status } = resolve(
      muscleMatch[1], MUSCLE_SYNONYMS, CANONICAL_MUSCLE, KNOWN_NEW_CATEGORIES_MUSCLE
    );
    if (status === "new-category") newCategoriesFound.muscle.add(muscleMatch[1]);
    if (status === "unresolved" || status === "compound-unresolved-primary") {
      if (!unresolvedFound.muscle.has(muscleMatch[1])) unresolvedFound.muscle.set(muscleMatch[1], []);
      unresolvedFound.muscle.get(muscleMatch[1]).push(name);
    }
    if (resolved !== muscleMatch[1]) {
      newBlock = newBlock.replace(
        /muscleGroup:\s*"(?:[^"\\]|\\.)*"/,
        `muscleGroup: "${resolved}"`
      );
      touched = true;
      logLines.push(`[muscleGroup] ${name}: "${muscleMatch[1]}" -> "${resolved}"${extraTags.length ? ` (+tags: ${extraTags.join(", ")})` : ""}`);
    }
    extraTagsAll.push(...extraTags);
  }

  if (equipMatch) {
    const { resolved, extraTags, status } = resolve(
      equipMatch[1], EQUIPMENT_SYNONYMS, CANONICAL_EQUIPMENT, KNOWN_NEW_CATEGORIES_EQUIPMENT
    );
    if (status === "new-category") newCategoriesFound.equipment.add(equipMatch[1]);
    if (status === "unresolved" || status === "compound-unresolved-primary") {
      if (!unresolvedFound.equipment.has(equipMatch[1])) unresolvedFound.equipment.set(equipMatch[1], []);
      unresolvedFound.equipment.get(equipMatch[1]).push(name);
    }
    if (resolved !== equipMatch[1]) {
      newBlock = newBlock.replace(
        /equipment:\s*"(?:[^"\\]|\\.)*"/,
        `equipment: "${resolved}"`
      );
      touched = true;
      logLines.push(`[equipment]   ${name}: "${equipMatch[1]}" -> "${resolved}"${extraTags.length ? ` (+tags: ${extraTags.join(", ")})` : ""}`);
    }
    extraTagsAll.push(...extraTags);
  }

  // fusionar tags nuevos con los existentes, sin duplicar
  if (extraTagsAll.length && tagsMatch) {
    const existing = tagsMatch[1]
      .split(",")
      .map((t) => t.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);
    const merged = Array.from(new Set([...existing, ...extraTagsAll]));
    const newTagsLiteral = `[${merged.map((t) => `"${t}"`).join(", ")}]`;
    newBlock = newBlock.replace(/tags:\s*\[[^\]]*\]/, `tags: ${newTagsLiteral}`);
  }

  if (touched) changedCount++;
  return newBlock;
});

const outPath = filePath.replace(/\.ts$/, ".normalized.ts");
fs.writeFileSync(outPath, result);

// ── Reporte ───────────────────────────────────────────────────────────
const report = [];
report.push(`=== NORMALIZACIÓN DE FILTROS ===`);
report.push(`Ejercicios modificados: ${changedCount}\n`);

report.push(`--- Cambios aplicados (sinónimos + compuestos separados) ---`);
report.push(...logLines);

report.push(`\n--- Categorías NUEVAS genuinas encontradas (no tocadas, decidí si agregarlas al frontend) ---`);
report.push(`muscleGroup: ${Array.from(newCategoriesFound.muscle).join(", ") || "(ninguna)"}`);
report.push(`equipment:   ${Array.from(newCategoriesFound.equipment).join(", ") || "(ninguna)"}`);

report.push(`\n--- SIN RESOLVER (revisar a mano — no matchean ni sinónimo ni lista canónica) ---`);
for (const [value, names] of unresolvedFound.muscle) {
  report.push(`muscleGroup "${value}": ${names.join(", ")}`);
}
for (const [value, names] of unresolvedFound.equipment) {
  report.push(`equipment "${value}": ${names.join(", ")}`);
}

fs.writeFileSync("normalize-report.txt", report.join("\n"));

console.log(`✅ Listo. Ejercicios modificados: ${changedCount}`);
console.log(`📄 Archivo corregido: ${outPath}`);
console.log(`📄 Reporte completo: normalize-report.txt`);
console.log(`\nCategorías nuevas a decidir:`);
console.log(`  muscleGroup: ${Array.from(newCategoriesFound.muscle).join(", ") || "(ninguna)"}`);
console.log(`  equipment:   ${Array.from(newCategoriesFound.equipment).join(", ") || "(ninguna)"}`);