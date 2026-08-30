import { expect, test } from "@playwright/test";
import {
  detectSensitiveValues,
  rehydrateText,
  SAMPLE_TRACE,
  sanitizeTrace,
} from "../src/lib/obfustrace";

test("creates a stable synthetic twin with a clean certificate", () => {
  const result = sanitizeTrace(SAMPLE_TRACE);

  expect(result.mappings.length).toBeGreaterThanOrEqual(9);
  expect(result.sanitized).not.toContain("alice@acme-corp.com");
  expect(result.sanitized).not.toContain("10.42.7.18");
  expect(result.sanitized).not.toContain("SuperSecret123!");
  expect(result.sanitized).not.toContain("123456789012");
  expect(result.sanitized).toContain("user1@example.invalid");
  expect(result.sanitized).toContain("192.0.2.1");
  expect(result.sanitized.match(/192\.0\.2\.1/g)).toHaveLength(2);
  expect(result.certificate).toMatchObject({
    lineCountPreserved: true,
    stackFrameCountPreserved: true,
    fingerprintPreserved: true,
    residualFindings: 0,
    safeToCopy: true,
  });
  expect(detectSensitiveValues(result.sanitized)).toEqual([]);
});

test("maps repeated originals consistently and rehydrates locally", () => {
  const result = sanitizeTrace(SAMPLE_TRACE);
  const ip = result.mappings.find((mapping) => mapping.original === "10.42.7.18");
  const databaseUser = result.mappings.find(
    (mapping) => mapping.original === "prod_admin",
  );

  expect(ip).toMatchObject({ alias: "192.0.2.1", occurrences: 2 });
  expect(databaseUser?.alias).toBe("[DB_USER_1]");

  const aiResponse = `Check ${databaseUser?.alias} connectivity to ${ip?.alias}.`;
  expect(rehydrateText(aiResponse, result.mappings)).toBe(
    "Check prod_admin connectivity to 10.42.7.18.",
  );
});

test("explains the safe-paste task", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Share the failure. Keep the infrastructure private.",
    }),
  ).toBeVisible();
  await expect(page.getByText("100% local · no uploads")).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Raw production trace" }),
  ).toHaveValue(/10\.42\.7\.18/);
  await expect(page.getByRole("button", { name: "Copy safe trace" })).toBeDisabled();
});

test("sanitizes the sample and enables safe copy", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create safe trace twin" }).click();

  await expect(page.getByRole("heading", { name: "Safe to copy" })).toBeVisible();
  await expect(page.getByText("CLEAN", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy safe trace" })).toBeEnabled();

  const sanitized = page.getByRole("textbox", { name: "Sanitized trace" });
  await expect(sanitized).not.toHaveValue(/10\.42\.7\.18/);
  await expect(sanitized).not.toHaveValue(/alice@acme-corp\.com/);
  await expect(sanitized).toHaveValue(/192\.0\.2\.1/);
  await expect(sanitized).toHaveValue(/user1@example\.invalid/);
  await expect(page.getByText("0", { exact: true }).first()).toBeVisible();
});

test("rehydrates an AI response only after local sanitization", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create safe trace twin" }).click();
  await page.getByRole("button", { name: "Rehydrate locally" }).click();

  const output = page.getByRole("textbox", { name: "Locally rehydrated response" });
  await expect(output).toHaveValue(/prod_admin/);
  await expect(output).toHaveValue(/10\.42\.7\.18/);
  await expect(output).toHaveValue(/123456789012/);
});

test("remains usable on mobile", async ({ page }) => {
  await page.goto("/");
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.getByRole("button", { name: "Create safe trace twin" })).toBeVisible();
});
