"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type ProviderStatus = "checking" | "ready" | "blocked" | "unavailable";

type ExtractedField = {
  id: string;
  label: string;
  value: string;
  confidence: number;
  dataType: string;
  page: number;
  reviewReasons: string[];
};

type ExtractionResponse = {
  provider?: string;
  filename?: string;
  receivedAt?: string;
  summary?: {
    fieldCount: number;
    reviewRequiredCount: number;
    readyCount: number;
  };
  fields?: ExtractedField[];
  result?: unknown;
  error?: string;
  message?: string;
  actionUrl?: string;
  retryable?: boolean;
};

type RecipientRole = "airline" | "consulate" | "hotel" | "police";
type PackageStatus = "idle" | "generating" | "ready" | "error";

const ROLE_POLICIES: Record<RecipientRole, { label: string; protect: string[] }> = {
  airline: {
    label: "Airline",
    protect: ["DATE OF BIRTH", "DOCUMENT NO.", "HOTEL", "RESERVATION"],
  },
  consulate: {
    label: "Consulate",
    protect: ["HOTEL", "RESERVATION"],
  },
  hotel: {
    label: "Hotel",
    protect: ["DATE OF BIRTH", "DOCUMENT NO.", "NATIONALITY", "BOOKING REF.", "DEPARTURE"],
  },
  police: {
    label: "Police",
    protect: ["BOOKING REF.", "DEPARTURE", "HOTEL", "RESERVATION"],
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_DOCUMENT_TYPES = new Set([
  "application/msword",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/webp",
]);

type DocumentIntakeProps = {
  onCaseCreated: () => void;
};

function normalizeFieldLabel(label: string) {
  return label.replace(/\s+/g, " ").trim().toUpperCase();
}

function validateDocument(file: File) {
  if (!SUPPORTED_DOCUMENT_TYPES.has(file.type)) {
    return "Unsupported file. Choose PDF, DOC, DOCX, JPEG, PNG, TIFF, or WebP.";
  }
  if (file.size === 0) {
    return "The selected document is empty.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "The selected document is larger than 10 MB.";
  }
  return "";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentIntake({ onCaseCreated }: DocumentIntakeProps) {
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>("checking");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<ExtractionResponse | null>(null);
  const [confirmedFieldIds, setConfirmedFieldIds] = useState<string[]>([]);
  const [recipientRole, setRecipientRole] = useState<RecipientRole>("airline");
  const [packageStatus, setPackageStatus] = useState<PackageStatus>("idle");
  const [packageMessage, setPackageMessage] = useState("");
  const [packageActionUrl, setPackageActionUrl] = useState("");

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
    if (!file || fileError) {
      return;
    }

    setIsSubmitting(true);
    setResponse(null);
    setPackageStatus("idle");
    setPackageMessage("");
    setPackageActionUrl("");

    const formData = new FormData();
    formData.append("document", file);

    try {
      const result = await fetch("/api/documents/extract", {
        method: "POST",
        body: formData,
      });
      const body = (await result.json()) as ExtractionResponse;
      setResponse(body);
      setConfirmedFieldIds([]);
    } catch {
      setResponse({
        error: "NETWORK_ERROR",
        message: "The extraction request could not reach the server.",
      });
      setConfirmedFieldIds([]);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(fieldId: string, value: string) {
    setResponse((current) => {
      if (!current?.fields) {
        return current;
      }

      return {
        ...current,
        fields: current.fields.map((field) =>
          field.id === fieldId ? { ...field, value } : field,
        ),
      };
    });
    setConfirmedFieldIds((current) => current.filter((id) => id !== fieldId));
  }

  function toggleFieldConfirmation(fieldId: string) {
    setConfirmedFieldIds((current) =>
      current.includes(fieldId)
        ? current.filter((id) => id !== fieldId)
        : [...current, fieldId],
    );
  }

  const fields = response?.fields ?? [];
  const allFieldsConfirmed = fields.length > 0 && confirmedFieldIds.length === fields.length;
  const redactionTerms = [
    ...new Set(
      fields
        .filter((field) =>
          ROLE_POLICIES[recipientRole].protect.includes(normalizeFieldLabel(field.label)),
        )
        .map((field) => field.value.trim())
        .filter((value) => value.length >= 2),
    ),
  ];

  async function generateRecipientPackage() {
    if (
      !file ||
      file.type !== "application/pdf" ||
      !allFieldsConfirmed ||
      redactionTerms.length === 0
    ) {
      return;
    }

    setPackageStatus("generating");
    setPackageMessage("");
    setPackageActionUrl("");

    const formData = new FormData();
    formData.append("document", file);
    formData.append("role", recipientRole);
    formData.append("terms", JSON.stringify(redactionTerms));

    try {
      const result = await fetch("/api/documents/redact", {
        method: "POST",
        body: formData,
      });

      if (!result.ok) {
        const body = (await result.json()) as { message?: string; actionUrl?: string };
        setPackageStatus("error");
        setPackageMessage(body.message ?? "The redacted package could not be generated.");
        setPackageActionUrl(body.actionUrl ?? "");
        return;
      }

      const blob = await result.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const download = document.createElement("a");
      download.href = downloadUrl;
      download.download = `micro-embassy-${recipientRole}.pdf`;
      download.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);

      const redactionCount =
        result.headers.get("x-redaction-count") ?? String(redactionTerms.length);
      setPackageStatus("ready");
      setPackageActionUrl("");
      setPackageMessage(
        `${redactionCount} reviewed values were irreversibly removed for the ${ROLE_POLICIES[recipientRole].label.toLowerCase()} view.`,
      );
    } catch {
      setPackageStatus("error");
      setPackageActionUrl("");
      setPackageMessage("The redaction request could not reach the server.");
    }
  }

  const statusCopy = {
    checking: { label: "Checking provider", className: "bg-slate-100 text-slate-600" },
    ready: { label: "Nutrient connected", className: "bg-emerald-100 text-emerald-700" },
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
            <span className="mt-1 block text-xs leading-5 text-slate-500">PDF, DOC, DOCX, JPEG, PNG, TIFF, or WebP · maximum 10 MB · one document at a time</span>
            <input
              className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              type="file"
              name="document"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tif,.tiff,.webp,application/msword,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/tiff,image/webp"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] ?? null;
                setFile(selectedFile);
                setFileError(selectedFile ? validateDocument(selectedFile) : "");
                setResponse(null);
                setConfirmedFieldIds([]);
                setPackageStatus("idle");
                setPackageMessage("");
                setPackageActionUrl("");
              }}
            />
          </label>

          {file ? (
            <div className={`mt-3 flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${fileError ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`} aria-live="polite">
              <div className="min-w-0">
                <span className="block truncate font-semibold">{file.name}</span>
                <span className="mt-0.5 block text-xs opacity-75">{formatFileSize(file.size)} · {file.type || "Unknown browser MIME type"}</span>
              </div>
              <span className="shrink-0 text-xs font-bold">{fileError || "Ready for extraction"}</span>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">Nothing selected yet. HEIC files should be exported as JPEG before upload.</p>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={!file || Boolean(fileError) || isSubmitting}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              {isSubmitting
                ? "Extracting with Nutrient…"
                : file
                  ? "Extract with Nutrient DWS"
                  : "Choose a document first"}
            </button>
            <a className="text-center text-sm font-semibold text-teal-700 underline-offset-4 hover:underline" href="/samples/maya-travel-evidence.pdf" download>
              Download the synthetic PDF sample
            </a>
          </div>

          {providerStatus === "blocked" ? (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              The production UI is live, but real extraction stays disabled until <code className="font-mono text-xs">NUTRIENT_DWS_API_KEY</code> is added to the server. The case dashboard below remains explicitly synthetic.
            </p>
          ) : null}

          {response ? (
            <div className={`mt-5 rounded-2xl border p-4 sm:p-5 ${response.error ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50"}`} aria-live="polite">
              <p className="font-semibold text-slate-950">{response.error ? response.message : `Nutrient extracted ${response.summary?.fieldCount ?? fields.length} fields from ${response.filename ?? "the document"}`}</p>
              {response.error && response.actionUrl ? (
                <a
                  className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
                  href={response.actionUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Nutrient credits dashboard
                </a>
              ) : null}
              {!response.error && fields.length > 0 ? (
                <div className="mt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-700">Human review queue</h3>
                      <p className="mt-1 text-xs text-slate-600">{response.summary?.reviewRequiredCount ?? 0} fields were flagged by deterministic checks. Confirm every value before disclosure.</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
                      {confirmedFieldIds.length}/{fields.length} confirmed
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {fields.map((field) => {
                      const isConfirmed = confirmedFieldIds.includes(field.id);
                      const needsReview = field.reviewReasons.length > 0;
                      const confidenceClass = field.confidence >= 85
                        ? "bg-emerald-100 text-emerald-700"
                        : field.confidence >= 70
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-700";

                      return (
                        <article key={field.id} className={`rounded-2xl border bg-white p-4 ${isConfirmed ? "border-emerald-300" : needsReview ? "border-amber-300" : "border-slate-200"}`}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{field.label} · Page {field.page}</p>
                              <p className="mt-1 text-xs text-slate-400">Detected as {field.dataType}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {needsReview ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">Needs review</span> : null}
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${confidenceClass}`}>{field.confidence.toFixed(1)}%</span>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <input
                              aria-label={`Review ${field.label}`}
                              className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                              value={field.value}
                              onChange={(event) => updateField(field.id, event.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => toggleFieldConfirmation(field.id)}
                              className={`min-h-11 rounded-full px-4 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${isConfirmed ? "bg-emerald-100 text-emerald-800" : "bg-slate-950 text-white hover:bg-slate-800"}`}
                            >
                              {isConfirmed ? "Confirmed" : "Confirm value"}
                            </button>
                          </div>

                          {field.reviewReasons.length > 0 ? (
                            <ul className="mt-3 space-y-1 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                              {field.reviewReasons.map((reason) => <li key={reason}>• {reason}</li>)}
                            </ul>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>

                  {allFieldsConfirmed ? (
                    <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-4 sm:p-5">
                      <p className="text-sm font-semibold text-teal-950">Human review complete. Generate a purpose-bound PDF from the corrected values.</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-end">
                        <label className="text-sm font-semibold text-slate-800">
                          Recipient
                          <select
                            value={recipientRole}
                            onChange={(event) => {
                              setRecipientRole(event.target.value as RecipientRole);
                              setPackageStatus("idle");
                              setPackageMessage("");
                              setPackageActionUrl("");
                            }}
                            className="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                          >
                            {Object.entries(ROLE_POLICIES).map(([id, policy]) => <option key={id} value={id}>{policy.label}</option>)}
                          </select>
                        </label>
                        <div className="rounded-xl bg-white px-3 py-2.5 text-xs leading-5 text-slate-600 ring-1 ring-slate-200">
                          <strong className="text-slate-900">{redactionTerms.length} values protected:</strong>{" "}
                          {redactionTerms.length > 0 ? redactionTerms.join(", ") : "No matching reviewed fields."}
                        </div>
                        <button
                          type="button"
                          onClick={generateRecipientPackage}
                          disabled={file?.type !== "application/pdf" || redactionTerms.length === 0 || packageStatus === "generating"}
                          className="min-h-11 rounded-full bg-teal-700 px-5 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                        >
                          {packageStatus === "generating" ? "Applying redactions…" : "Download protected PDF"}
                        </button>
                      </div>
                      {file?.type !== "application/pdf" ? (
                        <p className="mt-3 text-xs text-amber-900">Upload the synthetic PDF rather than an image to enable irreversible redaction.</p>
                      ) : null}
                      {packageMessage ? (
                        <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${packageStatus === "error" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-900"}`} aria-live="polite">{packageMessage}</p>
                      ) : null}
                      {packageStatus === "error" && packageActionUrl ? (
                        <a
                          className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-bold text-white"
                          href={packageActionUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Nutrient credits dashboard
                        </a>
                      ) : null}
                      {packageStatus === "ready" ? (
                        <button
                          type="button"
                          onClick={onCaseCreated}
                          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
                        >
                          Create temporary embassy
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-teal-800">Inspect raw Nutrient JSON output</summary>
                    <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{JSON.stringify(response.result, null, 2)}</pre>
                  </details>
                </div>
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
