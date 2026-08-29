export type RecipientId = "police" | "consulate" | "airline" | "hotel";

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
  subjectName: string;
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
  recipientIds: RecipientId[];
  facts: Record<string, CaseFact>;
};

function normalizeLabel(label: string) {
  return label.replace(/\s+/g, " ").trim().toUpperCase();
}

export function normalizeSubjectName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

export function getDistinctDocumentSubjects(documents: EvidenceDocument[]) {
  const subjects = new Map<string, string>();
  for (const document of documents) {
    const normalized = normalizeSubjectName(document.subjectName);
    if (normalized && !subjects.has(normalized)) {
      subjects.set(normalized, document.subjectName.trim());
    }
  }
  return [...subjects.values()];
}

export function hasDocumentSubjectConflict(documents: EvidenceDocument[]) {
  return getDistinctDocumentSubjects(documents).length > 1;
}

function stableCaseNumber(documents: EvidenceDocument[]) {
  const input = documents.map((document) => document.name).sort().join("|");
  let hash = 17;
  for (const character of input) {
    hash = (hash * 31 + character.charCodeAt(0)) % 10000;
  }
  return String(hash).padStart(4, "0");
}

const ALL_RECIPIENTS: RecipientId[] = ["police", "consulate", "airline", "hotel"];

export function buildEmergencyCase(
  documents: EvidenceDocument[],
  options: {
    caseId?: string;
    createdAt?: string;
    recipientIds?: RecipientId[];
  } = {},
): EmergencyCaseData {
  if (documents.length === 0) {
    throw new Error("At least one reviewed document is required.");
  }
  if (documents.some((document) => !normalizeSubjectName(document.subjectName))) {
    throw new Error("Every document requires a confirmed subject name.");
  }
  if (hasDocumentSubjectConflict(documents)) {
    throw new Error("Documents for different people cannot be merged into one case.");
  }

  const recipientIds = [...new Set(options.recipientIds ?? ALL_RECIPIENTS)];
  if (recipientIds.length === 0) {
    throw new Error("At least one recipient must be selected.");
  }

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
    travelerName: documents[0].subjectName.trim(),
    createdAt: options.createdAt ?? new Date().toISOString(),
    destructionHours: 48,
    documents,
    fieldCount: documents.reduce((total, document) => total + document.fields.length, 0),
    recipientIds,
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
    subjectName: "Maya Laurent",
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
    subjectName: "Maya Laurent",
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
    subjectName: "Maya Laurent",
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
