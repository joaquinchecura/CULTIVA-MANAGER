// convert-backup-to-csv.js
// Uso: node convert-backup-to-csv.js cultiva-backup-2026-09-14.json

const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Uso: node convert-backup-to-csv.js <archivo-backup.json>');
  process.exit(1);
}

const backup = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
const outDir = 'backup-csv';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

for (const [table, rows] of Object.entries(backup.data)) {
  if (!Array.isArray(rows) || rows.length === 0) continue;
  const csv = toCSV(rows);
  const outPath = path.join(outDir, `${table}.csv`);
  fs.writeFileSync(outPath, csv, 'utf-8');
  console.log(`✅ ${table}.csv (${rows.length} filas)`);
}

console.log(`\nListo. Archivos en ./${outDir}/`);