import LeadForm from "@/components/LeadForm";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-14">
      <header className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">
          Clínica de medicina estética
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Solicita tu valoración</h1>
        <p className="mt-3 text-slate-600">
          Cuéntanos qué procedimiento te interesa y un coordinador te contactará.
          Atendemos pacientes de Colombia y del exterior.
        </p>
      </header>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <LeadForm />
      </section>
      <footer className="mt-8 text-center text-xs text-slate-500">
        Tus datos se usan únicamente para contactarte sobre tu solicitud.
      </footer>
    </main>
  );
}
