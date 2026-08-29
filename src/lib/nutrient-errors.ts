export type NutrientOperation = "extraction" | "redaction";

export type NutrientFailure = {
  status: number;
  body: {
    error: string;
    message: string;
    actionUrl?: string;
    retryable: boolean;
  };
};

export function mapNutrientFailure(
  status: number,
  operation: NutrientOperation,
  fallbackMessage: string,
): NutrientFailure {
  if (status === 402) {
    return {
      status,
      body: {
        error: "NUTRIENT_CREDITS_EXHAUSTED",
        message:
          "Nutrient DWS is connected, but this account has no credits available. Add hackathon credits in the Nutrient dashboard and retry. The document was not retained.",
        actionUrl: "https://dashboard.nutrient.io/processor-api/",
        retryable: true,
      },
    };
  }

  if (status === 401 || status === 403) {
    return {
      status,
      body: {
        error: "NUTRIENT_AUTHORIZATION_FAILED",
        message:
          "Nutrient DWS rejected the server credential. Replace the Processor API key and redeploy before retrying.",
        actionUrl: "https://dashboard.nutrient.io/processor-api/",
        retryable: true,
      },
    };
  }

  return {
    status: status >= 400 && status < 600 ? status : 502,
    body: {
      error:
        operation === "extraction"
          ? "NUTRIENT_REQUEST_FAILED"
          : "NUTRIENT_REDACTION_FAILED",
      message: fallbackMessage,
      retryable: status === 408 || status === 429 || status >= 500,
    },
  };
}
