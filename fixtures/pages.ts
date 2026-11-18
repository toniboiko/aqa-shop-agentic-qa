import { test as base } from "@playwright/test";
import { CartPage } from "../pages/CartPage";
import { LoginPage } from "../pages/LoginPage";
import { ShopPage } from "../pages/ShopPage";

// Page Objects as custom fixtures. A fixture is created per test, only when the
// test asks for it, so no state is shared between tests.
type PageFixtures = {
  loginPage: LoginPage;
  shopPage: ShopPage;
  cartPage: CartPage;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  shopPage: async ({ page }, use) => {
    await use(new ShopPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
});

export { expect } from "@playwright/test";
