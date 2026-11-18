// TC-005
// TC-006
// spec: specs/TC-005-filter-price-high-to-lower.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { ShopPage } from "../pages/ShopPage";
import { validUser } from "../test-data/login";
import { sortOptions, expectedSortOptionCount } from "../test-data/sort";

test.describe("Catalog price sorting", () => {
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

  test("user resets the catalog price sorting back to low to high", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const shopPage = new ShopPage(page);

    // 1. Precondition: authenticated user on the Catalog page
    await loginPage.goto();
    await loginPage.login(validUser.email, validUser.password);

    // 2. Check the Catalog page and the sort control
    await expect(shopPage.heading).toBeVisible();
    await expect(shopPage.firstProductName).toBeVisible();
    await expect(shopPage.sortSelect).toBeVisible();
    await expect(shopPage.sortSelect).toBeEnabled();

    // 3. Read and save the initial (default) order from the page
    const savedNames = await shopPage.productNames.allTextContents();

    // 4. Precondition: 'Price: High to Low' is applied and the order differs
    await shopPage.sortSelect.selectOption({ label: sortOptions.highToLow });
    await expect(shopPage.selectedSortOption(sortOptions.highToLow)).toHaveCount(
      1,
    );
    await expect
      .poll(() => shopPage.productNames.allTextContents())
      .not.toEqual(savedNames);

    // 5. Reset: select 'Price: Low to High' in the sort control
    await shopPage.sortSelect.selectOption({ label: sortOptions.lowToHigh });
    await expect(shopPage.selectedSortOption(sortOptions.lowToHigh)).toHaveCount(
      1,
    );

    // 6. Check the Catalog page after the reset
    await expect(shopPage.heading).toBeVisible();
    await expect(shopPage.firstProductName).toBeVisible();

    // 7. The initial order is restored and prices go from low to high
    await expect
      .poll(() => shopPage.productNames.allTextContents())
      .toEqual(savedNames);
    await expect
      .poll(() => shopPage.pricesOrder())
      .toMatchObject({ sortedAscending: true, notEmpty: true });
  });
});
