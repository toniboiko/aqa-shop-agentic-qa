import { type Locator, type Page } from "@playwright/test";

export class ShopPage {
  readonly heading: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole("heading", {
      name: "🛍️ Welcome to Our Shop",
    });
  }
}
