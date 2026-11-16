import { test, expect, type Page } from "@playwright/test";

const ROUTES = ["/", "/activities", "/experience", "/courses", "/projects", "/journal"];
const theme = (page: Page) => page.locator("html").getAttribute("data-theme");
const toggle = (page: Page) => page.locator("#theme-toggle");

test.describe("tema", () => {
  test("padrão escuro sem JS (critério 12)", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/");
    expect(await theme(page)).toBe("dark");
    await ctx.close();
  });

  test("padrão escuro com JS e sem valor salvo; botão mostra [ light ]", async ({ page }) => {
    await page.goto("/");
    expect(await theme(page)).toBe("dark");
    await expect(toggle(page)).toHaveText("[ light ]");
  });

  test("clicar troca para claro, mostra [ dark ] e grava localStorage.theme", async ({ page }) => {
    await page.goto("/");
    await toggle(page).click();
    expect(await theme(page)).toBe("light");
    await expect(toggle(page)).toHaveText("[ dark ]");
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("light");
  });

  test("a escolha persiste após recarregar e vale em outra página, sem flash", async ({ page }) => {
    await page.goto("/");
    await toggle(page).click();
    await page.reload();
    expect(await theme(page)).toBe("light");
    await expect(toggle(page)).toHaveText("[ dark ]");
    await page.goto("/courses");
    expect(await theme(page)).toBe("light");
    // Volta para escuro e persiste também.
    await toggle(page).click();
    expect(await theme(page)).toBe("dark");
    await page.reload();
    expect(await theme(page)).toBe("dark");
    await expect(toggle(page)).toHaveText("[ light ]");
  });

  test("valor salvo 'light' é aplicado antes do DOMContentLoaded (script inline no head)", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto("/", { waitUntil: "commit" });
    await page.waitForFunction(() => document.documentElement.dataset.theme === "light");
  });

  test("valor salvo inválido cai no escuro", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "banana"));
    await page.goto("/");
    expect(await theme(page)).toBe("dark");
  });

  test("com localStorage bloqueado não há exceção e o botão ainda alterna", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("blocked", "SecurityError");
        },
      });
    });
    await page.goto("/");
    expect(await theme(page)).toBe("dark");
    await toggle(page).click();
    expect(await theme(page)).toBe("light");
    await expect(toggle(page)).toHaveText("[ dark ]");
    expect(errors).toEqual([]);
  });

  test("botão alcançável por Tab, com foco visível, e ativável por teclado", async ({ page }) => {
    await page.goto("/");
    let reached = false;
    for (let i = 0; i < 20 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(() => document.activeElement?.id === "theme-toggle");
    }
    expect(reached, "#theme-toggle não recebeu foco em 20 Tabs").toBe(true);
    const visible = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      const outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
      return el.matches(":focus-visible") && (outline || cs.boxShadow !== "none");
    });
    expect(visible, "foco sem outline/box-shadow visível").toBe(true);
    await page.keyboard.press("Enter");
    expect(await theme(page)).toBe("light");
  });
});

test.describe("sem overflow horizontal a 375 px", () => {
  test.use({ viewport: { width: 375, height: 800 } });
  for (const mode of ["dark", "light"] as const) {
    for (const route of ROUTES) {
      test(`${route} no tema ${mode}`, async ({ page }) => {
        await page.goto(route);
        if (mode === "light") await toggle(page).click();
        expect(await theme(page)).toBe(mode);
        const { sw, cw } = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth,
          cw: document.documentElement.clientWidth,
        }));
        expect(sw, `scrollWidth ${sw} > clientWidth ${cw}`).toBeLessThanOrEqual(cw);
      });
    }
  }
});
