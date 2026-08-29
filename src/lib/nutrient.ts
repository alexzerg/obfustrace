import "server-only";

const NUTRIENT_BUILD_URL = "https://api.nutrient.io/build";

export class NutrientError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "NutrientError";
  }
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

  return {
    provider: "nutrient-dws" as const,
    operation: "json-content-extraction" as const,
    filename: file.name,
    receivedAt: new Date().toISOString(),
    result,
  };
}
