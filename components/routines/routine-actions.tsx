"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MoreHorizontal, Edit2, Copy, Trash2, Power,
  Eye, Send, X, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RoutineActionsProps {
  routineId: string;
  isActive: boolean;
  routineName: string;
}

export function RoutineActions({ routineId, isActive, routineName }: RoutineActionsProps) {
  const router = useRouter();
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState("");

  const handleToggleActive = async () => {
    try {
      const res = await fetch(`/api/routines/${routineId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/routines/${routineId}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        setShowDuplicateModal(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/routines/${routineId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowDeleteModal(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedMember) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/routines/${routineId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: selectedMember }),
      });
      if (res.ok) {
        setShowAssignModal(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/admin/clientes");
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal size={16} className="text-slate-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/admin/rutinas/${routineId}`} className="flex items-center gap-2 cursor-pointer">
              <Eye size={14} /> Ver detalle
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/rutinas/${routineId}/editar`} className="flex items-center gap-2 cursor-pointer">
              <Edit2 size={14} /> Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => { fetchMembers(); setShowAssignModal(true); }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Send size={14} /> Asignar a cliente
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDuplicateModal(true)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Copy size={14} /> Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleToggleActive}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Power size={14} />
            {isActive ? "Desactivar" : "Activar"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
          >
            <Trash2 size={14} /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal: Duplicar */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Duplicar rutina</h3>
            <p className="text-sm text-slate-500 mb-4">
              Se creará una copia de <strong>"{routineName}"</strong> con todos sus días y ejercicios.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleDuplicate} disabled={loading} className="flex-1 gap-2">
                {loading ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full" /> : <Copy size={16} />}
                {loading ? "Duplicando..." : "Duplicar"}
              </Button>
              <Button variant="outline" onClick={() => setShowDuplicateModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Eliminar rutina</h3>
            <p className="text-sm text-slate-500 mb-4">
              ¿Estás seguro de eliminar <strong>"{routineName}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleDelete} disabled={loading} variant="destructive" className="flex-1 gap-2">
                {loading ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full" /> : <Trash2 size={16} />}
                {loading ? "Eliminando..." : "Eliminar"}
              </Button>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Asignar */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Asignar rutina</h3>
            <p className="text-sm text-slate-500 mb-4">
              Seleccioná el cliente al que querés asignar <strong>"{routineName}"</strong>
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedMember === m.id
                      ? "bg-blue-50 border border-blue-200 text-blue-900"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <span className="font-medium">{m.firstName} {m.lastName}</span>
                  <span className="text-slate-500 text-xs ml-2">DNI: {m.dni}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={handleAssign} disabled={loading || !selectedMember} className="flex-1 gap-2">
                {loading ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full" /> : <Send size={16} />}
                {loading ? "Asignando..." : "Asignar"}
              </Button>
              <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}