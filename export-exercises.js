// export-exercises.js
//
// Dumpea {id, name} de todos los ejercicios de tu base a exercises-list.json.
// Ese archivo lo va a usar match-images.html para armar el buscador/autocomplete.
//
// USO:
//   node export-exercises.js
//
// Requiere que ya tengas @prisma/client instalado y el schema generado
// (npx prisma generate) en el proyecto donde corras esto.

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function main() {
  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true, imageUrl: true },
    orderBy: { name: "asc" },
  });

  fs.writeFileSync(
    "exercises-list.json",
    JSON.stringify(exercises, null, 2),
    "utf8"
  );

  const withImage = exercises.filter((e) => e.imageUrl).length;
  console.log(`✅ Exportados ${exercises.length} ejercicios a exercises-list.json`);
  console.log(`   (${withImage} ya tienen imageUrl cargado, ${exercises.length - withImage} pendientes)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());