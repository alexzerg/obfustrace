"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type ProviderStatus = "checking" | "ready" | "blocked" | "unavailable";

type ExtractionResponse = {
  provider?: string;
  filename?: string;
  receivedAt?: string;
  result?: unknown;
  error?: string;
  message?: string;
};

export function DocumentIntake() {
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>("checking");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<ExtractionResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/documents/extract", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (result) => {
        if (!result.ok) {
          throw new Error("Provider status request failed");
        }
        return result.json() as Promise<{ configured: boolean }>;
      })
      .then((status) => setProviderStatus(status.configured ? "ready" : "blocked"))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setProviderStatus("unavailable");
        }
      });

    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || providerStatus !== "ready") {
      return;
    }

    setIsSubmitting(true);
    setResponse(null);

    const formData = new FormData();
    formData.append("document", file);

    try {
      const result = await fetch("/api/documents/extract", {
        method: "POST",
        body: formData,
      });
      const body = (await result.json()) as ExtractionResponse;
      setResponse(body);
    } catch {
      setResponse({
        error: "NETWORK_ERROR",
        message: "The extraction request could not reach the server.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const statusCopy = {
    checking: { label: "Checking provider", className: "bg-slate-100 text-slate-600" },
    ready: { label: "Nutrient DWS ready", className: "bg-emerald-100 text-emerald-700" },
    blocked: { label: "API key required", className: "bg-amber-100 text-amber-800" },
    unavailable: { label: "Status unavailable", className: "bg-rose-100 text-rose-700" },
  }[providerStatus];

  return (
    <section aria-labelledby="intake-title" className="mx-auto w-full max-w-[1440px] px-4 pb-12 sm:px-6 lg:px-10">
      <div className="grid overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)] lg:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Document intake · Step 1</p>
              <h2 id="intake-title" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Recover evidence from what remains</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Upload one synthetic PDF or image. When configured, the file is sent server-to-server to Nutrient DWS for structured extraction and is not retained by this app.</p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${statusCopy.className}`} aria-live="polite">
              {statusCopy.label}
            </span>
          </div>

          <label className="mt-6 block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-teal-500 hover:bg-teal-50/40 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-teal-700">
            <span className="block text-sm font-semibold text-slate-900">Travel evidence document</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">PDF, JPEG, PNG, or WebP · maximum 10 MB · synthetic data only</span>
            <input
              className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              type="file"
              name="document"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setResponse(null);
              }}
            />
          </label>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={!file || providerStatus !== "ready" || isSubmitting}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              {isSubmitting ? "Extracting with Nutrient…" : "Extract with Nutrient DWS"}
            </button>
            <a className="text-center text-sm font-semibold text-teal-700 underline-offset-4 hover:underline" href="/samples/maya-travel-evidence.png" download>
              Download the synthetic sample
            </a>
          </div>

          {providerStatus === "blocked" ? (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              The production UI is live, but real extraction stays disabled until <code className="font-mono text-xs">NUTRIENT_DWS_API_KEY</code> is added to the server. The case dashboard below remains explicitly synthetic.
            </p>
          ) : null}

          {response ? (
            <div className={`mt-5 rounded-2xl border p-4 ${response.error ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50"}`} aria-live="polite">
              <p className="font-semibold text-slate-950">{response.error ? response.message : `Extracted ${response.filename ?? "document"}`}</p>
              {!response.error ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-teal-800">Inspect deterministic JSON output</summary>
                  <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{JSON.stringify(response.result, null, 2)}</pre>
                </details>
              ) : null}
            </div>
          ) : null}
        </form>

        <aside className="border-t border-slate-200 bg-slate-950 p-6 text-white sm:p-8 lg:border-l lg:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Trust boundary</p>
          <h3 className="mt-3 text-xl font-semibold">AI may suggest. Evidence must remain inspectable.</h3>
          <ol className="mt-6 space-y-4 text-sm text-slate-300">
            <li className="flex gap-3"><span className="font-mono text-teal-300">01</span><span>Validate type and size before any external request.</span></li>
            <li className="flex gap-3"><span className="font-mono text-teal-300">02</span><span>Call Nutrient only from the server with a private API key.</span></li>
            <li className="flex gap-3"><span className="font-mono text-teal-300">03</span><span>Expose structured output for human review before disclosure.</span></li>
            <li className="flex gap-3"><span className="font-mono text-teal-300">04</span><span>Retain no uploaded file in the Micro-Embassy application.</span></li>
          </ol>
        </aside>
      </div>
    </section>
  );
}
