import { test, expect, type Page } from "@playwright/test";

const dayLinks = (page: Page) => page.locator("#calendar a[href*='/journal/day/']");

test.describe("journal", () => {
  test("calendário: clicar num dia abre o dia e voltar mostra o calendário", async ({ page }) => {
    await page.goto("/pt/journal");
    expect(await dayLinks(page).count(), "nenhum dia com entrada").toBeGreaterThan(0);
    const href = await dayLinks(page).first().getAttribute("href");
    await dayLinks(page).first().click();
    await expect(page).toHaveURL(new RegExp(`${href!.replace(/\/$/, "")}/?$`));
    await expect(page.locator("article").first()).toBeVisible();
    await page.goBack();
    await expect(page.locator("#calendar")).toBeVisible();
  });

  test("a troca de idioma dentro de um dia leva ao mesmo dia no outro idioma", async ({ page }) => {
    await page.goto("/pt/journal");
    await dayLinks(page).first().click();
    const day = page.url().replace(/\/$/, "").split("/").pop()!;
    await page.locator("#lang-switch").click();
    await expect(page).toHaveURL(new RegExp(`/en/journal/day/${day}/?$`));
    await expect(page.locator("article").first()).toBeVisible();
  });

  test("um dia com entrada é alcançável por Tab e abre com Enter", async ({ page }) => {
    await page.goto("/pt/journal");
    let reached = false;
    for (let i = 0; i < 40 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(() => !!document.activeElement?.matches("#calendar a[href*='/journal/day/']"));
    }
    expect(reached, "nenhum dia do calendário recebeu foco em 40 Tabs").toBe(true);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/pt\/journal\/day\/\d{4}-\d{2}-\d{2}\/?$/);
  });

  test("abas: Temas leva à lista e um tema lista entradas", async ({ page }) => {
    await page.goto("/en/journal");
    await page.locator("nav[aria-label] a[href$='/journal/themes'], nav[aria-label] a[href$='/journal/themes/']").first().click();
    await expect(page).toHaveURL(/\/en\/journal\/themes\/?$/);
    await page.locator("#themes a").first().click();
    await expect(page).toHaveURL(/\/en\/journal\/themes\/[a-z0-9-]+\/?$/);
    await expect(page.locator("#theme-entries a").first()).toBeVisible();
  });
});

test.describe("sem overflow horizontal a 375 px nas páginas do Journal", () => {
  test.use({ viewport: { width: 375, height: 800 } });
  for (const lang of ["pt", "en"]) {
    for (const mode of ["dark", "light"] as const) {
      test(`${lang} calendário, dia e temas no tema ${mode}`, async ({ page }) => {
        const check = async () => {
          const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
          expect(sw, `${page.url()}: scrollWidth ${sw} > clientWidth ${cw}`).toBeLessThanOrEqual(cw);
        };
        await page.goto(`/${lang}/journal`);
        if (mode === "light") await page.locator("#theme-toggle").click();
        await check();
        await dayLinks(page).first().click();
        await check();
        await page.goto(`/${lang}/journal/themes`);
        await check();
      });
    }
  }
});
