import { mapNutrientFailure } from "@/lib/nutrient-errors";
import {
  extractDocumentWithNutrient,
  isNutrientConfigured,
  NutrientError,
} from "@/lib/nutrient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/msword",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/tiff",
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
        message: "Upload a PDF, DOC, DOCX, JPEG, PNG, TIFF, or WebP document.",
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
      const failure = mapNutrientFailure(error.status, "extraction", error.message);
      return Response.json(failure.body, { status: failure.status });
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
