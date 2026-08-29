"use client";

import { useState } from "react";
import { useHydrated } from "@/lib/use-hydrated";
import { CaseDashboard } from "./case-dashboard";
import { DocumentIntake } from "./document-intake";

const steps = ["Upload evidence", "Review extraction", "Create packages", "Manage access"];

export function EmergencyDemo() {
  const isHydrated = useHydrated();
  const [caseActive, setCaseActive] = useState(false);

  return (
    <section id="start" aria-label="Micro-Embassy guided demo">
      <div className="mx-auto mb-6 w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-5 rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Guided demo</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
              {caseActive ? "Temporary embassy active" : "Start with an empty emergency case"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {caseActive
                ? "The dashboard now represents the case created from reviewed evidence."
                : "Upload a document and complete the review, or preview the finished synthetic case without calling an API."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCaseActive((current) => !current)}
            disabled={!isHydrated}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-teal-600 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-wait disabled:opacity-70"
          >
            {caseActive ? "Reset demo" : "Preview completed synthetic case"}
          </button>
        </div>

        <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Emergency case progress">
          {steps.map((step, index) => {
            const complete = caseActive || index === 0;
            return (
              <li key={step} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${complete ? "border-teal-200 bg-teal-50 text-teal-800" : "border-slate-200 bg-white/60 text-slate-400"}`}>
                <span className="mr-2 font-mono">{index + 1}</span>{step}
              </li>
            );
          })}
        </ol>
      </div>

      {!caseActive ? <DocumentIntake onCaseCreated={() => setCaseActive(true)} /> : null}
      {caseActive ? <CaseDashboard /> : null}
    </section>
  );
}
