const REQUIRED_FIELDS = [
  "passenger_name",
  "booking_reference",
  "flight",
  "requested_date",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function confirmationFrom(payload: Record<string, unknown>) {
  const input = `${payload.booking_reference}-${payload.requested_date}`;
  let hash = 7;
  for (const character of input) {
    hash = (hash * 31 + character.charCodeAt(0)) % 100000;
  }
  return `REBOOK-${String(hash).padStart(5, "0")}`;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { accepted: false, error: "INVALID_JSON", missingFields: [...REQUIRED_FIELDS] },
      { status: 400 },
    );
  }

  if (!isRecord(payload)) {
    return Response.json(
      { accepted: false, error: "INVALID_PAYLOAD", missingFields: [...REQUIRED_FIELDS] },
      { status: 400 },
    );
  }

  const missingFields = REQUIRED_FIELDS.filter(
    (field) => typeof payload[field] !== "string" || !payload[field]?.trim(),
  );
  const receivedFields = Object.keys(payload).sort();

  if (missingFields.length > 0) {
    return Response.json(
      {
        accepted: false,
        error: "MISSING_REQUIRED_FIELDS",
        missingFields,
        receivedFields,
      },
      { status: 422 },
    );
  }

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "true";
  if (dryRun) {
    return Response.json({
      accepted: true,
      dryRun: true,
      missingFields: [],
      receivedFields,
    });
  }

  return Response.json({
    accepted: true,
    dryRun: false,
    status: "rebooked",
    confirmation: confirmationFrom(payload),
    passenger: payload.passenger_name,
    previousFlight: payload.flight,
    newFlight: "AF1449",
    newDate: payload.requested_date,
    receivedFields,
  });
}
