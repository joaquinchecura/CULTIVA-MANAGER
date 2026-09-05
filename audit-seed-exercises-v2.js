#!/usr/bin/env node

/**
 * AUDITOR ROBUSTO DE seed.ts
 *
 * USO:
 *   node audit-seed-exercises-v2.js ./prisma/seed.ts
 *
 * O:
 *   node audit-seed-exercises-v2.js ./prisma/seed.ts --out ./seed-audit
 *
 * IMPORTANTE:
 * - NO modifica seed.ts
 * - Detecta errores estructurales
 * - Separa ERRORES de WARNINGS
 * - No marca automáticamente una descripción como incorrecta
 *   solamente porque no repita literalmente el nombre
 */

const fs = require("fs");
const path = require("path");

// ============================================================
// ARGUMENTOS
// ============================================================

const args = process.argv.slice(2);

const input = args.find((arg) => !arg.startsWith("--"));

const outIndex = args.indexOf("--out");

const outDir =
  outIndex >= 0 && args[outIndex + 1]
    ? args[outIndex + 1]
    : path.join(path.dirname(input || "."), "seed-audit");

if (!input) {
  console.error("");
  console.error("Uso:");
  console.error(
    "  node audit-seed-exercises-v2.js ./prisma/seed.ts"
  );
  console.error("");
  process.exit(1);
}

if (!fs.existsSync(input)) {
  console.error("");
  console.error(`❌ No existe el archivo: ${input}`);
  console.error("");
  process.exit(1);
}

const source = fs.readFileSync(input, "utf8");

fs.mkdirSync(outDir, { recursive: true });

// ============================================================
// TIPOS
// ============================================================

const FALLBACK_TYPES = new Set([
  "STRENGTH",
  "CARDIO",
  "FUNCTIONAL",
  "MOBILITY",
  "STRETCHING",
  "REHABILITATION",
  "WARMUP",
  "PLYOMETRIC",
  "TECHNIQUE",
  "BALANCE",
  "COOLDOWN",
  "OTHER",
]);

// ============================================================
// HELPERS
// ============================================================

function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

function decodeString(raw) {
  if (!raw) return "";

  const body = raw.slice(1, -1);

  return body
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\`/g, "`")
    .replace(/\\\\/g, "\\");
}

function extractStringField(text, fieldName) {
  const regex = new RegExp(
    "\\b" +
      fieldName +
      "\\s*:\\s*(\"(?:\\\\.|[^\"\\\\])*\"|'(?:\\\\.|[^'\\\\])*'|`(?:\\\\.|[^`\\\\])*`)",
    "m"
  );

  const match = text.match(regex);

  return match ? decodeString(match[1]) : "";
}

function extractTypeField(text) {
  const match = text.match(
    /\btype\s*:\s*["']([^"']+)["']\s*(?:as\s+ExerciseType)?/
  );

  return match ? match[1].trim() : "";
}

function extractArrayField(text, fieldName) {
  const regex = new RegExp(
    "\\b" +
      fieldName +
      "\\s*:\\s*\\[([\\s\\S]*?)\\]",
    "m"
  );

  const match = text.match(regex);

  if (!match) {
    return [];
  }

  return [
    ...match[1].matchAll(
      /"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'/g
    ),
  ]
    .map((match) => {
      const value =
        match[1] !== undefined
          ? `"${match[1]}"`
          : `'${match[2]}'`;

      return decodeString(value);
    })
    .filter(Boolean);
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

function tokenize(value) {
  return new Set(
    normalize(value)
      .split(" ")
      .filter(Boolean)
  );
}

function similarity(a, b) {
  const A = tokenize(a);
  const B = tokenize(b);

  if (!A.size || !B.size) {
    return 0;
  }

  let intersection = 0;

  for (const token of A) {
    if (B.has(token)) {
      intersection++;
    }
  }

  return intersection / Math.max(A.size, B.size);
}

function countBy(rows, key) {
  const counts = {};

  for (const row of rows) {
    const value = row[key] || "(vacío)";

    counts[value] = (counts[value] || 0) + 1;
  }

  return Object.fromEntries(
    Object.entries(counts).sort(
      (a, b) => b[1] - a[1]
    )
  );
}

// ============================================================
// EXTRACCIÓN DE OBJETOS DE exercises Y newExercises
// ============================================================

function extractArrayObjects(text) {
  const clean = stripComments(text);

  const arrays = [];

  const arrayRegex =
    /(?:const|let|var)\s+(exercises|newExercises)\s*=\s*\[/g;

  let match;

  while ((match = arrayRegex.exec(clean))) {
    const arrayStart = clean.indexOf(
      "[",
      match.index
    );

    let depth = 0;
    let quote = null;
    let escaped = false;
    let arrayEnd = -1;

    for (
      let i = arrayStart;
      i < clean.length;
      i++
    ) {
      const char = clean[i];

      if (quote) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === quote) {
          quote = null;
        }

        continue;
      }

      if (
        char === '"' ||
        char === "'" ||
        char === "`"
      ) {
        quote = char;
        continue;
      }

      if (char === "[") {
        depth++;
      } else if (char === "]") {
        depth--;

        if (depth === 0) {
          arrayEnd = i;
          break;
        }
      }
    }

    if (arrayEnd < 0) {
      continue;
    }

    const body = clean.slice(
      arrayStart + 1,
      arrayEnd
    );

    const objects = [];

    let objectStart = -1;
let braceDepth = 0;
let currentQuote = null;
let objectEscaped = false;

    for (
      let i = 0;
      i < body.length;
      i++
    ) {
      const char = body[i];

      if (currentQuote) {
        if (objectEscaped) {
          objectEscaped = false;
        } else if (char === "\\") {
          objectEscaped = true;
        } else if (char === currentQuote) {
          currentQuote = null;
        }
      
        continue;
      }

      if (
        char === '"' ||
        char === "'" ||
        char === "`"
      ) {
        currentQuote = char;
        continue;
      }

      if (char === "{") {
        if (braceDepth === 0) {
          objectStart = i;
        }

        braceDepth++;
      }

      if (char === "}") {
        braceDepth--;

        if (
          braceDepth === 0 &&
          objectStart >= 0
        ) {
          objects.push(
            body.slice(
              objectStart,
              i + 1
            )
          );

          objectStart = -1;
        }
      }
    }

    arrays.push({
      name: match[1],
      objects,
    });
  }

  return arrays.flatMap((array) =>
    array.objects.map((object) => ({
      sourceArray: array.name,
      text: object,
    }))
  );
}

// ============================================================
// DETECTAR TYPES DEL PROPIO SEED
// ============================================================

function discoverTypes(text) {
  const found = new Set(FALLBACK_TYPES);

  const regex =
    /["']([A-Z][A-Z0-9_]{2,})["']\s*(?:as\s+ExerciseType)?/g;

  for (const match of text.matchAll(regex)) {
    const candidate = match[1];

    if (
      [
        "STRENGTH",
        "CARDIO",
        "FUNCTIONAL",
        "MOBILITY",
        "STRETCHING",
        "REHABILITATION",
        "WARMUP",
        "PLYOMETRIC",
        "TECHNIQUE",
        "BALANCE",
        "COOLDOWN",
        "OTHER",
      ].includes(candidate)
    ) {
      found.add(candidate);
    }
  }

  return found;
}

// ============================================================
// PARSEAR EJERCICIOS
// ============================================================

const objects = extractArrayObjects(source);

const rows = objects.map((item, index) => {
  const text = item.text;

  return {
    index: index + 1,

    sourceArray: item.sourceArray,

    name: extractStringField(
      text,
      "name"
    ),

    type: extractTypeField(text),

    muscleGroup: extractStringField(
      text,
      "muscleGroup"
    ),

    equipment: extractStringField(
      text,
      "equipment"
    ),

    tags: extractArrayField(
      text,
      "tags"
    ),

    description: extractStringField(
      text,
      "description"
    ),

    clientDescription:
      extractStringField(
        text,
        "clientDescription"
      ),

    isPublic:
      /\bisPublic\s*:\s*true\b/.test(text),
  };
});

const allowedTypes =
  discoverTypes(source);

// ============================================================
// RESULTADOS
// ============================================================

const errors = [];
const warnings = [];

const byName = new Map();

// ============================================================
// ERROR / WARNING HELPERS
// ============================================================

function addError(
  row,
  issue,
  extra = {}
) {
  errors.push({
    severity: "ERROR",
    index: row.index,
    name: row.name,
    issue,
    ...extra,
  });
}

function addWarning(
  row,
  issue,
  extra = {}
) {
  warnings.push({
    severity: "WARNING",
    index: row.index,
    name: row.name,
    issue,
    ...extra,
  });
}

// ============================================================
// 1. CAMPOS OBLIGATORIOS
// ============================================================

for (const row of rows) {
  if (!row.name) {
    addError(
      row,
      "MISSING_NAME"
    );
  }

  if (!row.type) {
    addError(
      row,
      "MISSING_TYPE"
    );
  }

  if (!row.muscleGroup) {
    addError(
      row,
      "MISSING_MUSCLE_GROUP"
    );
  }

  if (!row.equipment) {
    addError(
      row,
      "MISSING_EQUIPMENT"
    );
  }

  if (!row.description) {
    addError(
      row,
      "MISSING_DESCRIPTION"
    );
  }

  if (!row.clientDescription) {
    addError(
      row,
      "MISSING_CLIENT_DESCRIPTION"
    );
  }

  if (!row.tags.length) {
    addError(
      row,
      "MISSING_TAGS"
    );
  }

  if (
    row.type &&
    !allowedTypes.has(row.type)
  ) {
    addError(
      row,
      "UNKNOWN_TYPE",
      {
        value: row.type,
      }
    );
  }

  // Tags duplicados dentro del mismo ejercicio

  if (row.tags.length) {
    const normalizedTags =
      row.tags.map(normalize);

    const uniqueTags =
      new Set(normalizedTags);

    if (
      uniqueTags.size !==
      normalizedTags.length
    ) {
      addWarning(
        row,
        "DUPLICATE_TAGS"
      );
    }
  }

  // Agrupar por nombre

  const key = normalize(row.name);

  if (key) {
    if (!byName.has(key)) {
      byName.set(key, []);
    }

    byName
      .get(key)
      .push(row);
  }
}

// ============================================================
// 2. DUPLICADOS
// ============================================================

for (const list of byName.values()) {
  if (list.length <= 1) {
    continue;
  }

  const signatures =
    new Set(
      list.map((row) =>
        JSON.stringify({
          type: row.type,
          muscleGroup:
            row.muscleGroup,
          equipment:
            row.equipment,
          description:
            normalize(
              row.description
            ),
          clientDescription:
            normalize(
              row.clientDescription
            ),
        })
      )
    );

  for (const row of list) {
    if (signatures.size === 1) {
      addError(
        row,
        "DUPLICATE_EXACT_EXERCISE",
        {
          duplicateCount:
            list.length,
        }
      );
    } else {
      addWarning(
        row,
        "DUPLICATE_NAME_DIFFERENT_DATA",
        {
          duplicateCount:
            list.length,

          variants: list.map(
            (exercise) => ({
              type: exercise.type,
              muscleGroup:
                exercise.muscleGroup,
              equipment:
                exercise.equipment,
            })
          ),
        }
      );
    }
  }
}

// ============================================================
// 3. DESCRIPCIONES SOSPECHOSAS
// ============================================================

const genericDescriptionPatterns =
  [
    /^ejercicio de .+ tipo .+ requiere /i,
    /^ejercicio de .+ que trabaja /i,
  ];

for (const row of rows) {
  if (
    !row.name ||
    !row.description
  ) {
    continue;
  }

  const sim = similarity(
    row.name,
    row.description
  );

  const isGeneric =
    genericDescriptionPatterns.some(
      (regex) =>
        regex.test(
          row.description
        )
    );

  if (isGeneric) {
    addWarning(
      row,
      "GENERIC_DESCRIPTION",
      {
        description:
          row.description,
      }
    );
  } else if (
    sim < 0.08 &&
    normalize(
      row.description
    ).split(" ").length <= 25
  ) {
    addWarning(
      row,
      "LOW_NAME_DESCRIPTION_RELATION",
      {
        similarity:
          Number(
            sim.toFixed(3)
          ),
      }
    );
  }
}

// ============================================================
// 4. EQUIPMENT SOSPECHOSO
// ============================================================

const equipmentHints = [
  [
    "mancuerna",
    ["mancuerna"],
  ],

  [
    "kettlebell",
    ["kettlebell"],
  ],

  [
    "banda",
    ["banda"],
  ],

  [
    "barra",
    ["barra"],
  ],

  [
    "smith",
    ["smith"],
  ],

  [
    "polea",
    ["polea"],
  ],

  [
    "trineo",
    [
      "trineo",
      "sled",
    ],
  ],

  [
    "foam roller",
    ["foam roller"],
  ],

  [
    "step",
    [
      "step",
      "plataforma",
    ],
  ],
];

for (const row of rows) {
  const name = normalize(
    row.name
  );

  const equipment =
    normalize(
      row.equipment
    );

  for (const [
    keyword,
    equipmentTerms,
  ] of equipmentHints) {
    if (
      !name.includes(keyword)
    ) {
      continue;
    }

    const equipmentMatches =
      equipmentTerms.some(
        (term) =>
          equipment.includes(
            normalize(term)
          )
      );

    if (
      !equipmentMatches
    ) {
      addWarning(
        row,
        "NAME_EQUIPMENT_POSSIBLE_MISMATCH",
        {
          keyword,
          equipment:
            row.equipment,
        }
      );
    }
  }
}

// ============================================================
// 5. TAGS SOSPECHOSOS
// ============================================================

for (const row of rows) {
  if (!row.tags.length) {
    continue;
  }

  const tagText = row.tags
    .map(normalize)
    .join(" ");

  const name = normalize(
    row.name
  );

  const importantTokens =
    name
      .split(" ")
      .filter(
        (token) =>
          token.length >= 5
      )
      .filter(
        (token) =>
          ![
            "con",
            "para",
            "desde",
            "sobre",
          ].includes(token)
      );

  const relevant =
    importantTokens.filter(
      (token) =>
        tagText.includes(
          token
        )
    );

  if (
    importantTokens.length >= 2 &&
    relevant.length === 0
  ) {
    addWarning(
      row,
      "TAGS_DO_NOT_REFLECT_NAME",
      {
        nameTokens:
          importantTokens,
      }
    );
  }
}

// ============================================================
// CSV
// ============================================================

function csvEscape(value) {
  if (Array.isArray(value)) {
    value = value.join("|");
  }

  if (
    value === null ||
    value === undefined
  ) {
    value = "";
  }

  const stringValue =
    String(value);

  return `"${stringValue.replace(
    /"/g,
    '""'
  )}"`;
}

function writeCsv(
  filename,
  headers,
  data
) {
  const lines = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) =>
          csvEscape(
            row[header]
          )
        )
        .join(",")
    ),
  ];

  fs.writeFileSync(
    path.join(
      outDir,
      filename
    ),
    lines.join("\n"),
    "utf8"
  );
}

// ============================================================
// ESTADÍSTICAS
// ============================================================

const report = {
  generatedAt:
    new Date().toISOString(),

  inputFile:
    path.resolve(input),

  summary: {
    rawExerciseObjects:
      rows.length,

    uniqueNames:
      byName.size,

    duplicateNameGroups:
      [...byName.values()]
        .filter(
          (list) =>
            list.length > 1
        ).length,

    errors:
      errors.length,

    warnings:
      warnings.length,

    publicExercises:
      rows.filter(
        (row) =>
          row.isPublic
      ).length,
  },

  allowedTypes:
    [...allowedTypes].sort(),

  statistics: {
    byType:
      countBy(
        rows,
        "type"
      ),

    byMuscleGroup:
      countBy(
        rows,
        "muscleGroup"
      ),

    byEquipment:
      countBy(
        rows,
        "equipment"
      ),

    bySourceArray:
      countBy(
        rows,
        "sourceArray"
      ),
  },

  issues: {
    errors,
    warnings,
  },
};

// ============================================================
// AUDIT COMPLETO
// ============================================================

writeCsv(
  "audit-exercises.csv",
  [
    "index",
    "sourceArray",
    "name",
    "type",
    "muscleGroup",
    "equipment",
    "tags",
    "description",
    "clientDescription",
    "isPublic",
  ],
  rows
);

// ============================================================
// ERRORS
// ============================================================

writeCsv(
  "errors.csv",
  [
    "severity",
    "index",
    "name",
    "issue",
    "value",
    "duplicateCount",
  ],
  errors
);

// ============================================================
// WARNINGS
// ============================================================

writeCsv(
  "warnings.csv",
  [
    "severity",
    "index",
    "name",
    "issue",
    "value",
    "duplicateCount",
    "similarity",
    "keyword",
    "equipment",
  ],
  warnings
);

// ============================================================
// DUPLICADOS
// ============================================================

const duplicateRows = [];

for (const list of byName.values()) {
  if (list.length <= 1) {
    continue;
  }

  for (const row of list) {
    duplicateRows.push({
      index:
        row.index,

      name:
        row.name,

      type:
        row.type,

      muscleGroup:
        row.muscleGroup,

      equipment:
        row.equipment,

      sourceArray:
        row.sourceArray,
    });
  }
}

writeCsv(
  "duplicates.csv",
  [
    "index",
    "name",
    "type",
    "muscleGroup",
    "equipment",
    "sourceArray",
  ],
  duplicateRows
);

// ============================================================
// CAMPOS FALTANTES
// ============================================================

const missingRows =
  errors.filter(
    (error) =>
      error.issue.startsWith(
        "MISSING_"
      )
  );

writeCsv(
  "missing-fields.csv",
  [
    "index",
    "name",
    "issue",
  ],
  missingRows
);

// ============================================================
// SOSPECHOSOS
// ============================================================

writeCsv(
  "suspicious-exercises.csv",
  [
    "index",
    "name",
    "issue",
    "similarity",
    "keyword",
    "equipment",
    "duplicateCount",
  ],
  warnings
);

// ============================================================
// ESTADÍSTICAS
// ============================================================

const statisticsRows = [];

for (const [
  type,
  count,
] of Object.entries(
  report.statistics.byType
)) {
  statisticsRows.push({
    category:
      "type",

    value:
      type,

    count,
  });
}

for (const [
  muscleGroup,
  count,
] of Object.entries(
  report.statistics
    .byMuscleGroup
)) {
  statisticsRows.push({
    category:
      "muscleGroup",

    value:
      muscleGroup,

    count,
  });
}

for (const [
  equipment,
  count,
] of Object.entries(
  report.statistics
    .byEquipment
)) {
  statisticsRows.push({
    category:
      "equipment",

    value:
      equipment,

    count,
  });
}

writeCsv(
  "statistics.csv",
  [
    "category",
    "value",
    "count",
  ],
  statisticsRows
);

// ============================================================
// JSON
// ============================================================

fs.writeFileSync(
  path.join(
    outDir,
    "audit-report.json"
  ),
  JSON.stringify(
    report,
    null,
    2
  ),
  "utf8"
);

// ============================================================
// CONSOLA
// ============================================================

console.log("");
console.log(
  "=============================================="
);
console.log(
  "       AUDITORÍA ROBUSTA DE SEED.TS"
);
console.log(
  "=============================================="
);
console.log("");

console.log(
  `Archivo: ${path.resolve(
    input
  )}`
);

console.log(
  `Objetos detectados: ${rows.length}`
);

console.log(
  `Nombres únicos: ${byName.size}`
);

console.log(
  `Grupos duplicados: ${report.summary.duplicateNameGroups}`
);

console.log(
  `ERRORES: ${errors.length}`
);

console.log(
  `WARNINGS: ${warnings.length}`
);

console.log("");

console.log("TIPOS:");

for (const [
  type,
  count,
] of Object.entries(
  report.statistics.byType
)) {
  console.log(
    `  ${type.padEnd(
      18
    )} ${count}`
  );
}

console.log("");

console.log(
  "ERRORES:"
);

if (!errors.length) {
  console.log(
    "  ✓ No se detectaron errores estructurales."
  );
} else {
  const counts =
    countBy(
      errors,
      "issue"
    );

  for (const [
    issue,
    count,
  ] of Object.entries(
    counts
  )) {
    console.log(
      `  ${issue}: ${count}`
    );
  }
}

console.log("");

console.log(
  "WARNINGS:"
);

if (!warnings.length) {
  console.log(
    "  ✓ No se detectaron warnings."
  );
} else {
  const counts =
    countBy(
      warnings,
      "issue"
    );

  for (const [
    issue,
    count,
  ] of Object.entries(
    counts
  )) {
    console.log(
      `  ${issue}: ${count}`
    );
  }
}

console.log("");

console.log(
  "ARCHIVOS GENERADOS:"
);

[
  "audit-report.json",
  "audit-exercises.csv",
  "errors.csv",
  "warnings.csv",
  "duplicates.csv",
  "missing-fields.csv",
  "suspicious-exercises.csv",
  "statistics.csv",
].forEach((file) => {
  console.log(
    `  ${path.join(
      outDir,
      file
    )}`
  );
});

console.log("");

console.log(
  "=============================================="
);

console.log(
  "El seed.ts original NO fue modificado."
);

console.log(
  "=============================================="
);

console.log("");