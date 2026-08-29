import { expect, test } from "@playwright/test";
import {
  DEMO_PAYLOAD_FIELDS,
  fieldsToPayload,
  minimizePayload,
} from "../src/lib/minpayload";

const REQUIRED_FIELDS = new Set([
  "passenger_name",
  "booking_reference",
  "flight",
  "requested_date",
]);

test("empirically finds the minimum successful payload", async () => {
  const result = await minimizePayload(DEMO_PAYLOAD_FIELDS, async (payload) => {
    const missingFields = [...REQUIRED_FIELDS].filter((field) => !payload[field]);
    return {
      status: missingFields.length ? 422 : 200,
      result: { accepted: missingFields.length === 0, missingFields },
    };
  });

  expect(Object.keys(fieldsToPayload(result.minimalFields)).sort()).toEqual(
    [...REQUIRED_FIELDS].sort(),
  );
  expect(result.removedFields.map((field) => field.key).sort()).toEqual([
    "date_of_birth",
    "hotel",
    "nationality",
    "passport_number",
  ]);
  expect(result.steps).toHaveLength(DEMO_PAYLOAD_FIELDS.length);
});

test("airline dry-run rejects an insufficient payload", async ({ request }) => {
  const response = await request.post("/api/demo-airline/rebook?dryRun=true", {
    data: {
      passenger_name: "Maya Laurent",
      booking_reference: "K8R4NQ",
    },
  });

  expect(response.status()).toBe(422);
  await expect(response.json()).resolves.toMatchObject({
    accepted: false,
    missingFields: ["flight", "requested_date"],
  });
});

test("airline dry-run accepts the minimum payload", async ({ request }) => {
  const response = await request.post("/api/demo-airline/rebook?dryRun=true", {
    data: {
      passenger_name: "Maya Laurent",
      booking_reference: "K8R4NQ",
      flight: "AF1249",
      requested_date: "2026-09-01",
    },
  });

  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({
    accepted: true,
    dryRun: true,
    missingFields: [],
  });
});

test("explains the executable minimization task", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Find the smallest payload that still gets the job done.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Rebook AF1249 to 1 September" }),
  ).toBeVisible();
  await expect(page.getByText("8 fields from 3 sources")).toBeVisible();
  await expect(page.getByRole("button", { name: "Run payload minimization" })).toBeEnabled();
});

test("runs API experiments and displays the minimum payload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Run payload minimization" }).click();

  await expect(
    page.getByRole("heading", { name: "Minimum successful payload" }),
  ).toBeVisible();
  await expect(page.getByText("50% fewer fields")).toBeVisible();
  await expect(page.getByText("4 unnecessary fields blocked")).toBeVisible();

  const payload = page.locator('section[aria-labelledby="payload-title"] pre');
  await expect(payload).toContainText('"passenger_name"');
  await expect(payload).toContainText('"booking_reference"');
  await expect(payload).toContainText('"flight"');
  await expect(payload).toContainText('"requested_date"');
  await expect(payload).not.toContainText('"passport_number"');
  await expect(payload).not.toContainText('"date_of_birth"');
});

test("executes only the approved minimum payload and returns a receipt", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Run payload minimization" }).click();
  await page.getByRole("button", { name: "Approve and execute minimal payload" }).click();

  await expect(
    page.getByRole("heading", { name: "Flight successfully rebooked" }),
  ).toBeVisible();
  await expect(page.getByText("AF1449", { exact: true })).toBeVisible();
  await expect(page.getByText("2026-09-01", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      "booking_reference, flight, passenger_name, requested_date",
      { exact: true },
    ),
  ).toBeVisible();
});

test("remains usable on a mobile viewport", async ({ page }) => {
  await page.goto("/");

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.getByRole("button", { name: "Run payload minimization" })).toBeVisible();
});
