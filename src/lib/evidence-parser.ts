export type ParsedEvidenceField = {
  id: string;
  label: string;
  value: string;
  confidence: number;
  dataType: string;
  page: number;
  reviewReasons: string[];
  sourceName: string;
};

type FieldPattern = {
  label: string;
  dataType: string;
  patterns: RegExp[];
  validate?: (value: string) => string | null;
};

const FIELD_PATTERNS: FieldPattern[] = [
  {
    label: "FULL NAME",
    dataType: "String",
    patterns: [
      /(?:FULL NAME|PASSENGER NAME|PASSENGER|GUEST NAME|GUEST)\s*[:\-]?\s*([^\n]{3,60})/i,
    ],
  },
  {
    label: "NATIONALITY",
    dataType: "String",
    patterns: [/(?:NATIONALITY|CITIZENSHIP)\s*[:\-]?\s*([A-Za-z ]{3,30})/i],
  },
  {
    label: "DATE OF BIRTH",
    dataType: "DateTime",
    patterns: [/(?:DATE OF BIRTH|BIRTH DATE|DOB)\s*[:\-]?\s*([^\n]{6,24})/i],
    validate: (value) => (/\b(?:19|20)\d{2}\b/.test(value) ? null : "The date is missing a four-digit year."),
  },
  {
    label: "DOCUMENT NO.",
    dataType: "String",
    patterns: [/(?:DOCUMENT(?: NUMBER| NO\.?| #)|PASSPORT(?: NUMBER| NO\.?| #))\s*[:\-]?\s*([A-Z0-9-]{6,24})/i],
    validate: (value) => (value.replace(/\W/g, "").length >= 8 ? null : "The document number appears too short."),
  },
  {
    label: "EXPIRES",
    dataType: "DateTime",
    patterns: [/(?:DATE OF EXPIRY|EXPIRY DATE|EXPIRATION DATE|EXPIRES)\s*[:\-]?\s*([^\n]{6,24})/i],
  },
  {
    label: "BOOKING REF.",
    dataType: "String",
    patterns: [/(?:BOOKING REFERENCE|BOOKING REF\.?|PNR)\s*[:\-]?\s*([A-Z0-9]{5,10})/i],
  },
  {
    label: "FLIGHT NUMBER",
    dataType: "String",
    patterns: [/(?:FLIGHT NUMBER|FLIGHT NO\.?|FLIGHT)\s*[:\-]?\s*([A-Z]{2}\s?\d{3,4})/i, /\b([A-Z]{2}\d{3,4})\b/],
  },
  {
    label: "DEPARTURE",
    dataType: "String",
    patterns: [/(?:DEPARTURE|DEPARTS)\s*[:\-]?\s*([^\n]{6,60})/i],
  },
  {
    label: "HOTEL",
    dataType: "String",
    patterns: [/(?:HOTEL|PROPERTY)\s*[:\-]?\s*([^\n]{3,60})/i],
  },
  {
    label: "RESERVATION",
    dataType: "String",
    patterns: [/(?:RESERVATION|CONFIRMATION NUMBER|CONFIRMATION NO\.?)\s*[:\-]?\s*([A-Z0-9-]{4,20})/i],
  },
];

function cleanValue(value: string) {
  return value.replace(/\s+/g, " ").replace(/^[|:;,.\-\s]+|[|;,.\s]+$/g, "").trim();
}

export function parseEvidenceText(
  text: string,
  sourceName: string,
  confidence: number,
): ParsedEvidenceField[] {
  const normalizedText = text.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  const fields: ParsedEvidenceField[] = [];

  for (const definition of FIELD_PATTERNS) {
    let value = "";
    for (const pattern of definition.patterns) {
      const match = normalizedText.match(pattern);
      if (match?.[1]) {
        value = cleanValue(match[1]);
        break;
      }
    }

    if (!value) {
      continue;
    }

    const reviewReasons: string[] = [];
    if (confidence < 85) {
      reviewReasons.push(`Browser OCR confidence is ${confidence.toFixed(1)}%, below the 85% review threshold.`);
    }
    const validationError = definition.validate?.(value);
    if (validationError) {
      reviewReasons.push(validationError);
    }

    fields.push({
      id: `browser-${fields.length + 1}`,
      label: definition.label,
      value,
      confidence,
      dataType: definition.dataType,
      page: 1,
      reviewReasons,
      sourceName,
    });
  }

  const labels = new Set(fields.map((field) => field.label));
  const fallbackReasons = [
    "The value was inferred from document structure because its printed label was not read reliably.",
  ];
  if (confidence < 85) {
    fallbackReasons.unshift(
      `Browser OCR confidence is ${confidence.toFixed(1)}%, below the 85% review threshold.`,
    );
  }

  function addFallback(label: string, value: string, dataType = "String") {
    const cleaned = cleanValue(value);
    if (!cleaned || labels.has(label)) {
      return;
    }
    fields.push({
      id: `browser-${fields.length + 1}`,
      label,
      value: cleaned,
      confidence,
      dataType,
      page: 1,
      reviewReasons: [...fallbackReasons],
      sourceName,
    });
    labels.add(label);
  }

  if (!labels.has("FULL NAME")) {
    const rejectedNames = new Set([
      "Return Journey",
      "Synthetic Travel",
      "Travel Document",
      "Hotel Brummell",
    ]);
    const nameCandidates = normalizedText.match(/\b[A-Z][a-z]{2,20}\s+[A-Z][a-z]{2,20}\b/g) ?? [];
    const counts = new Map<string, number>();
    for (const candidate of nameCandidates) {
      if (!rejectedNames.has(candidate)) {
        counts.set(candidate, (counts.get(candidate) ?? 0) + 1);
      }
    }
    const repeatedName = [...counts.entries()].sort((left, right) => right[1] - left[1])[0];
    if (repeatedName && repeatedName[1] >= 2) {
      addFallback("FULL NAME", repeatedName[0]);
    }
  }

  const dateValues = [
    ...new Set(
      normalizedText.match(/\b\d{1,2}\s+[A-Z][a-z]{2,8}\s+(?:19|20)\d{2}\b/g) ?? [],
    ),
  ];
  const dated = dateValues
    .map((value) => ({ value, time: Date.parse(value) }))
    .filter((entry) => Number.isFinite(entry.time))
    .sort((left, right) => left.time - right.time);
  if (dated.length > 0) {
    addFallback("DATE OF BIRTH", dated[0].value, "DateTime");
  }
  if (dated.length >= 2) {
    addFallback("EXPIRES", dated[dated.length - 1].value, "DateTime");
  }

  const bookingCandidate = normalizedText
    .match(/\b(?=[A-Z0-9]{6}\b)(?=[A-Z0-9]*[A-Z])(?=[A-Z0-9]*\d)[A-Z0-9]{6}\b/g)
    ?.find((value) => value !== "FFFFFF");
  if (bookingCandidate) {
    addFallback("BOOKING REF.", bookingCandidate);
  }

  const hotelCandidate = normalizedText.match(/\b(Hotel\s+[A-Z][A-Za-z'-]{2,30}(?:\s+[A-Z][A-Za-z'-]{2,30})?)\b/);
  if (hotelCandidate?.[1]) {
    addFallback("HOTEL", hotelCandidate[1]);
  }

  const reservationCandidate = normalizedText.match(/\b([A-Z]{2,5}-\d{4,10})\b/);
  if (reservationCandidate?.[1]) {
    addFallback("RESERVATION", reservationCandidate[1]);
  }

  const routeCandidate = normalizedText.match(/\b([A-Z]{3})\s+([A-Z]{3})\b/);
  if (routeCandidate) {
    addFallback("ROUTE", `${routeCandidate[1]} → ${routeCandidate[2]}`);
  }

  if (fields.length === 0) {
    const lines = normalizedText
      .split("\n")
      .map(cleanValue)
      .filter((line) => line.length >= 3)
      .slice(0, 8);

    return lines.map((line, index) => ({
      id: `browser-line-${index + 1}`,
      label: `OCR LINE ${index + 1}`,
      value: line,
      confidence,
      dataType: "UnstructuredText",
      page: 1,
      reviewReasons: [
        "Browser OCR could not map this line to a known evidence field. Review and relabel it manually.",
      ],
      sourceName,
    }));
  }

  return fields;
}
