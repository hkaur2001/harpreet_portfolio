import { expect, test } from "@playwright/test";

test.describe("FieldGuide deployment workbench", () => {
  test("every primary workflow control produces a visible state change", async ({ page }) => {
    await page.goto("/projects/fieldguide");

    await expect(page.getByRole("heading", { name: /Turn a messy workflow into an AI deployment you can defend/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Third-party vendor exception review", exact: true })).toBeVisible();

    await page.getByRole("button", { name: /Consulting/i }).click();
    await expect(page.getByRole("heading", { name: "Commercial diligence synthesis", exact: true })).toBeVisible();

    await page.getByRole("button", { name: /02 Design/i }).click();
    await expect(page.getByText("Automate the best learning loop first.", { exact: true })).toBeVisible();
    await expect(page.getByText("Source map + contradiction log", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /03 Pilot/i }).click();
    await expect(page.getByText("Market growth sources disagree by 9 points", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Run governed pilot/i }).click();
    await expect(page.getByText("Injected worker interruption", { exact: true })).toBeVisible();
    await expect(page.getByText("Resume from durable checkpoint", { exact: true })).toBeVisible();
    await expect(page.getByText("Pilot decision", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Accept as expert-reviewed/i }).click();
    await expect(page.getByText(/Accepted output becomes a candidate golden example/i)).toBeVisible();

    await page.getByRole("button", { name: /04 Evals/i }).click();
    await page.getByRole("button", { name: /Run golden-set gates/i }).click();
    await expect(page.getByText("4 / 4", { exact: true })).toBeVisible();
    await expect(page.getByText(/Hard-control suite passes/i)).toBeVisible();

    await page.getByRole("button", { name: /05 Rollout/i }).click();
    await page.getByRole("button", { name: /Air-gapped/i }).click();
    await expect(page.getByText(/No external network dependency/i)).toBeVisible();
    await expect(page.getByText("Shadow mode", { exact: true })).toBeVisible();
    await expect(page.getByText("Assisted production", { exact: true })).toBeVisible();
    await expect(page.getByText("Bounded automation", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /06 Manage/i }).click();
    await expect(page.getByText("Deployment control center", { exact: true })).toBeVisible();
    await expect(page.getByText("Business owner", { exact: true })).toBeVisible();
    await expect(page.getByText("Next best action", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Open evals/i }).click();
    await expect(page.getByText("Release gate", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /07 Your workflow/i }).click();
    const live = page.locator("#fieldguide-live");
    if (await live.isChecked()) await live.uncheck();

    await page.locator("textarea").fill(
      "Our operations team reviews complex customer exceptions across ServiceNow, SharePoint policy documents, Snowflake account history, and Slack. Analysts repeatedly reconstruct context, compare policy to current facts, and escalate high-risk exceptions to a director before writing the approved disposition back to ServiceNow. We need a measurable first pilot with strict authorization and audit controls.",
    );
    await page.getByRole("button", { name: /Build deployment hypothesis/i }).click();

    await expect(page.getByText("Deployment hypothesis", { exact: true })).toBeVisible();
    await expect(page.getByText("First pilot", { exact: true })).toBeVisible();
    await expect(page.getByText("full path", { exact: true })).toBeVisible();
  });

  test("all built-in scenarios render their scenario contracts", async ({ page }) => {
    await page.goto("/projects/fieldguide");

    for (const [button, heading] of [
      [/Enterprise operations/i, "Third-party vendor exception review"],
      [/Consulting/i, "Commercial diligence synthesis"],
      [/Hardware engineering/i, "Late engineering-change impact review"],
      [/Real-world case/i, "Cleveland Clinic third-party risk — public-source reconstruction"],
    ] as const) {
      await page.getByRole("button", { name: button }).click();
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
  });


  test("real-world Cleveland Clinic case separates sourced facts from deployment assumptions", async ({ page }) => {
    await page.goto("/projects/fieldguide");
    await page.getByRole("button", { name: /Real-world case/i }).click();

    await expect(page.getByRole("heading", { name: "Cleveland Clinic third-party risk — public-source reconstruction", exact: true })).toBeVisible();
    await expect(page.getByText("Real-world public case · sourced", { exact: true })).toBeVisible();
    await expect(page.getByText("ServiceNow Vendor Risk Management", { exact: true })).toBeVisible();
    await expect(page.getByText("SecurityScorecard", { exact: true })).toBeVisible();
    await expect(page.getByText("What is sourced vs. proposed", { exact: true })).toBeVisible();

    const source = page.getByRole("link", { name: /Open public source/i });
    await expect(source).toHaveAttribute("href", "https://securityscorecard.com/resources/case-studies/cleveland-clinic/");

    await page.getByRole("button", { name: /03 Pilot/i }).click();
    await expect(page.getByText("Risk score deterioration on a high-risk third party", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /06 Manage/i }).click();
    await expect(page.getByText(/Example management story · Cleveland Clinic/i)).toBeVisible();
  });

  test("invalid scenario IDs fail closed instead of silently loading another customer case", async ({ request }) => {
    const response = await request.post("/api/fieldguide/analyze", {
      data: { scenarioId: "does-not-exist", deploymentMode: "vpc", live: false },
    });
    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "Unknown FieldGuide scenario." });
  });

  test("malformed API inputs return bounded 4xx errors", async ({ request }) => {
    const invalidMode = await request.post("/api/fieldguide/analyze", {
      data: { scenarioId: "vendor-risk", deploymentMode: "moon", live: false },
    });
    expect(invalidMode.status()).toBe(400);

    const invalidType = await request.post("/api/fieldguide/analyze", {
      data: { workflowDescription: { nested: true }, live: false },
    });
    expect(invalidType.status()).toBe(400);

    const malformedJson = await request.post("/api/fieldguide/analyze", {
      headers: { "Content-Type": "application/json" },
      data: "{not-json",
    });
    expect(malformedJson.status()).toBe(400);
  });
});
