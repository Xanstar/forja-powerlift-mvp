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
