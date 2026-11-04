"use client";

import { OrganizationList } from "@clerk/nextjs";

export default function SelectOrgPage() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Seleccioná tu organización</h1>
          <p className="text-sm text-slate-500 mt-2">
            Para continuar, elegí el gimnasio al que pertenecés.
          </p>
        </div>
        <OrganizationList 
          hidePersonal 
          afterSelectOrganizationUrl="/admin"
          afterCreateOrganizationUrl="/admin"
        />
      </div>
    </div>
  );
}