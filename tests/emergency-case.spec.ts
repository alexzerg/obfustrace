import { expect, test } from "@playwright/test";

test("presents Micro-Embassy as post-incident infrastructure", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "A temporary embassy, built around you." })).toBeVisible();
  await expect(page.getByText("Post-incident identity recovery")).toBeVisible();
  await expect(page.getByText("Not a travel planner.", { exact: false })).toBeVisible();
});

test("switches to a purpose-bound airline view", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Airline/ }).click();

  await expect(page.getByRole("heading", { name: "Air France Assistance" })).toBeVisible();
  await expect(page.getByText("Booking reference")).toBeVisible();
  await expect(page.getByText("K8R4NQ")).toBeVisible();
  await expect(page.getByText("Passport number", { exact: true })).toBeVisible();
  await expect(page.getByText("Protected evidence")).toBeVisible();
});

test("revokes and reissues recipient access", async ({ page }) => {
  await page.goto("/");

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
  await expect(page.getByRole("link", { name: "Open case" })).toBeVisible();
});
