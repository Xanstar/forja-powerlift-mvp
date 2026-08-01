import { expect, test } from "@playwright/test";

test("loads home and navigates to coach login", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByText("Planificación de powerlifting para tu gimnasio", {
      exact: true,
    })
  ).toBeVisible();

  const coachLink = page.getByRole("link", { name: /Entrenador/ });
  await expect(coachLink).toBeVisible();
  await coachLink.click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByText("Acceso del entrenador", { exact: true })
  ).toBeVisible();
  await expect(page.getByLabel("Usuario")).toBeVisible();
  await expect(page.getByLabel("Contraseña")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ingresar" })).toBeVisible();
});
