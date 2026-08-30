"use client";

import { useMemo, useState } from "react";
import {
  rehydrateText,
  SAMPLE_TRACE,
  sanitizeTrace,
} from "@/lib/obfustrace";
import type { SanitizationResult } from "@/lib/obfustrace";
import { useHydrated } from "@/lib/use-hydrated";

const SAMPLE_AI_RESPONSE = `The connection failure points to [DB_USER_1] reaching 192.0.2.1 through service2.internal.example. Verify the security group for arn:aws:rds:us-east-1:000000000001:db:synthetic-1, then retry request 00000000-0000-4000-8000-000000000001.`;

export function ObfusTraceDemo() {
  const isHydrated = useHydrated();
  const [rawTrace, setRawTrace] = useState(SAMPLE_TRACE);
  const [result, setResult] = useState<SanitizationResult | null>(null);
  const [aiResponse, setAiResponse] = useState(SAMPLE_AI_RESPONSE);
  const [rehydrated, setRehydrated] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const mapping of result?.mappings ?? []) {
      counts.set(mapping.type, (counts.get(mapping.type) ?? 0) + mapping.occurrences);
    }
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [result]);

  function createTwin() {
    setResult(sanitizeTrace(rawTrace));
    setRehydrated("");
    setCopyStatus("");
  }

  async function copySafeTrace() {
    if (!result?.certificate.safeToCopy) return;
    try {
      await navigator.clipboard.writeText(result.sanitized);
      setCopyStatus("Safe trace copied. Raw values never left this browser.");
    } catch {
      setCopyStatus("Clipboard permission denied. Select the safe trace manually.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f1ea] text-slate-950">
      <header className="mx-auto flex w-full max-w-[1540px] items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 font-mono text-sm font-bold text-cyan-300">OT</span>
          <div>
            <p className="font-semibold tracking-tight">ObfusTrace</p>
            <p className="text-xs text-slate-500">Debug-equivalent synthetic traces</p>
          </div>
        </div>
        <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm ring-1 ring-slate-200">100% local · no uploads</span>
      </header>

      <section className="mx-auto grid w-full max-w-[1540px] gap-10 px-5 pb-14 pt-12 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_440px] lg:px-10 lg:pb-20 lg:pt-20">
        <div>
          <div className="inline-flex rounded-full border border-slate-300 bg-white/75 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Safe paste for AI debugging</div>
          <h1 className="mt-6 max-w-5xl text-balance text-5xl font-semibold leading-[0.96] tracking-[-0.055em] sm:text-7xl lg:text-[5.2rem]">Share the failure. Keep the infrastructure private.</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">Paste a production error before sending it to AI, Jira, Slack, GitHub, or vendor support. ObfusTrace replaces secrets and infrastructure identifiers with stable synthetic twins while preserving the diagnostic structure.</p>
          <button type="button" onClick={createTwin} disabled={!isHydrated || !rawTrace.trim()} className="mt-9 min-h-12 rounded-full bg-slate-950 px-7 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">Create safe trace twin</button>
        </div>

        <aside className="rounded-[28px] border border-white bg-white/75 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">What remains useful</p>
          <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-700">
            <li><strong className="text-slate-950">Stable aliases:</strong> the same IP or token maps to the same synthetic value everywhere.</li>
            <li><strong className="text-slate-950">Format preservation:</strong> IPs, ARNs, UUIDs, emails, URLs and stack frames remain structurally realistic.</li>
            <li><strong className="text-slate-950">Residual gate:</strong> copying is blocked unless a second scan finds zero remaining sensitive values.</li>
            <li><strong className="text-slate-950">Local round-trip:</strong> AI answers using aliases can be translated back on this device.</li>
          </ul>
        </aside>
      </section>

      <section className="mx-auto w-full max-w-[1540px] px-4 pb-16 sm:px-6 lg:px-10">
        <div className="grid overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)] xl:grid-cols-2">
          <section className="border-b border-slate-200 p-5 sm:p-7 xl:border-b-0 xl:border-r" aria-labelledby="raw-title">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Private input</p><h2 id="raw-title" className="mt-2 text-xl font-semibold">Raw production trace</h2></div>
              <button type="button" onClick={() => { setRawTrace(SAMPLE_TRACE); setResult(null); }} className="rounded-full border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:border-slate-500">Reset sample</button>
            </div>
            <textarea value={rawTrace} onChange={(event) => { setRawTrace(event.target.value); setResult(null); }} className="mt-5 h-[520px] w-full resize-y rounded-2xl border border-rose-200 bg-rose-50/40 p-4 font-mono text-xs leading-6 text-slate-800 outline-none focus:border-rose-400" aria-label="Raw production trace" spellCheck={false} />
            <p className="mt-3 text-xs font-semibold text-rose-700">Never paste this side into an external AI or support system.</p>
          </section>

          <section className="p-5 sm:p-7" aria-labelledby="safe-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Shareable output</p><h2 id="safe-title" className="mt-2 text-xl font-semibold">Debug-equivalent synthetic twin</h2></div>
              <button type="button" onClick={copySafeTrace} disabled={!result?.certificate.safeToCopy} className="min-h-10 rounded-full bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">Copy safe trace</button>
            </div>
            <textarea readOnly value={result?.sanitized ?? "Run sanitization to produce a safe trace."} className="mt-5 h-[520px] w-full resize-y rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 font-mono text-xs leading-6 text-slate-800" aria-label="Sanitized trace" spellCheck={false} />
            {copyStatus ? <p className="mt-3 text-xs font-semibold text-emerald-700" aria-live="polite">{copyStatus}</p> : null}
          </section>
        </div>

        {result ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Detected risk</p>
              <h2 className="mt-2 text-xl font-semibold">{result.mappings.length} unique values protected</h2>
              <div className="mt-5 space-y-2">
                {categoryCounts.map(([category, count]) => <div key={category} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"><span className="font-medium text-slate-700">{category}</span><span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-900 ring-1 ring-slate-200">{count}</span></div>)}
              </div>
              <details className="mt-5 rounded-xl border border-slate-200 p-3">
                <summary className="cursor-pointer text-sm font-semibold">Local mapping vault</summary>
                <div className="mt-3 space-y-2">{result.mappings.map((mapping) => <div key={`${mapping.type}-${mapping.alias}`} className="rounded-lg bg-slate-950 p-3 font-mono text-[11px] leading-5 text-slate-200"><span className="text-cyan-300">{mapping.type}</span><br/>{mapping.alias} ← local original · {mapping.occurrences} occurrence{mapping.occurrences === 1 ? "" : "s"}</div>)}</div>
              </details>
            </aside>

            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="certificate-title">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Sanitization certificate</p><h2 id="certificate-title" className="mt-2 text-xl font-semibold">{result.certificate.safeToCopy ? "Safe to copy" : "Blocked — residual risk remains"}</h2></div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${result.certificate.safeToCopy ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>{result.certificate.safeToCopy ? "CLEAN" : "BLOCKED"}</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <CertificateCheck label="Residual findings" value={String(result.certificate.residualFindings)} pass={result.certificate.residualFindings === 0} />
                <CertificateCheck label="Lines preserved" value={result.certificate.lineCountPreserved ? "Yes" : "No"} pass={result.certificate.lineCountPreserved} />
                <CertificateCheck label="Stack frames" value={result.certificate.stackFrameCountPreserved ? "Preserved" : "Changed"} pass={result.certificate.stackFrameCountPreserved} />
                <CertificateCheck label="Fingerprint" value={result.certificate.fingerprint} pass={result.certificate.fingerprintPreserved} />
              </div>

              <div className="mt-7 border-t border-slate-200 pt-6">
                <h3 className="font-semibold text-slate-950">Round-trip an AI response locally</h3>
                <p className="mt-1 text-sm text-slate-600">Paste an AI answer that references synthetic aliases. Rehydration replaces them with the original values only in this browser.</p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <textarea value={aiResponse} onChange={(event) => setAiResponse(event.target.value)} className="h-44 rounded-xl border border-slate-300 p-3 font-mono text-xs leading-5" aria-label="AI response using aliases" />
                  <textarea readOnly value={rehydrated || "Rehydrated response appears here."} className="h-44 rounded-xl border border-slate-300 bg-slate-50 p-3 font-mono text-xs leading-5" aria-label="Locally rehydrated response" />
                </div>
                <button type="button" onClick={() => setRehydrated(rehydrateText(aiResponse, result.mappings))} className="mt-4 min-h-10 rounded-full bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800">Rehydrate locally</button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function CertificateCheck({ label, value, pass }: { label: string; value: string; pass: boolean }) {
  return <div className={`rounded-xl border p-3 ${pass ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}><p className="text-xs font-semibold text-slate-500">{label}</p><p className={`mt-1 font-mono text-sm font-bold ${pass ? "text-emerald-800" : "text-rose-800"}`}>{value}</p></div>;
}
