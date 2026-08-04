import { expect, test, type Page } from "@playwright/test";

const targetViewports = [
  { width: 2000, height: 1000 },
  { width: 1920, height: 1080 },
  { width: 1440, height: 1000 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
] as const;

async function waitForLandingImages(page: Page) {
  const images = await page.locator("main figure img").all();

  for (const image of images) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => {
      const htmlImage = element as HTMLImageElement;
      return htmlImage.complete && htmlImage.naturalWidth > 0 && htmlImage.naturalHeight > 0;
    })).toBe(true);
  }
}

async function hasVisualCollision(page: Page) {
  return page.locator("main").evaluate((root) => {
    const pairs = [
      [root.querySelector(".landing-hero-copy"), root.querySelector(".hero-figure")],
      [root.querySelector(".evidence-photo"), root.querySelector(".evidence-board")],
      [root.querySelector(".roles-copy"), root.querySelector(".roles-figure")],
      ...Array.from(root.querySelectorAll(".cycle-stage")).map((stage) => [
        stage.querySelector(".cycle-stage-copy"),
        stage.querySelector("figure"),
      ]),
    ];

    return pairs.some(([first, second]) => {
      if (!first || !second) return false;
      const a = first.getBoundingClientRect();
      const b = second.getBoundingClientRect();
      const overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      return overlapWidth > 1 && overlapHeight > 1;
    });
  });
}

test("presents the product in semantic narrative order", async ({ page }) => {
  await page.goto("/");

  const headings = await page.getByRole("heading").allTextContents();
  const expectedOrder = [
    "El plan vale cuando conduce a la próxima decisión.",
    "El valor está en cerrar el ciclo.",
    "El registro avanza con el entrenamiento.",
    "Cada persona ve lo que necesita para actuar.",
    "La conectividad parcial no se disfraza de offline total.",
    "Llevá el ciclo completo a tu operación.",
  ];
  const headingIndexes = expectedOrder.map((heading) => headings.indexOf(heading));
  expect(headingIndexes.every((index) => index >= 0)).toBe(true);
  expect(headingIndexes).toEqual([...headingIndexes].sort((a, b) => a - b));

  const cycle = page.getByRole("list", { name: "Ciclo operativo de Forja" });
  await expect(cycle.getByRole("listitem")).toHaveCount(5);
  await expect(cycle.getByText("Programar", { exact: true })).toBeVisible();
  await expect(cycle.getByText("Ejecutar", { exact: true })).toBeVisible();
  await expect(cycle.getByText("Detectar", { exact: true })).toBeVisible();
  await expect(cycle.getByText("Revisar", { exact: true })).toBeVisible();
  await expect(cycle.getByText("Ajustar", { exact: true })).toBeVisible();
  await expect(page.getByText("Imágenes conceptuales · datos sintéticos", { exact: true })).toBeVisible();
  await expect(page.locator("main figure img")).toHaveCount(8);
});

test("applies the validated hero and action palette", async ({ page }) => {
  await page.goto("/");

  const colors = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    const hero = getComputedStyle(document.querySelector<HTMLElement>(".landing-hero")!);
    const heroCopy = getComputedStyle(document.querySelector<HTMLElement>(".landing-lede")!);
    const primaryAction = getComputedStyle(document.querySelector<HTMLElement>(".landing-primary-cta")!);
    const formAction = getComputedStyle(document.querySelector<HTMLButtonElement>(".access-form-submit button")!);
    const accessEyebrow = getComputedStyle(document.querySelector<HTMLElement>(".access-section .landing-eyebrow")!);

    return {
      brandRed: styles.getPropertyValue("--brand-red").trim(),
      heroBackground: hero.backgroundImage,
      heroForeground: hero.color,
      heroCopy: heroCopy.color,
      primaryBackground: primaryAction.backgroundColor,
      primaryForeground: primaryAction.color,
      formBackground: formAction.backgroundColor,
      formForeground: formAction.color,
      accessEyebrow: accessEyebrow.color,
    };
  });

  expect(colors).toEqual({
    brandRed: "#d93636",
    heroBackground: "linear-gradient(135deg, rgb(16, 41, 75), rgb(23, 78, 145))",
    heroForeground: "rgb(244, 241, 234)",
    heroCopy: "rgb(244, 241, 234)",
    primaryBackground: "rgb(181, 32, 32)",
    primaryForeground: "rgb(255, 255, 255)",
    formBackground: "rgb(181, 32, 32)",
    formForeground: "rgb(255, 255, 255)",
    accessEyebrow: "rgb(181, 32, 32)",
  });

  await page.getByRole("link", { name: /Solicitar acceso/ }).hover();
  await expect(page.locator(".landing-primary-cta")).toHaveCSS("background-color", "rgb(149, 31, 31)");
});

for (const viewport of targetViewports) {
  test(`keeps imagery and composition sound at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await waitForLandingImages(page);

    const imageMetrics = await page.locator("main figure img").evaluateAll((images) =>
      images.map((image) => {
        const htmlImage = image as HTMLImageElement;
        const rect = htmlImage.getBoundingClientRect();
        return {
          renderedRatio: rect.width / rect.height,
          naturalWidth: htmlImage.naturalWidth,
          renderedWidth: rect.width,
          currentSrc: htmlImage.currentSrc,
          requestedWidth: Number(new URL(htmlImage.currentSrc).searchParams.get("w")),
        };
      })
    );

    for (const image of imageMetrics) {
      expect(image.renderedRatio).toBeGreaterThan(1.74);
      expect(image.renderedRatio).toBeLessThan(1.81);
      expect(image.naturalWidth).toBeGreaterThan(0);
      expect(image.requestedWidth + 1).toBeGreaterThanOrEqual(image.renderedWidth);
      expect(image.currentSrc).toContain("q=90");
    }

    expect(await hasVisualCollision(page)).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
}

test("keeps every landing band full bleed with constrained inner content", async ({ page }) => {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 2000, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const geometry = await page.locator("[data-landing-band]").evaluateAll((bands) =>
      bands.map((band) => {
        const bandBounds = band.getBoundingClientRect();
        const innerBounds = band.querySelector<HTMLElement>(":scope > .landing-band-inner")!
          .getBoundingClientRect();
        return {
          left: bandBounds.left,
          right: bandBounds.right,
          innerWidth: innerBounds.width,
        };
      })
    );

    expect(geometry).toHaveLength(8);
    for (const band of geometry) {
      expect(Math.abs(band.left)).toBeLessThanOrEqual(1);
      expect(Math.abs(band.right - viewport.width)).toBeLessThanOrEqual(1);
      expect(band.innerWidth).toBeLessThanOrEqual(1536);
    }
  }
});

test("keeps the fixed light and dark module sequence in either global theme", async ({ page }) => {
  await page.goto("/");

  const expectedTones = ["light", "dark", "light", "dark", "light", "dark", "light", "dark"];
  const expectedColors = expectedTones.map((tone) =>
    tone === "light" ? "rgb(16, 41, 75)" : "rgb(244, 241, 234)"
  );

  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => document.documentElement.dataset.theme = value, theme);
    const bands = await page.locator("[data-landing-band]").evaluateAll((elements) =>
      elements.map((element) => ({
        tone: (element as HTMLElement).dataset.tone,
        color: getComputedStyle(element).color,
      }))
    );

    expect(bands.map((band) => band.tone)).toEqual(expectedTones);
    expect(bands.map((band) => band.color)).toEqual(expectedColors);
  }
});

test("stacks every mobile composition without hidden columns", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await waitForLandingImages(page);

  const geometry = await page.locator(".cycle-stage").evaluateAll((stages) =>
    stages.map((stage) => {
      const copy = stage.querySelector(".cycle-stage-copy")!.getBoundingClientRect();
      const figure = stage.querySelector("figure")!.getBoundingClientRect();
      return {
        columns: getComputedStyle(stage).gridTemplateColumns.split(" ").length,
        leftDelta: Math.abs(copy.left - figure.left),
        widthDelta: Math.abs(copy.width - figure.width),
      };
    })
  );

  for (const stage of geometry) {
    expect(stage.columns).toBe(1);
    expect(stage.leftDelta).toBeLessThanOrEqual(1);
    expect(stage.widthDelta).toBeLessThanOrEqual(1);
  }

  const evidenceColumns = await page.locator(".evidence-composition").evaluate(
    (section) => getComputedStyle(section).gridTemplateColumns.split(" ").length
  );
  expect(evidenceColumns).toBe(1);
});

test("keeps the complete static story with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("list", { name: "Ciclo operativo de Forja" }).getByRole("listitem"))
    .toHaveCount(5);
  expect(await page.locator(".cycle-stage").evaluateAll((stages) =>
    stages.every((stage) => getComputedStyle(stage).animationName === "none")
  )).toBe(true);
  expect(await page.locator("[data-reveal]").evaluateAll((elements) =>
    elements.every((element) => {
      const style = getComputedStyle(element);
      return style.opacity === "1" && style.transform === "none" && style.transitionDuration === "0s";
    })
  )).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("reveals below-fold content once and never resets it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");

  const target = page.locator('[data-stage="revisar"]');
  await expect(target).toHaveAttribute("data-reveal-state", "pending");
  await target.scrollIntoViewIfNeeded();
  await expect(target).toHaveAttribute("data-reveal-state", "revealed");
  await expect(target).toHaveCSS("opacity", "1");

  await page.evaluate(() => window.scrollTo(0, 0));
  await target.scrollIntoViewIfNeeded();
  await expect(target).toHaveAttribute("data-reveal-state", "revealed");
  await expect(target).toHaveCSS("transform", "none");
});

test("reveals hash targets immediately", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#solicitar-acceso");

  const target = page.locator("#solicitar-acceso [data-reveal]");
  await expect(target).toHaveAttribute("data-reveal-state", "revealed");
  await expect(target).toHaveCSS("opacity", "1");
});

test("reveals every module passed by an instant jump to access", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator('[data-reveal-state="pending"]')).not.toHaveCount(0);

  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
  });
  await page.getByRole("link", { name: /Solicitar acceso/ }).click();
  await expect(page).toHaveURL(/#solicitar-acceso$/);

  const intermediate = page.locator(
    "#evidencia [data-reveal], #como-funciona [data-reveal], .roles-section [data-reveal], .trust-section [data-reveal]"
  );
  await expect(intermediate).toHaveCount(9);
  await expect.poll(() => intermediate.evaluateAll((elements) =>
    elements.every((element) => {
      const style = getComputedStyle(element);
      return element.getAttribute("data-reveal-state") === "revealed" && style.opacity === "1";
    })
  )).toBe(true);

  expect(await page.locator('[data-reveal-state="pending"]').evaluateAll((elements) =>
    elements.filter((element) => {
      const style = getComputedStyle(element);
      return element.getBoundingClientRect().top <= window.innerHeight * 0.92 && style.opacity === "0";
    }).length
  )).toBe(0);
});

test("keeps every module visible without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL as string,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();

  try {
    await page.goto("/");
    await expect(page.locator("[data-landing-band]")).toHaveCount(8);
    expect(await page.locator("[data-reveal]").evaluateAll((elements) =>
      elements.every((element) => {
        const style = getComputedStyle(element);
        return style.opacity === "1" && style.transform === "none";
      })
    )).toBe(true);
  } finally {
    await context.close();
  }
});

test("keeps public, coach, activation, and athlete route contracts", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");

  const athleteLinks = page.getByRole("link", { name: "Atleta", exact: true });
  await expect(athleteLinks.first()).toBeVisible();
  await expect(athleteLinks.first()).toHaveAttribute("href", "/hoy");
  const athleteTarget = await athleteLinks.first().boundingBox();
  expect(athleteTarget?.width).toBeGreaterThanOrEqual(44);
  expect(athleteTarget?.height).toBeGreaterThanOrEqual(44);
  await expect(page.getByRole("link", { name: "Activar acceso" })).toHaveAttribute("href", "/activar");
  await expect(page.getByRole("link", { name: "Ingresar" }).first()).toHaveAttribute("href", "/login");

  await page.goto("/hoy");
  await expect(page).toHaveURL(/\/hoy$/);
  await expect(page.getByRole("heading", { name: "Ingresá tu PIN" })).toBeVisible();
});

test("keeps the access form reachable and associates errors with focused controls", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Solicitar acceso/ }).click();
  await expect(page.getByRole("heading", { name: "Llevá el ciclo completo a tu operación." })).toBeVisible();
  await page.getByRole("button", { name: "Solicitar acceso" }).click();

  await expect(page.locator("#name")).toBeFocused();
  await expect(page.locator("#name")).toHaveCSS("outline-width", "3px");
  await expect(page.locator(".access-profile")).toHaveAttribute("aria-describedby", "profile-error");
  await expect(page.locator(".access-profile")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("radio", { name: "Coach" })).toHaveAttribute("aria-describedby", "profile-error");
});
