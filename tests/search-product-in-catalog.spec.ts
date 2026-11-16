// TC-004
// spec: specs/TC-004-search-product-in-catalog.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { ShopPage } from "../pages/ShopPage";
import { validUser } from "../test-data/login";

test.describe("TC-004 Search product in catalog", () => {
  test("user finds the searched product by its name in the catalog search", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const shopPage = new ShopPage(page);

    // Precondition: authenticated user on the Catalog page
    await loginPage.goto();
    await loginPage.login(validUser.email, validUser.password);

    // Check the Catalog page before searching
    await expect(shopPage.heading).toBeVisible();
    await expect(shopPage.firstProductName).toBeVisible();
    await expect(shopPage.searchInput).toBeVisible();
    await expect(shopPage.searchInput).toBeEnabled();

    // Read and save the name of an existing product from the page
    const savedName = await shopPage.firstProductName.innerText();

    // 1. Enter the saved product name into the Search field
    await shopPage.searchInput.fill(savedName);
    await expect(shopPage.searchInput).toHaveValue(savedName);

    // 2. Check the Catalog page after searching
    await expect(shopPage.heading).toBeVisible();
    await expect(shopPage.firstProductName).toBeVisible();

    // Check the search result: exactly the searched product
    await expect(shopPage.productNames).toHaveCount(1);
    await expect(shopPage.productNames).toHaveText(savedName);
  });
});
