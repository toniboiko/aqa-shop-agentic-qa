import { type Locator, type Page } from "@playwright/test";

export class CartPage {
  readonly heading: Locator;
  readonly productName: Locator;
  // Price and quantity have no role, label or test id, so they are found by text:
  // the price is "$" and a number, the quantity is the only text made of digits alone.
  readonly productPrice: Locator;
  readonly productQuantity: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole("heading", {
      name: "🛒 Your Shopping Cart",
    });
    this.productName = page.getByRole("heading", { level: 3 });
    this.productPrice = page.getByText(/^\$\d+(\.\d+)?$/);
    this.productQuantity = page.getByText(/^\d+$/);
  }
}
