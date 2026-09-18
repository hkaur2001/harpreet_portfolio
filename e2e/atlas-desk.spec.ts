import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `desk-browser-${randomUUID()}` });
  await page.goto("/projects/atlas");
});
async function investigate(page: import("@playwright/test").Page) {
  await page.getByTestId("desk-run").click();
  await expect(page.getByTestId("desk-result")).toBeVisible({ timeout: 45000 });
}
test("clear goal, authorized source inspection, short-input rejection", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Turn conflicting financial data into a brief you can defend." })).toBeVisible();
  await expect(page.getByTestId("task-credit")).toBeVisible();
  await page.getByTestId("source-F04").click();
  await expect(page.getByTestId("source-reader")).toContainText("superseded");
  await expect(page.getByTestId("source-reader")).toBeFocused();
  await page.getByRole("button", { name: "Close source" }).click();
  await page.getByTestId("desk-question").fill("short");
  await page.getByTestId("desk-run").click();
  await expect(page.getByTestId("desk-error")).toContainText("10–2,000");
});
test("earnings agent returns calculations, inspectable citations, trace and review", async ({ page }) => {
  await investigate(page);
  await expect(page.getByTestId("desk-result")).toContainText("14.29");
  await expect(page.getByTestId("desk-result")).toContainText("20.00");
  await page.getByRole("button", { name: "Inspect citation F02" }).first().click();
  await expect(page.getByTestId("source-reader")).toContainText("revenue 480");
  await page.locator("summary").filter({ hasText: "actual tool calls" }).click();
  await expect(page.getByTestId("desk-trace")).toContainText("calculate metric");
  await page.getByTestId("desk-review").click();
  await expect(page.getByTestId("desk-review")).toBeDisabled();
  const download = page.waitForEvent("download");
  await page.getByTestId("desk-export").click();
  expect((await download).suggestedFilename()).toBe("atlas-earnings-brief.txt");
});
test("credit and data reconciliation use distinct reproducible metrics", async ({ page }) => {
  await page.getByTestId("task-credit").click(); await investigate(page);
  await expect(page.getByTestId("desk-result")).toContainText("2.92");
  await expect(page.getByTestId("desk-result")).toContainText("3.65");
  await expect(page.getByTestId("desk-result")).toContainText("actual compliance is unknown");
  await page.getByTestId("task-reconciliation").click();
  await expect(page.getByTestId("desk-result")).toHaveCount(0);
  await investigate(page); await expect(page.getByTestId("desk-result")).toContainText("62.50");
});
test("reviewer revision and explicitly accepted procedural memory", async ({ page }) => {
  await investigate(page);
  await page.getByTestId("desk-feedback").fill("Emphasize reporting periods and proxy limitations.");
  await page.getByTestId("desk-revise").click();
  await expect(page.getByTestId("desk-revision")).toContainText("reporting periods", { timeout: 45000 });
  await page.getByTestId("desk-accept-rule").click();
  await expect(page.getByTestId("desk-rules")).toContainText("Prefer approved current source versions");
  await page.reload();
  await expect(page.getByTestId("desk-rules")).toContainText("Prefer approved current source versions");
  await expect(page.getByTestId("desk-result")).toHaveCount(0);
  await page.getByRole("button", { name: "Remove rule 1" }).click();
  await expect(page.getByTestId("desk-rules")).toHaveCount(0);
});
test("invalid model numbers fail visibly and do not substitute a brief", async ({ page }) => {
  await page.getByTestId("desk-question").fill("DESK_TEST_BAD_VALUE inspect synthetic financial evidence.");
  await page.getByTestId("desk-run").click();
  await expect(page.getByTestId("desk-error")).toBeVisible({ timeout: 45000 });
  await expect(page.getByTestId("desk-result")).toHaveCount(0);
});
test("time budget includes review, added effort and empty-input handling", async ({ page }) => {
  await page.locator("summary").filter({ hasText: "Pilot time-budget calculator" }).click();
  await expect(page.getByText("7.3 hours / week potentially returned")).toBeVisible();
  await page.getByLabel("Manual minutes / task").fill("5");
  await expect(page.getByText("6.0 hours / week added effort")).toBeVisible();
  await page.getByLabel("Manual minutes / task").fill("");
  await expect(page.getByText("Use nonnegative inputs within the stated limits.")).toBeVisible();
});
test("desktop and mobile results fit the viewport without client errors", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await investigate(page);
  const sizes = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.width + 1);
  expect(errors).toEqual([]);
});
