import { expect, test } from "@playwright/test";

const targetViewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet-landscape", width: 1024, height: 768 },
  { name: "tablet-portrait", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
  { name: "mobile-narrow", width: 360, height: 800 },
] as const;

async function waitForLandingImages(page: import("@playwright/test").Page) {
  const images = await page.locator('img[alt^="Conceptual"]:visible').all();

  for (const image of images) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => {
      const htmlImage = element as HTMLImageElement;
      const rect = htmlImage.getBoundingClientRect();

      return htmlImage.complete
        && htmlImage.naturalWidth > 0
        && htmlImage.naturalHeight > 0
        && rect.width > 0
        && rect.height > 0;
    })).toBe(true);
  }
}

async function landingIntersections(page: import("@playwright/test").Page) {
  return page.locator(".landing-shell").evaluate((root) => {
    const groups = [
      [root.querySelector(".landing-hero-copy"), root.querySelector(".hero-athlete-pair"), root.querySelector(".mechanism-board")],
      ...Array.from(root.querySelectorAll(".story-scene")).map((scene) => [
        scene.querySelector(".scene-copy"),
        scene.querySelector(".story-photo-pair"),
        scene.querySelector(".scene-product-overlay"),
        scene.querySelector("figcaption"),
        scene.querySelector(".scene-evidence"),
      ]),
    ];
    const collisions: string[] = [];

    for (const group of groups) {
      const visible = group.filter((element): element is Element => {
        if (!element) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      });

      for (let firstIndex = 0; firstIndex < visible.length; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < visible.length; secondIndex += 1) {
          const first = visible[firstIndex];
          const second = visible[secondIndex];
          const firstRect = first.getBoundingClientRect();
          const secondRect = second.getBoundingClientRect();
          const intersectionWidth = Math.min(firstRect.right, secondRect.right) - Math.max(firstRect.left, secondRect.left);
          const intersectionHeight = Math.min(firstRect.bottom, secondRect.bottom) - Math.max(firstRect.top, secondRect.top);

          if (intersectionWidth > 1 && intersectionHeight > 1) {
            collisions.push(`${first.className || first.tagName} / ${second.className || second.tagName}`);
          }
        }
      }
    }

    return collisions;
  });
}

test("explains the coaching cycle and exposes the access request", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "El coaching no termina al publicar el plan." })
  ).toBeVisible();
  await expect(
    page.getByText("Un registro que avanza con el entrenamiento.", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("Imágenes conceptuales · datos sintéticos", { exact: true })
  ).toBeVisible();
  await expect(page.locator('img[alt^="Conceptual"]')).toHaveCount(8);

  const requestLink = page.getByRole("link", { name: /Solicitar acceso/ });
  await expect(requestLink).toBeVisible();
  await requestLink.click();
  await expect(page.getByRole("heading", { name: "Llevá el ciclo completo a tu operación." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Solicitar acceso" })).toBeVisible();

  await page.getByRole("link", { name: "Ingresar" }).first().click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByText("Acceso coach", { exact: true })
  ).toBeVisible();
  await expect(page.getByLabel("Usuario")).toBeVisible();
  await expect(page.getByLabel("Contraseña")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ingresar" })).toBeVisible();
});

test("keeps public and athlete entry usable at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "El coaching no termina al publicar el plan." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Solicitar acceso" })).toBeVisible();
  await page.goto("/hoy");
  await expect(page).toHaveURL(/\/hoy$/);
  await expect(page.getByRole("heading", { name: "Ingresá tu PIN" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Activar acceso" }).first()).toBeVisible();
});

for (const viewport of targetViewports) {
  test(`keeps landing composition separated at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator('img[alt^="Conceptual"]')).toHaveCount(8);
    await waitForLandingImages(page);

    const visibleHeroImages = await page.locator(".hero-athlete-pair img").evaluateAll(
      (images) => images.filter((image) => getComputedStyle(image).display !== "none").length
    );
    const visibleStoryImages = await page.locator(".story-photo-pair").evaluateAll((pairs) =>
      pairs.map((pair) =>
        Array.from(pair.querySelectorAll("img")).filter((image) => getComputedStyle(image).display !== "none").length
      )
    );

    expect(visibleHeroImages).toBe(viewport.width >= 1180 ? 2 : 1);
    expect(visibleStoryImages).toEqual(viewport.width >= 1180 ? [2, 2, 2] : [1, 1, 1]);
    await expect(page.locator(".scene-product-overlay")).toHaveCount(3);
    expect(await landingIntersections(page)).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    ).toBe(true);
  });
}
