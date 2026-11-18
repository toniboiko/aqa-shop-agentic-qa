import { type Locator, type Page } from "@playwright/test";
import { parsePrice } from "../utils/parsePrice";

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
  readonly productPrices: Locator;
  readonly sortSelect: Locator;
  readonly sortSelectOptions: Locator;

  constructor(private readonly page: Page) {
    this.productPrices = page.getByText(/^\$\d+(\.\d+)?$/);
    this.sortSelect = page.getByRole("combobox", { name: "Sort by price" });
    this.sortSelectOptions = this.sortSelect.getByRole("option");
    this.searchInput = page.getByRole("textbox", { name: "Search products" });
    this.productNames = page.getByRole("heading", { level: 3 });
    this.heading = page.getByRole("heading", {
      name: "🛍️ Welcome to Our Shop",
    });
    this.firstProductName = this.productNames.first();
    this.firstProductPrice = this.productPrices.first();
    this.firstProductAddToCartButton = page
      .getByRole("button", { name: "Add to Cart" })
      .first();
    this.cartLink = page.getByRole("link", { name: /^Cart \(/ });
  }

  message(text: string): Locator {
    return this.page.getByText(text);
  }

  sortOption(name: string): Locator {
    return this.sortSelect.getByRole("option", { name });
  }

  selectedSortOption(name: string): Locator {
    return this.sortSelect.getByRole("option", { name, selected: true });
  }

  async pricesOrder(): Promise<{
    prices: number[];
    sortedDescending: boolean;
    sortedAscending: boolean;
    notEmpty: boolean;
  }> {
    const prices = (await this.productPrices.allTextContents()).map(
      parsePrice,
    );
    const sortedDesc = [...prices].sort((a, b) => b - a);
    const sortedAsc = [...prices].sort((a, b) => a - b);
    return {
      prices,
      sortedDescending: prices.join() === sortedDesc.join(),
      sortedAscending: prices.join() === sortedAsc.join(),
      notEmpty: prices.length > 0,
    };
  }

  cartLinkWithCount(count: number): Locator {
    return this.page.getByRole("link", {
      name: `Cart (${count})`,
      exact: true,
    });
  }
}
