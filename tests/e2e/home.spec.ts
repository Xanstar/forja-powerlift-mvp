import { expect, test } from "@playwright/test";

test("explains the coaching cycle and exposes the access request", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "El coaching no termina al publicar el plan." })
  ).toBeVisible();
  await expect(
    page.getByText("Un registro que avanza con el entrenamiento.", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("Datos sintéticos", { exact: true })).toBeVisible();

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
