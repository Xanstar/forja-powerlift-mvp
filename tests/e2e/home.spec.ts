import { expect, test } from "@playwright/test";

test("loads home and navigates to coach login", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByText("Programa, ejecución y revisión de powerlifting en un mismo registro.", {
      exact: true,
    })
  ).toBeVisible();

  const coachLink = page.getByRole("link", { name: /Acceso coach/ });
  await expect(coachLink).toBeVisible();
  await coachLink.click();

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
  await expect(page.getByRole("heading", { name: "Cada serie deja evidencia." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Entrar a mi sesión" })).toBeVisible();
  await page.getByRole("link", { name: "Atleta", exact: true }).click();
  await expect(page).toHaveURL(/\/hoy$/);
  await expect(page.getByRole("heading", { name: "Ingresá tu PIN" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Activar acceso" }).first()).toBeVisible();
});
