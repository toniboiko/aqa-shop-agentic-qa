import { type Locator, type Page } from "@playwright/test";

export class ShopPage {
  readonly heading: Locator;
  readonly leatherWalletCard: Locator;
  readonly leatherWalletName: Locator;
  readonly leatherWalletPrice: Locator;
  readonly leatherWalletAddToCartButton: Locator;
  readonly cartLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", {
      name: "🛍️ Welcome to Our Shop",
    });
    // The product card is the only div that holds the Leather Wallet heading and its
    // Add to Cart button without holding any other product's heading.
    this.leatherWalletCard = page
      .locator("div")
      .filter({
        has: page.getByRole("heading", { name: "Leather Wallet", level: 3 }),
      })
      .filter({ has: page.getByRole("button", { name: "Add to Cart" }) })
      .filter({
        hasNot: page.getByRole("heading", {
          name: /^(?!Leather Wallet$)/,
          level: 3,
        }),
      });
    this.leatherWalletName = this.leatherWalletCard.getByRole("heading", {
      level: 3,
    });
    this.leatherWalletPrice = this.leatherWalletCard.getByText(/^\$\d+/);
    this.leatherWalletAddToCartButton = this.leatherWalletCard.getByRole(
      "button",
      { name: "Add to Cart" },
    );
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
