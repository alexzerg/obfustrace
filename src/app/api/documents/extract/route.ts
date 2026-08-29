import {
  extractDocumentWithNutrient,
  isNutrientConfigured,
  NutrientError,
} from "@/lib/nutrient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function GET() {
  return Response.json(
    {
      provider: "nutrient-dws",
      configured: isNutrientConfigured(),
      operation: "json-content-extraction",
      acceptedTypes: [...ALLOWED_TYPES],
      maxFileSizeBytes: MAX_FILE_SIZE,
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
      { error: "INVALID_FORM_DATA", message: "Expected a multipart document upload." },
      { status: 400 },
    );
  }

  const document = formData.get("document");

  if (!(document instanceof File)) {
    return Response.json(
      { error: "DOCUMENT_REQUIRED", message: "Choose a document before extraction." },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.has(document.type)) {
    return Response.json(
      {
        error: "UNSUPPORTED_DOCUMENT_TYPE",
        message: "Upload a PDF, JPEG, PNG, or WebP document.",
      },
      { status: 415 },
    );
  }

  if (document.size === 0 || document.size > MAX_FILE_SIZE) {
    return Response.json(
      {
        error: "INVALID_DOCUMENT_SIZE",
        message: "The document must be between 1 byte and 10 MB.",
      },
      { status: 413 },
    );
  }

  if (!isNutrientConfigured()) {
    return Response.json(
      {
        error: "NUTRIENT_NOT_CONFIGURED",
        message: "Add NUTRIENT_DWS_API_KEY on the server to enable real extraction.",
      },
      { status: 503 },
    );
  }

  try {
    const extraction = await extractDocumentWithNutrient(document);
    return Response.json(extraction, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof NutrientError) {
      return Response.json(
        { error: "NUTRIENT_REQUEST_FAILED", message: error.message },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 },
      );
    }

    return Response.json(
      {
        error: "EXTRACTION_FAILED",
        message: "The document could not be extracted. No file was retained.",
      },
      { status: 502 },
    );
  }
}
