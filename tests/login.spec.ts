import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

test("login page displays the login form", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();

  await expect(loginPage.heading).toBeVisible();
  await expect(loginPage.emailInput).toBeVisible();
  await expect(loginPage.passwordInput).toBeVisible();
  await expect(loginPage.loginButton).toBeVisible();
  await expect(loginPage.registerButton).toBeVisible();
});
