import { expect, test } from "@playwright/test";
import { buildEmergencyCase } from "../src/lib/case-model";
import { parseEvidenceText } from "../src/lib/evidence-parser";
import { mapNutrientFailure } from "../src/lib/nutrient-errors";

test("maps exhausted Nutrient credits to an actionable domain error", () => {
  expect(mapNutrientFailure(402, "extraction", "upstream failure")).toEqual({
    status: 402,
    body: {
      error: "NUTRIENT_CREDITS_EXHAUSTED",
      message:
        "Nutrient DWS is connected, but this account has no credits available. Add hackathon credits in the Nutrient dashboard and retry. The document was not retained.",
      actionUrl: "https://dashboard.nutrient.io/processor-api/",
      retryable: true,
    },
  });
});

test("keeps passport and flight facts tied to their source documents", () => {
  const passport = parseEvidenceText(
    "FULL NAME Maya Laurent\nNATIONALITY French\nDATE OF BIRTH 18 May 1994\nDOCUMENT NUMBER 19DF000042",
    "passport.pdf",
    92,
  );
  const flight = parseEvidenceText(
    "PASSENGER NAME Maya Laurent\nBOOKING REFERENCE K8R4NQ\nFLIGHT NUMBER AF1249",
    "flight-itinerary.pdf",
    94,
  );

  expect(passport.find((field) => field.label === "DOCUMENT NO.")).toMatchObject({
    value: "19DF000042",
    sourceName: "passport.pdf",
  });
  expect(passport.some((field) => field.label === "FLIGHT NUMBER")).toBeFalsy();
  expect(flight.find((field) => field.label === "FLIGHT NUMBER")).toMatchObject({
    value: "AF1249",
    sourceName: "flight-itinerary.pdf",
  });
  expect(flight.some((field) => field.label === "DOCUMENT NO.")).toBeFalsy();
});

test("builds dashboard facts from reviewed source documents", () => {
  const passportFields = parseEvidenceText(
    "FULL NAME Maya Laurent\nNATIONALITY French\nDOCUMENT NUMBER 19DF000042",
    "passport.pdf",
    96,
  );
  const flightFields = parseEvidenceText(
    "PASSENGER NAME Maya Laurent\nBOOKING REFERENCE K8R4NQ\nFLIGHT NUMBER AF1249",
    "flight.pdf",
    96,
  );
  const caseData = buildEmergencyCase([
    {
      id: "passport",
      name: "passport.pdf",
      type: "application/pdf",
      size: 100,
      subjectName: "Maya Laurent",
      fields: passportFields,
    },
    {
      id: "flight",
      name: "flight.pdf",
      type: "application/pdf",
      size: 100,
      subjectName: "Maya Laurent",
      fields: flightFields,
    },
  ], {
    caseId: "ME-TEST",
    recipientIds: ["police", "airline"],
  });

  expect(caseData).toMatchObject({
    caseId: "ME-TEST",
    travelerName: "Maya Laurent",
    fieldCount: passportFields.length + flightFields.length,
    recipientIds: ["police", "airline"],
  });
  expect(caseData.facts["DOCUMENT NO."]).toEqual({
    value: "19DF000042",
    sourceName: "passport.pdf",
  });
  expect(caseData.facts["FLIGHT NUMBER"]).toEqual({
    value: "AF1249",
    sourceName: "flight.pdf",
  });
});

test("rejects documents confirmed as belonging to different people", () => {
  const mayaFields = parseEvidenceText("FULL NAME Maya Laurent", "maya.pdf", 95);
  const mariaFields = parseEvidenceText("FULL NAME Maria Ivanova", "maria.pdf", 95);

  expect(() =>
    buildEmergencyCase([
      {
        id: "maya",
        name: "maya.pdf",
        type: "application/pdf",
        size: 100,
        subjectName: "Maya Laurent",
        fields: mayaFields,
      },
      {
        id: "maria",
        name: "maria.pdf",
        type: "application/pdf",
        size: 100,
        subjectName: "Maria Ivanova",
        fields: mariaFields,
      },
    ], { recipientIds: ["police"] }),
  ).toThrow("Documents for different people cannot be merged into one case.");
});

test("presents Micro-Embassy as post-incident infrastructure", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "A temporary embassy, built around you." })).toBeVisible();
  await expect(page.getByText("Post-incident identity recovery")).toBeVisible();
  await expect(page.getByText("Not a travel planner.", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start with an empty emergency case" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Maya Laurent's temporary embassy" })).toHaveCount(0);
});

test("exposes an honest Nutrient readiness and upload contract", async ({ page, request }) => {
  const statusResponse = await request.get("/api/documents/extract");
  expect(statusResponse.ok()).toBeTruthy();
  await expect(statusResponse.json()).resolves.toMatchObject({
    provider: "nutrient-dws",
    operation: "json-content-extraction",
    maxFileSizeBytes: 10 * 1024 * 1024,
  });

  const missingDocumentResponse = await request.post("/api/documents/extract", {
    multipart: {},
  });
  expect(missingDocumentResponse.status()).toBe(400);
  await expect(missingDocumentResponse.json()).resolves.toMatchObject({
    error: "DOCUMENT_REQUIRED",
  });

  const redactionStatusResponse = await request.get("/api/documents/redact");
  expect(redactionStatusResponse.ok()).toBeTruthy();
  await expect(redactionStatusResponse.json()).resolves.toMatchObject({
    provider: "nutrient-dws",
    operation: "irreversible-text-redaction",
    acceptedType: "application/pdf",
  });

  const missingRedactionDocument = await request.post("/api/documents/redact", {
    multipart: {},
  });
  expect(missingRedactionDocument.status()).toBe(400);
  await expect(missingRedactionDocument.json()).resolves.toMatchObject({
    error: "DOCUMENT_REQUIRED",
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Recover evidence from what remains" })).toBeVisible();
  await expect(page.getByRole("link", { name: "1. Download passport" })).toBeVisible();
});

test("serves a prominently synthetic extraction sample", async ({ request }) => {
  const response = await request.get("/samples/maya-passport.pdf");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("application/pdf");
  expect((await response.body()).byteLength).toBeGreaterThan(10_000);
});

test("offers separate passport, flight, and hotel evidence sources", async ({ page, request }) => {
  for (const path of [
    "/samples/maya-passport.pdf",
    "/samples/maya-flight-itinerary.pdf",
    "/samples/maya-hotel-confirmation.pdf",
  ]) {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("application/pdf");
    expect((await response.body()).byteLength).toBeGreaterThan(10_000);
  }

  await page.goto("/");
  await expect(page.getByRole("link", { name: "1. Download passport" })).toBeVisible();
  await expect(page.getByRole("link", { name: "2. Download flight itinerary" })).toBeVisible();
  await expect(page.getByRole("link", { name: "3. Download hotel confirmation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add at least two reviewed documents" })).toBeDisabled();
});

test("explains file selection and supports office documents", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Choose a document first" })).toBeDisabled();

  const input = page.locator('input[type="file"]');
  await input.setInputFiles("templates/doctavian/emergency-travel-request.docx");
  await expect(page.getByText("emergency-travel-request.docx")).toBeVisible();
  await expect(page.getByText("Ready for extraction")).toBeVisible();
  await expect(page.getByRole("button", { name: "Private OCR needs PDF or image" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Try Nutrient DWS" })).toBeEnabled();

  await input.setInputFiles({
    name: "unsupported.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not a supported identity document"),
  });
  await expect(page.getByText(/Unsupported file/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Try Nutrient DWS" })).toBeDisabled();
});

test("switches to a purpose-bound airline view", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Preview completed synthetic case" }).click();
  await expect(page.getByLabel("Source docs: 3")).toBeVisible();
  await expect(page.getByLabel("Reviewed fields: 13")).toBeVisible();
  await expect(page.getByLabel("Recipient links: 4")).toBeVisible();
  await page.getByRole("button", { name: /Airline/ }).click();

  await expect(page.getByRole("heading", { name: "Air France Assistance" })).toBeVisible();
  await expect(page.getByText("Booking reference")).toBeVisible();
  await expect(page.getByText("K8R4NQ")).toBeVisible();
  await expect(page.getByText("Passport number", { exact: true })).toBeVisible();
  await expect(page.getByText("Protected evidence")).toBeVisible();
});

test("revokes and reissues recipient access", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Preview completed synthetic case" }).click();
  await page.getByRole("button", { name: "Revoke access" }).click();
  await expect(page.getByRole("heading", { name: "This recipient can no longer open the case" })).toBeVisible();
  await expect(page.getByText("Link revoked")).toBeVisible();

  await page.getByRole("button", { name: "Reissue for 30 min" }).click();
  await expect(page.getByText("Expires in 30 min")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Shared evidence" })).toBeVisible();
});

test("does not overflow horizontally", async ({ page }) => {
  await page.goto("/");

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));

  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.getByRole("link", { name: "Start recovery" })).toBeVisible();
});
