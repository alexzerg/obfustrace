import {
  isNutrientConfigured,
  NutrientError,
  redactDocumentWithNutrient,
} from "@/lib/nutrient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_REDACTION_TERMS = 12;
const ROLE_IDS = new Set(["airline", "consulate", "hotel", "police"]);

export function GET() {
  return Response.json(
    {
      provider: "nutrient-dws",
      configured: isNutrientConfigured(),
      operation: "irreversible-text-redaction",
      acceptedType: "application/pdf",
      maxTerms: MAX_REDACTION_TERMS,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "INVALID_FORM_DATA", message: "Expected a multipart PDF redaction request." },
      { status: 400 },
    );
  }

  const document = formData.get("document");
  const role = formData.get("role");
  const rawTerms = formData.get("terms");

  if (!(document instanceof File)) {
    return Response.json(
      { error: "DOCUMENT_REQUIRED", message: "Choose a PDF before redaction." },
      { status: 400 },
    );
  }

  if (document.type !== "application/pdf") {
    return Response.json(
      { error: "PDF_REQUIRED", message: "Irreversible redaction requires a PDF source document." },
      { status: 415 },
    );
  }

  if (document.size === 0 || document.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "INVALID_DOCUMENT_SIZE", message: "The PDF must be between 1 byte and 10 MB." },
      { status: 413 },
    );
  }

  if (typeof role !== "string" || !ROLE_IDS.has(role)) {
    return Response.json(
      { error: "INVALID_RECIPIENT_ROLE", message: "Choose a supported recipient role." },
      { status: 400 },
    );
  }

  if (typeof rawTerms !== "string") {
    return Response.json(
      { error: "REDACTION_TERMS_REQUIRED", message: "Choose reviewed values to protect." },
      { status: 400 },
    );
  }

  let terms: unknown;
  try {
    terms = JSON.parse(rawTerms);
  } catch {
    return Response.json(
      { error: "INVALID_REDACTION_TERMS", message: "Redaction terms must be a JSON array." },
      { status: 400 },
    );
  }

  if (
    !Array.isArray(terms) ||
    terms.length === 0 ||
    terms.length > MAX_REDACTION_TERMS ||
    terms.some((term) => typeof term !== "string" || term.trim().length < 2 || term.length > 120)
  ) {
    return Response.json(
      {
        error: "INVALID_REDACTION_TERMS",
        message: `Provide between 1 and ${MAX_REDACTION_TERMS} short reviewed text values.`,
      },
      { status: 400 },
    );
  }

  if (!isNutrientConfigured()) {
    return Response.json(
      {
        error: "NUTRIENT_NOT_CONFIGURED",
        message: "Add NUTRIENT_DWS_API_KEY on the server to enable real redaction.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await redactDocumentWithNutrient(
      document,
      [...new Set(terms.map((term) => term.trim()))],
    );

    return new Response(result.pdf, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="micro-embassy-${role}.pdf"`,
        "Content-Type": result.contentType,
        "X-Redaction-Count": String(result.redactionCount),
      },
    });
  } catch (error) {
    if (error instanceof NutrientError) {
      return Response.json(
        { error: "NUTRIENT_REDACTION_FAILED", message: error.message },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 },
      );
    }

    return Response.json(
      {
        error: "REDACTION_FAILED",
        message: "The role-specific PDF could not be generated. No file was retained.",
      },
      { status: 502 },
    );
  }
}
