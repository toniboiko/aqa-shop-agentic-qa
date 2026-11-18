// TC-005
// spec: specs/TC-005-filter-price-high-to-lower.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { ShopPage } from "../pages/ShopPage";
import { validUser } from "../test-data/login";
import { sortOptions, expectedSortOptionCount } from "../test-data/sort";

test.describe("TC-005 Filter products from high to low", () => {
  test("user sorts the catalog products by price from high to low", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const shopPage = new ShopPage(page);

    // 1. Precondition: authenticated user on the Catalog page
    await loginPage.goto();
    await loginPage.login(validUser.email, validUser.password);

    // 2. Check the Catalog page before selecting the option
    await expect(shopPage.heading).toBeVisible();
    await expect(shopPage.firstProductName).toBeVisible();
    await expect(shopPage.sortSelect).toBeVisible();
    await expect(shopPage.sortSelect).toBeEnabled();
    await expect(shopPage.sortSelectOptions).toHaveCount(
      expectedSortOptionCount,
    );
    await expect(shopPage.sortOption(sortOptions.lowToHigh)).toHaveCount(1);
    await expect(shopPage.sortOption(sortOptions.highToLow)).toHaveCount(1);

    // 3. Assert the currently selected option before selecting (the default)
    await expect(shopPage.selectedSortOption(sortOptions.lowToHigh)).toHaveCount(
      1,
    );

    // 4. Read and save the initial order from the page
    const savedNames = await shopPage.productNames.allTextContents();

    // 5. Select 'Price: High to Low' in the sort control
    await shopPage.sortSelect.selectOption({ label: sortOptions.highToLow });
    await expect(shopPage.selectedSortOption(sortOptions.highToLow)).toHaveCount(
      1,
    );

    // 6. Check the Catalog page after selecting
    await expect(shopPage.heading).toBeVisible();
    await expect(shopPage.firstProductName).toBeVisible();

    // 7. Check the product order
    await expect
      .poll(() => shopPage.productNames.allTextContents())
      .not.toEqual(savedNames);
    await expect
      .poll(() => shopPage.pricesOrder())
      .toMatchObject({ sortedDescending: true, notEmpty: true });
  });
});
