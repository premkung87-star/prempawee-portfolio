import { test, expect, type Page } from "@playwright/test";

// E2E coverage for the feedback feature shipped in PR A.
// Tests run against a live URL (BASE_URL env var) — works against
// local dev/prod-build, Vercel preview, or live prempawee.com.
//
// Spec: docs/superpowers/specs/2026-04-26-feedback-button-design.md
// Plan: docs/superpowers/plans/2026-04-26-feedback-button-pr-a.md

async function freshVisitor(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      // private mode — fine
    }
  });
  await page.goto("/");
}

async function scrollToFooter(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}

test.describe("prempawee.com · feedback button", () => {
  test("footer link is visible after scroll", async ({ page }) => {
    await freshVisitor(page);
    await scrollToFooter(page);
    const link = page.getByRole("button", { name: /GIVE FEEDBACK/i });
    await expect(link).toBeVisible();
  });

  test("clicking the link expands the inline form (no modal)", async ({
    page,
  }) => {
    await freshVisitor(page);
    await scrollToFooter(page);
    await page.getByRole("button", { name: /GIVE FEEDBACK/i }).click();
    // Form fields appear in-place
    await expect(
      page.getByRole("radiogroup", { name: /TYPE/i }),
    ).toBeVisible();
    // Body textarea (look up by associated label)
    await expect(page.getByLabel(/MESSAGE/i)).toBeVisible();
    // Email input
    await expect(page.getByLabel(/^EMAIL/i)).toBeVisible();
    // No modal scroll-lock — body overflow should not be hidden
    const overflow = await page.evaluate(
      () => getComputedStyle(document.body).overflow,
    );
    expect(overflow).not.toBe("hidden");
  });

  test("submitting valid feedback shows the thanks confirmation", async ({
    page,
  }) => {
    await freshVisitor(page);
    await scrollToFooter(page);
    await page.getByRole("button", { name: /GIVE FEEDBACK/i }).click();

    // Pick a type, fill the body
    await page.getByRole("radio", { name: /SUGGESTION/i }).click();
    await page
      .getByLabel(/MESSAGE/i)
      .fill("E2E test feedback — please ignore.");

    // Submit
    await page.getByRole("button", { name: /^SUBMIT$/i }).click();

    // Thanks message appears within a reasonable timeout
    await expect(
      page.getByText(/Thanks\. Your feedback is logged\./i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("honeypot field is rendered but not visible to users", async ({
    page,
  }) => {
    await freshVisitor(page);
    await scrollToFooter(page);
    await page.getByRole("button", { name: /GIVE FEEDBACK/i }).click();
    // The honeypot input exists in DOM
    const honeypot = page.locator('input[name="website"]');
    await expect(honeypot).toHaveCount(1);
    // Bounding box should be at negative coordinates or zero-size
    const box = await honeypot.boundingBox();
    if (box) {
      const isOffScreen =
        box.x < 0 || box.width <= 1 || box.height <= 1;
      expect(isOffScreen).toBe(true);
    }
  });

  test("close button collapses the form back to the footer link", async ({
    page,
  }) => {
    await freshVisitor(page);
    await scrollToFooter(page);
    await page.getByRole("button", { name: /GIVE FEEDBACK/i }).click();
    await expect(page.getByLabel(/MESSAGE/i)).toBeVisible();
    // CLOSE button at the bottom of the form
    await page.getByRole("button", { name: /^CLOSE$/i }).click();
    await expect(page.getByLabel(/MESSAGE/i)).toBeHidden();
  });
});
