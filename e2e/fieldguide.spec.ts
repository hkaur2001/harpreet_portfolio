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

    await page.getByRole("button", { name: /06 Your workflow/i }).click();
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

  test("all three synthetic verticals render their scenario contracts", async ({ page }) => {
    await page.goto("/projects/fieldguide");

    for (const [button, heading] of [
      [/Enterprise operations/i, "Third-party vendor exception review"],
      [/Consulting/i, "Commercial diligence synthesis"],
      [/Hardware engineering/i, "Late engineering-change impact review"],
    ] as const) {
      await page.getByRole("button", { name: button }).click();
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
  });
});
