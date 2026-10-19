"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!password) {
      setError("Ingresa la contraseña");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/admin");
        return;
      }
      setError(
        res.status === 429
          ? "Demasiados intentos. Espera un minuto."
          : "Contraseña incorrecta",
      );
    } catch {
      setError("Sin conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold">Panel administrativo</h1>
      <p className="mb-6 text-sm text-slate-600">MedLeads · acceso restringido</p>
      <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "login-error" : undefined}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          />
          {error && (
            <p id="login-error" role="alert" className="mt-1 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
