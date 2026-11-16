import { type Locator, type Page } from "@playwright/test";

export class ShopPage {
  readonly heading: Locator;
  // The catalog lists products in one order, so the first heading, price and
  // Add to Cart button on the page all belong to the first product.
  readonly firstProductName: Locator;
  readonly firstProductPrice: Locator;
  readonly firstProductAddToCartButton: Locator;
  readonly cartLink: Locator;
  readonly searchInput: Locator;
  readonly productNames: Locator;

  constructor(private readonly page: Page) {
    this.searchInput = page.getByRole("textbox", { name: "Search products" });
    this.productNames = page.getByRole("heading", { level: 3 });
    this.heading = page.getByRole("heading", {
      name: "🛍️ Welcome to Our Shop",
    });
    this.firstProductName = this.productNames.first();
    this.firstProductPrice = page.getByText(/^\$\d+(\.\d+)?$/).first();
    this.firstProductAddToCartButton = page
      .getByRole("button", { name: "Add to Cart" })
      .first();
    this.cartLink = page.getByRole("link", { name: /^Cart \(/ });
  }

  message(text: string): Locator {
    return this.page.getByText(text);
  }

  cartLinkWithCount(count: number): Locator {
    return this.page.getByRole("link", {
      name: `Cart (${count})`,
      exact: true,
    });
  }
}
