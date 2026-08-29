import { CaseDashboard } from "./case-dashboard";

const principles = [
  {
    number: "01",
    title: "Recover what remains",
    copy: "Turn scattered screenshots, reservations, and document copies into one structured emergency case.",
  },
  {
    number: "02",
    title: "Disclose the minimum",
    copy: "Give every organization a purpose-bound view instead of emailing the same passport scan everywhere.",
  },
  {
    number: "03",
    title: "Disappear on purpose",
    copy: "Expire links, revoke access instantly, and destroy the temporary portal when the crisis is resolved.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f3ed] text-slate-950">
      <header className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <a href="#top" className="flex items-center gap-3 font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-sm font-bold text-teal-300">ME</span>
          <span>Micro-Embassy</span>
        </a>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">Synthetic crisis demo</span>
          <a href="#case" className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
            Open case
          </a>
        </div>
      </header>

      <section id="top" className="relative mx-auto grid w-full max-w-[1440px] gap-12 px-5 pb-14 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:px-10 lg:pb-20 lg:pt-24">
        <div className="pointer-events-none absolute -right-48 -top-52 h-[600px] w-[600px] rounded-full bg-teal-200/50 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-600 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
            Post-incident identity recovery
          </div>
          <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-slate-950 sm:text-7xl lg:text-[5.6rem]">
            A temporary embassy, built around you.
          </h1>
          <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-slate-600 sm:text-xl">
            Lose your documents abroad without losing control of your identity. Micro-Embassy gives police, hotels, airlines, and consulates only the evidence they need — then disappears.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#case" className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950">
              Explore the emergency case
            </a>
            <span className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white/60 px-5 text-sm font-semibold text-slate-600">
              No real identity data used
            </span>
          </div>
        </div>

        <aside className="relative self-end rounded-[28px] border border-white/80 bg-white/70 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.09)] backdrop-blur sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Emergency lifecycle</p>
          <ol className="mt-6 space-y-5">
            {principles.map((principle) => (
              <li key={principle.number} className="grid grid-cols-[38px_1fr] gap-3">
                <span className="font-mono text-sm font-semibold text-slate-400">{principle.number}</span>
                <div>
                  <h2 className="font-semibold text-slate-950">{principle.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{principle.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <CaseDashboard />

      <section className="border-t border-slate-300/70 bg-slate-950 text-white">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1fr_auto] md:items-end lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Ephemeral trust infrastructure</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Not a travel planner. A bridge through the moment your normal identity system fails.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-400 md:text-right">Recover → organize → disclose minimally → sign → resolve → revoke → destroy.</p>
        </div>
      </section>
    </main>
  );
}
