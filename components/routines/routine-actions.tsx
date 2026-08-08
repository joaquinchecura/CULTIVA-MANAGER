"use client";

import { toggleRoutineActive, deleteRoutine } from "@/app/actions/routines";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function RoutineActions({ routineId, isActive }: { routineId: string; isActive: boolean }) {
  const router = useRouter();

  async function handleToggle() {
    await toggleRoutineActive(routineId, !isActive);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("¿Estás seguro de eliminar esta rutina?")) return;
    await deleteRoutine(routineId);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Link href={`/admin/rutinas/${routineId}/editar`}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil size={14} />
        </Button>
      </Link>
      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleToggle}>
        {isActive ? "Desactivar" : "Activar"}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-500 hover:text-red-600"
        onClick={handleDelete}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}