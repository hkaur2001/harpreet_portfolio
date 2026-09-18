import { expect, test } from "@playwright/test";

test.describe("Atlas live deployment agent", () => {
  test("is internally linked from the portfolio", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Open Atlas/i })).toHaveAttribute("href", "/projects/atlas");
    await page.goto("/projects");
    const atlas = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Atlas", exact: true }) });
    await expect(atlas.getByRole("link", { name: /Open project/i })).toHaveAttribute("href", "/projects/atlas");
  });

  test("goal is clear and short briefs fail before model invocation", async ({ page }) => {
    await page.goto("/projects/atlas/strategy");
    await expect(page.getByRole("heading", { name: /Find the right first AI pilot/i })).toBeVisible();
    await page.getByTestId("atlas-brief").fill("too short");
    await page.getByTestId("run-agent").click();
    await expect(page.getByRole("alert").filter({ hasText: "Describe the workflow" })).toContainText("40–4,000");
  });

  test("real API tool loop returns evidence-backed plan and human review", async ({ page }) => {
    await page.goto("/projects/atlas/strategy");
    await page.getByTestId("run-agent").click();
    await expect(page.getByTestId("atlas-plan")).toBeVisible({ timeout: 40_000 });
    await expect(page.getByTestId("recommendation-title")).toHaveText("Diligence evidence synthesis");
    await page.getByTestId("approve-output").click();
    await expect(page.getByRole("button", { name: "Reviewed ✓" })).toBeDisabled();
    await page.getByRole("button", { name: /Inspect agent evidence/i }).click();
    await expect(page.getByTestId("agent-evidence")).toContainText("inspect workflow");
    await expect(page.getByTestId("agent-evidence")).toContainText("inspect controls");
    await expect(page.getByTestId("agent-evidence")).toContainText("assess capacity");
  });

  test("extreme controls and all verticals remain usable", async ({ page }) => {
    await page.goto("/projects/atlas/strategy");
    await page.locator("summary").filter({ hasText: "Deployment constraints" }).click();
    await page.getByTestId("risk-slider").fill("0");
    await page.getByTestId("capacity-slider").fill("1");
    await page.getByTestId("strict-governance").uncheck();
    await page.getByTestId("risk-slider").fill("100");
    await page.getByTestId("capacity-slider").fill("16");
    for (const id of ["banking", "hardware", "consulting", "healthcare"]) await page.getByTestId("atlas-vertical").selectOption(id);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  });

  test("malformed JSON and invalid typed inputs fail closed", async ({ request }) => {
    for (const data of [null, [], { verticalId: "__proto__", brief: "x".repeat(100), riskTolerance: 30, capacity: 6, strictGovernance: true }, { verticalId: "banking", brief: {}, riskTolerance: 30, capacity: 6, strictGovernance: true }]) {
      const response = await request.post("/api/atlas/plan", { headers: { "Content-Type": "application/json" }, data });
      expect(response.status()).toBe(400);
    }
  });
});
