import "server-only";

const NUTRIENT_BUILD_URL = "https://api.nutrient.io/build";
const REVIEW_THRESHOLD = 85;
const EXPECTED_LABELS = new Set([
  "BOOKING REF.",
  "DATE OF BIRTH",
  "DEPARTURE",
  "DOCUMENT NO.",
  "EXPIRES",
  "FULL NAME",
  "HOTEL",
  "ISSUED",
  "NATIONALITY",
  "PASSENGER",
  "RESERVATION",
]);

type JsonRecord = Record<string, unknown>;

export type ExtractedField = {
  id: string;
  label: string;
  value: string;
  confidence: number;
  dataType: string;
  page: number;
  reviewReasons: string[];
};

export class NutrientError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "NutrientError";
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readContent(value: unknown) {
  return isRecord(value) && typeof value.content === "string" ? value.content.trim() : "";
}

function readDataType(value: unknown) {
  return isRecord(value) && typeof value.dataType === "string" ? value.dataType : "Unknown";
}

function normalizeLabel(label: string) {
  return label.replace(/\s+/g, " ").trim().toUpperCase();
}

export function normalizeNutrientResult(result: unknown): ExtractedField[] {
  if (!isRecord(result) || !Array.isArray(result.pages)) {
    return [];
  }

  return result.pages.flatMap((page, pageIndex) => {
    if (!isRecord(page) || !Array.isArray(page.keyValuePairs)) {
      return [];
    }

    return page.keyValuePairs.flatMap((pair, pairIndex) => {
      if (!isRecord(pair)) {
        return [];
      }

      const label = readContent(pair.key);
      const value = readContent(pair.value);
      const dataType = readDataType(pair.value);
      const confidence =
        typeof pair.confidence === "number"
          ? Math.max(0, Math.min(100, pair.confidence))
          : 0;
      const reviewReasons: string[] = [];
      const normalizedLabel = normalizeLabel(label);

      if (!label || !value) {
        reviewReasons.push("The key-value pair is incomplete.");
      }
      if (confidence < REVIEW_THRESHOLD) {
        reviewReasons.push(`Confidence is ${confidence.toFixed(1)}%, below the ${REVIEW_THRESHOLD}% review threshold.`);
      }
      if (!EXPECTED_LABELS.has(normalizedLabel)) {
        reviewReasons.push("The field label was inferred from nearby content and needs mapping.");
      }
      if (dataType === "DateTime" && !/\b(?:19|20)\d{2}\b/.test(value)) {
        reviewReasons.push("The extracted date is missing a four-digit year.");
      }
      if (normalizedLabel.includes("DOCUMENT NO") && value.replace(/\W/g, "").length < 10) {
        reviewReasons.push("The document number appears shorter than the expected synthetic sample.");
      }

      return [
        {
          id: `page-${pageIndex + 1}-field-${pairIndex + 1}`,
          label: label || "Unlabelled field",
          value: value || "No value extracted",
          confidence,
          dataType,
          page: pageIndex + 1,
          reviewReasons,
        },
      ];
    });
  });
}

export function isNutrientConfigured() {
  return Boolean(process.env.NUTRIENT_DWS_API_KEY?.trim());
}

export async function extractDocumentWithNutrient(file: File) {
  const apiKey = process.env.NUTRIENT_DWS_API_KEY?.trim();

  if (!apiKey) {
    throw new NutrientError("Nutrient DWS is not configured.", 503);
  }

  const formData = new FormData();
  formData.append(
    "instructions",
    JSON.stringify({
      parts: [{ file: "document" }],
      output: {
        type: "json-content",
        keyValuePairs: true,
        plainText: true,
        structuredText: true,
      },
    }),
  );
  formData.append("document", file, file.name);

  const response = await fetch(NUTRIENT_BUILD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
    cache: "no-store",
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new NutrientError(
      `Nutrient DWS rejected the document with HTTP ${response.status}.`,
      response.status,
    );
  }

  let result: unknown;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new NutrientError("Nutrient DWS returned a non-JSON extraction response.", 502);
  }

  const fields = normalizeNutrientResult(result);
  const reviewRequiredCount = fields.filter((field) => field.reviewReasons.length > 0).length;

  return {
    provider: "nutrient-dws" as const,
    operation: "json-content-extraction" as const,
    filename: file.name,
    receivedAt: new Date().toISOString(),
    summary: {
      fieldCount: fields.length,
      reviewRequiredCount,
      readyCount: fields.length - reviewRequiredCount,
    },
    fields,
    result,
  };
}

export async function redactDocumentWithNutrient(file: File, terms: string[]) {
  const apiKey = process.env.NUTRIENT_DWS_API_KEY?.trim();

  if (!apiKey) {
    throw new NutrientError("Nutrient DWS is not configured.", 503);
  }

  const actions: JsonRecord[] = terms.map((term) => ({
    type: "createRedactions",
    strategy: "text",
    strategyOptions: {
      text: term,
      caseSensitive: false,
      includeAnnotations: true,
    },
  }));
  actions.push({ type: "applyRedactions" });

  const formData = new FormData();
  formData.append(
    "instructions",
    JSON.stringify({
      parts: [{ file: "document" }],
      actions,
    }),
  );
  formData.append("document", file, file.name);

  const response = await fetch(NUTRIENT_BUILD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new NutrientError(
      `Nutrient DWS rejected the redaction workflow with HTTP ${response.status}.`,
      response.status,
    );
  }

  const contentType = response.headers.get("content-type") ?? "application/pdf";
  if (!contentType.includes("application/pdf")) {
    throw new NutrientError("Nutrient DWS returned a non-PDF redaction response.", 502);
  }

  return {
    pdf: await response.arrayBuffer(),
    contentType,
    redactionCount: terms.length,
  };
}
