import { type Locator, type Page } from "@playwright/test";

export class CartPage {
  readonly heading: Locator;
  readonly leatherWalletName: Locator;
  // No role, label or data-testid on these elements; ids are allowed by the owner.
  readonly leatherWalletPrice: Locator;
  readonly leatherWalletQuantity: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole("heading", {
      name: "🛒 Your Shopping Cart",
    });
    this.leatherWalletName = page.getByRole("heading", {
      name: "Leather Wallet",
      level: 3,
    });
    this.leatherWalletPrice = page.locator("#cart-item-price-1");
    this.leatherWalletQuantity = page.locator("#cart-item-quantity-1");
  }
}
