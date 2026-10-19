"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  COORDINATION_LABEL,
  NEXT_STATUSES,
  STATUS_LABEL,
  type Coordination,
  type Lead,
  type LeadStatus,
} from "@/lib/constants";

interface Stats {
  total: number;
  nacional: number;
  internacional: number;
}

const STATUS_STYLE: Record<LeadStatus, string> = {
  NUEVO: "bg-blue-100 text-blue-800",
  CONTACTADO: "bg-amber-100 text-amber-800",
  CONVERTIDO: "bg-emerald-100 text-emerald-800",
  DESCARTADO: "bg-slate-200 text-slate-700",
};

const fmt = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function AdminPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<"" | Coordination>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const qs = filter ? `?coordination=${filter}` : "";
      const [l, s] = await Promise.all([
        fetch(`/api/leads${qs}`),
        fetch("/api/leads/stats"),
      ]);
      if (l.status === 401 || s.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!l.ok || !s.ok) throw new Error();
      setLeads(await l.json());
      setStats(await s.json());
    } catch {
      setError("No se pudo cargar la información. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function changeStatus(id: string, status: LeadStatus) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/leads/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Error");
      }
      await load();
    } catch (e) {
      setError(
        e instanceof Error && e.message !== "Error"
          ? e.message
          : "No se pudo actualizar el estado.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  const counters = [
    { label: "Total de solicitudes", value: stats?.total },
    { label: "Nacionales", value: stats?.nacional },
    { label: "Internacionales", value: stats?.internacional },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Solicitudes</h1>
        <button
          onClick={logout}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {counters.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="mt-1 text-3xl font-bold">{c.value ?? "–"}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="filter" className="text-sm font-medium">
          Coordinación
        </label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => {
            setLoading(true);
            setFilter(e.target.value as "" | Coordination);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todas</option>
          <option value="NACIONAL">Nacional</option>
          <option value="INTERNACIONAL">Internacional</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">País</th>
              <th className="px-4 py-3">Coordinación</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cambiar estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Cargando…
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No hay solicitudes.
                </td>
              </tr>
            ) : (
              leads.map((l) => (
                <tr key={l.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{l.fullName}</p>
                    <p className="text-xs text-slate-500">{l.email}</p>
                  </td>
                  <td className="px-4 py-3">{l.country}</td>
                  <td className="px-4 py-3">{COORDINATION_LABEL[l.coordination]}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[l.status]}`}
                    >
                      {STATUS_LABEL[l.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {fmt.format(new Date(l.createdAt))}
                  </td>
                  <td className="px-4 py-3">
                    {NEXT_STATUSES[l.status].length === 0 ? (
                      <span className="text-xs text-slate-400">Finalizado</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {NEXT_STATUSES[l.status].map((s) => (
                          <button
                            key={s}
                            disabled={busyId === l.id}
                            onClick={() => changeStatus(l.id, s)}
                            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-100 disabled:opacity-50"
                          >
                            → {STATUS_LABEL[s]}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
