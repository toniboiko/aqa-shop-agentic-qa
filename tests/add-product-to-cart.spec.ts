// TC-003
// spec: specs/TC-003-add-product-to-cart.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { ShopPage } from "../pages/ShopPage";
import { CartPage } from "../pages/CartPage";
import { validUser } from "../test-data/login";
import { cartExpectations } from "../test-data/cart";

test.describe("TC-003 Add product to cart", () => {
  test("user adds one product to the cart", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const shopPage = new ShopPage(page);
    const cartPage = new CartPage(page);

    // Precondition: authenticated user
    await loginPage.goto();
    await loginPage.login(validUser.email, validUser.password);

    // 1. User is on the Welcome to Our Shop page
    await expect(shopPage.heading).toBeVisible();

    // 2. Save the name and price for Leather Wallet product
    const savedName = await shopPage.leatherWalletName.innerText();
    const savedPrice = await shopPage.leatherWalletPrice.innerText();

    // 3. Click Add to Cart button for Leather Wallet product (one product)
    await shopPage.leatherWalletAddToCartButton.click();
    await expect(
      shopPage.message(cartExpectations.processingText),
    ).toBeVisible();
    await expect(
      shopPage.cartLinkWithCount(cartExpectations.addedQuantity),
    ).toBeVisible();

    // 4. Navigate to Cart at the header
    await shopPage.cartLink.click();
    await expect(cartPage.heading).toBeVisible();

    // 5. Check the product in the cart
    await expect(cartPage.leatherWalletName).toBeVisible();

    // 6. Check product price and name
    await expect(cartPage.leatherWalletName).toHaveText(savedName);
    await expect(cartPage.leatherWalletPrice).toHaveText(savedPrice);

    // 7. Check product quantity
    await expect(cartPage.leatherWalletQuantity).toHaveText(
      cartExpectations.quantityText,
    );
  });
});
