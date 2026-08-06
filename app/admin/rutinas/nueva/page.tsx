import { prisma } from "@/lib/prisma";
import { RoutineBuilder } from "@/components/routines/routine-builder";

export default async function NuevaRutinaPage() {
  const members = await prisma.member.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { lastName: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">🎯 Nueva rutina</h2>
        <p className="text-slate-500 mt-1">Armá una rutina personalizada para un cliente</p>
      </div>
      <RoutineBuilder members={members} />
    </div>
  );
}