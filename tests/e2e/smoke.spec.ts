import { test, expect, type Page } from "@playwright/test";

// These tests are the §17/§20 regression guard. Each one would have caught the
// "site looks rendered but clicks do nothing" hydration failure that cost us
// ~3 hours of debugging on 2026-04-17 and passed every curl-based check.
//
// Rule from AUDIT_LOG §20: no CSP, middleware/proxy, async-layout, or
// experimental-flag change may deploy until these pass.

// Fresh page with consent cleared so the banner renders for each test.
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

test.describe("prempawee.com · hydration smoke", () => {
  test("page loads and welcome message is visible", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText(/I'm Prempawee's portfolio AI|ผม(?:เป็น|คือ) AI ของ Prempawee/i),
    ).toBeVisible();
    await expect(
      page.getByText(/What do you need built\?|คุณต้องการให้สร้างอะไร/i),
    ).toBeVisible();
  });

  test("consent button hides banner when clicked (§17/§20 regression guard)", async ({
    page,
  }) => {
    await freshVisitor(page);
    const button = page.getByRole("button", { name: /I understand|เข้าใจแล้ว/i });
    await expect(button).toBeVisible();
    await button.click();
    // Banner must disappear within 2s of click — any longer means onClick
    // didn't attach (hydration failed).
    await expect(button).toBeHidden({ timeout: 2000 });
  });

  test("language toggle switches UI (client interactivity sanity)", async ({
    page,
  }) => {
    await freshVisitor(page);
    // Dismiss consent first
    const consent = page.getByRole("button", { name: /I understand/i });
    if (await consent.isVisible()) await consent.click();

    const th = page.getByRole("button", { name: "TH", exact: true });
    await th.click();
    await expect(th).toHaveAttribute("aria-pressed", "true");
    // TH mode swaps the chat-input placeholder to Thai. Placeholder text
    // lives on the input's placeholder attribute, not as visible text.
    await expect(page.getByPlaceholder(/คุณต้องการให้สร้างอะไร/i)).toBeVisible();
  });

  test("chat input accepts message and streams a response", async ({ page }) => {
    test.slow(); // Claude responses take time
    await freshVisitor(page);

    // Dismiss consent
    const consent = page.getByRole("button", { name: /I understand/i });
    if (await consent.isVisible()) await consent.click();

    const input = page.getByRole("textbox", { name: /Chat input/i });
    await input.fill("hello");
    await input.press("Enter");

    // Message appears in the chat log
    await expect(page.getByText("hello")).toBeVisible();

    // Response streams in — look for any assistant-style text within 30s.
    // We don't assert exact content (that's Ragas-eval territory), just that
    // SOMETHING beyond the welcome message appears in response to the send.
    await expect(
      page.locator('[role="log"]').getByText(/Prempawee|LINE OA|Claude/i).nth(1),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("client sends x-session-id on /api/chat POSTs (persistence guard)", async ({
    page,
  }) => {
    test.slow();
    await freshVisitor(page);
    const consent = page.getByRole("button", { name: /I understand/i });
    if (await consent.isVisible()) await consent.click();

    let capturedSid: string | null = null;
    page.on("request", (req) => {
      if (
        req.method() === "POST" &&
        req.url().includes("/api/chat") &&
        !capturedSid
      ) {
        capturedSid = req.headers()["x-session-id"] ?? null;
      }
    });

    const input = page.getByRole("textbox", { name: /Chat input/i });
    await input.fill("test");
    await input.press("Enter");

    // Wait until the request has been issued (response starts streaming)
    await expect(page.getByText("test")).toBeVisible();
    await page.waitForTimeout(1500);

    expect(capturedSid).not.toBeNull();
    // Must be a UUID-shaped alphanumeric-hyphen string (server regex).
    expect(capturedSid).toMatch(/^[a-zA-Z0-9-]{1,64}$/);
    // Must NOT be the server-generated srv-* fallback — that means the
    // client failed to inject the header and the server had to make one up.
    expect(capturedSid).not.toMatch(/^srv-/);

    // And it must match what's in localStorage (persisted).
    const stored = await page.evaluate(() =>
      localStorage.getItem("chat-session-id"),
    );
    expect(stored).toBe(capturedSid);
  });
});

test.describe("prempawee.com · security headers", () => {
  test("core security headers present on homepage", async ({ request }) => {
    const res = await request.get("/");
    expect(res.status()).toBe(200);
    const h = res.headers();
    expect(h["strict-transport-security"]).toMatch(/preload/);
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["content-security-policy"]).toBeTruthy();
    expect(h["cross-origin-opener-policy"]).toBe("same-origin");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });
});
