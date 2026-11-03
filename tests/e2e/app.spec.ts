import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("radio", { name: "Numbers" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("analyses the default example and confirms it with the browser", async ({ page }) => {
  await expect(page.getByText("Same result as your browser’s RegExp")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Matches · 4" })).toBeVisible();
  await expect(page.getByRole("tabpanel")).toContainText("42");
});

test("guides the visitor through numbered steps", async ({ page }) => {
  for (const title of [
    "Write a search rule",
    "Give it some text",
    "Watch the train",
    "See what it found",
  ]) {
    await expect(page.getByRole("heading", { name: new RegExp(title) })).toBeVisible();
  }
  await expect(page.getByText("How to read the map")).toBeVisible();
  await expect(
    page.getByText("A loop below: the train may go round and read it again."),
  ).toBeVisible();
});

test("plays the whole journey from the big button", async ({ page }) => {
  test.setTimeout(60_000);
  await page.getByRole("radio", { name: "Either spelling" }).click();
  await expect(page.getByRole("button", { name: "Watch again" })).toBeVisible({ timeout: 40_000 });
  await page.getByRole("button", { name: "Watch again" }).click();
  await expect(page.getByRole("button", { name: "Pause" }).first()).toBeVisible();
});

test("explains a station on hover and on tap", async ({ page, isMobile }) => {
  if (isMobile) await page.getByRole("radio", { name: "Full map" }).click();
  const station = page
    .locator('svg[role="img"] g', { has: page.locator("text", { hasText: /^digit$/ }) })
    .first();
  if (isMobile) await station.tap();
  else await station.hover();
  await expect(
    page.getByRole("region", { name: /Railway map/ }).getByText("A digit (0–9)"),
  ).toBeVisible();
});

test("shows a vertical line of stations on phones", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Desktop always shows the full map");
  const line = page.getByRole("list", { name: /line of stations/ });
  await expect(line).toBeVisible();
  await expect(line).toContainText("A digit (0–9)");
  await page.getByRole("radio", { name: "Full map" }).click();
  await expect(line).toBeHidden();
  await expect(page.getByRole("region", { name: /Railway map/ })).toBeVisible();
});

test("points at the exact place of a syntax error", async ({ page }) => {
  const input = page.getByRole("textbox", { name: "Pattern" });
  await input.fill("(abc");
  await expect(page.getByRole("alert")).toContainText(
    "This group is never closed with ) at position 1",
  );
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await input.fill("(abc)");
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("steps through the match one event at a time", async ({ page }) => {
  const next = page.getByRole("button", { name: "Next step" });
  const narration = page.getByLabel("Step-by-step debugger").locator('[aria-live="polite"]');
  await expect(narration).toContainText("waiting at the station");
  await next.click();
  await expect(narration).toContainText("New attempt from position 0");
  await next.click();
  await expect(narration).toContainText("A digit (0–9): found “T” instead.");
  await page.getByRole("button", { name: "Previous step" }).click();
  await expect(narration).toContainText("New attempt from position 0");
});

test("warns about catastrophic backtracking", async ({ page }) => {
  await page.getByRole("radio", { name: "Backtracking trap" }).click();
  await expect(page.getByRole("alert")).toContainText("Catastrophic backtracking");
});

test("explains the pattern in plain words", async ({ page }) => {
  await page.getByRole("radio", { name: "Date" }).click();
  await page.getByRole("tab", { name: "Explain" }).click();
  await expect(page.getByRole("tabpanel")).toContainText('Remember as group #1 "year"');
  await expect(page.getByRole("tabpanel")).toContainText("Repeat exactly 4 times");
});

test("restores pattern, flags and text from a share link", async ({ page }) => {
  await page.getByRole("textbox", { name: "Pattern" }).fill("ra+il");
  await page.getByRole("textbox", { name: "Test text" }).fill("RAAIL rail");
  await page.getByRole("button", { name: /ignore case/ }).click();
  await page.getByRole("button", { name: /multiline/ }).click();
  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  const shared = page.url();
  await page.goto("about:blank");
  await page.goto(shared);
  await expect(page.getByRole("textbox", { name: "Pattern" })).toHaveValue("ra+il");
  await expect(page.getByRole("button", { name: /multiline/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: /ignore case/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("tab", { name: "Matches · 2" })).toBeVisible();
});

test("has no detectable accessibility violations", async ({ page }) => {
  await page.getByRole("button", { name: "Next step" }).click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.map(
      (violation) =>
        `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
    ),
  ).toEqual([]);
});

test("does not scroll sideways on any screen", async ({ page }) => {
  await page.getByRole("radio", { name: "IP address" }).click();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

test("keeps the whole train inside the map while it moves", async ({ page, isMobile }) => {
  if (isMobile) await page.getByRole("radio", { name: "Full map" }).click();
  await page.getByRole("radio", { name: "Email" }).click();
  for (let sample = 0; sample < 20; sample += 1) {
    await page.waitForTimeout(100);
    const inside = await page.evaluate(() => {
      const scroller = document.querySelector('[aria-label^="Railway map"]');
      const train = scroller?.querySelector('svg g[class*="_x_"] rect');
      if (!scroller || !train) return false;
      const view = scroller.getBoundingClientRect();
      const box = train.getBoundingClientRect();
      return (
        box.left >= view.left &&
        box.right <= view.right &&
        box.top >= view.top &&
        box.bottom <= view.bottom
      );
    });
    expect(inside).toBe(true);
  }
});

test("switches the whole app to Russian", async ({ page }) => {
  await page.getByRole("button", { name: /switch to Russian/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { name: /Напишите правило поиска/ })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Тестовый текст" })).toHaveValue(
    "Поезд 42 уходит с платформы 7 в 9:15",
  );
  await expect(page.getByText("Тот же результат, что у RegExp в вашем браузере")).toBeVisible();
  await page.getByRole("tab", { name: "Объяснение" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Повторить один или больше раз");
  await page.getByRole("textbox", { name: "Паттерн" }).fill("(abc");
  await expect(page.getByRole("alert")).toContainText(
    "Эта группа не закрыта скобкой ) в позиции 1",
  );
});

test("opens in Russian from the address and finds Cyrillic repeats", async ({ page }) => {
  await page.goto("/?lang=ru");
  await page.getByRole("radio", { name: "Повтор слова" }).click();
  await expect(page.getByRole("tab", { name: "Совпадения · 2" })).toBeVisible();
  await expect(page.getByText("Тот же результат, что у RegExp в вашем браузере")).toBeVisible();
});
