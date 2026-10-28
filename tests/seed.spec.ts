import { test } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

// Seed for the Playwright test agents: puts the browser on the starting page.
test.describe("Seed", () => {
  test("seed: open the login page", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
  });
});
