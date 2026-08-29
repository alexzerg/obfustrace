"use client";

import { useMemo, useState } from "react";
import type { CaseFact, EmergencyCaseData, RecipientId } from "@/lib/case-model";
import { useHydrated } from "@/lib/use-hydrated";

type RoleId = RecipientId;
type AccessState = "active" | "revoked";

type Recipient = {
  id: RoleId;
  label: string;
  organization: string;
  purpose: string;
  expiresIn: number;
  accent: string;
  shared: Array<{ label: string; value: string; sourceName?: string }>;
  protected: string[];
};

const recipientTemplates: Recipient[] = [
  {
    id: "police",
    label: "Police",
    organization: "Mossos d'Esquadra",
    purpose: "Report the document loss",
    expiresIn: 22,
    accent: "#0d9488",
    shared: [
      { label: "Legal name", value: "Maya Laurent" },
      { label: "Nationality", value: "French" },
      { label: "Date of birth", value: "18 May 1994" },
      { label: "Incident", value: "Passport and wallet lost" },
      { label: "Last known location", value: "Barcelona Sants" },
    ],
    protected: ["Passport scan", "Home address", "Flight details", "Insurance policy"],
  },
  {
    id: "consulate",
    label: "Consulate",
    organization: "French Consulate General",
    purpose: "Request an emergency travel document",
    expiresIn: 46,
    accent: "#d97706",
    shared: [
      { label: "Legal name", value: "Maya Laurent" },
      { label: "Passport number", value: "19DF••••42" },
      { label: "Nationality", value: "French" },
      { label: "Police report", value: "ME-BCN-2048.pdf" },
      { label: "Return flight", value: "AF1249 · 31 Aug" },
      { label: "Identity evidence", value: "3 corroborating documents" },
    ],
    protected: ["Payment cards", "Insurance medical data", "Hotel payment details"],
  },
  {
    id: "airline",
    label: "Airline",
    organization: "Air France Assistance",
    purpose: "Protect the return booking",
    expiresIn: 31,
    accent: "#2563eb",
    shared: [
      { label: "Passenger", value: "Maya Laurent" },
      { label: "Booking reference", value: "K8R4NQ" },
      { label: "Flight", value: "AF1249 · BCN → CDG" },
      { label: "Identity assertion", value: "Verified by emergency case" },
    ],
    protected: ["Passport number", "Date of birth", "Home address", "Police narrative"],
  },
  {
    id: "hotel",
    label: "Hotel",
    organization: "Hotel Brummell",
    purpose: "Maintain accommodation during recovery",
    expiresIn: 18,
    accent: "#7c3aed",
    shared: [
      { label: "Guest", value: "Maya Laurent" },
      { label: "Reservation", value: "BRM-88215" },
      { label: "Stay", value: "29–31 Aug 2026" },
      { label: "Identity status", value: "Documents reported lost" },
    ],
    protected: ["Passport scan", "Passport number", "Flight details", "Police report"],
  },
];

function findFact(caseData: EmergencyCaseData, ...labels: string[]) {
  for (const label of labels) {
    const fact = caseData.facts[label];
    if (fact) {
      return fact;
    }
  }
  return undefined;
}

function sharedField(label: string, fact: CaseFact | undefined, fallback?: CaseFact) {
  const selected = fact ?? fallback;
  return selected
    ? { label, value: selected.value, sourceName: selected.sourceName }
    : null;
}

function compactFields(fields: Array<ReturnType<typeof sharedField>>) {
  return fields.filter((field): field is NonNullable<typeof field> => Boolean(field));
}

function maskDocumentNumber(value: string) {
  const compact = value.replace(/\s+/g, "");
  if (compact.length <= 6) {
    return "Protected";
  }
  return `${compact.slice(0, 4)}••••${compact.slice(-2)}`;
}

function buildRecipients(caseData: EmergencyCaseData): Recipient[] {
  const name = findFact(caseData, "FULL NAME", "PASSENGER", "GUEST");
  const nationality = findFact(caseData, "NATIONALITY");
  const dateOfBirth = findFact(caseData, "DATE OF BIRTH");
  const documentNumber = findFact(caseData, "DOCUMENT NO.");
  const booking = findFact(caseData, "BOOKING REF.");
  const flight = findFact(caseData, "FLIGHT NUMBER");
  const route = findFact(caseData, "ROUTE");
  const departure = findFact(caseData, "DEPARTURE");
  const hotel = findFact(caseData, "HOTEL");
  const reservation = findFact(caseData, "RESERVATION");
  const caseDeclaration: CaseFact = {
    value: "Critical travel documents reported lost",
    sourceName: "Case declaration",
  };
  const identityAssertion: CaseFact = {
    value: `${caseData.documents.length} reviewed source documents`,
    sourceName: "Micro-Embassy correlation",
  };

  return recipientTemplates
    .filter((template) => caseData.recipientIds.includes(template.id))
    .map((template) => {
    if (template.id === "police") {
      return {
        ...template,
        organization: "Local police",
        shared: compactFields([
          sharedField("Legal name", name),
          sharedField("Nationality", nationality),
          sharedField("Date of birth", dateOfBirth),
          sharedField("Incident", caseDeclaration),
        ]),
      };
    }
    if (template.id === "consulate") {
      return {
        ...template,
        organization: nationality
          ? `${nationality.value} consular assistance`
          : "Consular assistance",
        shared: compactFields([
          sharedField("Legal name", name),
          documentNumber
            ? {
                label: "Passport number",
                value: maskDocumentNumber(documentNumber.value),
                sourceName: documentNumber.sourceName,
              }
            : null,
          sharedField("Nationality", nationality),
          sharedField("Return flight", flight),
          sharedField("Departure", departure),
          sharedField("Identity evidence", identityAssertion),
        ]),
      };
    }
    if (template.id === "airline") {
      return {
        ...template,
        shared: compactFields([
          sharedField("Passenger", name),
          sharedField("Booking reference", booking),
          sharedField("Flight", flight),
          sharedField("Route", route),
          sharedField("Identity assertion", identityAssertion),
        ]),
      };
    }
    return {
      ...template,
      organization: hotel?.value ?? "Hotel assistance",
      shared: compactFields([
        sharedField("Guest", name),
        sharedField("Reservation", reservation),
        sharedField("Property", hotel),
        sharedField("Identity status", caseDeclaration),
      ]),
    };
  });
}

type CaseDashboardProps = {
  caseData: EmergencyCaseData;
};

export function CaseDashboard({ caseData }: CaseDashboardProps) {
  const isHydrated = useHydrated();
  const recipients = useMemo(() => buildRecipients(caseData), [caseData]);
  const [selectedId, setSelectedId] = useState<RoleId>(recipients[0]?.id ?? "police");
  const [access, setAccess] = useState<Record<RoleId, AccessState>>({
    police: "active",
    consulate: "active",
    airline: "active",
    hotel: "active",
  });
  const [expirations, setExpirations] = useState<Record<RoleId, number>>(
    Object.fromEntries(recipients.map((recipient) => [recipient.id, recipient.expiresIn])) as Record<RoleId, number>,
  );

  const selected = useMemo(
    () => recipients.find((recipient) => recipient.id === selectedId) ?? recipients[0],
    [recipients, selectedId],
  );
  const selectedStatus = access[selected.id];
  const activeCount = recipients.filter(
    (recipient) => access[recipient.id] === "active",
  ).length;

  function toggleAccess() {
    setAccess((current) => ({
      ...current,
      [selected.id]: current[selected.id] === "active" ? "revoked" : "active",
    }));
    if (selectedStatus === "revoked") {
      setExpirations((current) => ({ ...current, [selected.id]: 30 }));
    }
  }

  return (
    <section id="case" aria-labelledby="case-title" className="mx-auto w-full max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-10">
      <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.13)]">
        <header className="border-b border-slate-200 bg-slate-950 px-5 py-5 text-white sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-400 font-bold text-slate-950">ME</div>
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <span>Emergency case {caseData.caseId}</span>
                  <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-emerald-300">Protected</span>
                </div>
                <h2 id="case-title" className="text-xl font-semibold tracking-tight sm:text-2xl">{caseData.travelerName}&apos;s temporary embassy</h2>
                <p className="mt-1 text-sm text-slate-400">Created from {caseData.documents.length} reviewed sources · scheduled destruction in {caseData.destructionHours} hours</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
              <Metric value={String(caseData.documents.length)} label="Source docs" />
              <Metric value={String(caseData.fieldCount)} label="Reviewed fields" />
              <Metric value={String(activeCount)} label="Recipient links" />
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-slate-50/80 p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Recipient views</p>
                <p className="mt-1 text-sm text-slate-600">Each link reveals a different case.</p>
              </div>
              <span className="text-xs font-semibold text-teal-700">Minimum disclosure</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1" role="list" aria-label="Emergency case recipients">
              {recipients.map((recipient) => {
                const isSelected = recipient.id === selected.id;
                const status = access[recipient.id];
                return (
                  <button
                    key={recipient.id}
                    type="button"
                    onClick={() => setSelectedId(recipient.id)}
                    disabled={!isHydrated}
                    className={`group rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-wait ${
                      isSelected
                        ? "border-slate-300 bg-white shadow-sm"
                        : "border-transparent hover:border-slate-200 hover:bg-white/80"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ background: recipient.accent }} aria-hidden="true" />
                        <div>
                          <span className="block font-semibold text-slate-900">{recipient.label}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">{recipient.organization}</span>
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}>
                        {status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>{recipient.shared.length} fields shared</span>
                      <span>{status === "active" ? `${expirations[recipient.id]} min left` : "Access stopped"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0 p-5 sm:p-8">
            <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Live access preview</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{selected.organization}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    selectedStatus === "active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}>
                    {selectedStatus === "active" ? `Expires in ${expirations[selected.id]} min` : "Link revoked"}
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Purpose: {selected.purpose}. Fields outside this purpose remain protected.</p>
              </div>

              <button
                type="button"
                onClick={toggleAccess}
                disabled={!isHydrated}
                className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70 ${
                  selectedStatus === "active"
                    ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:outline-rose-600"
                    : "bg-slate-950 text-white hover:bg-slate-800 focus-visible:outline-slate-950"
                }`}
              >
                {selectedStatus === "active" ? "Revoke access" : "Reissue for 30 min"}
              </button>
            </div>

            {selectedStatus === "active" ? (
              <div className="grid gap-6 pt-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900">Shared evidence</h4>
                    <span className="text-xs font-semibold text-teal-700">Allowlisted for this purpose</span>
                  </div>
                  <dl className="overflow-hidden rounded-2xl border border-slate-200">
                    {selected.shared.map((field, index) => (
                      <div key={field.label} className={`grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-5 ${index > 0 ? "border-t border-slate-100" : ""}`}>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{field.label}</dt>
                        <dd className="text-sm font-medium text-slate-900">
                          <span className="block">{field.value}</span>
                          {field.sourceName ? <span className="mt-0.5 block text-[11px] font-normal text-slate-400">Source: {field.sourceName}</span> : null}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-200 text-sm" aria-hidden="true">◼</span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Protected evidence</h4>
                      <p className="text-xs text-slate-500">Not included in this view</p>
                    </div>
                  </div>
                  <ul className="space-y-2.5">
                    {selected.protected.map((field) => (
                      <li key={field} className="flex items-center justify-between gap-3 text-sm text-slate-600">
                        <span>{field}</span>
                        <span className="font-mono text-xs tracking-widest text-slate-400" aria-label="Redacted">████</span>
                      </li>
                    ))}
                  </ul>
                </aside>
              </div>
            ) : (
              <div className="grid min-h-72 place-items-center pt-6 text-center">
                <div className="max-w-md">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-xl text-rose-700" aria-hidden="true">×</div>
                  <h4 className="mt-4 text-xl font-semibold text-slate-950">This recipient can no longer open the case</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">The access token was invalidated immediately. Reissue a new link only if the organization still needs evidence.</p>
                </div>
              </div>
            )}

            <div className="mt-7 border-t border-slate-200 pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">Latest audit event</h4>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedStatus === "active"
                      ? `${selected.organization} received a purpose-bound link. No document was attached to an email.`
                      : `${selected.organization}'s link was revoked. Future requests now return access denied.`}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-2 font-mono text-xs text-slate-600">SHA-256 · 9f3c…a81e</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div aria-label={`${label}: ${value}`} className="min-w-20 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
      <span className="block text-lg font-semibold text-white">{value}</span>
      <span className="block text-[10px] uppercase tracking-wide text-slate-400">{label}</span>
    </div>
  );
}
