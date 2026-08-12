"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Edit2, Copy, Trash2, Power, Eye, Send, X
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="flex items-center gap-1">
        <Link href={`/admin/rutinas/${routineId}`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600">
            <Eye size={14} />
          </Button>
        </Link>
        <Link href={`/admin/rutinas/${routineId}/editar`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600">
            <Edit2 size={14} />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600"
          onClick={() => { fetchMembers(); setShowAssignModal(true); }}
          title="Asignar a cliente"
        >
          <Send size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-400 hover:text-violet-600"
          onClick={() => setShowDuplicateModal(true)}
          title="Duplicar"
        >
          <Copy size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600"
          onClick={handleToggleActive}
          title={isActive ? "Desactivar" : "Activar"}
        >
          <Power size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
          onClick={() => setShowDeleteModal(true)}
          title="Eliminar"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Modal: Duplicar */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Duplicar rutina</h3>
            <p className="text-sm text-slate-500 mb-4">
              Se creará una copia de <strong>&quot;{routineName}&quot;</strong> con todos sus días y ejercicios.
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
              ¿Estás seguro de eliminar <strong>&quot;{routineName}&quot;</strong>? Esta acción no se puede deshacer.
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Asignar rutina</h3>
              <button onClick={() => setShowAssignModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Seleccioná el cliente al que querés asignar <strong>&quot;{routineName}&quot;</strong>
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