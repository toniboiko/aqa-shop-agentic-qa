import { type Locator, type Page } from "@playwright/test";

export class LoginPage {
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", {
      name: "🔑 Login to Your Account",
    });
    this.emailInput = page.getByRole("textbox", { name: "Enter your email" });
    this.passwordInput = page.getByRole("textbox", {
      name: "Enter your password",
    });
    this.loginButton = page.getByRole("button", { name: "Login" });
    this.registerButton = page.getByRole("button", { name: "Register" });
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
