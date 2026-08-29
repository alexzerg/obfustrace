"use client";

import { useMemo, useState } from "react";
import {
  DEMO_PAYLOAD_FIELDS,
  fieldsToPayload,
  minimizePayload,
} from "@/lib/minpayload";
import type {
  MinimizationResult,
  PayloadField,
  ValidationResult,
} from "@/lib/minpayload";
import { useHydrated } from "@/lib/use-hydrated";

type ExecutionReceipt = {
  status: string;
  confirmation: string;
  previousFlight: string;
  newFlight: string;
  newDate: string;
  receivedFields: string[];
};

export function MinPayloadDemo() {
  const isHydrated = useHydrated();
  const [result, setResult] = useState<MinimizationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [receipt, setReceipt] = useState<ExecutionReceipt | null>(null);
  const [error, setError] = useState("");

  const finalPayload = useMemo(
    () => fieldsToPayload(result?.minimalFields ?? DEMO_PAYLOAD_FIELDS),
    [result],
  );

  async function validatePayload(payload: Record<string, string>) {
    const response = await fetch("/api/demo-airline/rebook?dryRun=true", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return {
      status: response.status,
      result: (await response.json()) as ValidationResult,
    };
  }

  async function runMinimization() {
    setIsRunning(true);
    setResult(null);
    setReceipt(null);
    setError("");
    setActiveStep(0);

    try {
      const minimized = await minimizePayload(
        DEMO_PAYLOAD_FIELDS,
        async (payload) => {
          const validation = await validatePayload(payload);
          setActiveStep((current) => current + 1);
          return validation;
        },
      );
      setResult(minimized);
    } catch {
      setError("The minimization experiment could not reach the target API.");
    } finally {
      setIsRunning(false);
    }
  }

  async function executeMinimalPayload() {
    setError("");
    const response = await fetch("/api/demo-airline/rebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalPayload),
    });
    if (!response.ok) {
      setError("The approved minimal payload was rejected by the target API.");
      return;
    }
    setReceipt((await response.json()) as ExecutionReceipt);
  }

  const removedPercent = result
    ? Math.round((result.removedFields.length / result.originalFields.length) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-[#f4f1e8] text-slate-950">
      <header className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 font-mono text-sm font-bold text-lime-300">MP</span>
          <div><p className="font-semibold tracking-tight">MinPayload</p><p className="text-xs text-slate-500">Empirical data minimization for AI actions</p></div>
        </div>
        <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">Synthetic airline API demo</span>
      </header>

      <section className="mx-auto grid w-full max-w-[1500px] gap-10 px-5 pb-14 pt-12 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_460px] lg:px-10 lg:pb-20 lg:pt-20">
        <div>
          <div className="inline-flex rounded-full border border-slate-300 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">AI agent privacy · executable proof</div>
          <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold leading-[0.96] tracking-[-0.055em] sm:text-7xl lg:text-[5.4rem]">Find the smallest payload that still gets the job done.</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">An AI agent wants to rebook a flight. MinPayload removes personal fields one by one, tests each candidate against the API, executes only the smallest successful payload, and proves what stayed private.</p>
          <button type="button" onClick={runMinimization} disabled={!isHydrated || isRunning} className="mt-9 min-h-12 rounded-full bg-slate-950 px-7 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70">
            {isRunning ? `Testing field ${activeStep + 1} of ${DEMO_PAYLOAD_FIELDS.length}…` : "Run payload minimization"}
          </button>
        </div>

        <aside className="rounded-[28px] border border-white bg-white/75 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-lime-700">Requested action</p>
          <h2 className="mt-3 text-2xl font-semibold">Rebook AF1249 to 1 September</h2>
          <dl className="mt-6 space-y-4 text-sm">
            <Row label="Target" value="Synthetic Airline API" />
            <Row label="Method" value="POST /rebook" />
            <Row label="Starting context" value={`${DEMO_PAYLOAD_FIELDS.length} fields from 3 sources`} />
            <Row label="Approval" value="Required before execution" />
          </dl>
        </aside>
      </section>

      <section className="mx-auto w-full max-w-[1500px] px-4 pb-16 sm:px-6 lg:px-10">
        <div className="grid overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)] xl:grid-cols-[320px_minmax(0,1fr)_380px]">
          <section className="border-b border-slate-200 bg-slate-50 p-5 sm:p-6 xl:border-b-0 xl:border-r" aria-labelledby="evidence-title">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Evidence inventory</p>
            <h2 id="evidence-title" className="mt-2 text-xl font-semibold">Available agent context</h2>
            <div className="mt-5 space-y-2">
              {DEMO_PAYLOAD_FIELDS.map((field) => <FieldCard key={field.key} field={field} removed={Boolean(result?.removedFields.some((item) => item.key === field.key))} />)}
            </div>
          </section>

          <section className="min-w-0 border-b border-slate-200 p-5 sm:p-7 xl:border-b-0 xl:border-r" aria-labelledby="experiments-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Delta-debugging experiments</p><h2 id="experiments-title" className="mt-2 text-xl font-semibold">Can the API still succeed without this field?</h2></div>
              {result ? <span className="rounded-full bg-lime-100 px-3 py-1.5 text-xs font-bold text-lime-900">{removedPercent}% fewer fields</span> : null}
            </div>
            {!result && !isRunning ? <div className="mt-8 grid min-h-80 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center"><div className="max-w-sm px-6"><p className="text-lg font-semibold">No experiments yet</p><p className="mt-2 text-sm leading-6 text-slate-500">Run minimization to execute dry-run API calls with progressively smaller payloads.</p></div></div> : null}
            {isRunning ? <div className="mt-8 rounded-2xl bg-slate-950 p-6 text-white"><p className="font-mono text-sm text-lime-300">Experiment {Math.min(activeStep + 1, DEMO_PAYLOAD_FIELDS.length)}/{DEMO_PAYLOAD_FIELDS.length}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-lime-300 transition-all" style={{ width: `${Math.min(100, activeStep / DEMO_PAYLOAD_FIELDS.length * 100)}%` }} /></div><p className="mt-4 text-sm text-slate-300">Removing one field, calling the API dry-run, and keeping the removal only if the action still succeeds.</p></div> : null}
            {result ? <div className="mt-6 space-y-2">{result.steps.map((step, index) => <div key={step.field.key} className="grid grid-cols-[30px_1fr_auto] items-center gap-3 rounded-xl border border-slate-200 px-3 py-3"><span className="font-mono text-xs text-slate-400">{index + 1}</span><div><p className="text-sm font-semibold">Remove {step.field.label}</p><p className="mt-0.5 text-xs text-slate-500">API {step.status}{step.missingFields.length ? ` · missing ${step.missingFields.join(", ")}` : " · action still valid"}</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${step.outcome === "removed" ? "bg-lime-100 text-lime-900" : "bg-amber-100 text-amber-900"}`}>{step.outcome === "removed" ? "REMOVED" : "REQUIRED"}</span></div>)}</div> : null}
          </section>

          <section className="p-5 sm:p-7" aria-labelledby="payload-title">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Outbound payload</p>
            <h2 id="payload-title" className="mt-2 text-xl font-semibold">{result ? "Minimum successful payload" : "Candidate payload"}</h2>
            <pre className="mt-5 max-h-80 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-lime-200">{JSON.stringify(finalPayload, null, 2)}</pre>
            {result ? <div className="mt-5 rounded-2xl bg-lime-50 p-4"><p className="font-semibold text-lime-950">{result.removedFields.length} unnecessary fields blocked</p><p className="mt-1 text-sm leading-6 text-lime-900">{result.removedFields.map((field) => field.label).join(", ")}</p></div> : null}
            <button type="button" onClick={executeMinimalPayload} disabled={!result || Boolean(receipt)} className="mt-5 min-h-12 w-full rounded-full bg-lime-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">Approve and execute minimal payload</button>
            {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p> : null}
            {receipt ? <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4" aria-live="polite"><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Execution receipt</p><h3 className="mt-2 text-lg font-semibold text-emerald-950">Flight successfully rebooked</h3><dl className="mt-4 space-y-2 text-sm"><Row label="Confirmation" value={receipt.confirmation} /><Row label="Previous" value={receipt.previousFlight} /><Row label="New flight" value={receipt.newFlight} /><Row label="New date" value={receipt.newDate} /><Row label="Fields sent" value={receipt.receivedFields.join(", ")} /></dl></div> : null}
          </section>
        </div>
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4"><dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold text-slate-900">{value}</dd></div>;
}

function FieldCard({ field, removed }: { field: PayloadField; removed: boolean }) {
  const sensitivityStyle = {
    critical: "bg-rose-100 text-rose-800",
    high: "bg-amber-100 text-amber-800",
    moderate: "bg-blue-100 text-blue-800",
    operational: "bg-slate-200 text-slate-700",
  }[field.sensitivity];
  return <div className={`rounded-xl border p-3 transition ${removed ? "border-slate-200 bg-white opacity-50" : "border-slate-200 bg-white"}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className={`truncate text-sm font-semibold ${removed ? "line-through" : ""}`}>{field.label}</p><p className="mt-0.5 truncate text-xs text-slate-500">{field.source}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${sensitivityStyle}`}>{field.sensitivity}</span></div></div>;
}
