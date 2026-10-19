"use client";

import { useState } from "react";
import { COUNTRIES, PROCEDURES } from "@/lib/constants";

type Field = "fullName" | "email" | "phone" | "country" | "procedure" | "message";
type Errors = Partial<Record<Field, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9\s\-()]{7,20}$/;

function validate(v: Record<Field, string>): Errors {
  const e: Errors = {};
  if (!v.fullName.trim()) e.fullName = "El nombre completo es obligatorio";
  if (!v.email.trim()) e.email = "El correo electrónico es obligatorio";
  else if (!EMAIL_RE.test(v.email.trim())) e.email = "Ingresa un correo válido";
  if (!v.phone.trim()) e.phone = "El teléfono es obligatorio";
  else if (!PHONE_RE.test(v.phone.trim()))
    e.phone = "Ingresa un teléfono válido (7 a 20 dígitos)";
  if (!v.country) e.country = "Selecciona tu país";
  if (!v.procedure) e.procedure = "Selecciona un procedimiento";
  if (v.message.length > 2000) e.message = "Máximo 2000 caracteres";
  return e;
}

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border bg-white px-3 py-2.5 text-base outline-none transition focus:ring-2 ${
    hasError
      ? "border-red-500 focus:ring-red-200"
      : "border-slate-300 focus:border-teal-600 focus:ring-teal-100"
  }`;

export default function LeadForm() {
  const [values, setValues] = useState<Record<Field, string>>({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    procedure: "",
    message: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (f: Field) => (
    ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setValues((p) => ({ ...p, [f]: ev.target.value }));
    if (errors[f]) setErrors((p) => ({ ...p, [f]: undefined }));
  };

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError("");
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          country: values.country,
          procedure: values.procedure,
          ...(values.message.trim() ? { message: values.message } : {}),
        }),
      });
      if (res.ok) {
        setSent(true);
        return;
      }
      if (res.status === 429) {
        setServerError("Demasiados intentos. Espera un minuto e inténtalo de nuevo.");
        return;
      }
      const body = await res.json().catch(() => null);
      const msgs: string[] = Array.isArray(body?.message)
        ? body.message
        : body?.message
          ? [body.message]
          : [];
      setServerError(msgs.join(". ") || "No pudimos enviar tu solicitud. Inténtalo de nuevo.");
    } catch {
      setServerError("Sin conexión con el servidor. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-teal-200 bg-teal-50 p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-2xl text-white">
          ✓
        </div>
        <h2 className="text-xl font-semibold text-teal-900">¡Solicitud enviada!</h2>
        <p className="mt-2 text-teal-800">
          Gracias, {values.fullName.trim().split(" ")[0]}. Nuestro equipo de coordinación
          se pondrá en contacto contigo muy pronto.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setValues({ fullName: "", email: "", phone: "", country: "", procedure: "", message: "" });
          }}
          className="mt-6 rounded-lg border border-teal-600 px-4 py-2 font-medium text-teal-700 hover:bg-teal-100"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  const err = (f: Field) =>
    errors[f] ? (
      <p id={`${f}-error`} role="alert" className="mt-1 text-sm text-red-600">
        {errors[f]}
      </p>
    ) : null;

  const aria = (f: Field) => ({
    "aria-invalid": errors[f] ? true : undefined,
    "aria-describedby": errors[f] ? `${f}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
          Nombre completo <span className="text-red-600">*</span>
        </label>
        <input
          id="fullName"
          autoComplete="name"
          value={values.fullName}
          onChange={set("fullName")}
          className={inputClass(!!errors.fullName)}
          {...aria("fullName")}
        />
        {err("fullName")}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Correo electrónico <span className="text-red-600">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={set("email")}
            className={inputClass(!!errors.email)}
            {...aria("email")}
          />
          {err("email")}
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">
            Teléfono <span className="text-red-600">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+57 300 123 4567"
            value={values.phone}
            onChange={set("phone")}
            className={inputClass(!!errors.phone)}
            {...aria("phone")}
          />
          {err("phone")}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="country" className="mb-1 block text-sm font-medium">
            País <span className="text-red-600">*</span>
          </label>
          <select
            id="country"
            value={values.country}
            onChange={set("country")}
            className={inputClass(!!errors.country)}
            {...aria("country")}
          >
            <option value="">Selecciona…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {err("country")}
        </div>
        <div>
          <label htmlFor="procedure" className="mb-1 block text-sm font-medium">
            Procedimiento de interés <span className="text-red-600">*</span>
          </label>
          <select
            id="procedure"
            value={values.procedure}
            onChange={set("procedure")}
            className={inputClass(!!errors.procedure)}
            {...aria("procedure")}
          >
            <option value="">Selecciona…</option>
            {PROCEDURES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {err("procedure")}
        </div>
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium">
          Mensaje <span className="font-normal text-slate-500">(opcional)</span>
        </label>
        <textarea
          id="message"
          rows={4}
          value={values.message}
          onChange={set("message")}
          className={inputClass(!!errors.message)}
          {...aria("message")}
        />
        {err("message")}
      </div>

      {serverError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-teal-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Enviando…" : "Solicitar valoración"}
      </button>
    </form>
  );
}
