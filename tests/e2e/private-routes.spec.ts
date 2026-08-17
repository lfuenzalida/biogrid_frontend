import { expect, test } from "@playwright/test";

const protectedRoutes = ["/mapa", "/historial", "/perfil", "/administracion"];

for (const route of protectedRoutes) {
  test(`${route} redirige anónimos sin exponer el chasis`, async ({ page }) => {
    await page.goto(route);

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Navegación principal" })).toHaveCount(0);
  });
}

test("la raíz resuelve a login para una sesión anónima", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
