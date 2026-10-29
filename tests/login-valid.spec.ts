// TC-002
// spec: specs/TC-002-login-valid.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { ShopPage } from "../pages/ShopPage";
import { validUser, expectedUrls } from "../test-data/login";

test.describe("TC-002 Login with valid credentials", () => {
  test("user can log in with valid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const shopPage = new ShopPage(page);

    // 1. Navigate to /login
    await loginPage.goto();

    // 2. Enter valid email
    await loginPage.emailInput.fill(validUser.email);

    // 3. Enter valid password
    await loginPage.passwordInput.fill(validUser.password);

    // 4. Click login button
    await loginPage.loginButton.click();

    // Expected Result 1: user is redirected to the shop root
    await expect(page).toHaveURL(expectedUrls.shop);

    // Expected Result 2: shop page heading is visible
    await expect(shopPage.heading).toBeVisible();
  });
});
