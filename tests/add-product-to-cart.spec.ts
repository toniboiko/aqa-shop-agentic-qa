// TC-003
// spec: test-cases/TC-003-add-product-to-cart.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { ShopPage } from "../pages/ShopPage";
import { CartPage } from "../pages/CartPage";
import { validUser } from "../test-data/login";
import { cartExpectations } from "../test-data/cart";

test.describe("TC-003 Add product to cart", () => {
  test("user adds the first product from the list to the cart", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const shopPage = new ShopPage(page);
    const cartPage = new CartPage(page);

    // Precondition: authenticated user
    await loginPage.goto();
    await loginPage.login(validUser.email, validUser.password);

    // 1. User is on the Welcome to Our Shop page, nothing is added yet
    const addedProducts: string[] = [];
    await expect(shopPage.heading).toBeVisible();
    await expect(
      shopPage.cartLinkWithCount(addedProducts.length),
    ).toBeVisible();

    // 2. Save the name and price of the first product in the list
    const savedName = await shopPage.firstProductName.innerText();
    const savedPrice = await shopPage.firstProductPrice.innerText();

    // 3. Click Add to Cart for that product; every added product is recorded
    await shopPage.firstProductAddToCartButton.click();
    addedProducts.push(savedName);
    await expect(
      shopPage.message(cartExpectations.processingText),
    ).toBeVisible();
    await expect(
      shopPage.cartLinkWithCount(addedProducts.length),
    ).toBeVisible();

    // 4. Navigate to Cart at the header
    await shopPage.cartLink.click();
    await expect(cartPage.heading).toBeVisible();

    // 5. Check the saved product is in the cart
    await expect(cartPage.productName).toHaveText(savedName);

    // 6. Check product price
    await expect(cartPage.productPrice).toHaveText(savedPrice);

    // 7. Check product quantity: how many times this product was added
    const addedUnits = addedProducts.filter((name) => name === savedName);
    await expect(cartPage.productQuantity).toHaveText(`${addedUnits.length}`);
  });
});
