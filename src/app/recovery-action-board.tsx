"use client";

import { useMemo, useState } from "react";
import type { EmergencyCaseData } from "@/lib/case-model";
import {
  buildPreparedContactMessage,
  getRecoveryPlan,
} from "@/lib/recovery-plan";
import type { IncidentData } from "@/lib/recovery-plan";
import { CaseDashboard } from "./case-dashboard";

type RecoveryActionBoardProps = {
  caseData: EmergencyCaseData;
  incident: IncidentData;
};

type ActionState = "required" | "opened" | "user-confirmed";

export function RecoveryActionBoard({
  caseData,
  incident,
}: RecoveryActionBoardProps) {
  const plan = useMemo(() => getRecoveryPlan(incident), [incident]);
  const preparedMessage = useMemo(
    () => buildPreparedContactMessage(incident, caseData),
    [caseData, incident],
  );
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const [copyStatus, setCopyStatus] = useState("");
  const [officialReference, setOfficialReference] = useState("");

  function markAction(actionId: string, state: ActionState) {
    setActionStates((current) => ({ ...current, [actionId]: state }));
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(preparedMessage);
      setCopyStatus("Prepared message copied. It has not been sent.");
    } catch {
      setCopyStatus("Clipboard permission was denied. Select and copy the prepared message manually.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-10">
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.13)]" aria-labelledby="recovery-title">
        <header className="bg-slate-950 px-6 py-7 text-white sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Recovery action board · {caseData.caseId}</p>
          <h2 id="recovery-title" className="mt-2 text-3xl font-semibold tracking-tight">From lost documents to official next actions</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Micro-Embassy prepared the case and matched an official recovery procedure. Nothing is labelled sent, delivered, or accepted without evidence.</p>
        </header>

        <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-slate-50 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Competent authority</p>
            <h3 className="mt-3 text-xl font-semibold text-slate-950">{plan.authorityName}</h3>
            <dl className="mt-5 space-y-4 text-sm">
              <div><dt className="font-semibold text-slate-500">Address</dt><dd className="mt-1 leading-6 text-slate-900">{plan.address}</dd></div>
              <div><dt className="font-semibold text-slate-500">Emergency phone</dt><dd className="mt-1"><a className="font-bold text-teal-700 hover:underline" href={`tel:${plan.emergencyPhone.replace(/\s/g, "")}`}>{plan.emergencyPhone}</a></dd></div>
              <div><dt className="font-semibold text-slate-500">Published hours</dt><dd className="mt-1 text-slate-900">{plan.serviceHours}</dd></div>
              <div><dt className="font-semibold text-slate-500">Appointment</dt><dd className="mt-1 text-slate-900">{plan.appointmentRequired ? "Required according to the official consular page" : "Verify with the authority"}</dd></div>
            </dl>
            <a
              href={plan.contactUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => markAction("consulate-contact", "opened")}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800"
            >
              Open official contact channel
            </a>
            <p className="mt-3 text-xs leading-5 text-slate-500">Opening the channel is not proof of submission or delivery.</p>
          </aside>

          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Current outcome</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">Official procedure found; submission still required</h3>
              </div>
              <span className="w-fit rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900">NOT SUBMITTED</span>
            </div>

            <div className="mt-6 grid gap-3">
              <StaticAction number="1" title="Identity evidence reviewed" detail={`${caseData.documents.length} source documents · ${caseData.fieldCount} reviewed fields`} />
              <StaticAction number="2" title="Official authority and procedure matched" detail={`${plan.sources.length} allowlisted government sources`} />

              {plan.actions.map((action, index) => {
                const state = actionStates[action.id] ?? "required";
                return (
                  <article key={action.id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-600">{index + 3}</span>
                        <div>
                          <h4 className="font-semibold text-slate-950">{action.title}</h4>
                          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{action.description}</p>
                        </div>
                      </div>
                      <StatusPill state={state} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 pl-0 sm:pl-11">
                      {action.sourceUrl ? (
                        <a href={action.sourceUrl} target="_blank" rel="noreferrer" onClick={() => markAction(action.id, "opened")} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:border-teal-600 hover:text-teal-800">
                          Open official source
                        </a>
                      ) : null}
                      <button type="button" onClick={() => markAction(action.id, "user-confirmed")} className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">
                        Mark completed by user
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <section className="mt-8 rounded-2xl border border-teal-200 bg-teal-50 p-5" aria-labelledby="message-title">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 id="message-title" className="font-semibold text-teal-950">Prepared consular contact message</h3>
                  <p className="mt-1 text-sm text-teal-900">Generated from the incident and reviewed evidence. Copying it does not send it.</p>
                </div>
                <button type="button" onClick={copyMessage} className="min-h-10 shrink-0 rounded-full bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800">Copy prepared message</button>
              </div>
              <textarea readOnly value={preparedMessage} className="mt-4 h-64 w-full rounded-xl border border-teal-200 bg-white p-4 font-mono text-xs leading-5 text-slate-800" aria-label="Prepared consular contact message" />
              {copyStatus ? <p className="mt-3 text-sm font-semibold text-teal-900" aria-live="polite">{copyStatus}</p> : null}
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-950">Submission evidence</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">Enter a reference only after the official channel returns one. A user-entered reference is recorded, not independently verified.</p>
              <input value={officialReference} onChange={(event) => setOfficialReference(event.target.value)} placeholder="Official reference number" className="mt-3 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-teal-600" />
              <p className={`mt-3 text-sm font-semibold ${officialReference.trim() ? "text-emerald-700" : "text-amber-800"}`}>
                {officialReference.trim() ? `Reference recorded: ${officialReference.trim()} · user-provided, not verified` : "No submission receipt or acknowledgement recorded"}
              </p>
            </section>

            <section className="mt-8">
              <h3 className="text-lg font-semibold text-slate-950">Official sources</h3>
              <div className="mt-3 grid gap-2">
                {plan.sources.map((source) => (
                  <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 px-4 py-3 text-sm hover:border-teal-400">
                    <span className="font-semibold text-slate-900">{source.label}</span>
                    <span className="mt-1 block text-xs text-slate-500">{source.authority} · verified {source.verifiedDate}</span>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>

      <details className="mt-8 rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer px-2 py-2 font-semibold text-slate-900">Secondary: inspect purpose-bound evidence sharing controls</summary>
        <div className="mt-4 overflow-hidden rounded-2xl">
          <CaseDashboard caseData={caseData} />
        </div>
      </details>
    </div>
  );
}

function StaticAction({ number, title, detail }: { number: string; title: string; detail: string }) {
  return (
    <article className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
      <div className="flex gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 font-mono text-xs font-bold text-emerald-800">{number}</span>
        <div><h4 className="font-semibold text-slate-950">{title}</h4><p className="mt-1 text-sm text-slate-600">{detail}</p></div>
      </div>
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">COMPLETE</span>
    </article>
  );
}

function StatusPill({ state }: { state: ActionState }) {
  const style = {
    required: "bg-amber-100 text-amber-900",
    opened: "bg-blue-100 text-blue-800",
    "user-confirmed": "bg-emerald-100 text-emerald-800",
  }[state];
  const label = {
    required: "ACTION REQUIRED",
    opened: "OFFICIAL CHANNEL OPENED",
    "user-confirmed": "USER MARKED COMPLETE",
  }[state];
  return <span className={`w-fit shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${style}`}>{label}</span>;
}
