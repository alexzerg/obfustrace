export type EvidenceField = {
  id: string;
  label: string;
  value: string;
  confidence: number;
  dataType: string;
  page: number;
  reviewReasons: string[];
  sourceName?: string;
};

export type EvidenceDocument = {
  id: string;
  name: string;
  type: string;
  size: number;
  fields: EvidenceField[];
};

export type CaseFact = {
  value: string;
  sourceName: string;
};

export type EmergencyCaseData = {
  caseId: string;
  travelerName: string;
  createdAt: string;
  destructionHours: number;
  documents: EvidenceDocument[];
  fieldCount: number;
  facts: Record<string, CaseFact>;
};

function normalizeLabel(label: string) {
  return label.replace(/\s+/g, " ").trim().toUpperCase();
}

function stableCaseNumber(documents: EvidenceDocument[]) {
  const input = documents.map((document) => document.name).sort().join("|");
  let hash = 17;
  for (const character of input) {
    hash = (hash * 31 + character.charCodeAt(0)) % 10000;
  }
  return String(hash).padStart(4, "0");
}

export function buildEmergencyCase(
  documents: EvidenceDocument[],
  options: { caseId?: string; createdAt?: string } = {},
): EmergencyCaseData {
  const facts: Record<string, CaseFact> = {};

  for (const document of documents) {
    for (const field of document.fields) {
      const label = normalizeLabel(field.label);
      if (!facts[label] && field.value.trim()) {
        facts[label] = {
          value: field.value.trim(),
          sourceName: field.sourceName ?? document.name,
        };
      }
    }
  }

  return {
    caseId: options.caseId ?? `ME-${stableCaseNumber(documents)}`,
    travelerName:
      facts["FULL NAME"]?.value ??
      facts["PASSENGER"]?.value ??
      facts["GUEST"]?.value ??
      "Traveler",
    createdAt: options.createdAt ?? new Date().toISOString(),
    destructionHours: 48,
    documents,
    fieldCount: documents.reduce((total, document) => total + document.fields.length, 0),
    facts,
  };
}

function field(id: string, label: string, value: string, sourceName: string): EvidenceField {
  return {
    id,
    label,
    value,
    confidence: 100,
    dataType: "String",
    page: 1,
    reviewReasons: [],
    sourceName,
  };
}

const demoDocuments: EvidenceDocument[] = [
  {
    id: "demo-passport",
    name: "maya-passport.pdf",
    type: "application/pdf",
    size: 124535,
    fields: [
      field("demo-name", "FULL NAME", "Maya Laurent", "maya-passport.pdf"),
      field("demo-nationality", "NATIONALITY", "French", "maya-passport.pdf"),
      field("demo-dob", "DATE OF BIRTH", "18 May 1994", "maya-passport.pdf"),
      field("demo-document", "DOCUMENT NO.", "19DF000042", "maya-passport.pdf"),
      field("demo-expiry", "EXPIRES", "19 May 2029", "maya-passport.pdf"),
    ],
  },
  {
    id: "demo-flight",
    name: "maya-flight-itinerary.pdf",
    type: "application/pdf",
    size: 130080,
    fields: [
      field("demo-passenger", "FULL NAME", "Maya Laurent", "maya-flight-itinerary.pdf"),
      field("demo-booking", "BOOKING REF.", "K8R4NQ", "maya-flight-itinerary.pdf"),
      field("demo-flight-number", "FLIGHT NUMBER", "AF1249", "maya-flight-itinerary.pdf"),
      field("demo-route", "ROUTE", "BCN → CDG", "maya-flight-itinerary.pdf"),
      field("demo-departure", "DEPARTURE", "31 August 2026 at 17:45 CEST", "maya-flight-itinerary.pdf"),
    ],
  },
  {
    id: "demo-hotel",
    name: "maya-hotel-confirmation.pdf",
    type: "application/pdf",
    size: 128691,
    fields: [
      field("demo-guest", "FULL NAME", "Maya Laurent", "maya-hotel-confirmation.pdf"),
      field("demo-hotel-name", "HOTEL", "Hotel Brummell", "maya-hotel-confirmation.pdf"),
      field("demo-reservation", "RESERVATION", "BRM-88215", "maya-hotel-confirmation.pdf"),
    ],
  },
];

export const DEMO_CASE_DATA = buildEmergencyCase(demoDocuments, {
  caseId: "ME-2048",
  createdAt: "2026-08-29T17:46:00.000Z",
});
