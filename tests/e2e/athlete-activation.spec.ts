import { expect, test } from "@playwright/test";

test("shows the athlete activation form without contacting WhatsApp", async ({
  page,
}) => {
  await page.goto("/activar");
  await expect(
    page.getByRole("heading", { name: "Activá tu acceso" })
  ).toBeVisible();
  await expect(page.getByLabel("Teléfono")).toBeVisible();
  await expect(page.getByLabel("Código de 6 dígitos")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Activar acceso" })
  ).toBeVisible();
});

test("uses canonical credential access and rejects disabled legacy routes", async ({
  page,
}) => {
  await page.goto("/hoy");
  await expect(page.getByLabel("Credencial de acceso")).toBeVisible();
  await expect(page.getByText("Usá la credencial entregada")).toBeVisible();

  const response = await page.goto("/hoy/1111");
  expect(response?.status()).toBe(404);
});

test("isolates rate-limit client cookies across otherwise identical browsers", async ({
  browser,
}) => {
  const contexts = await Promise.all([browser.newContext(), browser.newContext()]);
  try {
    const cookieValues: string[] = [];
    for (const [index, context] of contexts.entries()) {
      const page = await context.newPage();
      await page.goto("/hoy");
      await page.getByLabel("Credencial de acceso").fill(
        `invalid-${Date.now()}-${index}`
      );
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page.getByText("No pudimos validar el acceso.")).toBeVisible();
      const cookie = (await context.cookies()).find(
        (entry) => entry.name === "forja-rate-limit-client"
      );
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.sameSite).toBe("Lax");
      cookieValues.push(cookie!.value);
    }
    expect(cookieValues[0]).not.toBe(cookieValues[1]);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});
