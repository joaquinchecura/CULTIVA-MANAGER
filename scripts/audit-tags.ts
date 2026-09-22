// scripts/audit-tags.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const exercises = await prisma.exercise.findMany({
    where: { isPublic: true },
    select: { id: true, name: true, type: true, muscleGroup: true, tags: true },
  });

  const tagCounts = new Map<string, number>();
  for (const ex of exercises) {
    for (const tag of ex.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const sorted = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`Total ejercicios: ${exercises.length}`);
  console.log(`Total tags distintos: ${sorted.length}\n`);
  sorted.forEach(([tag, count]) => console.log(`${count.toString().padStart(4)}  ${tag}`));

  // Ejercicios sin ningún tag — candidatos a revisar primero
  const untagged = exercises.filter((e) => e.tags.length === 0);
  console.log(`\nEjercicios sin tags: ${untagged.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());