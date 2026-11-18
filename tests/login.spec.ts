// TC-001
import { test, expect } from "../fixtures/pages";

test("login page displays the login form", async ({ loginPage }) => {
  await loginPage.goto();

  await expect(loginPage.heading).toBeVisible();
  await expect(loginPage.emailInput).toBeVisible();
  await expect(loginPage.passwordInput).toBeVisible();
  await expect(loginPage.loginButton).toBeVisible();
  await expect(loginPage.registerButton).toBeVisible();
});
