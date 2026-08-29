import { expect, test } from "@playwright/test";

test("presents Micro-Embassy as post-incident infrastructure", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "A temporary embassy, built around you." })).toBeVisible();
  await expect(page.getByText("Post-incident identity recovery")).toBeVisible();
  await expect(page.getByText("Not a travel planner.", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start with an empty emergency case" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Maya lost her passport in Barcelona" })).toHaveCount(0);
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
  await expect(page.getByRole("link", { name: "Download the synthetic PDF sample" })).toBeVisible();
});

test("serves a prominently synthetic extraction sample", async ({ request }) => {
  const response = await request.get("/samples/maya-travel-evidence.pdf");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("application/pdf");
  expect((await response.body()).byteLength).toBeGreaterThan(10_000);
});

test("explains file selection and supports office documents", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Choose a document first" })).toBeDisabled();

  const input = page.locator('input[type="file"]');
  await input.setInputFiles("templates/doctavian/emergency-travel-request.docx");
  await expect(page.getByText("emergency-travel-request.docx")).toBeVisible();
  await expect(page.getByText("Ready for extraction")).toBeVisible();
  await expect(page.getByRole("button", { name: "Extract with Nutrient DWS" })).toBeEnabled();

  await input.setInputFiles({
    name: "unsupported.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not a supported identity document"),
  });
  await expect(page.getByText(/Unsupported file/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Extract with Nutrient DWS" })).toBeDisabled();
});

test("switches to a purpose-bound airline view", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Preview completed synthetic case" }).click();
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
