"use client";

import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { DEMO_INCIDENT } from "@/lib/recovery-plan";
import type { IncidentData } from "@/lib/recovery-plan";
import { useHydrated } from "@/lib/use-hydrated";

type IncidentIntakeProps = {
  onContinue: (incident: IncidentData) => void;
};

export function IncidentIntake({ onContinue }: IncidentIntakeProps) {
  const isHydrated = useHydrated();
  const [incident, setIncident] = useState<IncidentData>(DEMO_INCIDENT);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onContinue(incident);
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 pb-12 sm:px-6 lg:px-10" aria-labelledby="incident-title">
      <form onSubmit={submit} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Incident · Step 1</p>
            <h2 id="incident-title" className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">What happened, and where?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Micro-Embassy uses this information to identify the competent official authority and the recovery procedure. It never claims a submission occurred without evidence.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Nationality">
                <input value={incident.nationality} onChange={(event) => setIncident({ ...incident, nationality: event.target.value })} required />
              </Field>
              <Field label="Current city">
                <input value={incident.currentCity} onChange={(event) => setIncident({ ...incident, currentCity: event.target.value })} required />
              </Field>
              <Field label="Current country">
                <input value={incident.currentCountry} onChange={(event) => setIncident({ ...incident, currentCountry: event.target.value })} required />
              </Field>
              <Field label="Lost item">
                <select value={incident.lostItem} onChange={(event) => setIncident({ ...incident, lostItem: event.target.value as IncidentData["lostItem"] })}>
                  <option value="passport">Passport</option>
                  <option value="identity-card">Identity card</option>
                  <option value="passport-and-wallet">Passport and wallet</option>
                </select>
              </Field>
              <Field label="Incident date">
                <input type="date" value={incident.incidentDate} onChange={(event) => setIncident({ ...incident, incidentDate: event.target.value })} required />
              </Field>
              <Field label="Planned departure">
                <input type="date" value={incident.plannedDeparture} onChange={(event) => setIncident({ ...incident, plannedDeparture: event.target.value })} required />
              </Field>
            </div>

            <button type="submit" disabled={!isHydrated} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70">
              Find official recovery procedure
            </button>
          </div>

          <aside className="border-t border-slate-200 bg-slate-950 p-6 text-white sm:p-8 lg:border-l lg:border-t-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Curated demo route</p>
            <h3 className="mt-3 text-xl font-semibold">French traveler in Barcelona</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">This route is grounded in official French consular and Service-Public sources verified on 29 August 2026.</p>
            <p className="mt-5 rounded-xl bg-white/10 px-4 py-3 text-sm text-slate-200">Outside the curated route, the app opens an official diplomatic directory instead of inventing contacts or requirements.</p>
          </aside>
        </div>
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactElement<{ className?: string }> }) {
  return (
    <label className="text-sm font-semibold text-slate-800">
      {label}
      <span className="mt-1 block [&>input]:min-h-11 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-slate-300 [&>input]:px-3 [&>select]:min-h-11 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:px-3">
        {children}
      </span>
    </label>
  );
}
