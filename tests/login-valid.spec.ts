import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { ShopPage } from "../pages/ShopPage";
import { expectedUrls, validUser } from "../test-data/login";

test("user can log in with valid credentials", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const shopPage = new ShopPage(page);

  await loginPage.goto();
  await loginPage.login(validUser.email, validUser.password);

  await expect(page).toHaveURL(expectedUrls.shop);
  await expect(shopPage.heading).toBeVisible();
});
