import { expect, test } from "@playwright/test";

const publicPages = [
  "/", "/projects", "/projects/atlas", "/projects/atlas/strategy", "/projects/fieldguide",
  "/projects/sentinel", "/projects/secure-knowledge", "/projects/voice-agent",
  "/projects/research-agent", "/projects/policy-radar", "/projects/enough",
  "/projects/evaluations", "/projects/vibecheck", "/enough", "/labs",
  "/work/enterprise-ai-ops-agent", "/security",
];

for (const route of publicPages) {
  test(`recruiter visit ${route}: useful content, readable controls and responsive layout`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${route} did not load`).toBe(200);
    await expect(page.locator("main h1").first()).toBeVisible();
    if (route !== "/enough") await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Projects" })).toBeVisible();
    const audit = await page.evaluate(() => {
      const unnamedButtons = Array.from(document.querySelectorAll("button")).filter(b => !b.disabled && !b.getAttribute("aria-label")?.trim() && !b.textContent?.trim()).map(b => b.outerHTML.slice(0, 180));
      const unnamedLinks = Array.from(document.querySelectorAll("a[href]")).filter(a => !a.getAttribute("aria-label")?.trim() && !a.textContent?.trim() && !a.querySelector("img[alt]")) .map(a => a.outerHTML.slice(0, 180));
      const unlabeledInputs = Array.from(document.querySelectorAll("input:not([type=hidden]),textarea,select")).filter(el => !(el as HTMLInputElement).labels?.length && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby")).map(el => el.outerHTML.slice(0, 180));
      return { headings: document.querySelectorAll("main h1").length, width: document.documentElement.clientWidth, contentWidth: document.documentElement.scrollWidth, unnamedButtons, unnamedLinks, unlabeledInputs, builderBranding: /chatgpt\.site|powered by chatgpt|created with chatgpt/i.test(document.body.innerText) };
    });
    expect(audit.headings, `${route}: expected one main heading`).toBe(1);
    expect(audit.contentWidth, `${route}: horizontal page overflow`).toBeLessThanOrEqual(audit.width + 1);
    expect(audit.unnamedButtons, `${route}: buttons without a name`).toEqual([]);
    expect(audit.unnamedLinks, `${route}: links without a name`).toEqual([]);
    expect(audit.unlabeledInputs, `${route}: inputs without labels`).toEqual([]);
    expect(audit.builderBranding, `${route}: builder branding exposed`).toBe(false);
    expect(errors, `${route}: client exceptions`).toEqual([]);
  });
}

test("primary navigation and every public project link resolve", async ({ page, request }) => {
  await page.goto("/projects");
  const links = await page.locator("article a[href^='/projects/']").evaluateAll(nodes => [...new Set(nodes.map(n => (n as HTMLAnchorElement).getAttribute("href")))].filter(Boolean) as string[]);
  expect(links.length).toBeGreaterThanOrEqual(8);
  for (const href of links) expect((await request.get(href)).status(), `${href} is broken`).toBe(200);
  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL(/\/projects$/);
});

test("homepage experience respects employer privacy while offering a resume request", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#experience")).toContainText("Enterprise AI platform");
  await expect(page.locator("#experience")).not.toContainText("S&P Global");
  await expect(page.locator("#experience").getByRole("link", { name: /Request résumé/ })).toHaveAttribute("href", /mailto:.*subject=Resume%20request/);
  await expect(page.getByRole("link", { name: "Deployment strategy →" })).toHaveAttribute("href", "/projects/atlas/strategy");
});
