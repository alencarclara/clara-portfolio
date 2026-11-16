import { test, expect } from "@playwright/test";

const theme = (page: import("@playwright/test").Page) => page.locator("html").getAttribute("data-theme");

test.describe("raiz escolhe o idioma", () => {
  test.describe("navegador em inglês", () => {
    test.use({ locale: "en-US" });
    test("/ leva a /en/", async ({ page }) => {
      await page.goto("/");
      await page.waitForURL(/\/en\/?$/);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
    });
  });

  test.describe("navegador em português", () => {
    test.use({ locale: "pt-BR" });
    test("/ leva a /pt/", async ({ page }) => {
      await page.goto("/");
      await page.waitForURL(/\/pt\/?$/);
      await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    });
  });

  test.describe("outro idioma", () => {
    test.use({ locale: "fr-FR" });
    test("cai em /pt/", async ({ page }) => {
      await page.goto("/");
      await page.waitForURL(/\/pt\/?$/);
    });
  });

  test("sem JS a raiz mostra os dois links, PT primeiro", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, locale: "en-US" });
    const page = await ctx.newPage();
    await page.goto("/");
    const hrefs = await page.locator("main a[hreflang], main a[href^='/pt'], main a[href^='/en']").evaluateAll((as) =>
      as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!.replace(/\/$/, "")),
    );
    expect(hrefs.slice(0, 2)).toEqual(["/pt", "/en"]);
    await ctx.close();
  });
});

test.describe("troca de idioma", () => {
  test("de /pt/activities para /en/activities e de volta", async ({ page }) => {
    await page.goto("/pt/activities");
    await page.locator("#lang-switch").click();
    await expect(page).toHaveURL(/\/en\/activities\/?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.locator("#lang-switch").click();
    await expect(page).toHaveURL(/\/pt\/activities\/?$/);
  });

  test("a escolha de tema continua ao trocar de idioma", async ({ page }) => {
    await page.goto("/pt/");
    await page.locator("#theme-toggle").click();
    expect(await theme(page)).toBe("light");
    await page.locator("#lang-switch").click();
    await expect(page).toHaveURL(/\/en\/?$/);
    expect(await theme(page)).toBe("light");
  });

  test("o botão de idioma é alcançável por Tab e ativável por Enter", async ({ page }) => {
    await page.goto("/pt/");
    let reached = false;
    for (let i = 0; i < 20 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(() => document.activeElement?.id === "lang-switch");
    }
    expect(reached, "#lang-switch não recebeu foco em 20 Tabs").toBe(true);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/en\/?$/);
  });

  test("em /en/ o toggle de tema também funciona", async ({ page }) => {
    await page.goto("/en/");
    await page.locator("#theme-toggle").click();
    expect(await theme(page)).toBe("light");
  });
});
