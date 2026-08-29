export type Sensitivity = "critical" | "high" | "moderate" | "operational";

export type PayloadField = {
  key: string;
  label: string;
  value: string;
  source: string;
  sensitivity: Sensitivity;
};

export type ValidationResult = {
  accepted: boolean;
  missingFields: string[];
};

export type MinimizationStep = {
  field: PayloadField;
  outcome: "removed" | "required";
  status: number;
  remainingFieldCount: number;
  missingFields: string[];
};

export type MinimizationResult = {
  originalFields: PayloadField[];
  minimalFields: PayloadField[];
  removedFields: PayloadField[];
  steps: MinimizationStep[];
};

const SENSITIVITY_ORDER: Record<Sensitivity, number> = {
  critical: 0,
  high: 1,
  moderate: 2,
  operational: 3,
};

export const DEMO_PAYLOAD_FIELDS: PayloadField[] = [
  {
    key: "passenger_name",
    label: "Passenger name",
    value: "Maya Laurent",
    source: "passport.pdf",
    sensitivity: "moderate",
  },
  {
    key: "passport_number",
    label: "Passport number",
    value: "19DF000042",
    source: "passport.pdf",
    sensitivity: "critical",
  },
  {
    key: "date_of_birth",
    label: "Date of birth",
    value: "1994-05-18",
    source: "passport.pdf",
    sensitivity: "critical",
  },
  {
    key: "nationality",
    label: "Nationality",
    value: "French",
    source: "passport.pdf",
    sensitivity: "high",
  },
  {
    key: "booking_reference",
    label: "Booking reference",
    value: "K8R4NQ",
    source: "flight-itinerary.pdf",
    sensitivity: "high",
  },
  {
    key: "flight",
    label: "Current flight",
    value: "AF1249",
    source: "flight-itinerary.pdf",
    sensitivity: "operational",
  },
  {
    key: "hotel",
    label: "Hotel",
    value: "Hotel Brummell",
    source: "hotel-confirmation.pdf",
    sensitivity: "moderate",
  },
  {
    key: "requested_date",
    label: "Requested travel date",
    value: "2026-09-01",
    source: "user request",
    sensitivity: "operational",
  },
];

export function fieldsToPayload(fields: PayloadField[]) {
  return Object.fromEntries(fields.map((field) => [field.key, field.value]));
}

export async function minimizePayload(
  fields: PayloadField[],
  validate: (payload: Record<string, string>) => Promise<{
    status: number;
    result: ValidationResult;
  }>,
): Promise<MinimizationResult> {
  const originalFields = [...fields];
  let minimalFields = [...fields];
  const steps: MinimizationStep[] = [];
  const candidates = [...fields].sort(
    (left, right) =>
      SENSITIVITY_ORDER[left.sensitivity] - SENSITIVITY_ORDER[right.sensitivity],
  );

  for (const field of candidates) {
    const candidateFields = minimalFields.filter((item) => item.key !== field.key);
    const validation = await validate(fieldsToPayload(candidateFields));

    if (validation.result.accepted) {
      minimalFields = candidateFields;
      steps.push({
        field,
        outcome: "removed",
        status: validation.status,
        remainingFieldCount: minimalFields.length,
        missingFields: validation.result.missingFields,
      });
    } else {
      steps.push({
        field,
        outcome: "required",
        status: validation.status,
        remainingFieldCount: minimalFields.length,
        missingFields: validation.result.missingFields,
      });
    }
  }

  return {
    originalFields,
    minimalFields,
    removedFields: originalFields.filter(
      (field) => !minimalFields.some((item) => item.key === field.key),
    ),
    steps,
  };
}
